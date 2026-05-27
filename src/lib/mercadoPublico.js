import "server-only"

const BASE_URL = "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json"
const ORDENES_COMPRA_URL = "https://api.mercadopublico.cl/servicios/v1/publico/ordenesdecompra.json"
const TICKET = process.env.MERCADO_PUBLICO_TICKET ?? "8E6AFEDD-E204-4921-90C3-CD736B80D116"
const CODIGO_ORGANISMO = process.env.MERCADO_PUBLICO_CODIGO_ORGANISMO ?? "7374"
const API_RETRIES = 4
const API_RETRY_DELAY = 750
const API_REQUEST_DELAY = 250

export const pick = (obj, keys, fallback = null) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key]
    }
  }

  return fallback
}

export const asArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  return [value]
}

const getListado = (value) => {
  return asArray(pick(value, ["Listado"], value))
}

const asNumber = (value) => {
  if (value === null || value === undefined || value === "") return null

  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export const cleanText = (value) => {
  return String(value ?? "")
    .replace(/\t/g, " ")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const normalizeItem = (item = {}, index = 0, isOrderItem = false) => {
  const adjudicacion = item.Adjudicacion ?? null
  const cantidad = asNumber(
    pick(adjudicacion, ["Cantidad"], pick(item, ["Cantidad", "CantidadTotal", "CantidadAdjudicada"], 0))
  ) ?? 0
  const precioUnitario = asNumber(
    pick(adjudicacion, ["MontoUnitario"], pick(item, ["PrecioUnitario", "PrecioNeto", "MontoUnitario"], 0))
  ) ?? 0
  const adjudicado = isOrderItem || Boolean(adjudicacion)
  const totalOrden = asNumber(pick(item, ["Total", "MontoTotal"]))

  return {
    correlativo: pick(item, ["Correlativo"], index + 1),
    codigoProducto: pick(item, ["CodigoProducto", "Codigo", "CodigoCategoria"]),
    codigoCategoria: pick(item, ["CodigoCategoria"]),
    categoria: cleanText(pick(item, ["Categoria"])),
    nombreProducto: cleanText(pick(item, ["NombreProducto", "Producto", "Nombre"])),
    descripcion: cleanText(pick(item, [
      "Descripcion",
      "Especificacion",
      "EspecificacionComprador",
      "EspecificacionProveedor"
    ])),
    unidadMedida: cleanText(pick(item, ["UnidadMedida", "Unidad"])),
    cantidad,
    precioUnitario: adjudicado ? precioUnitario : null,
    total: adjudicado ? totalOrden ?? cantidad * precioUnitario : null,
    proveedor: adjudicado
      ? cleanText(pick(adjudicacion, ["NombreProveedor"], isOrderItem ? "Proveedor de la orden" : "Sin adjudicacion"))
      : "Sin adjudicacion",
    rutProveedor: pick(adjudicacion, ["RutProveedor"]),
    adjudicado
  }
}

const getItemsFromOrden = (orden = {}) => {
  const items = pick(orden, ["Items", "ItemsListado"])

  if (items) {
    return getListado(items).map((item, index) => normalizeItem(item, index, true))
  }

  const listado = pick(orden, ["Listado"])
  return getListado(listado).map((item, index) => normalizeItem(item, index, true))
}

const normalizeOrden = (orden = {}) => ({
  codigoOC: pick(orden, ["Codigo", "CodigoOC", "CodigoOrdenCompra"]),
  codigoLicitacion: pick(orden, ["CodigoLicitacion"]),
  codigoEstado: pick(orden, ["CodigoEstado"]),
  nombre: cleanText(pick(orden, ["Nombre", "Descripcion"])),
  proveedor: cleanText(pick(orden.Proveedor, ["Nombre", "NombreProveedor"], pick(orden, ["NombreProveedor"]))),
  estado: pick(orden, ["Estado", "EstadoProveedor"]),
  total: asNumber(pick(orden, ["Total", "MontoTotal", "TotalNeto"])),
  fecha: pick(orden.Fechas, ["FechaEnvio", "FechaCreacion", "FechaAceptacion"], pick(orden, ["Fecha", "FechaCreacion"])),
  items: getItemsFromOrden(orden)
})

const calculateMontoAdjudicado = (licitacion, items) => {
  const directAmount = asNumber(pick(licitacion, ["MontoAdjudicado"]))

  if (directAmount !== null && directAmount > 0) return directAmount

  const adjudicatedItemsAmount = items.reduce((total, item) => total + Number(item.total ?? 0), 0)

  if (adjudicatedItemsAmount > 0) return adjudicatedItemsAmount

  return 0
}

const isOrdenConsumida = (orden) => {
  const estado = cleanText(orden.estado).toLowerCase()

  return [6, 12].includes(Number(orden.codigoEstado)) ||
    estado.includes("aceptada") ||
    estado.includes("recepcion conforme") ||
    estado.includes("recepción conforme")
}

const calculateConsumo = (ordenesCompra, montoAdjudicado) => {
  const montoConsumido = ordenesCompra
    .filter(isOrdenConsumida)
    .reduce((total, orden) => total + Number(orden.total ?? 0), 0)
  const porcentajeConsumo = montoAdjudicado > 0
    ? Math.round((montoConsumido / montoAdjudicado) * 100)
    : 0

  return { montoConsumido, porcentajeConsumo }
}

const delay = async (milliseconds) => {
  await new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export const buildMercadoPublicoUrl = (codigo) => {
  const url = new URL(BASE_URL)
  url.searchParams.set("ticket", TICKET)
  url.searchParams.set("CodigoOrganismo", CODIGO_ORGANISMO)
  url.searchParams.set("codigo", codigo)
  return url.toString()
}

const buildOrdenCompraUrl = (codigoOC) => {
  const url = new URL(ORDENES_COMPRA_URL)
  url.searchParams.set("ticket", TICKET)
  url.searchParams.set("codigo", codigoOC)
  return url.toString()
}

const fetchMercadoPublicoJson = async (url, errorMessage, retries = API_RETRIES) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, { cache: "no-store" })
    const json = await response.json()
    const apiError = Number(json?.Codigo) >= 400 && !json?.Listado

    if (response.ok && !apiError) {
      return json
    }

    if (attempt < retries) {
      await delay(API_RETRY_DELAY * (attempt + 1))
      continue
    }
  }

  throw new Error(errorMessage)
}

