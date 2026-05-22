/**
 * Script para re-vincular órdenes de compra huérfanas con sus licitaciones
 * Si las licitaciones no existen, las consulta de la API y las crea
 * Ejecutar con: node scripts/relink-oc.js
 */

require("dotenv").config()
const { PrismaClient } = require("@prisma/client")
const https = require("https")

const prisma = new PrismaClient()

const API_BASE_URL = "https://api.mercadopublico.cl/servicios/v1/publico"
const API_TICKET = process.env.MERCADO_PUBLICO_TICKET
const DELAY_BETWEEN_REQUESTS = 1500 // 1.5 segundos entre peticiones

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Función para hacer peticiones HTTPS con reintentos y manejo de rate limiting
const fetchJSON = async (url, retries = 5) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await new Promise((resolve, reject) => {
        https.get(url, { timeout: 30000 }, (res) => {
          let data = ""
          res.on("data", chunk => data += chunk)
          res.on("end", () => {
            try {
              const json = JSON.parse(data)
              resolve(json)
            } catch (e) {
              reject(new Error("Error parseando JSON"))
            }
          })
        }).on("error", reject)
          .on("timeout", function() {
            this.destroy()
            reject(new Error("Timeout"))
          })
      })
      
      // Verificar errores de API
      if (result.Codigo && result.Codigo !== 200) {
        const mensaje = result.Mensaje || ""
        
        // Si es error de peticiones simultáneas, esperar y reintentar
        if (mensaje.includes("simultáneas") || mensaje.includes("simultaneas")) {
          if (attempt < retries) {
            const waitTime = 2000 * attempt // Espera incremental: 2s, 4s, 6s...
            console.log(`   ⏳ Rate limit, esperando ${waitTime/1000}s... (intento ${attempt}/${retries})`)
            await delay(waitTime)
            continue
          }
        }
        
        throw new Error(mensaje || `Error API: ${result.Codigo}`)
      }
      
      return result
      
    } catch (error) {
      if (attempt < retries && (error.message.includes("simultáneas") || error.message.includes("Timeout"))) {
        const waitTime = 2000 * attempt
        console.log(`   ⏳ Reintentando en ${waitTime/1000}s... (intento ${attempt}/${retries})`)
        await delay(waitTime)
        continue
      }
      throw error
    }
  }
}

// Calcular monto adjudicado desde items de la licitación
const calcularMontoAdjudicado = (licData) => {
  // Primero intentar obtener de Adjudicacion directa
  if (licData.Adjudicacion?.MontoTotalAdjudicado) {
    return licData.Adjudicacion.MontoTotalAdjudicado
  }
  
  // Calcular desde items adjudicados (Cantidad * MontoUnitario)
  if (licData.Items?.Listado && licData.Items.Listado.length > 0) {
    const montoNeto = licData.Items.Listado.reduce((total, item) => {
      if (item.Adjudicacion?.Cantidad && item.Adjudicacion?.MontoUnitario) {
        return total + (item.Adjudicacion.Cantidad * item.Adjudicacion.MontoUnitario)
      }
      return total
    }, 0)
    
    // Agregar IVA (19%) para tener monto total
    return Math.round(montoNeto * 1.19)
  }
  
  return 0
}

