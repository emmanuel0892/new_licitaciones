"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { preferenciaNotificacionSchema } from "@/lib/validations/notificacion"

const DEFAULTS = { emailPlazos: true, emailConsumo: true, emailAsignacion: true }

// Obtiene las preferencias de notificacion del usuario en sesion.
export const getPreferenciasNotificacion = async () => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  try {
    const pref = await prisma.preferenciaNotificacion.findUnique({
      where: { usuarioId: session.user.id }
    })
    return { data: pref ?? { usuarioId: session.user.id, ...DEFAULTS } }
  } catch (error) {
    console.error("Error en getPreferenciasNotificacion:", error)
    return { error: "Error al obtener preferencias" }
  }
}

// Crea o actualiza las preferencias del usuario en sesion. Validado con Zod.
export const updatePreferenciasNotificacion = async (data) => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  const parsed = preferenciaNotificacionSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors }
  }

  try {
    const pref = await prisma.preferenciaNotificacion.upsert({
      where: { usuarioId: session.user.id },
      create: { usuarioId: session.user.id, ...parsed.data },
      update: parsed.data
    })
    return { data: pref, success: true }
  } catch (error) {
    console.error("Error en updatePreferenciasNotificacion:", error)
    return { error: "Error al guardar preferencias" }
  }
}
