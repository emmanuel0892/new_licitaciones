// Feature flags por variable de entorno.
// Cada modulo nuevo (valor agregado) se activa explicitamente sin tocar lo existente.
// Por defecto TODO esta apagado: si la variable no existe, el flag es false.

const readFlag = (name) => {
  const value = process.env[name]
  if (value === undefined || value === null) return false
  return ["1", "true", "on", "yes"].includes(String(value).trim().toLowerCase())
}

export const flags = {
  // Fase 1: envio de correos de notificacion
  notificacionesEmail: () => readFlag("FEATURE_NOTIFICACIONES_EMAIL"),
  // Fase 2: panel de indicadores / KPIs
  indicadores: () => readFlag("FEATURE_INDICADORES"),
  // Fase 3: proyeccion de agotamiento de convenios
  proyeccionConsumo: () => readFlag("FEATURE_PROYECCION_CONSUMO")
}

export const isFeatureEnabled = (name) => {
  const flag = flags[name]
  return typeof flag === "function" ? flag() : false
}
