/**
 * Script de Sincronización Diaria - Mercado Público
 * 
 * Sincroniza datos del día actual:
 * - Licitaciones del organismo (nuevas y actualizaciones)
 * - Órdenes de compra del día
 * - Items de cada orden de compra
 * - Actualiza estados existentes
 * 
 * Ejecutar con: npm run sync:diario
 * Diseñado para ejecutarse via cronjob cada 5-15 minutos
 */

require("dotenv").config()
const https = require("https")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

// Configuración
const API_BASE_URL = "https://api.mercadopublico.cl/servicios/v1/publico"
const API_TICKET = process.env.MERCADO_PUBLICO_TICKET
const CODIGO_ORGANISMO = process.env.MERCADO_PUBLICO_CODIGO_ORGANISMO || "7374"

// Rate limiting
const DELAY_BETWEEN_REQUESTS = 300 // ms entre peticiones
const MAX_RETRIES = 3
const RETRY_DELAY = 1500 // ms antes de reintentar

// Estadísticas
const stats = {
  licitacionesNuevas: 0,
  licitacionesActualizadas: 0,
  ordenesNuevas: 0,
  ordenesActualizadas: 0,
  itemsSincronizados: 0,
  errores: 0
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
      await delay(RETRY_DELAY * attempt)
    }
  }
}

// Sincronizar licitaciones del organismo
const syncLicitaciones = async () => {
  console.log("📋 Sincronizando licitaciones...")
  
  try {
    const url = `${API_BASE_URL}/licitaciones.json?CodigoOrganismo=${CODIGO_ORGANISMO}&ticket=${API_TICKET}`
    const data = await fetchJSON(url)
    
    if (!data.Listado || data.Listado.length === 0) {
      console.log("   Sin licitaciones nuevas")
      return
    }
    
    for (const licResumen of data.Listado) {
      try {
        await delay(DELAY_BETWEEN_REQUESTS)
        
        // Verificar si existe
        const existing = await prisma.licitacionMP.findUnique({
          where: { codigoExterno: licResumen.CodigoExterno },
          select: { id: true, updatedAt: true }
        })
        
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
        
        if (existing) {
          stats.licitacionesActualizadas++
        } else {
          stats.licitacionesNuevas++
        }
        
        // Sincronizar items de la licitación
        if (licData.Items?.Listado && licData.Items.Listado.length > 0) {
          for (const item of licData.Items.Listado) {
            const existingItem = await prisma.itemLicitacionMP.findFirst({
              where: {
                licitacionMPId: licitacion.id,
                correlativo: item.Correlativo
              }
            })
            
            if (existingItem) {
              await prisma.itemLicitacionMP.update({
                where: { id: existingItem.id },
                data: {
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
            } else {
              await prisma.itemLicitacionMP.create({
                data: {
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
        }
      } catch (err) {
        stats.errores++
      }
    }
    
    console.log(`   ✓ Nuevas: ${stats.licitacionesNuevas} | Actualizadas: ${stats.licitacionesActualizadas}`)
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`)
    stats.errores++
  }
}

// Sincronizar órdenes de compra del día
const syncOrdenesCompraHoy = async () => {
  console.log("📦 Sincronizando órdenes de compra del día...")
  
  const hoy = new Date()
  const fechaAPI = formatDateForAPI(hoy)
  
  try {
    const url = `${API_BASE_URL}/ordenesdecompra.json?fecha=${fechaAPI}&CodigoOrganismo=${CODIGO_ORGANISMO}&ticket=${API_TICKET}`
    const data = await fetchJSON(url)
    
    if (!data.Listado || data.Listado.length === 0) {
      console.log("   Sin órdenes de compra hoy")
      return
    }
    
    console.log(`   Encontradas ${data.Listado.length} OC del día`)
    
    for (const ocResumen of data.Listado) {
      try {
        await delay(DELAY_BETWEEN_REQUESTS)
        
        // Verificar si existe
        const existing = await prisma.ordenCompraMP.findUnique({
          where: { codigo: ocResumen.Codigo },
          select: { id: true }
        })
        
        // Obtener detalle completo
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
        
        if (existing) {
          stats.ordenesActualizadas++
        } else {
          stats.ordenesNuevas++
        }
        
        // Sincronizar items
        if (ocData.Items?.Listado && ocData.Items.Listado.length > 0) {
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
      } catch (err) {
        stats.errores++
      }
    }
    
    console.log(`   ✓ Nuevas: ${stats.ordenesNuevas} | Actualizadas: ${stats.ordenesActualizadas} | Items: ${stats.itemsSincronizados}`)
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`)
    stats.errores++
  }
}

// Actualizar consumo de licitaciones
const updateConsumoLicitaciones = async () => {
  console.log("📊 Actualizando consumo...")
  
  try {
    const licitaciones = await prisma.licitacionMP.findMany({
      include: {
        ordenesCompra: {
          where: { codigoEstado: { in: [6, 12] } }, // Aceptada o Recepción Conforme
          select: { total: true }
        }
      }
    })
    
    let updated = 0
    for (const lic of licitaciones) {
      const montoConsumido = lic.ordenesCompra.reduce((acc, oc) => acc + (oc.total || 0), 0)
      const porcentajeConsumo = lic.montoAdjudicado > 0 
        ? (montoConsumido / lic.montoAdjudicado) * 100 
        : 0
      
      if (montoConsumido !== lic.montoConsumido) {
        await prisma.licitacionMP.update({
          where: { id: lic.id },
          data: { montoConsumido, porcentajeConsumo }
        })
        updated++
      }
    }
    
    console.log(`   ✓ ${updated} licitaciones con consumo actualizado`)
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`)
  }
}

// Función principal
const runDailySync = async () => {
  const startTime = Date.now()
  
  console.log("═══════════════════════════════════════════")
  console.log("  SINCRONIZACIÓN DIARIA - MERCADO PÚBLICO")
  console.log("═══════════════════════════════════════════")
  console.log(`Fecha: ${new Date().toLocaleString("es-CL")}`)
  console.log("───────────────────────────────────────────\n")
  
  if (!API_TICKET) {
    console.error("✗ ERROR: Falta MERCADO_PUBLICO_TICKET")
    process.exit(1)
  }
  
  try {
    await syncLicitaciones()
    await syncOrdenesCompraHoy()
    await updateConsumoLicitaciones()
    
    const duration = Math.round((Date.now() - startTime) / 1000)
    
    console.log("\n───────────────────────────────────────────")
    console.log("✓ SINCRONIZACIÓN COMPLETADA")
    console.log(`  Licitaciones: +${stats.licitacionesNuevas} | ~${stats.licitacionesActualizadas}`)
    console.log(`  OC: +${stats.ordenesNuevas} | ~${stats.ordenesActualizadas}`)
    console.log(`  Items: ${stats.itemsSincronizados}`)
    console.log(`  Errores: ${stats.errores}`)
    console.log(`  Duración: ${duration}s`)
    console.log("═══════════════════════════════════════════\n")
    
  } catch (error) {
    console.error("\n✗ ERROR:", error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar
runDailySync()
