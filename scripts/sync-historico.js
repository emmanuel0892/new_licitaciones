/**
 * Script de Sincronización Histórica Completa - Mercado Público
 * 
 * Sincroniza desde 01-01-2025 hasta la fecha actual:
 * - Licitaciones del organismo
 * - Órdenes de compra por fecha
 * - Items de cada orden de compra
 * 
 * Ejecutar con: npm run sync:historico
 * 
 * Características:
 * - Iteración día por día
 * - Reintentos automáticos
 * - Rate limiting
 * - Logs detallados
 * - Reanudación desde última fecha procesada
 * - Control de duplicados via upsert
 */

require("dotenv").config()
const https = require("https")
const fs = require("fs")
const path = require("path")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

// Configuración
const API_BASE_URL = "https://api.mercadopublico.cl/servicios/v1/publico"
const API_TICKET = process.env.MERCADO_PUBLICO_TICKET
const CODIGO_ORGANISMO = process.env.MERCADO_PUBLICO_CODIGO_ORGANISMO || "7374"

// Archivo de progreso para reanudación
const PROGRESS_FILE = path.join(__dirname, ".sync-progress.json")

// Rate limiting
const DELAY_BETWEEN_REQUESTS = 500 // ms entre peticiones
const DELAY_BETWEEN_DAYS = 1000 // ms entre días
const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // ms antes de reintentar

// Estadísticas
const stats = {
  diasProcesados: 0,
  licitacionesSincronizadas: 0,
  ordenesCompraSincronizadas: 0,
  itemsSincronizados: 0,
  errores: 0,
  inicio: null,
  ultimaFecha: null
}

// Helper: delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Helper: formatear fecha para API (DDMMYYYY)
const formatDateForAPI = (date) => {
  const d = String(date.getDate()).padStart(2, "0")
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const y = date.getFullYear()
  return `${d}${m}${y}`
}

// Helper: formatear fecha para logs
const formatDateForLog = (date) => {
  return date.toISOString().split("T")[0]
}

// Función para hacer peticiones HTTPS con reintentos
const fetchJSON = async (url, retries = MAX_RETRIES) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const data = await new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 30000 }, (res) => {
          let data = ""
          res.on("data", chunk => data += chunk)
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data)
              resolve(parsed)
            } catch (e) {
              reject(new Error(`Error parseando JSON: ${e.message}`))
            }
          })
        })
        
        req.on("error", (e) => reject(new Error(`Error de conexión: ${e.message}`)))
        req.on("timeout", () => {
          req.destroy()
          reject(new Error("Timeout de conexión"))
        })
      })
      
      return data
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      console.log(`    ⟳ Reintento ${attempt}/${retries} - ${error.message}`)
      await delay(RETRY_DELAY * attempt)
    }
  }
}

// Guardar progreso
const saveProgress = (lastDate) => {
  const progress = {
    lastDate: lastDate.toISOString(),
    stats: { ...stats, ultimaFecha: lastDate.toISOString() },
    savedAt: new Date().toISOString()
  }
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

// Cargar progreso
const loadProgress = () => {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"))
      return new Date(data.lastDate)
    }
  } catch (e) {
    console.log("No se pudo cargar progreso anterior, iniciando desde cero")
  }
  return null
}

// Limpiar progreso
const clearProgress = () => {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE)
    }
  } catch (e) {
    // Ignorar
  }
}

