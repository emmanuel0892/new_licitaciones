"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getUserPermissionContext } from "@/lib/permissions"
import { getDiasSugeridosProceso } from "@/lib/helpers"

const ESTADOS_FINALIZADOS = ["finalizada", "finalizado", "terminada", "terminado"]

const parseMonto = (valor) => {
  if (valor === null || valor === undefined) return 0
  const limpio = String(valor).replace(/\./g, "").replace(/[^0-9]/g, "")
  const n = Number(limpio)
  return Number.isFinite(n) ? n : 0
}

const diasTranscurridos = (fechaInicio) => {
  if (!fechaInicio) return 0
  const diff = Date.now() - new Date(fechaInicio).getTime()
  return diff <= 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Indicadores de gestion (solo lectura) sobre datos existentes.
// No modifica nada; pensado para el panel /dashboard/indicadores.
export const getIndicadoresGestion = async () => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  try {
    const inicioAno = new Date(new Date().getFullYear(), 0, 1)

    // Superadmin ve todo; el resto solo sus licitaciones (igual que el inicio anterior).
    const ctx = await getUserPermissionContext(session.user.id)
    const where = ctx.isSuperAdmin ? {} : { usuarioId: session.user.id }

    const licitaciones = await prisma.licitacion.findMany({
      where,
      include: {
        formatoLiquidacion: { select: { titulo: true } },
        procesoActual: true
      }
    })

    // ── Resumen por estado ──────────────────────────────────────────────
    const resumen = { total: licitaciones.length, activas: 0, finalizadas: 0, devueltas: 0 }

    // ── Cumplimiento de plazos (solo activas) ───────────────────────────
    const plazos = { enRegla: 0, porVencer: 0, vencidas: 0 }

    // ── Distribucion por etapa actual (cuellos de botella) ──────────────
    const porEtapa = new Map()

    // ── Top requirentes ─────────────────────────────────────────────────
    const porRequirente = new Map()

    // ── Tendencia ultimos 6 meses ───────────────────────────────────────
    const tendencia = new Map()
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      tendencia.set(`${d.getFullYear()}-${d.getMonth()}`, { label: `${meses[d.getMonth()]} ${d.getFullYear()}`, total: 0 })
    }

    // ── Calidad y montos ────────────────────────────────────────────────
    let totalDevoluciones = 0
    let totalEdiciones = 0
    let presupuestoAno = 0
    let comprometidoAno = 0

    for (const lic of licitaciones) {
      const estadoNorm = (lic.estado ?? "").toString().trim().toLowerCase()
      const esFinalizada = ESTADOS_FINALIZADOS.includes(estadoNorm)

      if (esFinalizada) resumen.finalizadas++
      else if (estadoNorm === "devuelto") resumen.devueltas++

      if (!esFinalizada) {
        resumen.activas++

        // Plazos
        const diasSugeridos = getDiasSugeridosProceso(lic.procesoActual, lic)
        if (diasSugeridos !== null && diasSugeridos !== undefined && lic.procesoActual) {
          const restante = Number(diasSugeridos) - diasTranscurridos(lic.fechaRecepcion ?? lic.createdAt)
          if (restante < 0) plazos.vencidas++
          else if (restante <= 3) plazos.porVencer++
          else plazos.enRegla++
        }

        // Etapa actual
        const etapa = lic.procesoActual?.tituloProceso ?? "Sin proceso"
        porEtapa.set(etapa, (porEtapa.get(etapa) ?? 0) + 1)
      }

      // Requirente
      if (lic.requirente) {
        porRequirente.set(lic.requirente, (porRequirente.get(lic.requirente) ?? 0) + 1)
      }

      // Tendencia
      const c = new Date(lic.createdAt)
      const key = `${c.getFullYear()}-${c.getMonth()}`
      if (tendencia.has(key)) tendencia.get(key).total++

      // Calidad
      totalDevoluciones += lic.contadorDevoluciones ?? 0
      totalEdiciones += lic.contadorEdiciones ?? 0

      // Montos del año
      if (new Date(lic.createdAt) >= inicioAno) {
        const monto = parseMonto(lic.montoPresupuestado)
        presupuestoAno += monto
        if (esFinalizada) comprometidoAno += monto
      }
    }

    const topRequirentes = [...porRequirente.entries()]
      .map(([requirente, total]) => ({ requirente, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    const etapas = [...porEtapa.entries()]
      .map(([etapa, total]) => ({ etapa, total }))
      .sort((a, b) => b.total - a.total)

    return {
      data: {
        resumen,
        plazos,
        etapas,
        topRequirentes,
        tendencia: [...tendencia.values()],
        calidad: {
          totalDevoluciones,
          totalEdiciones,
          promedioDevoluciones: resumen.total ? totalDevoluciones / resumen.total : 0
        },
        montos: { presupuestoAno, comprometidoAno }
      }
    }
  } catch (error) {
    console.error("Error en getIndicadoresGestion:", error)
    return { error: "Error al calcular indicadores" }
  }
}
