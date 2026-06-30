import nodemailer from "nodemailer"
import { flags } from "@/lib/featureFlags"

// Cliente de correo institucional reutilizable.
// Lee la configuracion SMTP desde variables de entorno. Si el flag esta apagado
// o falta configuracion, no envia y registra el motivo (sin lanzar excepcion).

let cachedTransport = null

const getTransport = () => {
  if (cachedTransport) return cachedTransport

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })

  return cachedTransport
}

export const enviarCorreo = async ({ to, subject, html, text }) => {
  if (!flags.notificacionesEmail()) {
    return { skipped: true, reason: "feature-off" }
  }

  if (!to || !subject || (!html && !text)) {
    return { skipped: true, reason: "datos-incompletos" }
  }

  const transport = getTransport()
  if (!transport) {
    console.warn("[email] SMTP no configurado: se omite el envio")
    return { skipped: true, reason: "smtp-no-configurado" }
  }

  try {
    const from = process.env.SMTP_FROM ?? "HRR Licitaciones <no-reply@hrr.cl>"
    const info = await transport.sendMail({ from, to, subject, html, text })
    return { sent: true, messageId: info.messageId }
  } catch (error) {
    console.error("[email] Error enviando correo:", error.message)
    return { sent: false, error: error.message }
  }
}

// Plantilla HTML simple y sobria con el color institucional del hospital.
export const renderEmailLayout = ({ titulo, cuerpoHtml }) => {
  return `
  <div style="font-family: Arial, sans-serif; background:#f6f8f1; padding:24px;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 2px 10px rgba(20,40,0,0.06);">
      <div style="background:linear-gradient(135deg,#93c01f,#6f9417); padding:20px 24px;">
        <h1 style="margin:0; color:#ffffff; font-size:18px;">Hospital Dr. Franco Ravera Zunino</h1>
        <p style="margin:4px 0 0; color:rgba(255,255,255,0.9); font-size:13px;">Sistema de Gestión de Licitaciones</p>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 16px; color:#1f2937; font-size:16px;">${titulo}</h2>
        ${cuerpoHtml}
      </div>
      <div style="padding:16px 24px; border-top:1px solid #eef2e6; color:#9ca3af; font-size:12px;">
        Este es un correo automático, por favor no responder.
      </div>
    </div>
  </div>`
}
