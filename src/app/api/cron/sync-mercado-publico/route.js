import { NextResponse } from "next/server"
import { syncAllLicitacionesMP, getLastSyncStatus } from "@/lib/syncMercadoPublico"

const CRON_SECRET = process.env.CRON_SECRET

// GET: Obtener estado de última sincronización
export async function GET(request) {
  try {
    const status = await getLastSyncStatus()
    return NextResponse.json({ 
      success: true, 
      ...status,
      message: "Estado de sincronización obtenido"
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Ejecutar sincronización
export async function POST(request) {
  try {
    // Verificar autorización para cron jobs
    const authHeader = request.headers.get("authorization")
    const cronSecret = request.headers.get("x-cron-secret")
    
    // Permitir si viene del cron con el secret correcto o si es desarrollo local
    const isAuthorized = 
      cronSecret === CRON_SECRET ||
      authHeader === `Bearer ${CRON_SECRET}` ||
      process.env.NODE_ENV === "development"

    if (!isAuthorized && CRON_SECRET) {
      console.log("[CRON] Acceso no autorizado")
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      )
    }

    console.log("[CRON] Iniciando sincronización programada...")
    const startTime = Date.now()
    
    const result = await syncAllLicitacionesMP()
    
    const duration = Date.now() - startTime
    console.log(`[CRON] Sincronización completada en ${duration}ms`)

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error, synced: result.synced },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors || 0,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[CRON] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
