"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { flags } from "@/lib/featureFlags"
import { calcularProyeccionConsumo } from "@/lib/proyeccionConsumo"

// Devuelve un mapa { [licitacionMPId]: proyeccion } con el agotamiento estimado.
// Solo lectura. Si el feature flag esta apagado, enabled=false (la UI no muestra la columna).
export const getProyeccionesConsumo = async () => {
  if (!flags.proyeccionConsumo()) {
    return { enabled: false, data: {} }
  }

  const session = await auth()
  if (!session) return { enabled: false, error: "No autorizado", data: {} }

  try {
    const licitaciones = await prisma.licitacionMP.findMany({
      select: {
        id: true,
        montoAdjudicado: true,
        montoConsumido: true,
        fechaAdjudicacion: true,
        vigenciaMeses: true,
        ordenesCompra: {
          select: { fechaCreacion: true, total: true }
        }
      }
    })

    const data = {}
    for (const lic of licitaciones) {
      data[lic.id] = calcularProyeccionConsumo(lic)
    }

    return { enabled: true, data }
  } catch (error) {
    console.error("Error en getProyeccionesConsumo:", error)
    return { enabled: false, error: "Error al calcular proyecciones", data: {} }
  }
}
