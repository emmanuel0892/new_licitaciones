"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { construirExpedientePdf } from "@/lib/expedientePdf"
import { formatDate, formatDateTime, formatMoney, getFormatoLabel, getProcesoActualWorkflowLabel } from "@/lib/helpers"

const nombreCompleto = (u) => (u ? `${u.name ?? ""} ${u.lastname ?? ""}`.trim() : "")

// Genera el expediente auditable (PDF) de una licitacion y lo devuelve en base64.
// Solo lectura: no modifica nada.
export const getExpedienteLicitacion = async (licitacionId) => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  const id = Number(licitacionId)
  if (!Number.isInteger(id) || id <= 0) return { error: "Identificador inválido" }

  try {
    const lic = await prisma.licitacion.findUnique({
      where: { id },
      select: {
        id: true,
        numeroLicitacion: true,
        nombreLicitacion: true,
        requirente: true,
        estado: true,
        montoPresupuestado: true,
        vigencia: true,
        createdAt: true,
        formatoLiquidacion: { select: { titulo: true } },
        procesoActual: { select: { tituloProceso: true, numeroPaso: true } },
        usuario: { select: { name: true, lastname: true } },
        historial: {
          orderBy: { createdAt: "asc" },
          select: {
            tipoAccion: true,
            procesoOrigen: true,
            procesoDestino: true,
            observacion: true,
            campoModificado: true,
            datoAntiguo: true,
            datoNuevo: true,
            createdAt: true,
            usuario: { select: { name: true, lastname: true } }
          }
        },
        documentos: {
          orderBy: { createdAt: "asc" },
          select: {
            nombreOriginal: true,
            nombreArchivo: true,
            tipoDocumento: true,
            numeroPaso: true,
            procesoNombre: true,
            createdAt: true
          }
        },
        licitacion_firmas: {
          orderBy: { created_at: "asc" },
          select: {
            numero_paso: true,
            firma_label: true,
            created_at: true,
            users: { select: { name: true, lastname: true } }
          }
        }
      }
    })

    if (!lic) return { error: "Licitación no encontrada" }

    const expediente = {
      generadoEl: formatDateTime(new Date()),
      licitacion: {
        nombreLicitacion: lic.nombreLicitacion,
        numeroLicitacion: lic.numeroLicitacion || "Sin número",
        formato: getFormatoLabel(lic.formatoLiquidacion?.titulo),
        requirente: lic.requirente,
        estado: lic.estado,
        monto: formatMoney(lic.montoPresupuestado),
        vigencia: lic.vigencia ? formatDate(lic.vigencia) : "—",
        procesoActual: getProcesoActualWorkflowLabel(lic),
        creador: nombreCompleto(lic.usuario),
        createdAt: formatDateTime(lic.createdAt)
      },
      historial: lic.historial.map((h) => ({
        fecha: formatDateTime(h.createdAt),
        accion: h.tipoAccion || "Acción",
        origen: h.procesoOrigen,
        destino: h.procesoDestino,
        campoModificado: h.campoModificado,
        datoAntiguo: h.datoAntiguo,
        datoNuevo: h.datoNuevo,
        usuario: nombreCompleto(h.usuario),
        observacion: h.observacion
      })),
      documentos: lic.documentos.map((d) => ({
        nombre: d.nombreOriginal || d.nombreArchivo,
        tipo: d.tipoDocumento,
        paso: d.numeroPaso,
        proceso: d.procesoNombre,
        fecha: formatDate(d.createdAt)
      })),
      firmas: lic.licitacion_firmas.map((f) => ({
        paso: f.numero_paso,
        label: f.firma_label,
        usuario: nombreCompleto(f.users),
        fecha: formatDateTime(f.created_at)
      }))
    }

    const bytes = await construirExpedientePdf(expediente)
    const base64 = Buffer.from(bytes).toString("base64")
    const filename = `Expediente-${(lic.numeroLicitacion || lic.id).toString().replace(/[^\w-]/g, "_")}.pdf`

    return { data: { base64, filename } }
  } catch (error) {
    console.error("Error en getExpedienteLicitacion:", error)
    return { error: "Error al generar el expediente" }
  }
}