// Sincronizar licitaciones del organismo
const syncLicitaciones = async () => {
  console.log("\n📋 Sincronizando licitaciones del organismo...")
  
  try {
    const url = `${API_BASE_URL}/licitaciones.json?CodigoOrganismo=${CODIGO_ORGANISMO}&ticket=${API_TICKET}`
    const data = await fetchJSON(url)
    
    if (!data.Listado || data.Listado.length === 0) {
      console.log("   No se encontraron licitaciones")
      return
    }
    
    console.log(`   Encontradas ${data.Listado.length} licitaciones en listado`)
    
    for (const licResumen of data.Listado) {
      try {
        await delay(DELAY_BETWEEN_REQUESTS)
        
        // Obtener detalle completo
        const detalleUrl = `${API_BASE_URL}/licitaciones.json?codigo=${licResumen.CodigoExterno}&ticket=${API_TICKET}`
        const detalleData = await fetchJSON(detalleUrl)
        const licData = detalleData.Listado?.[0]
        
        if (!licData) continue
        
        // Calcular monto adjudicado desde items (con IVA)
        let montoAdjudicado = 0
        if (licData.Items?.Listado) {
          const montoNeto = licData.Items.Listado.reduce((acc, item) => {
            if (item.Adjudicacion?.Cantidad && item.Adjudicacion?.MontoUnitario) {
              return acc + (item.Adjudicacion.Cantidad * item.Adjudicacion.MontoUnitario)
            }
            return acc
          }, 0)
          // Agregar IVA (19%) para monto total
          montoAdjudicado = Math.round(montoNeto * 1.19)
        }
        
        // Upsert licitación
        const licitacion = await prisma.licitacionMP.upsert({
          where: { codigoExterno: licData.CodigoExterno },
          update: {
            nombre: licData.Nombre || "",
            descripcion: licData.Descripcion,
            estado: licData.Estado || "Desconocido",
            codigoEstado: licData.CodigoEstado || 0,
            tipo: licData.Tipo || "",
            codigoTipo: licData.CodigoTipo,
            etapas: licData.Etapas,
            modalidad: licData.Modalidad,
            montoEstimado: licData.MontoEstimado,
            montoAdjudicado,
            tiempoDuracion: licData.TiempoDuracionContrato?.toString(),
            unidadTiempoDuracion: licData.UnidadTiempoDuracion,
            fechaCreacion: licData.Fechas?.FechaCreacion ? new Date(licData.Fechas.FechaCreacion) : null,
            fechaPublicacion: licData.Fechas?.FechaPublicacion ? new Date(licData.Fechas.FechaPublicacion) : null,
            fechaCierre: licData.Fechas?.FechaCierre ? new Date(licData.Fechas.FechaCierre) : null,
            fechaAdjudicacion: licData.Fechas?.FechaAdjudicacion ? new Date(licData.Fechas.FechaAdjudicacion) : null,
            fechaInicio: licData.Fechas?.FechaInicio ? new Date(licData.Fechas.FechaInicio) : null,
            fechaFinal: licData.Fechas?.FechaFinal ? new Date(licData.Fechas.FechaFinal) : null,
            adjudicacionTipo: licData.Adjudicacion?.Tipo,
            adjudicacionNumero: licData.Adjudicacion?.Numero,
            adjudicacionNumOferentes: licData.Adjudicacion?.NumeroOferentes,
            adjudicacionUrlActa: licData.Adjudicacion?.UrlActa,
            codigoOrganismo: licData.Comprador?.CodigoOrganismo,
            nombreOrganismo: licData.Comprador?.NombreOrganismo,
            rutUnidad: licData.Comprador?.RutUnidad,
            codigoUnidad: licData.Comprador?.CodigoUnidad,
            nombreUnidad: licData.Comprador?.NombreUnidad,
            direccionUnidad: licData.Comprador?.DireccionUnidad,
            comunaUnidad: licData.Comprador?.ComunaUnidad,
            regionUnidad: licData.Comprador?.RegionUnidad,
            nombreUsuario: licData.Comprador?.NombreUsuario,
            cargoUsuario: licData.Comprador?.CargoUsuario
          },
          create: {
            codigoExterno: licData.CodigoExterno,
            nombre: licData.Nombre || "",
            descripcion: licData.Descripcion,
            estado: licData.Estado || "Desconocido",
            codigoEstado: licData.CodigoEstado || 0,
            tipo: licData.Tipo || "",
            codigoTipo: licData.CodigoTipo,
            moneda: licData.Moneda || "CLP",
            etapas: licData.Etapas,
            modalidad: licData.Modalidad,
            montoEstimado: licData.MontoEstimado,
            montoAdjudicado,
            tiempoDuracion: licData.TiempoDuracionContrato?.toString(),
            unidadTiempoDuracion: licData.UnidadTiempoDuracion,
            fechaCreacion: licData.Fechas?.FechaCreacion ? new Date(licData.Fechas.FechaCreacion) : null,
            fechaPublicacion: licData.Fechas?.FechaPublicacion ? new Date(licData.Fechas.FechaPublicacion) : null,
            fechaCierre: licData.Fechas?.FechaCierre ? new Date(licData.Fechas.FechaCierre) : null,
            fechaAdjudicacion: licData.Fechas?.FechaAdjudicacion ? new Date(licData.Fechas.FechaAdjudicacion) : null,
            fechaInicio: licData.Fechas?.FechaInicio ? new Date(licData.Fechas.FechaInicio) : null,
            fechaFinal: licData.Fechas?.FechaFinal ? new Date(licData.Fechas.FechaFinal) : null,
            adjudicacionTipo: licData.Adjudicacion?.Tipo,
            adjudicacionNumero: licData.Adjudicacion?.Numero,
            adjudicacionNumOferentes: licData.Adjudicacion?.NumeroOferentes,
            adjudicacionUrlActa: licData.Adjudicacion?.UrlActa,
            codigoOrganismo: licData.Comprador?.CodigoOrganismo,
            nombreOrganismo: licData.Comprador?.NombreOrganismo,
            rutUnidad: licData.Comprador?.RutUnidad,
            codigoUnidad: licData.Comprador?.CodigoUnidad,
            nombreUnidad: licData.Comprador?.NombreUnidad,
            direccionUnidad: licData.Comprador?.DireccionUnidad,
            comunaUnidad: licData.Comprador?.ComunaUnidad,
            regionUnidad: licData.Comprador?.RegionUnidad,
            nombreUsuario: licData.Comprador?.NombreUsuario,
            cargoUsuario: licData.Comprador?.CargoUsuario,
            requirente: licData.Comprador?.NombreUnidad || "Sin asignar"
          }
        })
        
        // Sincronizar items de la licitación
        if (licData.Items?.Listado && licData.Items.Listado.length > 0) {
          for (const item of licData.Items.Listado) {
            await prisma.itemLicitacionMP.upsert({
              where: {
                id: await prisma.itemLicitacionMP.findFirst({
                  where: {
                    licitacionMPId: licitacion.id,
                    correlativo: item.Correlativo
                  },
                  select: { id: true }
                }).then(r => r?.id || 0)
              },
              update: {
                codigoProducto: item.CodigoProducto || 0,
                codigoCategoria: item.CodigoCategoria?.toString() || "0",
                categoria: item.Categoria,
                nombreProducto: item.NombreProducto || "",
                descripcion: item.Descripcion,
                unidadMedida: item.UnidadMedida || "",
                cantidadTotal: item.Cantidad || 0,
                cantidadAdjudicada: item.Adjudicacion?.Cantidad,
                montoUnitario: item.Adjudicacion?.MontoUnitario || 0,
                montoTotal: (item.Adjudicacion?.Cantidad || 0) * (item.Adjudicacion?.MontoUnitario || 0),
                rutProveedor: item.Adjudicacion?.RutProveedor,
                nombreProveedor: item.Adjudicacion?.NombreProveedor
              },
              create: {
                licitacionMPId: licitacion.id,
                correlativo: item.Correlativo || 1,
                codigoProducto: item.CodigoProducto || 0,
                codigoCategoria: item.CodigoCategoria?.toString() || "0",
                categoria: item.Categoria,
                nombreProducto: item.NombreProducto || "",
                descripcion: item.Descripcion,
                unidadMedida: item.UnidadMedida || "",
                cantidadTotal: item.Cantidad || 0,
                cantidadAdjudicada: item.Adjudicacion?.Cantidad,
                montoUnitario: item.Adjudicacion?.MontoUnitario || 0,
                montoTotal: (item.Adjudicacion?.Cantidad || 0) * (item.Adjudicacion?.MontoUnitario || 0),
                rutProveedor: item.Adjudicacion?.RutProveedor,
                nombreProveedor: item.Adjudicacion?.NombreProveedor
              }
            })
          }
        }
        
        stats.licitacionesSincronizadas++
        process.stdout.write(`\r   Licitaciones: ${stats.licitacionesSincronizadas}`)
      } catch (err) {
        stats.errores++
      }
    }
    
    console.log(`\n   ✓ ${stats.licitacionesSincronizadas} licitaciones sincronizadas`)
  } catch (error) {
    console.error(`   ✗ Error sincronizando licitaciones: ${error.message}`)
    stats.errores++
  }
}

