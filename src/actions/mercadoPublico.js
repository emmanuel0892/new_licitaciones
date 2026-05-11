"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const API_BASE_URL = process.env.MERCADO_PUBLICO_API_URL || "https://api.mercadopublico.cl/servicios/v1/publico"
const API_TICKET = process.env.MERCADO_PUBLICO_TICKET

// Obtener licitaciones por requirente/servicio
export const getLicitacionesMPByRequirente = async (requirente) => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  try {
    const licitaciones = await prisma.licitacionMP.findMany({
      where: { requirente },
      include: {
        items: true,
        ordenesCompra: {
          include: { items: true }
        },
        _count: {
          select: { ordenesCompra: true, alertas: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return { data: licitaciones }
  } catch (error) {
    console.error(error)
    return { error: "Error al obtener licitaciones" }
  }
}

// Obtener todas las licitaciones MP con filtros
export const getLicitacionesMP = async (filters = {}) => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  try {
    const where = {}

    if (filters.requirente) {
      where.requirente = { contains: filters.requirente }
    }

    if (filters.codigo) {
      where.codigoExterno = { contains: filters.codigo }
    }

    if (filters.alertaActiva) {
      where.OR = [
        { porcentajeConsumo: { gte: 50 } }
      ]
    }

    const licitaciones = await prisma.licitacionMP.findMany({
      where,
      include: {
        items: true,
        _count: {
          select: { ordenesCompra: true, alertas: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    return { data: licitaciones }
  } catch (error) {
    console.error(error)
    return { error: "Error al obtener licitaciones" }
  }
}

// Obtener detalle de una licitación MP con sus órdenes de compra
export const getLicitacionMPById = async (id) => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  try {
    const licitacion = await prisma.licitacionMP.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          orderBy: { correlativo: "asc" }
        },
        ordenesCompra: {
          include: {
            items: {
              orderBy: { correlativo: "asc" }
            }
          },
          orderBy: { fechaCreacion: "desc" }
        },
        alertas: {
          orderBy: { createdAt: "desc" }
        }
      }
    })

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    return { data: licitacion }
  } catch (error) {
    console.error(error)
    return { error: "Error al obtener licitación" }
  }
}

// Obtener detalle de una orden de compra
export const getOrdenCompraMPById = async (id) => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  try {
    const orden = await prisma.ordenCompraMP.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          orderBy: { correlativo: "asc" }
        },
        licitacionMP: {
          select: {
            codigoExterno: true,
            nombre: true,
            requirente: true
          }
        }
      }
    })

    if (!orden) {
      return { error: "Orden de compra no encontrada" }
    }

    return { data: orden }
  } catch (error) {
    console.error(error)
    return { error: "Error al obtener orden de compra" }
  }
}