// Obtener y guardar una licitación desde la API
const fetchAndSaveLicitacion = async (codigoExterno) => {
  try {
    const url = `${API_BASE_URL}/licitaciones.json?codigo=${codigoExterno}&ticket=${API_TICKET}`
    const data = await fetchJSON(url)
    
    const licData = data.Listado?.[0]
    if (!licData) {
      console.log(`   ⚠ Licitación ${codigoExterno} no encontrada en API`)
      return null
    }
    
    // Calcular monto adjudicado desde items
    const montoAdjudicado = calcularMontoAdjudicado(licData)
    
    const licitacionData = {
      nombre: licData.Nombre || "",
      codigoEstado: licData.CodigoEstado || 0,
      estado: licData.Estado || "",
      descripcion: licData.Descripcion || null,
      codigoTipo: licData.CodigoTipo || null,
      tipo: licData.Tipo || "",
      moneda: licData.Moneda || "CLP",
      etapas: licData.Etapas || 1,
      modalidad: licData.Modalidad || 1,
      montoEstimado: licData.MontoEstimado || 0,
      montoAdjudicado,
      tiempoDuracion: licData.Tiempo?.toString() || null,
      unidadTiempoDuracion: licData.UnidadTiempo ? parseInt(licData.UnidadTiempo) : null,
      fechaCreacion: licData.Fechas?.FechaCreacion ? new Date(licData.Fechas.FechaCreacion) : null,
      fechaPublicacion: licData.Fechas?.FechaPublicacion ? new Date(licData.Fechas.FechaPublicacion) : null,
      fechaCierre: licData.Fechas?.FechaCierre ? new Date(licData.Fechas.FechaCierre) : null,
      fechaAdjudicacion: licData.Fechas?.FechaAdjudicacion ? new Date(licData.Fechas.FechaAdjudicacion) : null,
      fechaInicio: licData.Fechas?.FechaInicio ? new Date(licData.Fechas.FechaInicio) : null,
      fechaFinal: licData.Fechas?.FechaFinal ? new Date(licData.Fechas.FechaFinal) : null,
      adjudicacionTipo: licData.Adjudicacion?.Tipo || null,
      adjudicacionNumero: licData.Adjudicacion?.Numero || null,
      adjudicacionNumOferentes: licData.Adjudicacion?.NumeroOferentes || null,
      adjudicacionUrlActa: licData.Adjudicacion?.UrlActa || null,
      codigoOrganismo: licData.Comprador?.CodigoOrganismo?.toString() || null,
      nombreOrganismo: licData.Comprador?.NombreOrganismo || null,
      rutUnidad: licData.Comprador?.RutUnidad || null,
      codigoUnidad: licData.Comprador?.CodigoUnidad?.toString() || null,
      nombreUnidad: licData.Comprador?.NombreUnidad || null,
      direccionUnidad: licData.Comprador?.DireccionUnidad || null,
      comunaUnidad: licData.Comprador?.ComunaUnidad || null,
      regionUnidad: licData.Comprador?.RegionUnidad || null,
      nombreUsuario: licData.Comprador?.NombreUsuario || null,
      cargoUsuario: licData.Comprador?.CargoUsuario || null,
      requirente: licData.Comprador?.NombreUnidad || "Sin requirente"
    }
    
    const licitacion = await prisma.licitacionMP.upsert({
      where: { codigoExterno: licData.CodigoExterno },
      update: licitacionData,
      create: {
        codigoExterno: licData.CodigoExterno,
        ...licitacionData
      }
    })
    
    console.log(`   ✓ Licitación ${codigoExterno} obtenida y guardada`)
    return licitacion
  } catch (error) {
    console.error(`   ✗ Error obteniendo licitación ${codigoExterno}: ${error.message}`)
    return null
  }
}

