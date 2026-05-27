"use server"

import { randomUUID } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import dayjs from "dayjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import {
  buildDocumentoStorageLocation,
  getNumeroLicitacionActual,
  resolveDocumentoAbsolutePath,
  sanitizeFileName,
  sanitizeFolderName
} from "@/lib/documentosLicitacion"
import { PERMISSION_CODES, userHasPermission } from "@/lib/permissions"

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
const ALLOWED_FILE_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"])
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png"
])

const licitacionIdSchema = z.coerce.number().int().positive()
const documentoIdSchema = z.coerce.number().int().positive()
const uploadedFileSchema = z.custom(
  (value) => value && typeof value.arrayBuffer === "function" && typeof value.name === "string",
  "El archivo no es valido."
).superRefine((file, context) => {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()

  if (!ALLOWED_FILE_EXTENSIONS.has(extension)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Tipo de archivo no permitido." })
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Formato de archivo no permitido." })
  }

  if (Number(file.size) <= 0 || Number(file.size) > MAX_FILE_SIZE_BYTES) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "El archivo debe pesar entre 1 byte y 20 MB." })
  }
})

const findLicitacionDocumentContext = async (licitacionId) => {
  return prisma.licitacion.findUnique({
    where: { id: licitacionId },
    select: {
      id: true,
      codigoMercadoPublico: true,
      numeroLicitacion: true,
      procesoActual: {
        select: {
          numeroPaso: true,
          tituloProceso: true
        }
      }
    }
  })
}

const serializeDocumento = (documento) => ({
  ...documento,
  sizeBytes: documento.sizeBytes === null ? null : Number(documento.sizeBytes),
  usuario: documento.usuario ?? {
    name: documento.usuarioName,
    lastname: documento.usuarioLastname
  }
})

const findDocumentosByNumeroLicitacion = async (licitacionId, numeroLicitacion) => {
  return prisma.$queryRaw`
    SELECT
      documento.id,
      documento.fk_licitacion_id AS licitacionId,
      documento.fk_usuario_id AS usuarioId,
      documento.nombre_archivo AS nombreArchivo,
      documento.nombre_original AS nombreOriginal,
      documento.ruta_archivo AS rutaArchivo,
      documento.mime_type AS mimeType,
      documento.size_bytes AS sizeBytes,
      documento.numero_licitacion AS numeroLicitacion,
      documento.numero_paso AS numeroPaso,
      documento.proceso_nombre AS procesoNombre,
      documento.created_at AS createdAt,
      documento.updated_at AS updatedAt,
      usuario.name AS usuarioName,
      usuario.lastname AS usuarioLastname
    FROM documentos_licitacion AS documento
    INNER JOIN users AS usuario ON usuario.id = documento.fk_usuario_id
    WHERE documento.fk_licitacion_id = ${licitacionId}
      AND documento.numero_licitacion = ${numeroLicitacion}
    ORDER BY documento.created_at DESC
  `
}

const createDocumentoRecord = async (data) => {
  await prisma.$executeRaw`
    INSERT INTO documentos_licitacion (
      fk_licitacion_id,
      fk_usuario_id,
      nombre_archivo,
      nombre_original,
      ruta_archivo,
      mime_type,
      size_bytes,
      numero_licitacion,
      numero_paso,
      proceso_nombre,
      created_at,
      updated_at
    ) VALUES (
      ${data.licitacionId},
      ${data.usuarioId},
      ${data.nombreArchivo},
      ${data.nombreOriginal},
      ${data.rutaArchivo},
      ${data.mimeType},
      ${data.sizeBytes},
      ${data.numeroLicitacion},
      ${data.numeroPaso},
      ${data.procesoNombre},
      NOW(3),
      NOW(3)
    )
  `
}

const findDocumentoRecordById = async (documentoId) => {
  const documentos = await prisma.$queryRaw`
    SELECT
      id,
      fk_usuario_id AS usuarioId,
      ruta_archivo AS rutaArchivo
    FROM documentos_licitacion
    WHERE id = ${documentoId}
    LIMIT 1
  `

  return documentos[0] ?? null
}

