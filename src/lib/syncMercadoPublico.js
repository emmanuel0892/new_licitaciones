import prisma from "@/lib/prisma"

const API_BASE_URL = process.env.MERCADO_PUBLICO_API_URL || "https://api.mercadopublico.cl/servicios/v1/publico"
const API_TICKET = process.env.MERCADO_PUBLICO_TICKET
const CODIGO_ORGANISMO = process.env.MERCADO_PUBLICO_CODIGO_ORGANISMO || "7374"

// Sincronizar todas las licitaciones adjudicadas del organismo
export const syncAllLicitacionesMP = async () => {
  if (!API_TICKET) {
    console.error("[SYNC] API de Mercado Público no configurada")
    return { error: "API de Mercado Público no configurada", synced: 0 }
  }

  console.log("[SYNC] Iniciando sincronización de licitaciones...")
  let totalSynced = 0
  let totalErrors = 0

  try {
    // Obtener licitaciones adjudicadas del organismo
    const response = await fetch(
      `${API_BASE_URL}/licitaciones.json?CodigoOrganismo=${CODIGO_ORGANISMO}&estado=adjudicada&ticket=${API_TICKET}`,
      { next: { revalidate: 0 } }
    )

    if (!response.ok) {
      console.error("[SYNC] Error al consultar API:", response.status)
      return { error: "Error al consultar API de Mercado Público", synced: 0 }
    }

    const data = await response.json()

    if (!data.Listado || data.Listado.length === 0) {
      console.log("[SYNC] No se encontraron licitaciones")
      return { success: true, synced: 0, message: "No hay licitaciones para sincronizar" }
    }

    console.log(`[SYNC] Encontradas ${data.Listado.length} licitaciones`)

    for (const licResumen of data.Listado) {
      try {
        // Obtener detalle completo de la licitación
        const detalleRes = await fetch(
          `${API_BASE_URL}/licitaciones.json?codigo=${licResumen.CodigoExterno}&ticket=${API_TICKET}`,
          { next: { revalidate: 0 } }
        )

        if (!detalleRes.ok) {
          console.error(`[SYNC] Error obteniendo detalle de ${licResumen.CodigoExterno}`)
          totalErrors++
          continue
        }

        const detalleData = await detalleRes.json()
        const licData = detalleData.Listado?.[0]

        if (!licData) {
          totalErrors++
          continue
        }

        // Calcular monto adjudicado total
        let montoAdjudicado = 0
        if (licData.Items?.Listado) {
          montoAdjudicado = licData.Items.Listado.reduce((acc, item) => {
            if (item.Adjudicacion) {
              return acc + (item.Adjudicacion.Cantidad * item.Adjudicacion.MontoUnitario)
            }
            return acc
          }, 0)
        }

        // Upsert licitación
        const licitacion = await prisma.licitacionMP.upsert({
          where: { codigoExterno: licData.CodigoExterno },
          update: {
            nombre: licData.Nombre,
            descripcion: licData.Descripcion,
            estado: licData.Estado,
            codigoEstado: licData.CodigoEstado,
            tipo: licData.Tipo,
            codigoTipo: licData.CodigoTipo,
            moneda: licData.Moneda || "CLP",
            etapas: licData.Etapas,
            modalidad: licData.Modalidad,
            montoEstimado: licData.MontoEstimado,
            montoAdjudicado,
            tiempoDuracion: licData.Tiempo,
            unidadTiempoDuracion: licData.UnidadTiempo ? parseInt(licData.UnidadTiempo) : null,
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
            vigenciaMeses: licData.Tiempo ? parseInt(licData.Tiempo) : null
          },
          create: {
            codigoExterno: licData.CodigoExterno,
            nombre: licData.Nombre,
            descripcion: licData.Descripcion,
            estado: licData.Estado,
            codigoEstado: licData.CodigoEstado,
            tipo: licData.Tipo,
            codigoTipo: licData.CodigoTipo,
            moneda: licData.Moneda || "CLP",
            etapas: licData.Etapas,
            modalidad: licData.Modalidad,
            montoEstimado: licData.MontoEstimado,
            montoAdjudicado,
            tiempoDuracion: licData.Tiempo,
            unidadTiempoDuracion: licData.UnidadTiempo ? parseInt(licData.UnidadTiempo) : null,
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
            requirente: licData.Comprador?.NombreUnidad || "Sin asignar",
            vigenciaMeses: licData.Tiempo ? parseInt(licData.Tiempo) : null
          }
        })

        // Sincronizar items de la licitación
        if (licData.Items?.Listado) {
          for (const item of licData.Items.Listado) {
            const existingItem = await prisma.itemLicitacionMP.findFirst({
              where: { licitacionMPId: licitacion.id, correlativo: item.Correlativo }
            })

            if (existingItem) {
              await prisma.itemLicitacionMP.update({
                where: { id: existingItem.id },
                data: {
                  cantidadTotal: item.Cantidad,
                  cantidadAdjudicada: item.Adjudicacion?.Cantidad,
                  montoUnitario: item.Adjudicacion?.MontoUnitario || 0,
                  montoTotal: (item.Adjudicacion?.Cantidad || item.Cantidad || 0) * (item.Adjudicacion?.MontoUnitario || 0),
                  rutProveedor: item.Adjudicacion?.RutProveedor,
                  nombreProveedor: item.Adjudicacion?.NombreProveedor
                }
              })
            } else {
              await prisma.itemLicitacionMP.create({
                data: {
                  licitacionMPId: licitacion.id,
                  correlativo: item.Correlativo,
                  codigoProducto: item.CodigoProducto || 0,
                  codigoCategoria: item.CodigoCategoria || "",
                  categoria: item.Categoria,
                  nombreProducto: item.NombreProducto || "",
                  descripcion: item.Descripcion,
                  unidadMedida: item.UnidadMedida || "Unidad",
                  cantidadTotal: item.Cantidad || 0,
                  cantidadAdjudicada: item.Adjudicacion?.Cantidad,
                  montoUnitario: item.Adjudicacion?.MontoUnitario || 0,
                  montoTotal: (item.Adjudicacion?.Cantidad || item.Cantidad || 0) * (item.Adjudicacion?.MontoUnitario || 0),
                  rutProveedor: item.Adjudicacion?.RutProveedor,
                  nombreProveedor: item.Adjudicacion?.NombreProveedor
                }
              })
            }
          }
        }

        // Sincronizar órdenes de compra
        await syncOrdenesCompraForLicitacion(licitacion)

        totalSynced++
        console.log(`[SYNC] Sincronizada: ${licData.CodigoExterno}`)
      } catch (err) {
        console.error(`[SYNC] Error sincronizando ${licResumen.CodigoExterno}:`, err.message)
        totalErrors++
      }
    }

    console.log(`[SYNC] Completado. Sincronizadas: ${totalSynced}, Errores: ${totalErrors}`)
    return { success: true, synced: totalSynced, errors: totalErrors }
  } catch (error) {
    console.error("[SYNC] Error general:", error)
    return { error: error.message, synced: totalSynced }
  }
}