const relinkOrphanOC = async () => {
  console.log("═══════════════════════════════════════════")
  console.log("  Re-vinculación de Órdenes de Compra")
  console.log("═══════════════════════════════════════════\n")
  
  try {
    // Buscar OC que tienen codigoLicitacion pero no licitacionMPId
    const orphanOCs = await prisma.ordenCompraMP.findMany({
      where: {
        codigoLicitacion: { not: null },
        licitacionMPId: null
      },
      select: {
        id: true,
        codigo: true,
        codigoLicitacion: true
      }
    })
    
    console.log(`📦 OC sin vincular: ${orphanOCs.length}`)
    
    if (orphanOCs.length === 0) {
      console.log("✓ No hay OC huérfanas\n")
      return
    }
    
    // Obtener códigos únicos de licitaciones referenciadas
    const codigosLic = [...new Set(orphanOCs.map(oc => oc.codigoLicitacion))]
    console.log(`📋 Licitaciones referenciadas: ${codigosLic.length}`)
    console.log(`   Códigos: ${codigosLic.join(", ")}\n`)
    
    // Buscar cuáles existen en BD
    const licitacionesExistentes = await prisma.licitacionMP.findMany({
      where: { codigoExterno: { in: codigosLic } },
      select: { id: true, codigoExterno: true }
    })
    
    console.log(`✓ Licitaciones encontradas en BD: ${licitacionesExistentes.length}`)
    
    const mapLic = new Map(licitacionesExistentes.map(l => [l.codigoExterno, l.id]))
    
    // Identificar licitaciones faltantes
    const codigosFaltantes = codigosLic.filter(c => !mapLic.has(c))
    
    // Buscar licitaciones faltantes en la API
    if (codigosFaltantes.length > 0) {
      console.log(`\n🔍 Buscando ${codigosFaltantes.length} licitaciones faltantes en API...`)
      
      if (!API_TICKET) {
        console.error("   ✗ ERROR: Falta MERCADO_PUBLICO_TICKET en variables de entorno")
      } else {
        let fetched = 0
        let notInAPI = 0
        
        for (const codigo of codigosFaltantes) {
          await delay(DELAY_BETWEEN_REQUESTS)
          const licitacion = await fetchAndSaveLicitacion(codigo)
          
          if (licitacion) {
            mapLic.set(codigo, licitacion.id)
            fetched++
          } else {
            notInAPI++
          }
        }
        
        console.log(`\n   ✓ Licitaciones obtenidas de API: ${fetched}`)
        if (notInAPI > 0) {
          console.log(`   ⚠ No encontradas en API: ${notInAPI}`)
        }
      }
    }
    
    // Vincular OC con todas las licitaciones disponibles
    console.log("\n🔗 Vinculando órdenes de compra...")
    let linked = 0
    let notFound = 0
    
    for (const oc of orphanOCs) {
      const licId = mapLic.get(oc.codigoLicitacion)
      
      if (licId) {
        await prisma.ordenCompraMP.update({
          where: { id: oc.id },
          data: { licitacionMPId: licId }
        })
        linked++
        process.stdout.write(`\r   Vinculadas: ${linked}`)
      } else {
        notFound++
      }
    }
    
    console.log(`\n\n───────────────────────────────────────────`)
    console.log(`✓ OC vinculadas:     ${linked}`)
    if (notFound > 0) {
      console.log(`✗ Sin licitación (no existe en API): ${notFound}`)
    }
    
    // Actualizar consumo de licitaciones afectadas
    if (linked > 0) {
      console.log("\n📊 Actualizando consumo de licitaciones...")
      
      for (const [codigoExt, licId] of mapLic) {
        const ordenes = await prisma.ordenCompraMP.findMany({
          where: { licitacionMPId: licId, codigoEstado: { in: [6, 12] } }, // Aceptada o Recepción Conforme
          select: { total: true }
        })
        
        const lic = await prisma.licitacionMP.findUnique({
          where: { id: licId },
          select: { montoAdjudicado: true }
        })
        
        const montoConsumido = ordenes.reduce((acc, o) => acc + (o.total || 0), 0)
        const porcentajeConsumo = lic.montoAdjudicado > 0 
          ? (montoConsumido / lic.montoAdjudicado) * 100 
          : 0
        
        await prisma.licitacionMP.update({
          where: { id: licId },
          data: { montoConsumido, porcentajeConsumo }
        })
      }
      
      console.log("   ✓ Consumo actualizado")
    }
    
    console.log("═══════════════════════════════════════════\n")
    
  } catch (error) {
    console.error("✗ Error:", error.message)
  }
}

