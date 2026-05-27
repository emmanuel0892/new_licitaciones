import "server-only"

import prisma from "@/lib/prisma"
import { cleanText, fetchLicitacionMercadoPublico } from "@/lib/mercadoPublico"

const licitacionMPInclude = {
  items: {
    orderBy: { correlativo: "asc" }
  },
  ordenesCompra: {
    include: {
      items: {
        orderBy: { correlativo: "asc" }
      }
    },
    orderBy: [
      { fechaEnvio: "desc" },
      { fechaCreacion: "desc" }
    ]
  }
}

const toDateOrNull = (value) => {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const toNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const getUnidadFromStoredSpecification = (item) => {
  const specification = item.especificacionComprador ?? item.especificacionProveedor

  if (!specification) return null

  const fields = String(specification)
    .split(/\t|\r?\n/)
    .map(cleanText)
    .filter(Boolean)

  return fields.find((field) => (
    ["UNIDAD", "UNIDADES", "CAJA", "CAJAS", "PAQUETE", "PAQUETES", "KIT", "KITS"].includes(field.toUpperCase())
  )) ?? null
}

const normalizeItemLicitacionFromDatabase = (item) => ({
  correlativo: item.correlativo,
  codigoProducto: item.codigoProducto,
  codigoCategoria: item.codigoCategoria,
  categoria: cleanText(item.categoria),
  nombreProducto: cleanText(item.nombreProducto),
  descripcion: cleanText(item.descripcion),
  unidadMedida: cleanText(item.unidadMedida),
  cantidad: item.cantidadAdjudicada ?? item.cantidadTotal,
  precioUnitario: item.montoUnitario,
  total: item.montoTotal,
  proveedor: item.nombreProveedor || "Sin adjudicacion",
  rutProveedor: item.rutProveedor,
  adjudicado: Boolean(item.nombreProveedor)
})

const normalizeItemOrdenFromDatabase = (item, itemsLicitacion) => {
  const itemLicitacion = itemsLicitacion.find((licitacionItem) => (
    String(licitacionItem.codigoProducto) === String(item.codigoProducto)
  ))

  return {
    correlativo: item.correlativo,
    codigoProducto: item.codigoProducto,
    codigoCategoria: item.codigoCategoria,
    categoria: cleanText(item.categoria),
    nombreProducto: cleanText(item.producto),
    descripcion: cleanText(item.especificacionComprador ?? item.especificacionProveedor),
    unidadMedida: cleanText(
      item.unidad || itemLicitacion?.unidadMedida || getUnidadFromStoredSpecification(item)
    ),
    cantidad: item.cantidad,
    precioUnitario: item.precioNeto,
    total: item.total,
    proveedor: null,
    adjudicado: true
  }
}

const normalizeLicitacionFromDatabase = (licitacion) => {
  const items = licitacion.items.map(normalizeItemLicitacionFromDatabase)
  const ordenesCompra = licitacion.ordenesCompra.map((orden) => ({
    codigoOC: orden.codigo,
    codigoLicitacion: orden.codigoLicitacion,
    codigoEstado: orden.codigoEstado,
    nombre: cleanText(orden.nombre),
    proveedor: cleanText(orden.nombreProveedor),
    estado: orden.estado,
    total: orden.total,
    fecha: orden.fechaEnvio ?? orden.fechaCreacion,
    items: orden.items.map((item) => normalizeItemOrdenFromDatabase(item, items))
  }))
  const proveedoresAdjudicados = [...new Set(
    [
      ...items.map((item) => item.proveedor),
      ...ordenesCompra.map((orden) => orden.proveedor)
    ].filter((proveedor) => proveedor && proveedor !== "Sin adjudicacion")
  )]

  return {
    codigo: licitacion.codigoExterno,
    nombre: cleanText(licitacion.nombre),
    descripcion: cleanText(licitacion.descripcion),
    estado: licitacion.estado,
    requirente: cleanText(licitacion.requirente),
    organismo: cleanText(licitacion.nombreOrganismo),
    montoAdjudicado: licitacion.montoAdjudicado ?? 0,
    montoConsumido: licitacion.montoConsumido ?? 0,
    porcentajeConsumo: licitacion.porcentajeConsumo ?? 0,
    consumoDisponible: true,
    proveedoresAdjudicados,
    cantidadItems: items.length,
    items,
    ordenesCompra,
    source: "database"
  }
}

const createLicitacionFromApi = async (codigo, apiData) => {
  const raw = apiData.raw ?? {}
  const rawItems = Array.isArray(raw.Items?.Listado) ? raw.Items.Listado : []

  await prisma.$transaction(async (transaction) => {
    const existing = await transaction.licitacionMP.findUnique({
      where: { codigoExterno: codigo },
      select: { id: true }
    })

    if (existing) return

    const licitacion = await transaction.licitacionMP.create({
      data: {
        codigoExterno: codigo,
        nombre: apiData.nombre || "Sin nombre",
        descripcion: apiData.descripcion || null,
        estado: apiData.estado || "Sin estado",
        codigoEstado: toNumber(raw.CodigoEstado),
        tipo: String(raw.Tipo ?? "Sin tipo"),
        montoEstimado: raw.MontoEstimado == null ? null : toNumber(raw.MontoEstimado),
        montoAdjudicado: apiData.montoAdjudicado,
        fechaAdjudicacion: toDateOrNull(raw.Fechas?.FechaAdjudicacion),
        fechaCierre: toDateOrNull(raw.Fechas?.FechaCierre),
        requirente: apiData.requirente || "Sin requirente",
        codigoOrganismo: raw.Comprador?.CodigoOrganismo?.toString() ?? null,
        nombreOrganismo: raw.Comprador?.NombreOrganismo ?? null,
        rutUnidad: raw.Comprador?.RutUnidad ?? null,
        codigoUnidad: raw.Comprador?.CodigoUnidad?.toString() ?? null,
        nombreUnidad: raw.Comprador?.NombreUnidad ?? null,
        direccionUnidad: raw.Comprador?.DireccionUnidad ?? null,
        comunaUnidad: raw.Comprador?.ComunaUnidad ?? null,
        regionUnidad: raw.Comprador?.RegionUnidad ?? null,
        nombreUsuario: raw.Comprador?.NombreUsuario ?? null,
        cargoUsuario: raw.Comprador?.CargoUsuario ?? null,
        moneda: raw.Moneda ?? "CLP"
      }
    })

    if (rawItems.length === 0) return

    await transaction.itemLicitacionMP.createMany({
      data: rawItems.map((item) => {
        const adjudicacion = item.Adjudicacion
        const cantidadAdjudicada = adjudicacion?.Cantidad == null
          ? null
          : toNumber(adjudicacion.Cantidad)
        const montoUnitario = toNumber(adjudicacion?.MontoUnitario)

        return {
          licitacionMPId: licitacion.id,
          correlativo: toNumber(item.Correlativo),
          codigoProducto: toNumber(item.CodigoProducto),
          codigoCategoria: String(item.CodigoCategoria ?? ""),
          categoria: item.Categoria ?? null,
          nombreProducto: item.NombreProducto ?? "Sin producto",
          descripcion: item.Descripcion ?? null,
          unidadMedida: item.UnidadMedida || "Unidad",
          cantidadTotal: toNumber(item.Cantidad),
          cantidadAdjudicada,
          montoUnitario,
          montoTotal: toNumber(cantidadAdjudicada) * montoUnitario,
          rutProveedor: adjudicacion?.RutProveedor ?? null,
          nombreProveedor: adjudicacion?.NombreProveedor ?? null
        }
      })
    })
  })
}

const findLicitacionMP = async (codigo) => {
  return prisma.licitacionMP.findUnique({
    where: { codigoExterno: codigo },
    include: licitacionMPInclude
  })
}

export const getOrCreateLicitacionMercadoPublico = async (codigo) => {
  const existing = await findLicitacionMP(codigo)

  if (existing) return normalizeLicitacionFromDatabase(existing)

  const apiData = await fetchLicitacionMercadoPublico(codigo)
  await createLicitacionFromApi(codigo, apiData)

  const created = await findLicitacionMP(codigo)

  if (!created) {
    throw new Error("No se pudo guardar la licitacion de Mercado Publico.")
  }

  return normalizeLicitacionFromDatabase(created)
}

export const getLicitacionMercadoPublicoGuardada = async (codigo) => {
  const existing = await findLicitacionMP(codigo)
  return existing ? normalizeLicitacionFromDatabase(existing) : null
}