// Sincronizar órdenes de compra de una fecha específica
const syncOrdenesCompraByDate = async (fecha) => {
  const fechaAPI = formatDateForAPI(fecha)
  const fechaLog = formatDateForLog(fecha)
  
  try {
    const url = `${API_BASE_URL}/ordenesdecompra.json?fecha=${fechaAPI}&CodigoOrganismo=${CODIGO_ORGANISMO}&ticket=${API_TICKET}`
    const data = await fetchJSON(url)
    
    if (!data.Listado || data.Listado.length === 0) {
      return 0
    }
    
    let ocCount = 0
    
    for (const ocResumen of data.Listado) {
      try {
        await delay(DELAY_BETWEEN_REQUESTS)
        
        // Obtener detalle completo de la OC
        const detalleUrl = `${API_BASE_URL}/ordenesdecompra.json?codigo=${ocResumen.Codigo}&ticket=${API_TICKET}`
        const detalleData = await fetchJSON(detalleUrl)
        const ocData = detalleData.Listado?.[0]
        
        if (!ocData) continue
        
        // Buscar licitación relacionada
        let licitacionMPId = null
        if (ocData.CodigoLicitacion) {
          const licitacion = await prisma.licitacionMP.findUnique({
            where: { codigoExterno: ocData.CodigoLicitacion },
            select: { id: true }
          })
          licitacionMPId = licitacion?.id || null
        }
        
        // Upsert orden de compra
        const orden = await prisma.ordenCompraMP.upsert({
          where: { codigo: ocData.Codigo },
          update: {
            licitacionMPId,
            codigoLicitacion: ocData.CodigoLicitacion,
            nombre: ocData.Nombre || "",
            descripcion: ocData.Descripcion,
            codigoEstado: ocData.CodigoEstado || 0,
            estado: ocData.Estado || "",
            codigoTipo: ocData.CodigoTipo,
            tipo: ocData.Tipo || "",
            tipoMoneda: ocData.TipoMoneda || "CLP",
            codigoEstadoProveedor: ocData.CodigoEstadoProveedor,
            estadoProveedor: ocData.EstadoProveedor,
            descuentos: ocData.Descuentos || 0,
            cargos: ocData.Cargos || 0,
            totalNeto: ocData.TotalNeto || 0,
            porcentajeIva: ocData.PorcentajeIva || 19,
            impuestos: ocData.Impuestos || 0,
            total: ocData.Total || 0,
            fechaEnvio: ocData.Fechas?.FechaEnvio ? new Date(ocData.Fechas.FechaEnvio) : null,
            fechaAceptacion: ocData.Fechas?.FechaAceptacion ? new Date(ocData.Fechas.FechaAceptacion) : null,
            fechaCancelacion: ocData.Fechas?.FechaCancelacion ? new Date(ocData.Fechas.FechaCancelacion) : null,
            fechaUltimaModificacion: ocData.Fechas?.FechaUltimaModificacion ? new Date(ocData.Fechas.FechaUltimaModificacion) : null,
            financiamiento: ocData.Financiamiento,
            tipoDespacho: ocData.TipoDespacho,
            formaPago: ocData.FormaPago,
            codigoOrganismo: ocData.Comprador?.CodigoOrganismo,
            nombreOrganismo: ocData.Comprador?.NombreOrganismo,
            rutUnidad: ocData.Comprador?.RutUnidad,
            nombreUnidad: ocData.Comprador?.NombreUnidad,
            direccionUnidad: ocData.Comprador?.DireccionUnidad,
            comunaUnidad: ocData.Comprador?.ComunaUnidad,
            nombreContacto: ocData.Comprador?.NombreContacto,
            cargoContacto: ocData.Comprador?.CargoContacto,
            codigoProveedor: ocData.Proveedor?.Codigo,
            rutProveedor: ocData.Proveedor?.RutSucursal,
            nombreProveedor: ocData.Proveedor?.Nombre,
            direccionProveedor: ocData.Proveedor?.Direccion,
            comunaProveedor: ocData.Proveedor?.Comuna,
            regionProveedor: ocData.Proveedor?.Region
          },
          create: {
            licitacionMPId,
            codigoLicitacion: ocData.CodigoLicitacion,
            codigo: ocData.Codigo,
            nombre: ocData.Nombre || "",
            descripcion: ocData.Descripcion,
            codigoEstado: ocData.CodigoEstado || 0,
            estado: ocData.Estado || "",
            codigoTipo: ocData.CodigoTipo,
            tipo: ocData.Tipo || "",
            tipoMoneda: ocData.TipoMoneda || "CLP",
            codigoEstadoProveedor: ocData.CodigoEstadoProveedor,
            estadoProveedor: ocData.EstadoProveedor,
            descuentos: ocData.Descuentos || 0,
            cargos: ocData.Cargos || 0,
            totalNeto: ocData.TotalNeto || 0,
            porcentajeIva: ocData.PorcentajeIva || 19,
            impuestos: ocData.Impuestos || 0,
            total: ocData.Total || 0,
            fechaCreacion: ocData.Fechas?.FechaCreacion ? new Date(ocData.Fechas.FechaCreacion) : new Date(),
            fechaEnvio: ocData.Fechas?.FechaEnvio ? new Date(ocData.Fechas.FechaEnvio) : null,
            fechaAceptacion: ocData.Fechas?.FechaAceptacion ? new Date(ocData.Fechas.FechaAceptacion) : null,
            fechaCancelacion: ocData.Fechas?.FechaCancelacion ? new Date(ocData.Fechas.FechaCancelacion) : null,
            fechaUltimaModificacion: ocData.Fechas?.FechaUltimaModificacion ? new Date(ocData.Fechas.FechaUltimaModificacion) : null,
            financiamiento: ocData.Financiamiento,
            tipoDespacho: ocData.TipoDespacho,
            formaPago: ocData.FormaPago,
            codigoOrganismo: ocData.Comprador?.CodigoOrganismo,
            nombreOrganismo: ocData.Comprador?.NombreOrganismo,
            rutUnidad: ocData.Comprador?.RutUnidad,
            nombreUnidad: ocData.Comprador?.NombreUnidad,
            direccionUnidad: ocData.Comprador?.DireccionUnidad,
            comunaUnidad: ocData.Comprador?.ComunaUnidad,
            nombreContacto: ocData.Comprador?.NombreContacto,
            cargoContacto: ocData.Comprador?.CargoContacto,
            codigoProveedor: ocData.Proveedor?.Codigo,
            rutProveedor: ocData.Proveedor?.RutSucursal,
            nombreProveedor: ocData.Proveedor?.Nombre,
            direccionProveedor: ocData.Proveedor?.Direccion,
            comunaProveedor: ocData.Proveedor?.Comuna,
            regionProveedor: ocData.Proveedor?.Region
          }
        })
        
        // Sincronizar items de la OC
        if (ocData.Items?.Listado && ocData.Items.Listado.length > 0) {
          // Eliminar items anteriores para evitar duplicados
          await prisma.itemOrdenCompraMP.deleteMany({
            where: { ordenCompraId: orden.id }
          })
          
          for (const item of ocData.Items.Listado) {
            await prisma.itemOrdenCompraMP.create({
              data: {
                ordenCompraId: orden.id,
                correlativo: item.Correlativo || 1,
                codigoCategoria: item.CodigoCategoria || 0,
                categoria: item.Categoria,
                codigoProducto: item.CodigoProducto || 0,
                producto: item.Producto || "",
                especificacionComprador: item.EspecificacionComprador,
                especificacionProveedor: item.EspecificacionProveedor,
                cantidad: item.Cantidad || 0,
                unidad: item.Unidad,
                moneda: item.Moneda || "CLP",
                precioNeto: item.PrecioNeto || 0,
                totalDescuentos: item.TotalDescuentos || 0,
                totalCargos: item.TotalCargos || 0,
                totalImpuestos: item.TotalImpuestos || 0,
                total: item.Total || 0
              }
            })
            stats.itemsSincronizados++
          }
        }
        
        ocCount++
        stats.ordenesCompraSincronizadas++
      } catch (err) {
        stats.errores++
      }
    }
    
    return ocCount
  } catch (error) {
    if (!error.message.includes("No hay datos")) {
      console.error(`   ✗ Error en ${fechaLog}: ${error.message}`)
      stats.errores++
    }
    return 0
  }
}