// Actualizar montos de licitaciones que tienen monto 0
const updateLicitacionesSinMonto = async () => {
  console.log("═══════════════════════════════════════════")
  console.log("  Actualización de Montos de Licitaciones")
  console.log("═══════════════════════════════════════════\n")
  
  if (!API_TICKET) {
    console.error("✗ ERROR: Falta MERCADO_PUBLICO_TICKET en variables de entorno")
    return
  }
  
  try {
    // Buscar licitaciones adjudicadas con monto 0
    const licitacionesSinMonto = await prisma.licitacionMP.findMany({
      where: {
        montoAdjudicado: { lte: 0 },
        codigoEstado: 8 // Adjudicadas
      },
      select: {
        id: true,
        codigoExterno: true,
        nombre: true
      }
    })
    
    console.log(`📋 Licitaciones adjudicadas sin monto: ${licitacionesSinMonto.length}`)
    
    if (licitacionesSinMonto.length === 0) {
      console.log("✓ Todas las licitaciones tienen monto asignado\n")
      return
    }
    
    let updated = 0
    let failed = 0
    
    for (const lic of licitacionesSinMonto) {
      await delay(DELAY_BETWEEN_REQUESTS)
      
      try {
        const url = `${API_BASE_URL}/licitaciones.json?codigo=${lic.codigoExterno}&ticket=${API_TICKET}`
        const data = await fetchJSON(url)
        const licData = data.Listado?.[0]
        
        if (!licData) {
          failed++
          continue
        }
        
        const montoAdjudicado = calcularMontoAdjudicado(licData)
        
        if (montoAdjudicado > 0) {
          // Calcular consumo actual
          const ordenes = await prisma.ordenCompraMP.findMany({
            where: { licitacionMPId: lic.id, codigoEstado: { in: [6, 12] } }, // Aceptada o Recepción Conforme
            select: { total: true }
          })
          
          const montoConsumido = ordenes.reduce((acc, o) => acc + (o.total || 0), 0)
          const porcentajeConsumo = (montoConsumido / montoAdjudicado) * 100
          
          await prisma.licitacionMP.update({
            where: { id: lic.id },
            data: { montoAdjudicado, montoConsumido, porcentajeConsumo }
          })
          
          updated++
          console.log(`   ✓ ${lic.codigoExterno}: $${montoAdjudicado.toLocaleString("es-CL")}`)
        } else {
          console.log(`   ⚠ ${lic.codigoExterno}: Sin items adjudicados`)
        }
        
      } catch (error) {
        console.error(`   ✗ ${lic.codigoExterno}: ${error.message}`)
        failed++
      }
    }
    
    console.log(`\n───────────────────────────────────────────`)
    console.log(`✓ Licitaciones actualizadas: ${updated}`)
    if (failed > 0) {
      console.log(`✗ Errores: ${failed}`)
    }
    console.log("═══════════════════════════════════════════\n")
    
  } catch (error) {
    console.error("✗ Error:", error.message)
  }
}

// Recalcular consumo de todas las licitaciones
const recalcularConsumo = async () => {
  console.log("═══════════════════════════════════════════")
  console.log("  Recálculo de Consumo de Licitaciones")
  console.log("═══════════════════════════════════════════\n")
  
  try {
    const licitaciones = await prisma.licitacionMP.findMany({
      where: { montoAdjudicado: { gt: 0 } },
      include: {
        ordenesCompra: {
          where: { codigoEstado: { in: [6, 12] } }, // Aceptada o Recepción Conforme
          select: { total: true }
        }
      }
    })
    
    console.log(`📋 Licitaciones a procesar: ${licitaciones.length}`)
    
    let updated = 0
    for (const lic of licitaciones) {
      const montoConsumido = lic.ordenesCompra.reduce((acc, oc) => acc + (oc.total || 0), 0)
      const porcentajeConsumo = (montoConsumido / lic.montoAdjudicado) * 100
      
      await prisma.licitacionMP.update({
        where: { id: lic.id },
        data: { montoConsumido, porcentajeConsumo }
      })
      updated++
      process.stdout.write(`\r   Procesadas: ${updated}/${licitaciones.length}`)
    }
    
    console.log(`\n\n───────────────────────────────────────────`)
    console.log(`✓ Licitaciones actualizadas: ${updated}`)
    console.log("═══════════════════════════════════════════\n")
    
  } catch (error) {
    console.error("✗ Error:", error.message)
  }
}

// Ejecutar todas las funciones
const run = async () => {
  try {
    await relinkOrphanOC()
    await updateLicitacionesSinMonto()
    await recalcularConsumo()
  } finally {
    await prisma.$disconnect()
  }
}

run()
