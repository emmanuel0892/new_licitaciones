// Proyeccion de agotamiento de convenios (Fase 3).
// Calculo puro: a partir del consumo historico estima cuando se agota el monto adjudicado.
// Pensado para anticipar la re-licitacion y evitar quiebres de stock.

const DAY_MS = 1000 * 60 * 60 * 24
const DIAS_POR_MES = 30.44
const MIN_MESES_DATA = 0.5 // menos de ~15 dias de historia => datos insuficientes

const toNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const fechaMasAntigua = (ordenesCompra = [], fechaAdjudicacion) => {
  const fechasOC = ordenesCompra
    .map((oc) => oc?.fechaCreacion)
    .filter(Boolean)
    .map((f) => new Date(f).getTime())
    .filter((t) => Number.isFinite(t))

  const candidatos = [...fechasOC]
  if (fechaAdjudicacion) {
    const t = new Date(fechaAdjudicacion).getTime()
    if (Number.isFinite(t)) candidatos.push(t)
  }

  if (candidatos.length === 0) return null
  return Math.min(...candidatos)
}

const calcularRiesgo = (restante, mesesRestantes) => {
  if (restante <= 0) return "agotado"
  if (mesesRestantes < 2) return "critico"
  if (mesesRestantes < 4) return "alerta"
  return "ok"
}

// Devuelve la proyeccion de una licitacion. Si no hay datos suficientes, suficiente=false.
export const calcularProyeccionConsumo = (licitacion = {}) => {
  const montoAdjudicado = toNumber(licitacion.montoAdjudicado)
  const montoConsumido = toNumber(licitacion.montoConsumido)
  const ordenesCompra = Array.isArray(licitacion.ordenesCompra) ? licitacion.ordenesCompra : []

  if (montoAdjudicado <= 0 || montoConsumido <= 0) {
    return { suficiente: false }
  }

  const inicio = fechaMasAntigua(ordenesCompra, licitacion.fechaAdjudicacion)
  if (!inicio) {
    return { suficiente: false }
  }

  const diasTranscurridos = (Date.now() - inicio) / DAY_MS
  const mesesTranscurridos = diasTranscurridos / DIAS_POR_MES

  if (mesesTranscurridos < MIN_MESES_DATA) {
    return { suficiente: false }
  }

  const consumoMensual = montoConsumido / mesesTranscurridos
  const restante = montoAdjudicado - montoConsumido

  if (consumoMensual <= 0) {
    return { suficiente: false }
  }

  const mesesRestantes = restante <= 0 ? 0 : restante / consumoMensual
  const fechaAgotamiento =
    restante <= 0 ? new Date() : new Date(Date.now() + mesesRestantes * DIAS_POR_MES * DAY_MS)

  return {
    suficiente: true,
    consumoMensual,
    restante,
    mesesRestantes,
    fechaAgotamiento: fechaAgotamiento.toISOString(),
    riesgo: calcularRiesgo(restante, mesesRestantes)
  }
}

export const RIESGO_META = {
  agotado: { label: "Agotado", color: "#e53935" },
  critico: { label: "Crítico", color: "#e53935" },
  alerta: { label: "Riesgo", color: "#fa8c16" },
  ok: { label: "En regla", color: "#52c41a" }
}