const fetchOrdenesCompraDirectas = async (codigosOrdenCompra = []) => {
  const ordenes = []

  for (let index = 0; index < codigosOrdenCompra.length; index += 1) {
    const codigoOC = codigosOrdenCompra[index]
    const json = await fetchMercadoPublicoJson(
      buildOrdenCompraUrl(codigoOC),
      `No se pudo actualizar la orden de compra ${codigoOC} desde Mercado Publico. Intente nuevamente.`
    )
    const orden = getListado(json)[0]

    if (!orden) {
      throw new Error(`Mercado Publico no devolvio la orden de compra ${codigoOC}. Intente nuevamente.`)
    }

    ordenes.push(orden)

    if (index < codigosOrdenCompra.length - 1) {
      await delay(API_REQUEST_DELAY)
    }
  }

  return ordenes
}

export const normalizeMercadoPublicoResponse = (json, ordenesExternas = [], options = {}) => {
  const licitacion = json?.Listado?.[0] ?? json ?? {}
  const items = asArray(licitacion?.Items?.Listado).map((item, index) => normalizeItem(item, index))
  const ordenesAnidadas = pick(licitacion, ["OrdenesCompra"], pick(json, ["OrdenesCompra"]))
  const ordenesCompra = (ordenesAnidadas ? getListado(ordenesAnidadas) : asArray(ordenesExternas)).map(normalizeOrden)
  const montoAdjudicado = calculateMontoAdjudicado(licitacion, items)
  const { montoConsumido, porcentajeConsumo } = calculateConsumo(ordenesCompra, montoAdjudicado)
  const proveedoresAdjudicados = [...new Set(
    items
      .filter((item) => item.adjudicado && item.proveedor && item.proveedor !== "Sin adjudicacion")
      .map((item) => item.proveedor)
  )]

  return {
    codigo: licitacion.CodigoExterno ?? pick(licitacion, ["Codigo", "CodigoLicitacion"]),
    nombre: cleanText(licitacion.Nombre),
    descripcion: cleanText(licitacion.Descripcion),
    estado: licitacion.Estado ?? null,
    requirente: cleanText(pick(
      licitacion.Comprador,
      ["NombreUnidad", "NombreOrganismo"],
      pick(licitacion, ["Requirente", "NombreOrganismo"], "Sin requirente")
    )),
    organismo: cleanText(licitacion.Comprador?.NombreOrganismo),
    comprador: licitacion.Comprador ?? null,
    montoAdjudicado,
    montoConsumido,
    porcentajeConsumo,
    consumoDisponible: Boolean(options.consumoDisponible ?? ordenesAnidadas),
    cantidadOrdenesIndexadas: Number(options.cantidadOrdenesIndexadas ?? ordenesCompra.length),
    proveedoresAdjudicados,
    cantidadItems: Number(licitacion?.Items?.Cantidad ?? items.length),
    items,
    ordenesCompra,
    raw: licitacion
  }
}

export const fetchLicitacionMercadoPublico = async (codigo, { codigosOrdenCompra = [] } = {}) => {
  if (!codigo) return null

  const json = await fetchMercadoPublicoJson(
    buildMercadoPublicoUrl(codigo),
    "No se pudo obtener la licitacion desde Mercado Publico."
  )
  const licitacion = getListado(json)[0]

  if (!licitacion) {
    throw new Error("No se encontro la licitacion en Mercado Publico.")
  }

  if (codigosOrdenCompra.length === 0) {
    return normalizeMercadoPublicoResponse(json)
  }

  const ordenes = await fetchOrdenesCompraDirectas(codigosOrdenCompra)

  return normalizeMercadoPublicoResponse(json, ordenes, {
    consumoDisponible: true,
    cantidadOrdenesIndexadas: codigosOrdenCompra.length
  })
}
