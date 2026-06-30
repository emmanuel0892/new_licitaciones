/**
 * Script de sincronización programada con Mercado Público
 * Ejecutar con: node scripts/cron-sync.js
 * 
 * Este script ejecuta sync-diario.js cada 15 minutos
 * Puede ejecutarse como servicio de Windows o con PM2
 */

const cron = require("node-cron")
const { spawn } = require("child_process")
const path = require("path")

// Configuración del intervalo (cada 15 minutos)
const CRON_SCHEDULE = "*/15 * * * *"

// Valor agregado · Fase 1: notificaciones de plazos por correo (una vez al día, 08:00)
const NOTIF_SCHEDULE = process.env.NOTIF_CRON_SCHEDULE || "0 8 * * *"
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000"
const CRON_SECRET = process.env.CRON_SECRET || ""

console.log("═══════════════════════════════════════════")
console.log("  CRON Sync Mercado Público - Iniciado")
console.log("═══════════════════════════════════════════")
console.log(`Schedule: ${CRON_SCHEDULE} (cada 15 minutos)`)
console.log(`Hora inicio: ${new Date().toLocaleString("es-CL")}`)
console.log("───────────────────────────────────────────")

let isRunning = false

const executeSyncJob = () => {
  if (isRunning) {
    console.log(`[${new Date().toLocaleString("es-CL")}] Sincronización en progreso, saltando...`)
    return
  }

  isRunning = true
  console.log(`\n[${new Date().toLocaleString("es-CL")}] Iniciando sincronización diaria...`)

  const scriptPath = path.join(__dirname, "sync-diario.js")
  const child = spawn("node", [scriptPath], {
    stdio: "inherit",
    cwd: path.join(__dirname, "..")
  })

  child.on("close", (code) => {
    isRunning = false
    if (code === 0) {
      console.log(`[${new Date().toLocaleString("es-CL")}] Sincronización completada exitosamente`)
    } else {
      console.error(`[${new Date().toLocaleString("es-CL")}] Sincronización finalizó con código: ${code}`)
    }
  })

  child.on("error", (error) => {
    isRunning = false
    console.error(`[${new Date().toLocaleString("es-CL")}] Error ejecutando script: ${error.message}`)
  })
}

// Job de notificaciones de plazos: llama al endpoint protegido de la app.
const executeNotificacionesJob = async () => {
  try {
    const res = await fetch(`${APP_BASE_URL}/api/cron/notificaciones-plazos`, {
      method: "POST",
      headers: { "x-cron-secret": CRON_SECRET }
    })
    const data = await res.json()
    console.log(`[${new Date().toLocaleString("es-CL")}] Notificaciones:`, JSON.stringify(data))
  } catch (error) {
    console.error(`[${new Date().toLocaleString("es-CL")}] Error en notificaciones: ${error.message}`)
  }
}

// Programar tarea
cron.schedule(CRON_SCHEDULE, executeSyncJob, {
  scheduled: true,
  timezone: "America/Santiago"
})

// Programar notificaciones de plazos
cron.schedule(NOTIF_SCHEDULE, executeNotificacionesJob, {
  scheduled: true,
  timezone: "America/Santiago"
})

// Ejecutar una vez al iniciar (opcional)
if (process.argv.includes("--run-now")) {
  console.log("\n[INIT] Ejecutando sincronización inicial...")
  executeSyncJob()
}

console.log("\nEsperando próxima ejecución programada...")
console.log("Presiona Ctrl+C para detener\n")

// Mantener el proceso activo
process.on("SIGINT", () => {
  console.log("\n\nCRON detenido por el usuario")
  process.exit(0)
})
