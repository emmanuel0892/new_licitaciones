/**
 * Script de sincronización manual única
 * Ejecutar con: npm run sync:now
 * 
 * Este script ejecuta la sincronización directamente sin necesidad
 * de tener el servidor Next.js corriendo.
 */

require("dotenv").config()
const https = require("https")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const API_BASE_URL = process.env.MERCADO_PUBLICO_API_URL || "https://api.mercadopublico.cl/servicios/v1/publico"
const API_TICKET = process.env.MERCADO_PUBLICO_TICKET
const CODIGO_ORGANISMO = process.env.MERCADO_PUBLICO_CODIGO_ORGANISMO || "7374"

// Función para hacer peticiones HTTPS
const fetchJSON = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ""
      res.on("data", chunk => data += chunk)
      res.on("end", () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error(`Error parseando JSON: ${e.message}`))
        }
      })
    }).on("error", (e) => {
      reject(new Error(`Error de conexión: ${e.message}`))
    })
  })
}

const runSync = async () => {
  console.log("===========================================")
  console.log("  Sincronización Manual - Mercado Público")
  console.log("===========================================")
  console.log(`API URL: ${API_BASE_URL}`)
  console.log(`Organismo: ${CODIGO_ORGANISMO}`)
  console.log(`Hora: ${new Date().toLocaleString("es-CL")}`)
  console.log("-------------------------------------------\n")

  if (!API_TICKET) {
    console.error("✗ ERROR: MERCADO_PUBLICO_TICKET no configurado en .env")
    process.exit(1)
  }

  const startTime = Date.now()
  let totalSynced = 0
  let totalErrors = 0

  try {
    console.log("Consultando licitaciones adjudicadas...")
    const url = `${API_BASE_URL}/licitaciones.json?CodigoOrganismo=${CODIGO_ORGANISMO}&estado=adjudicada&ticket=${API_TICKET}`
    console.log(`URL: ${url.replace(API_TICKET, "***")}\n`)
    
    const data = await fetchJSON(url)

    if (data.Codigo && data.Codigo !== 200) {
      throw new Error(`Error API: ${data.Mensaje || "Error desconocido"}`)
    }

    if (!data.Listado || data.Listado.length === 0) {
      console.log("No se encontraron licitaciones para sincronizar")
      await prisma.$disconnect()
      process.exit(0)
    }

    console.log(`Encontradas ${data.Listado.length} licitaciones\n`)

    for (const licResumen of data.Listado) {
      try {
        process.stdout.write(`Sincronizando ${licResumen.CodigoExterno}... `)
        
        const detalleData = await fetchJSON(
          `${API_BASE_URL}/licitaciones.json?codigo=${licResumen.CodigoExterno}&ticket=${API_TICKET}`
        )

        const licData = detalleData.Listado?.[0]

        if (!licData) {
          console.log("✗ Sin datos")
          totalErrors++
          continue
        }

        let montoAdjudicado = 0
        if (licData.Items?.Listado) {
          montoAdjudicado = licData.Items.Listado.reduce((acc, item) => {
            if (item.Adjudicacion) {
              return acc + (item.Adjudicacion.Cantidad * item.Adjudicacion.MontoUnitario)
            }
            return acc
          }, 0)
        }

        const licitacion = await prisma.licitacionMP.upsert({
          where: { codigoExterno: licData.CodigoExterno },
          update: {
            nombre: licData.Nombre,
            descripcion: licData.Descripcion,
            estado: licData.Estado,
            codigoEstado: licData.CodigoEstado,
            tipo: licData.Tipo,
            montoEstimado: licData.MontoEstimado,
            montoAdjudicado,
            fechaCreacion: licData.Fechas?.FechaCreacion ? new Date(licData.Fechas.FechaCreacion) : null,
            fechaPublicacion: licData.Fechas?.FechaPublicacion ? new Date(licData.Fechas.FechaPublicacion) : null,
            fechaCierre: licData.Fechas?.FechaCierre ? new Date(licData.Fechas.FechaCierre) : null,
            fechaAdjudicacion: licData.Fechas?.FechaAdjudicacion ? new Date(licData.Fechas.FechaAdjudicacion) : null,
            codigoOrganismo: licData.Comprador?.CodigoOrganismo,
            nombreOrganismo: licData.Comprador?.NombreOrganismo,
            nombreUnidad: licData.Comprador?.NombreUnidad
          },
          create: {
            codigoExterno: licData.CodigoExterno,
            nombre: licData.Nombre,
            descripcion: licData.Descripcion,
            estado: licData.Estado,
            codigoEstado: licData.CodigoEstado,
            tipo: licData.Tipo,
            moneda: licData.Moneda || "CLP",
            montoEstimado: licData.MontoEstimado,
            montoAdjudicado,
            fechaCreacion: licData.Fechas?.FechaCreacion ? new Date(licData.Fechas.FechaCreacion) : null,
            fechaPublicacion: licData.Fechas?.FechaPublicacion ? new Date(licData.Fechas.FechaPublicacion) : null,
            fechaCierre: licData.Fechas?.FechaCierre ? new Date(licData.Fechas.FechaCierre) : null,
            fechaAdjudicacion: licData.Fechas?.FechaAdjudicacion ? new Date(licData.Fechas.FechaAdjudicacion) : null,
            codigoOrganismo: licData.Comprador?.CodigoOrganismo,
            nombreOrganismo: licData.Comprador?.NombreOrganismo,
            nombreUnidad: licData.Comprador?.NombreUnidad,
            requirente: licData.Comprador?.NombreUnidad || "Sin asignar"
          }
        })

        // Sincronizar órdenes de compra
        await syncOrdenesCompra(licitacion)

        console.log("✓")
        totalSynced++
      } catch (err) {
        console.log(`✗ ${err.message}`)
        totalErrors++
      }
    }

    const duration = Date.now() - startTime

    console.log("\n-------------------------------------------")
    console.log("✓ SINCRONIZACIÓN COMPLETADA")
    console.log(`  Licitaciones sincronizadas: ${totalSynced}`)
    console.log(`  Errores: ${totalErrors}`)
    console.log(`  Duración: ${Math.round(duration / 1000)}s`)
    console.log("-------------------------------------------\n")

    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error("\n✗ ERROR EN SINCRONIZACIÓN")
    console.error(`  ${error.message}`)
    await prisma.$disconnect()
    process.exit(1)
  }
}