// Sincronizar licitación desde Mercado Público
export const syncLicitacionMP = async (codigoLicitacion, requirente) => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  if (!API_TICKET) {
    return { error: "API de Mercado Público no configurada" }
  }

  try {
    // Obtener datos de la licitación desde la API
    const response = await fetch(
      `${API_BASE_URL}/licitaciones.json?codigo=${codigoLicitacion}&ticket=${API_TICKET}`
    )

    if (!response.ok) {
      return { error: "Error al consultar API de Mercado Público" }
    }

    const data = await response.json()

    if (!data.Listado || data.Listado.length === 0) {
      return { error: "Licitación no encontrada en Mercado Público" }
    }

    const licData = data.Listado[0]

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

    // Crear o actualizar licitación
    const licitacion = await prisma.licitacionMP.upsert({
      where: { codigoExterno: codigoLicitacion },
      update: {
        nombre: licData.Nombre,
        descripcion: licData.Descripcion,
        estado: licData.Estado,
        codigoEstado: licData.CodigoEstado,
        montoAdjudicado,
        fechaAdjudicacion: licData.Adjudicacion?.Fecha ? new Date(licData.Adjudicacion.Fecha) : null,
        vigenciaMeses: licData.Tiempo ? parseInt(licData.Tiempo) : null
      },
      create: {
        codigoExterno: codigoLicitacion,
        nombre: licData.Nombre,
        descripcion: licData.Descripcion,
        estado: licData.Estado,
        codigoEstado: licData.CodigoEstado,
        tipo: licData.Tipo,
        montoEstimado: licData.MontoEstimado,
        montoAdjudicado,
        fechaAdjudicacion: licData.Adjudicacion?.Fecha ? new Date(licData.Adjudicacion.Fecha) : null,
        fechaCierre: licData.Fechas?.FechaCierre ? new Date(licData.Fechas.FechaCierre) : null,
        vigenciaMeses: licData.Tiempo ? parseInt(licData.Tiempo) : null,
        requirente
      }
    })

    // Sincronizar items de la licitación
    if (licData.Items?.Listado) {
      for (const item of licData.Items.Listado) {
        await prisma.itemLicitacionMP.upsert({
          where: {
            id: await getItemIdByCorrelativo(licitacion.id, item.Correlativo)
          },
          update: {
            cantidadTotal: item.Cantidad,
            montoUnitario: item.Adjudicacion?.MontoUnitario || 0,
            montoTotal: (item.Cantidad || 0) * (item.Adjudicacion?.MontoUnitario || 0),
            rutProveedor: item.Adjudicacion?.RutProveedor,
            nombreProveedor: item.Adjudicacion?.NombreProveedor
          },
          create: {
            licitacionMPId: licitacion.id,
            correlativo: item.Correlativo,
            codigoProducto: item.CodigoProducto,
            codigoCategoria: item.CodigoCategoria,
            categoria: item.Categoria,
            nombreProducto: item.NombreProducto,
            descripcion: item.Descripcion,
            unidadMedida: item.UnidadMedida || "Unidad",
            cantidadTotal: item.Cantidad,
            montoUnitario: item.Adjudicacion?.MontoUnitario || 0,
            montoTotal: (item.Cantidad || 0) * (item.Adjudicacion?.MontoUnitario || 0),
            rutProveedor: item.Adjudicacion?.RutProveedor,
            nombreProveedor: item.Adjudicacion?.NombreProveedor
          }
        })
      }
    }

    revalidatePath("/dashboard/consumo")
    return { success: true, data: licitacion }
  } catch (error) {
    console.error(error)
    return { error: "Error al sincronizar licitación" }
  }
}

// Helper para obtener ID de item por correlativo
const getItemIdByCorrelativo = async (licitacionMPId, correlativo) => {
  const item = await prisma.itemLicitacionMP.findFirst({
    where: { licitacionMPId, correlativo }
  })
  return item?.id || 0
}

