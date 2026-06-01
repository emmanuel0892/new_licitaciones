"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getUserPermissionContext } from "@/lib/permissions"
import { getOrCreateLicitacionMercadoPublico } from "@/lib/mercadoPublicoCache"
import { esFormatoLicitacion, esFormatoTratoDirecto } from "@/lib/helpers"
import { getMercadoPublicoEditPermissionCode } from "@/lib/permissionCodes"
import { updateCodigoMercadoPublicoSchema } from "@/lib/validations/licitacion"

export const updateCodigoMercadoPublico = async (data) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const validatedFields = updateCodigoMercadoPublicoSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos invalidos" }
  }

  const { licitacionId, codigoMercadoPublico } = validatedFields.data

  try {
    const licitacion = await prisma.licitacion.findUnique({
      where: { id: licitacionId },
      select: {
        id: true,
        codigoMercadoPublico: true,
        numeroLicitacion: true,
        montoPresupuestado: true,
        requirente: true,
        formatoLiquidacion: {
          select: { titulo: true }
        },
        procesoActual: {
          select: { numeroPaso: true }
        }
      }
    })

    if (!licitacion) {
      return { error: "Licitacion no encontrada" }
    }

    const authorization = await getUserPermissionContext(session.user.id)
    const canEditAndSync = authorization.isSuperAdmin ||
      authorization.permissions.includes(getMercadoPublicoEditPermissionCode(licitacion))

    if (!canEditAndSync) {
      return { error: "No tienes permisos para editar y consultar Mercado Publico." }
    }

    const currentStep = Number(licitacion.procesoActual?.numeroPaso)
    const canEditInCurrentStep = (
      (esFormatoLicitacion(licitacion.formatoLiquidacion?.titulo) && currentStep === 1) ||
      (esFormatoTratoDirecto(licitacion) && currentStep === 5)
    )

    if (!canEditInCurrentStep) {
      return { error: "El codigo Mercado Publico solo se puede editar en la etapa habilitada para este formato." }
    }

    const datosMercadoPublico = await getOrCreateLicitacionMercadoPublico(codigoMercadoPublico)
    const montoAdjudicado = Number(datosMercadoPublico?.montoAdjudicado)
    const hasMontoAdjudicado = Number.isFinite(montoAdjudicado) && montoAdjudicado > 0
    const montoPresupuestado = hasMontoAdjudicado
      ? String(Math.round(montoAdjudicado))
      : licitacion.montoPresupuestado
    const updateData = {
      codigoMercadoPublico,
      numeroLicitacion: codigoMercadoPublico
    }

    if (hasMontoAdjudicado) {
      updateData.montoPresupuestado = montoPresupuestado
    }

    await prisma.$transaction([
      prisma.licitacion.update({
        where: { id: licitacionId },
        data: updateData
      }),
      prisma.historialLicitacion.create({
        data: {
          licitacionId,
          usuarioId: session.user.id,
          tipoAccion: "actualizacion_mercado_publico",
          campoModificado: "codigo_mercado_publico, numero_licitacion, monto_presupuestado",
          datoAntiguo: `Codigo: ${licitacion.codigoMercadoPublico ?? "Sin codigo"}; Monto: ${licitacion.montoPresupuestado ?? "Sin monto"}`,
          datoNuevo: `Codigo: ${codigoMercadoPublico}; Monto: ${montoPresupuestado ?? "Sin monto"}`,
          observacion: "Se actualizo N Licitacion y monto adjudicado desde Mercado Publico.",
          requirente: licitacion.requirente
        }
      })
    ])

    revalidatePath("/dashboard/licitaciones/bandeja")

    return {
      success: true,
      warning: hasMontoAdjudicado
        ? null
        : "No se pudo obtener monto adjudicado desde Mercado Publico.",
      data: {
        codigoMercadoPublico,
        numeroLicitacion: codigoMercadoPublico,
        montoPresupuestado
      }
    }
  } catch (error) {
    console.error("Error al actualizar datos Mercado Publico:", error)
    return { error: "No se pudo consultar o guardar la licitacion de Mercado Publico." }
  }
}
