"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { z } from "zod"
import { PERMISSION_CODES, userHasPermission } from "@/lib/permissions"

const licitacionIdSchema = z.coerce.number().int().positive()
const documentoIdSchema = z.coerce.number().int().positive()

export const getDocumentosLicitacion = async (licitacionId) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  const parsedLicitacionId = licitacionIdSchema.safeParse(licitacionId)

  if (!parsedLicitacionId.success) {
    return { error: "Datos inválidos" }
  }

  const allowed = await userHasPermission(session.user.id, PERMISSION_CODES.LICITACION_VIEW_DOCUMENTS)

  if (!allowed) {
    return { error: "No tienes permisos para realizar esta acción." }
  }

  try {
    const documentos = await prisma.documentoLicitacion.findMany({
      where: { licitacionId: parsedLicitacionId.data },
      include: {
        usuario: { select: { name: true, lastname: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    return { data: documentos }
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
    return { error: "No tienes permisos para realizar esta acción." }
  }

  try {
    const file = formData.get("file")
    const licitacionId = formData.get("licitacionId")
    const parsedLicitacionId = licitacionIdSchema.safeParse(licitacionId)

    if (!file || !parsedLicitacionId.success) {
      return { error: "Datos incompletos" }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), "public", "uploads", "licitaciones", String(parsedLicitacionId.data))
    await mkdir(uploadDir, { recursive: true })

    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = path.join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    const rutaArchivo = `/uploads/licitaciones/${parsedLicitacionId.data}/${fileName}`

    await prisma.documentoLicitacion.create({
      data: {
        licitacionId: parsedLicitacionId.data,
        usuarioId: session.user.id,
        nombreArchivo: file.name,
        rutaArchivo
      }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
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
    return { error: "Datos inválidos" }
  }

  const allowed = await userHasPermission(session.user.id, PERMISSION_CODES.LICITACION_UPLOAD_DOCUMENT)

  if (!allowed) {
    return { error: "No tienes permisos para realizar esta acción." }
  }

  try {
    const documento = await prisma.documentoLicitacion.findUnique({
      where: { id: parsedDocumentoId.data }
    })

    if (!documento) {
      return { error: "Documento no encontrado" }
    }

    // Solo el creador o Super Admin pueden eliminar
    if (documento.usuarioId !== session.user.id && session.user.typeAccount !== "Super Admin") {
      return { error: "No tiene permisos para eliminar este documento" }
    }

    // Eliminar archivo físico
    try {
      const filePath = path.join(process.cwd(), "public", documento.rutaArchivo)
      await unlink(filePath)
    } catch (e) {
      // Archivo no existe, continuar
    }

    await prisma.documentoLicitacion.delete({
      where: { id: parsedDocumentoId.data }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al eliminar documento" }
  }
}