export const getDocumentosLicitacion = async (licitacionId) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const parsedLicitacionId = licitacionIdSchema.safeParse(licitacionId)

  if (!parsedLicitacionId.success) {
    return { error: "Datos invalidos" }
  }

  const allowed = await userHasPermission(session.user.id, PERMISSION_CODES.LICITACION_VIEW_DOCUMENTS)

  if (!allowed) {
    return { error: "No tienes permisos para realizar esta accion." }
  }

  try {
    const licitacion = await findLicitacionDocumentContext(parsedLicitacionId.data)

    if (!licitacion) {
      return { error: "Licitacion no encontrada." }
    }

    const numeroLicitacionActual = getNumeroLicitacionActual(licitacion)
    const documentos = await findDocumentosByNumeroLicitacion(licitacion.id, numeroLicitacionActual)

    return {
      data: documentos.map(serializeDocumento),
      context: {
        numeroLicitacion: numeroLicitacionActual,
        numeroPaso: licitacion.procesoActual?.numeroPaso ?? null,
        procesoNombre: licitacion.procesoActual?.tituloProceso ?? "Sin proceso"
      }
    }
  } catch (error) {
    console.error(error)
    return { error: "Error al obtener documentos" }
  }
}

export const uploadDocumento = async (formData) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const allowed = await userHasPermission(session.user.id, PERMISSION_CODES.LICITACION_UPLOAD_DOCUMENT)

  if (!allowed) {
    return { error: "No tienes permisos para realizar esta accion." }
  }

  const parsedLicitacionId = licitacionIdSchema.safeParse(formData.get("licitacionId"))
  const files = formData.getAll("files").length > 0 ? formData.getAll("files") : [formData.get("file")]
  const validatedFiles = z.array(uploadedFileSchema).min(1, "Debes seleccionar al menos un archivo.").safeParse(files)

  if (!parsedLicitacionId.success || !validatedFiles.success) {
    return { error: validatedFiles.error?.issues?.[0]?.message || "Datos incompletos o invalidos." }
  }

  try {
    const licitacion = await findLicitacionDocumentContext(parsedLicitacionId.data)

    if (!licitacion) {
      return { error: "Licitacion no encontrada." }
    }

    const numeroLicitacionActual = getNumeroLicitacionActual(licitacion)
    const folderName = sanitizeFolderName(numeroLicitacionActual) || `licitacion_${licitacion.id}`
    const numeroPaso = licitacion.procesoActual?.numeroPaso ?? null
    const procesoNombre = licitacion.procesoActual?.tituloProceso ?? "Sin proceso"
    const createdDocuments = []

    for (const file of validatedFiles.data) {
      const storedFileName = `${dayjs().format("YYYYMMDD_HHmmss")}_${randomUUID()}_${sanitizeFileName(file.name)}`
      const location = buildDocumentoStorageLocation(folderName, storedFileName)
      const buffer = Buffer.from(await file.arrayBuffer())

      await mkdir(location.directoryPath, { recursive: true })
      await writeFile(location.absolutePath, buffer)

      try {
        await createDocumentoRecord({
          licitacionId: licitacion.id,
          usuarioId: session.user.id,
          nombreArchivo: storedFileName,
          nombreOriginal: file.name,
          rutaArchivo: location.rutaArchivo,
          mimeType: file.type || null,
          sizeBytes: BigInt(file.size),
          numeroLicitacion: numeroLicitacionActual,
          numeroPaso,
          procesoNombre
        })

        createdDocuments.push(location.rutaArchivo)
      } catch (error) {
        await unlink(location.absolutePath).catch(() => null)
        throw error
      }
    }

    revalidatePath("/dashboard/licitaciones/bandeja")
    revalidatePath("/dashboard/licitaciones/mis-licitaciones")
    revalidatePath("/dashboard/licitaciones/todas")

    return { success: true, data: createdDocuments }
  } catch (error) {
    console.error(error)
    return { error: "Error al subir documento" }
  }
}

export const deleteDocumento = async (documentoId) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const parsedDocumentoId = documentoIdSchema.safeParse(documentoId)

  if (!parsedDocumentoId.success) {
    return { error: "Datos invalidos" }
  }

  const allowed = await userHasPermission(session.user.id, PERMISSION_CODES.LICITACION_UPLOAD_DOCUMENT)

  if (!allowed) {
    return { error: "No tienes permisos para realizar esta accion." }
  }

  try {
    const documento = await findDocumentoRecordById(parsedDocumentoId.data)

    if (!documento) {
      return { error: "Documento no encontrado" }
    }

    if (documento.usuarioId !== session.user.id && session.user.typeAccount !== "Super Admin") {
      return { error: "No tiene permisos para eliminar este documento" }
    }

    const filePath = resolveDocumentoAbsolutePath(documento.rutaArchivo)

    if (filePath) {
      await unlink(filePath).catch((error) => {
        if (error.code !== "ENOENT") throw error
      })
    }

    await prisma.$executeRaw`
      DELETE FROM documentos_licitacion
      WHERE id = ${parsedDocumentoId.data}
    `

    revalidatePath("/dashboard/licitaciones/bandeja")
    revalidatePath("/dashboard/licitaciones/mis-licitaciones")
    revalidatePath("/dashboard/licitaciones/todas")

    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al eliminar documento" }
  }
}
