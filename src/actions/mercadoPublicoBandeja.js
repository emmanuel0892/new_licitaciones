"use server"

import { auth } from "@/lib/auth"
import { PERMISSION_CODES, userHasPermission } from "@/lib/permissions"
import {
  getLicitacionMercadoPublicoGuardada,
  getOrCreateLicitacionMercadoPublico
} from "@/lib/mercadoPublicoCache"
import { consultaMercadoPublicoSchema } from "@/lib/validations/licitacion"

export const getLicitacionMercadoPublicoBandeja = async (codigo) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const allowed = await userHasPermission(
    session.user.id,
    PERMISSION_CODES.MERCADO_PUBLICO_VIEW
  )

  if (!allowed) {
    return { error: "No tienes permisos para consultar Mercado Publico." }
  }

  const validatedFields = consultaMercadoPublicoSchema.safeParse({ codigo })

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors.codigo?.[0]
    return { error: error || "Codigo invalido" }
  }

  try {
    const existing = await getLicitacionMercadoPublicoGuardada(validatedFields.data.codigo)

    if (existing) {
      return { data: existing }
    }

    const canSync = await userHasPermission(
      session.user.id,
      PERMISSION_CODES.MERCADO_PUBLICO_SYNC
    )

    if (!canSync) {
      return { error: "No tienes permisos para incorporar esta licitacion desde Mercado Publico." }
    }

    const data = await getOrCreateLicitacionMercadoPublico(validatedFields.data.codigo)
    return { data }
  } catch (error) {
    console.error("Error al cargar Mercado Publico en Bandeja:", error)
    return { error: error.message || "No se pudo consultar Mercado Publico." }
  }
}