// Re-vincular OC huérfanas con sus licitaciones
const relinkOrphanOC = async () => {
  console.log("\n🔗 Re-vinculando órdenes de compra con licitaciones...")
  
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
    
    if (orphanOCs.length === 0) {
      console.log("   ✓ No hay OC huérfanas")
      return
    }
    
    console.log(`   Encontradas ${orphanOCs.length} OC sin vincular`)
    
    let linked = 0
    for (const oc of orphanOCs) {
      const licitacion = await prisma.licitacionMP.findUnique({
        where: { codigoExterno: oc.codigoLicitacion },
        select: { id: true }
      })
      
      if (licitacion) {
        await prisma.ordenCompraMP.update({
          where: { id: oc.id },
          data: { licitacionMPId: licitacion.id }
        })
        linked++
      }
    }
    
    console.log(`   ✓ ${linked} OC vinculadas correctamente`)
  } catch (error) {
    console.error(`   ✗ Error re-vinculando: ${error.message}`)
  }
}

// Actualizar consumo de licitaciones
const updateConsumoLicitaciones = async () => {
  console.log("\n📊 Calculando consumo de licitaciones...")
  
  try {
    const licitaciones = await prisma.licitacionMP.findMany({
      include: {
        ordenesCompra: {
          where: { codigoEstado: { in: [6, 12] } }, // Aceptada o Recepción Conforme
          select: { total: true }
        }
      }
    })
    
    for (const lic of licitaciones) {
      const montoConsumido = lic.ordenesCompra.reduce((acc, oc) => acc + (oc.total || 0), 0)
      const porcentajeConsumo = lic.montoAdjudicado > 0 
        ? (montoConsumido / lic.montoAdjudicado) * 100 
        : 0
      
      await prisma.licitacionMP.update({
        where: { id: lic.id },
        data: { montoConsumido, porcentajeConsumo }
      })
    }
    
    console.log(`   ✓ Consumo actualizado para ${licitaciones.length} licitaciones`)
  } catch (error) {
    console.error(`   ✗ Error actualizando consumo: ${error.message}`)
  }
}

