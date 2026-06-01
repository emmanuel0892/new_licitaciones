import { readFile } from "node:fs/promises"
import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { resolveDocumentoAbsolutePath, sanitizeFileName } from "@/lib/documentosLicitacion"
import { userHasPermission } from "@/lib/permissions"
import { getDocumentViewPermissionCode } from "@/lib/permissionCodes"

const documentoIdSchema = z.coerce.number().int().positive()

export const GET = async (_request, { params }) => {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const parsedDocumentoId = documentoIdSchema.safeParse(id)

  if (!parsedDocumentoId.success) {
    return NextResponse.json({ error: "Documento invalido" }, { status: 400 })
  }

  const documentos = await prisma.$queryRaw`
    SELECT
      documento.nombre_archivo AS nombreArchivo,
      documento.nombre_original AS nombreOriginal,
      documento.mime_type AS mimeType,
      documento.ruta_archivo AS rutaArchivo,
      formato.titulo AS formatoTitulo
    FROM documentos_licitacion AS documento
    INNER JOIN licitaciones AS licitacion ON licitacion.id = documento.fk_licitacion_id
    INNER JOIN formato_liquidacion AS formato ON formato.id = licitacion.fk_formato_liquidacion_id
    WHERE documento.id = ${parsedDocumentoId.data}
    LIMIT 1
  `
  const documento = documentos[0]

  if (!documento) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
  }

  const allowed = await userHasPermission(
    session.user.id,
    getDocumentViewPermissionCode({
      formatoLiquidacion: {
        titulo: documento.formatoTitulo
      }
    })
  )

  if (!allowed) {
    return NextResponse.json({ error: "No tienes permisos para realizar esta accion." }, { status: 403 })
  }

  const filePath = resolveDocumentoAbsolutePath(documento.rutaArchivo)

  if (!filePath) {
    return NextResponse.json({ error: "Ruta de documento no valida" }, { status: 404 })
  }

  try {
    const file = await readFile(filePath)
    const downloadName = sanitizeFileName(documento.nombreOriginal || documento.nombreArchivo)

    return new NextResponse(file, {
      headers: {
        "Content-Disposition": `attachment; filename="${downloadName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        "Content-Type": documento.mimeType || "application/octet-stream",
        "Cache-Control": "private, no-store"
      }
    })
  } catch (error) {
    if (error.code === "ENOENT") {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
    }

    console.error(error)
    return NextResponse.json({ error: "No se pudo descargar el documento" }, { status: 500 })
  }
}
