import prisma from "@/lib/prisma"
import { getDiasSugeridosProceso } from "@/lib/helpers"
import { enviarCorreo, renderEmailLayout } from "@/lib/email"
import { flags } from "@/lib/featureFlags"

const ESTADOS_FINALIZADOS = ["finalizada", "finalizado", "terminada", "terminado"]
const UMBRAL_AVISO_DIAS = 3

const claveDia = () => new Date().toISOString().slice(0, 10)

const calcularDiasTranscurridos = (fechaInicio) => {
  if (!fechaInicio) return 0
  const diff = Date.now() - new Date(fechaInicio).getTime()
  return diff <= 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Devuelve las alertas de plazos de TODAS las licitaciones activas, agrupadas por usuario.
// No depende de sesion: pensado para ejecutarse desde el cron.
export const calcularAlertasPlazosGlobal = async () => {
  const licitaciones = await prisma.licitacion.findMany({
    where: { estado: { notIn: ["Finalizada"] } },
    include: {
      formatoLiquidacion: { select: { titulo: true } },
      procesoActual: true,
      historial: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      usuario: { select: { id: true, name: true, lastname: true, email: true } }
    }
  })

  const porUsuario = new Map()

  for (const lic of licitaciones) {
    const estadoNorm = (lic.estado ?? "").toString().trim().toLowerCase()
    if (ESTADOS_FINALIZADOS.includes(estadoNorm)) continue
    if (!lic.procesoActual || !lic.usuario?.email) continue

    const diasSugeridos = getDiasSugeridosProceso(lic.procesoActual, lic)
    if (diasSugeridos === null || diasSugeridos === undefined) continue

    const fechaInicio = lic.historial?.[0]?.createdAt ?? lic.fechaRecepcion ?? lic.createdAt
    const diasTranscurridos = calcularDiasTranscurridos(fechaInicio)
    const restante = Number(diasSugeridos) - diasTranscurridos

    if (restante > UMBRAL_AVISO_DIAS) continue

    const severidad = restante < 0 ? "vencido" : restante === 0 ? "hoy" : "proximo"
    const mensaje =
      restante < 0
        ? `Pasado por ${Math.abs(restante)} día${Math.abs(restante) === 1 ? "" : "s"}`
        : restante === 0
        ? "Se cumple hoy"
        : `Falta${restante === 1 ? "" : "n"} ${restante} día${restante === 1 ? "" : "s"}`

    if (!porUsuario.has(lic.usuario.id)) {
      porUsuario.set(lic.usuario.id, { usuario: lic.usuario, alertas: [] })
    }

    porUsuario.get(lic.usuario.id).alertas.push({
      licitacionId: lic.id,
      nombreLicitacion: lic.nombreLicitacion,
      numeroLicitacion: lic.numeroLicitacion,
      pasoActual: lic.procesoActual.tituloProceso,
      numeroPaso: lic.procesoActual.numeroPaso,
      severidad,
      mensaje
    })
  }

  return porUsuario
}

// Idempotencia: una notificacion por licitacion/paso/dia. Devuelve true si es nueva.
const registrarSiNuevo = async (usuarioId, referencia) => {
  try {
    await prisma.notificacionEnviada.create({
      data: { usuarioId, tipo: "plazo", referencia, canal: "email" }
    })
    return true
  } catch {
    // Choca con el unique → ya se envió hoy
    return false
  }
}

const construirHtmlDigest = (usuario, alertas) => {
  const filas = alertas
    .map((a) => {
      const color = a.severidad === "vencido" ? "#e53935" : a.severidad === "hoy" ? "#fa8c16" : "#faad14"
      return `
        <tr>
          <td style="padding:8px 0; border-bottom:1px solid #f0f0f0;">
            <strong style="color:#1f2937;">${a.nombreLicitacion}</strong><br/>
            <span style="color:#6b7280; font-size:12px;">
              ${a.numeroLicitacion ? `${a.numeroLicitacion} · ` : ""}Paso ${a.numeroPaso}: ${a.pasoActual ?? ""}
            </span>
          </td>
          <td style="padding:8px 0; border-bottom:1px solid #f0f0f0; text-align:right; white-space:nowrap;">
            <span style="background:${color}; color:#fff; font-size:12px; padding:2px 8px; border-radius:10px;">${a.mensaje}</span>
          </td>
        </tr>`
    })
    .join("")

  return renderEmailLayout({
    titulo: `Tienes ${alertas.length} licitación(es) con plazos por atender`,
    cuerpoHtml: `
      <p style="color:#374151; font-size:14px;">Hola ${usuario.name},</p>
      <p style="color:#374151; font-size:14px;">Estas licitaciones a tu cargo requieren atención según los días sugeridos:</p>
      <table style="width:100%; border-collapse:collapse; margin-top:8px;">${filas}</table>
    `
  })
}

// Punto de entrada del job: calcula, deduplica y envia los correos de plazos.
export const notificarPlazos = async () => {
  if (!flags.notificacionesEmail()) {
    return { skipped: true, reason: "feature-off" }
  }

  const porUsuario = await calcularAlertasPlazosGlobal()
  const resumen = { usuarios: 0, correos: 0, omitidos: 0 }

  for (const { usuario, alertas } of porUsuario.values()) {
    resumen.usuarios++

    const dia = claveDia()
    const nuevas = []
    for (const a of alertas) {
      const ref = `${a.licitacionId}:${a.numeroPaso}:${dia}`
      const esNueva = await registrarSiNuevo(usuario.id, ref)
      if (esNueva) nuevas.push(a)
    }

    if (nuevas.length === 0) {
      resumen.omitidos++
      continue
    }

    const res = await enviarCorreo({
      to: usuario.email,
      subject: `[HRR] ${nuevas.length} licitación(es) con plazos por atender`,
      html: construirHtmlDigest(usuario, nuevas)
    })

    if (res.sent) resumen.correos++
  }

  return { skipped: false, ...resumen }
}