// Función principal
const runHistoricSync = async () => {
  console.log("═══════════════════════════════════════════════════════")
  console.log("  SINCRONIZACIÓN HISTÓRICA COMPLETA - MERCADO PÚBLICO")
  console.log("═══════════════════════════════════════════════════════")
  console.log(`Organismo: ${CODIGO_ORGANISMO}`)
  console.log(`Inicio: ${new Date().toLocaleString("es-CL")}`)
  console.log("═══════════════════════════════════════════════════════\n")
  
  if (!API_TICKET) {
    console.error("✗ ERROR: Falta MERCADO_PUBLICO_TICKET en variables de entorno")
    process.exit(1)
  }
  
  stats.inicio = new Date()
  
  // Verificar si hay progreso previo
  const lastProcessedDate = loadProgress()
  const START_DATE = lastProcessedDate
    ? new Date(lastProcessedDate.getTime() + 24 * 60 * 60 * 1000) // día siguiente
    : new Date(2026, 4, 1); // 01-05-2026
  const END_DATE = new Date()
  
  if (lastProcessedDate) {
    console.log(`⟳ Reanudando desde: ${formatDateForLog(START_DATE)}`)
  } else {
    console.log(`Rango: ${formatDateForLog(START_DATE)} → ${formatDateForLog(END_DATE)}`)
  }
  
  try {
    // Paso 1: Sincronizar licitaciones
    await syncLicitaciones()
    
    // Paso 2: Iterar día por día para órdenes de compra
    console.log("\n📦 Sincronizando órdenes de compra por fecha...")
    
    let currentDate = new Date(START_DATE)
    const totalDays = Math.ceil((END_DATE - START_DATE) / (1000 * 60 * 60 * 24))
    
    while (currentDate <= END_DATE) {
      const fechaLog = formatDateForLog(currentDate)
      const daysProcessed = Math.ceil((currentDate - START_DATE) / (1000 * 60 * 60 * 24)) + 1
      const progress = Math.round((daysProcessed / totalDays) * 100)
      
      process.stdout.write(`\r   [${progress}%] ${fechaLog} - OC: ${stats.ordenesCompraSincronizadas} | Items: ${stats.itemsSincronizados}`)
      
      const ocCount = await syncOrdenesCompraByDate(currentDate)
      
      stats.diasProcesados++
      stats.ultimaFecha = currentDate
      
      // Guardar progreso cada 10 días
      if (stats.diasProcesados % 10 === 0) {
        saveProgress(currentDate)
      }
      
      // Siguiente día
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
      await delay(DELAY_BETWEEN_DAYS)
    }
    
    console.log(`\n   ✓ ${stats.diasProcesados} días procesados`)
    console.log(`   ✓ ${stats.ordenesCompraSincronizadas} órdenes de compra sincronizadas`)
    console.log(`   ✓ ${stats.itemsSincronizados} items sincronizados`)
    
    // Paso 3: Re-vincular OC huérfanas
    await relinkOrphanOC()
    
    // Paso 4: Actualizar consumo
    await updateConsumoLicitaciones()
    
    // Limpiar archivo de progreso al completar
    clearProgress()
    
    // Resumen final
    const duration = Math.round((Date.now() - stats.inicio.getTime()) / 1000)
    
    console.log("\n═══════════════════════════════════════════════════════")
    console.log("  ✓ SINCRONIZACIÓN HISTÓRICA COMPLETADA")
    console.log("═══════════════════════════════════════════════════════")
    console.log(`  Días procesados:      ${stats.diasProcesados}`)
    console.log(`  Licitaciones:         ${stats.licitacionesSincronizadas}`)
    console.log(`  Órdenes de Compra:    ${stats.ordenesCompraSincronizadas}`)
    console.log(`  Items:                ${stats.itemsSincronizados}`)
    console.log(`  Errores:              ${stats.errores}`)
    console.log(`  Duración:             ${Math.floor(duration / 60)}m ${duration % 60}s`)
    console.log("═══════════════════════════════════════════════════════\n")
    
  } catch (error) {
    console.error("\n✗ ERROR FATAL:", error.message)
    saveProgress(stats.ultimaFecha || START_DATE)
    console.log("   Progreso guardado. Ejecute nuevamente para continuar.")
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar
runHistoricSync()