const syncOrdenesCompra = async (licitacion) => {
  try {
    const data = await fetchJSON(
      `${API_BASE_URL}/ordenesdecompra.json?CodigoLicitacion=${licitacion.codigoExterno}&estado=todos&ticket=${API_TICKET}`
    )

    let totalConsumido = 0

    if (data.Listado && data.Listado.length > 0) {
      for (const ocResumen of data.Listado) {
        try {
          const detalleData = await fetchJSON(
            `${API_BASE_URL}/ordenesdecompra.json?codigo=${ocResumen.Codigo}&ticket=${API_TICKET}`
          )

          const ocData = detalleData.Listado?.[0]
          if (!ocData) continue

          // Upsert orden de compra
          const orden = await prisma.ordenCompraMP.upsert({
            where: { codigo: ocData.Codigo },
            update: {
              nombre: ocData.Nombre,
              estado: ocData.Estado,
              codigoEstado: ocData.CodigoEstado,
              total: ocData.Total || 0,
              totalNeto: ocData.TotalNeto || 0,
              impuestos: ocData.Impuestos || 0,
              nombreProveedor: ocData.Proveedor?.Nombre
            },
            create: {
              licitacionMPId: licitacion.id,
              codigoLicitacion: licitacion.codigoExterno,
              codigo: ocData.Codigo,
              nombre: ocData.Nombre,
              estado: ocData.Estado,
              codigoEstado: ocData.CodigoEstado,
              tipo: ocData.Tipo || "OC",
              tipoMoneda: ocData.TipoMoneda || "CLP",
              total: ocData.Total || 0,
              totalNeto: ocData.TotalNeto || 0,
              impuestos: ocData.Impuestos || 0,
              fechaCreacion: ocData.Fechas?.FechaCreacion ? new Date(ocData.Fechas.FechaCreacion) : new Date(),
              rutProveedor: ocData.Proveedor?.RutSucursal,
              nombreProveedor: ocData.Proveedor?.Nombre
            }
          })

          // Sincronizar items de la orden
          if (ocData.Items?.Listado && ocData.Items.Listado.length > 0) {
            // Eliminar items anteriores
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
            }
          }

          if (ocData.CodigoEstado === 6) {
            totalConsumido += ocData.Total || 0
          }
        } catch (ocErr) {
          // Continuar con siguiente OC
        }
      }
    }

    const porcentajeConsumo = licitacion.montoAdjudicado > 0 
      ? (totalConsumido / licitacion.montoAdjudicado) * 100 
      : 0

    await prisma.licitacionMP.update({
      where: { id: licitacion.id },
      data: { montoConsumido: totalConsumido, porcentajeConsumo }
    })
  } catch (err) {
    // Silenciar errores de OC
  }
}

runSync()