// Sincronizar órdenes de compra de una licitación
export const syncOrdenesCompraMP = async (licitacionMPId) => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  if (!API_TICKET) {
    return { error: "API de Mercado Público no configurada" }
  }

  try {
    const licitacion = await prisma.licitacionMP.findUnique({
      where: { id: parseInt(licitacionMPId) }
    })

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    // Obtener órdenes de compra desde la API
    const response = await fetch(
      `${API_BASE_URL}/ordenesdecompra.json?CodigoLicitacion=${licitacion.codigoExterno}&estado=aceptada&ticket=${API_TICKET}`
    )

    if (!response.ok) {
      return { error: "Error al consultar API de Mercado Público" }
    }

    const data = await response.json()
    let totalConsumido = 0

    if (data.Listado) {
      for (const oc of data.Listado) {
        // Obtener detalle de la orden
        const detalleResponse = await fetch(
          `${API_BASE_URL}/ordenesdecompra.json?codigo=${oc.Codigo}&ticket=${API_TICKET}`
        )
        
        if (!detalleResponse.ok) continue

        const detalleData = await detalleResponse.json()
        const ocDetalle = detalleData.Listado?.[0]

        if (!ocDetalle) continue

        // Crear o actualizar orden de compra
        const orden = await prisma.ordenCompraMP.upsert({
          where: { codigo: oc.Codigo },
          update: {
            codigoEstado: ocDetalle.CodigoEstado,
            estado: ocDetalle.Estado,
            totalNeto: ocDetalle.TotalNeto || 0,
            impuestos: ocDetalle.Impuestos || 0,
            total: ocDetalle.Total || 0,
            fechaAceptacion: ocDetalle.Fechas?.FechaAceptacion ? new Date(ocDetalle.Fechas.FechaAceptacion) : null
          },
          create: {
            licitacionMPId: licitacion.id,
            codigo: oc.Codigo,
            nombre: ocDetalle.Nombre,
            codigoEstado: ocDetalle.CodigoEstado,
            estado: ocDetalle.Estado,
            tipo: ocDetalle.Tipo,
            totalNeto: ocDetalle.TotalNeto || 0,
            impuestos: ocDetalle.Impuestos || 0,
            total: ocDetalle.Total || 0,
            fechaCreacion: new Date(ocDetalle.Fechas?.FechaCreacion),
            fechaEnvio: ocDetalle.Fechas?.FechaEnvio ? new Date(ocDetalle.Fechas.FechaEnvio) : null,
            fechaAceptacion: ocDetalle.Fechas?.FechaAceptacion ? new Date(ocDetalle.Fechas.FechaAceptacion) : null,
            rutProveedor: ocDetalle.Proveedor?.RutSucursal,
            nombreProveedor: ocDetalle.Proveedor?.Nombre
          }
        })

        totalConsumido += ocDetalle.Total || 0

        // Sincronizar items de la orden
        if (ocDetalle.Items?.Listado) {
          // Eliminar items anteriores
          await prisma.itemOrdenCompraMP.deleteMany({
            where: { ordenCompraId: orden.id }
          })

          for (const item of ocDetalle.Items.Listado) {
            await prisma.itemOrdenCompraMP.create({
              data: {
                ordenCompraId: orden.id,
                correlativo: item.Correlativo,
                codigoCategoria: item.CodigoCategoria,
                categoria: item.Categoria,
                codigoProducto: item.CodigoProducto,
                producto: item.Producto,
                especificacion: item.EspecificacionComprador,
                cantidad: item.Cantidad,
                unidad: item.Unidad,
                precioNeto: item.PrecioNeto,
                totalDescuentos: item.TotalDescuentos || 0,
                totalCargos: item.TotalCargos || 0,
                total: item.Total
              }
            })
          }
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

    // Verificar y crear alertas
    await checkAndCreateAlertas(licitacion.id, porcentajeConsumo)

    revalidatePath("/dashboard/consumo")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al sincronizar órdenes de compra" }
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

// Obtener alertas no leídas
export const getAlertasNoLeidas = async () => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  try {
    const alertas = await prisma.alertaConsumo.findMany({
      where: { leida: false },
      include: {
        licitacionMP: {
          select: {
            codigoExterno: true,
            nombre: true,
            requirente: true,
            porcentajeConsumo: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return { data: alertas }
  } catch (error) {
    console.error(error)
    return { error: "Error al obtener alertas" }
  }
}

// Marcar alerta como leída
export const marcarAlertaLeida = async (alertaId) => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  try {
    await prisma.alertaConsumo.update({
      where: { id: parseInt(alertaId) },
      data: { leida: true }
    })

    revalidatePath("/dashboard/consumo")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al marcar alerta" }
  }
}

// Crear licitación MP manualmente (sin API)
export const createLicitacionMPManual = async (data) => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  try {
    const licitacion = await prisma.licitacionMP.create({
      data: {
        codigoExterno: data.codigoExterno,
        nombre: data.nombre,
        descripcion: data.descripcion,
        estado: data.estado || "Adjudicada",
        codigoEstado: data.codigoEstado || 8,
        tipo: data.tipo || "LQ",
        montoEstimado: data.montoEstimado,
        montoAdjudicado: data.montoAdjudicado,
        vigenciaMeses: data.vigenciaMeses,
        requirente: data.requirente
      }
    })

    // Crear items si se proporcionan
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await prisma.itemLicitacionMP.create({
          data: {
            licitacionMPId: licitacion.id,
            correlativo: item.correlativo,
            codigoProducto: item.codigoProducto || 0,
            codigoCategoria: item.codigoCategoria || "",
            categoria: item.categoria || "",
            nombreProducto: item.nombreProducto,
            descripcion: item.descripcion,
            unidadMedida: item.unidadMedida || "Unidad",
            cantidadTotal: item.cantidadTotal,
            montoUnitario: item.montoUnitario,
            montoTotal: item.cantidadTotal * item.montoUnitario,
            rutProveedor: item.rutProveedor,
            nombreProveedor: item.nombreProveedor
          }
        })
      }
    }

    revalidatePath("/dashboard/consumo")
    return { success: true, data: licitacion }
  } catch (error) {
    console.error(error)
    if (error.code === "P2002") {
      return { error: "Ya existe una licitación con ese código" }
    }
    return { error: "Error al crear licitación" }
  }
}

// Obtener requirentes únicos de licitaciones MP
export const getRequirentesMPUnicos = async () => {
  const session = await auth()
  if (!session) return { error: "No autorizado" }

  try {
    const requirentes = await prisma.licitacionMP.findMany({
      select: { requirente: true },
      distinct: ["requirente"],
      orderBy: { requirente: "asc" }
    })

    return { data: requirentes.map(r => r.requirente) }
  } catch (error) {
    console.error(error)
    return { error: "Error al obtener requirentes" }
  }
}
