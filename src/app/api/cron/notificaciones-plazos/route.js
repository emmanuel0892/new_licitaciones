import { NextResponse } from "next/server"
import { notificarPlazos } from "@/lib/notificaciones"

const CRON_SECRET = process.env.CRON_SECRET

// POST: Ejecutar el envio de notificaciones de plazos por correo.
// Protegido con el mismo esquema de secret que el cron de Mercado Publico.
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = request.headers.get("x-cron-secret")

    const isAuthorized =
      cronSecret === CRON_SECRET ||
      authHeader === `Bearer ${CRON_SECRET}` ||
      process.env.NODE_ENV === "development"

    if (!isAuthorized && CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    const result = await notificarPlazos()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[CRON notificaciones] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