// Sincronizar órdenes de compra de una licitación
const syncOrdenesCompraForLicitacion = async (licitacion) => {
  if (!API_TICKET) return

  try {
    const response = await fetch(
      `${API_BASE_URL}/ordenesdecompra.json?CodigoLicitacion=${licitacion.codigoExterno}&estado=todos&ticket=${API_TICKET}`,
      { next: { revalidate: 0 } }
    )

    if (!response.ok) return

    const data = await response.json()
    let totalConsumido = 0

    if (data.Listado) {
      for (const ocResumen of data.Listado) {
        try {
          // Obtener detalle de la orden
          const detalleRes = await fetch(
            `${API_BASE_URL}/ordenesdecompra.json?codigo=${ocResumen.Codigo}&ticket=${API_TICKET}`,
            { next: { revalidate: 0 } }
          )

          if (!detalleRes.ok) continue

          const detalleData = await detalleRes.json()
          const ocData = detalleData.Listado?.[0]

          if (!ocData) continue

          // Upsert orden de compra
          const orden = await prisma.ordenCompraMP.upsert({
            where: { codigo: ocData.Codigo },
            update: {
              nombre: ocData.Nombre,
              descripcion: ocData.Descripcion,
              codigoEstado: ocData.CodigoEstado,
              estado: ocData.Estado,
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
              fechaUltimaModificacion: ocData.Fechas?.FechaUltimaModificacion ? new Date(ocData.Fechas.FechaUltimaModificacion) : null
            },
            create: {
              licitacionMPId: licitacion.id,
              codigoLicitacion: licitacion.codigoExterno,
              codigo: ocData.Codigo,
              nombre: ocData.Nombre,
              descripcion: ocData.Descripcion,
              codigoEstado: ocData.CodigoEstado,
              estado: ocData.Estado,
              codigoTipo: ocData.CodigoTipo,
              tipo: ocData.Tipo || "OC",
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

          // Solo sumar al consumo si la OC está Aceptada (6) o Recepción Conforme (12)
          if (ocData.CodigoEstado === 6 || ocData.CodigoEstado === 12) {
            totalConsumido += ocData.Total || 0
          }

          // Sincronizar items de la orden
          if (ocData.Items?.Listado) {
            // Eliminar items anteriores para evitar duplicados
            await prisma.itemOrdenCompraMP.deleteMany({
              where: { ordenCompraId: orden.id }
            })

            for (const item of ocData.Items.Listado) {
              await prisma.itemOrdenCompraMP.create({
                data: {
                  ordenCompraId: orden.id,
                  correlativo: item.Correlativo,
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
        } catch (err) {
          console.error(`[SYNC] Error en OC ${ocResumen.Codigo}:`, err.message)
        }
      }
    }

    // Actualizar consumo de la licitación
    const porcentajeConsumo = licitacion.montoAdjudicado > 0 
      ? (totalConsumido / licitacion.montoAdjudicado) * 100 
      : 0

    await prisma.licitacionMP.update({
      where: { id: licitacion.id },
      data: {
        montoConsumido: totalConsumido,
        porcentajeConsumo
      }
    })

    // Verificar y crear alertas de consumo
    await checkAndCreateAlertas(licitacion.id, porcentajeConsumo)
  } catch (error) {
    console.error(`[SYNC] Error sincronizando OCs de ${licitacion.codigoExterno}:`, error.message)
  }
}

// Verificar y crear alertas de consumo
const checkAndCreateAlertas = async (licitacionMPId, porcentaje) => {
  const licitacion = await prisma.licitacionMP.findUnique({
    where: { id: licitacionMPId }
  })

  if (!licitacion) return

  const alertas = []

  if (porcentaje >= 50 && !licitacion.alertaEnviada50) {
    alertas.push({
      tipo: "warning",
      porcentaje: 50,
      mensaje: `La licitación ${licitacion.codigoExterno} ha alcanzado el 50% de consumo. Se recomienda iniciar proceso de relicitación.`
    })
    await prisma.licitacionMP.update({
      where: { id: licitacionMPId },
      data: { alertaEnviada50: true }
    })
  }

  if (porcentaje >= 75 && !licitacion.alertaEnviada75) {
    alertas.push({
      tipo: "urgent",
      porcentaje: 75,
      mensaje: `La licitación ${licitacion.codigoExterno} ha alcanzado el 75% de consumo. Es urgente iniciar proceso de relicitación.`
    })
    await prisma.licitacionMP.update({
      where: { id: licitacionMPId },
      data: { alertaEnviada75: true }
    })
  }

  if (porcentaje >= 90 && !licitacion.alertaEnviada90) {
    alertas.push({
      tipo: "critical",
      porcentaje: 90,
      mensaje: `La licitación ${licitacion.codigoExterno} ha alcanzado el 90% de consumo. ¡Acción inmediata requerida!`
    })
    await prisma.licitacionMP.update({
      where: { id: licitacionMPId },
      data: { alertaEnviada90: true }
    })
  }

  for (const alerta of alertas) {
    await prisma.alertaConsumo.create({
      data: {
        licitacionMPId,
        ...alerta
      }
    })
  }
}

// Obtener última sincronización
export const getLastSyncStatus = async () => {
  try {
    const lastLicitacion = await prisma.licitacionMP.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true }
    })

    const totalLicitaciones = await prisma.licitacionMP.count()
    const totalOrdenes = await prisma.ordenCompraMP.count()
    const alertasActivas = await prisma.alertaConsumo.count({ where: { leida: false } })

    return {
      lastSync: lastLicitacion?.updatedAt,
      totalLicitaciones,
      totalOrdenes,
      alertasActivas
    }
  } catch (error) {
    return null
  }
}
