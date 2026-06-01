"use server"

import prisma from "@/lib/prisma"

function normalizeFirmaBase64(firma) {
  if (!firma) return null
  if (String(firma).startsWith("data:image/")) {
    return firma
  }
  return `data:image/png;base64,${firma}`
}

export async function getHistorialFirmasLicitacion(licitacionId) {
  try {
    const firmas = await prisma.licitacion_firmas.findMany({
      where: {
        licitacion_id: Number(licitacionId)
      },
      orderBy: {
        created_at: "desc"
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            firma: true
          }
        }
      }
    })

    const licitacion = await prisma.licitacion.findUnique({
      where: { id: Number(licitacionId) },
      select: {
        formatoLiquidacionId: true
      }
    })

    const firmasNormalizadas = await Promise.all(
      firmas.map(async (firma) => {
        let procesoNombre = `Paso ${firma.numero_paso}`

        if (licitacion) {
          const proceso = await prisma.procesoLicitacion.findFirst({
            where: {
              formatoLiquidacionId: licitacion.formatoLiquidacionId,
              numeroPaso: firma.numero_paso
            },
            select: {
              tituloProceso: true
            }
          })

          if (proceso?.tituloProceso) {
            procesoNombre = proceso.tituloProceso
          }
        }

        return {
          id: firma.id,
          firmadoPor: `${firma.users.name} ${firma.users.lastname}`,
          emailFirmante: firma.users.email,
          tipoFirma: firma.firma_label,
          firmaKey: firma.firma_key,
          numeroPaso: firma.numero_paso,
          procesoNombre,
          fechaFirma: firma.created_at,
          firmaBase64: normalizeFirmaBase64(firma.firma_base64 || firma.users.firma)
        }
      })
    )

    return {
      data: firmasNormalizadas
    }
  } catch (error) {
    console.error("Error al obtener historial de firmas:", error)
    return {
      error: "Error al obtener historial de firmas"
    }
  }
}
