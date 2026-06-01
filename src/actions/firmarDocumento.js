"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getUserPermissionContext } from "@/lib/permissions"

export async function firmarDocumentoPrueba({
  licitacionId,
  numeroPaso,
  firmaKey,
  firmaLabel
}) {
  const session = await auth()

  if (!session) {
    throw new Error("No autorizado")
  }

  const authorization = await getUserPermissionContext(session.user.id)
  const isSuperAdmin = authorization.isSuperAdmin

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      lastname: true,
      firma: true
    }
  })

  if (!user?.firma && !isSuperAdmin) {
    throw new Error("Debe registrar una firma antes de firmar.")
  }

  const licitacion = await prisma.licitacion.findUnique({
    where: { id: Number(licitacionId) }
  })

  if (!licitacion) {
    throw new Error("Licitación no encontrada.")
  }

  try {
    await prisma.licitacion_firmas.create({
      data: {
        licitacion_id: Number(licitacionId),
        numero_paso: Number(numeroPaso),
        firma_key: firmaKey,
        firma_label: firmaLabel,
        user_id: user.id,
        firma_base64: user?.firma || null
      }
    })

    return {
      ok: true
    }
  } catch (error) {
    console.error("Error al firmar documento:", error)
    throw new Error(error.message || "Error al firmar el documento")
  }
}
