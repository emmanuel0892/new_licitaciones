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

// Programar tarea
cron.schedule(CRON_SCHEDULE, executeSyncJob, {
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
