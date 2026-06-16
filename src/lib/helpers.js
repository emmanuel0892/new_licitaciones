import dayjs from "dayjs"
import "dayjs/locale/es"

dayjs.locale("es")

export const formatDate = (date) => {
  if (!date) return ""
  return dayjs(date).format("DD-MM-YYYY")
}

export const formatDateTime = (date) => {
  if (!date) return ""
  return dayjs(date).format("DD-MM-YYYY HH:mm")
}

export const convertDateFormat = (originalDate) => {
  if (!originalDate) return null
  return dayjs(originalDate, "DD-MM-YYYY").format("YYYY-MM-DD")
}

export const getMonthAbbr = (date) => {
  const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
  const month = new Date(date).getMonth()
  return meses[month]
}

export const formatMoney = (amount) => {
  if (!amount || amount === "null") return "Sin Monto"
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0
  }).format(amount)
}

export const getEstadoColor = (estado) => {
  const colors = {
    Pendiente: "#e5be01",
    Devuelto: "#e53935",
    Finalizada: "#268e00"
  }
  return colors[estado] || "#6B7280"
}

export const ROLES = {
  SUPER_ADMIN: "Super Admin",
  LICITADOR: "Licitador",
  SECRETARIA_ABASTECIMIENTO: "Secretaria Abastecimiento",
  SECRETARIO_JURIDICO: "Secretario Juridico",
  PRESUPUESTO: "Presupuesto",
  SUBDIRECCION_ADMINISTRATIVA: "Subdireccion Administrativa"
}

const ROLE_LABELS = {
  requirente: "Requirente",
  coordinador_licitacion: "Coordinador Licitacion",
  jefe_compras: "Jefe Compras",
  jefe_adquisiciones: "Jefe Adquisiciones",
  abogado: "Abogado",
  jefe_unidad_legal: "Jefe Unidad Legal",
  secretaria_legal: "Secretaria Legal",
  secretaria_adquisiciones: "Secretaria Adquisiciones",
  subdirector_administrativo: "Subdirector Administrativo",
  secretaria_subdireccion: "Secretaria Subdireccion",
  director: "Director",
  secretaria_direccion: "Secretaria Direccion",
  oficina_partes: "Oficina de Partes",
  jefe_presupuesto: "Jefe Presupuesto",
  analista_presupuesto: "Analista Presupuesto",
  visor: "Visor"
}

export const formatRoleLabel = (roleName = "") => {
  if (ROLE_LABELS[roleName]) {
    return ROLE_LABELS[roleName]
  }

  return roleName
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export const DEPARTAMENTOS = [
  { value: "RR.HH", label: "RR.HH" },
  { value: "Contabilidad", label: "Contabilidad" },
  { value: "Abastecimiento", label: "Abastecimiento" },
  { value: "Juridico", label: "Jurídico" }
]

export const TIPOS_CUENTA = [
  { value: "Secretaria Abastecimiento", label: "Secretaria Abastecimiento" },
  { value: "Licitador", label: "Licitador" },
  { value: "Secretario Juridico", label: "Secretario Jurídico" },
  { value: "Presupuesto", label: "Presupuesto" },
  { value: "Subdireccion Administrativa", label: "Subdirección Administrativa" },
  { value: "Super Admin", label: "Super Admin" }
]

export const CATEGORIAS_BASE = [
  { value: "Bienes", label: "Bienes" },
  { value: "Servicios", label: "Servicios" }
]

export const ESTADOS_LICITACION = [
  { value: "Pendiente", label: "Pendiente" },
  { value: "Finalizada", label: "Finalizada" },
  { value: "Devuelto", label: "Devuelto" }
]

export const hasPermission = (userType, allowedRoles) => {
  if (userType === ROLES.SUPER_ADMIN) return true
  return allowedRoles.includes(userType)
}

export const FLUJO_LICITACION = [
  {
    numero: "1",
    nombre: "Confección Bases Técnicas",
    diasSugeridos: 5,
    subpasos: [
      {
        numero: "1.1",
        nombre: "Firmas Jefatura de Unidad y Jefatura de Depto.",
        diasSugeridos: 0
      }
    ]
  },
  {
    numero: "2",
    nombre: "Unidad Administrativa Legal",
    diasSugeridos: 5,
    subpasos: [
      {
        numero: "2.1",
        nombre: "Firma Jefatura Unidad Administrativo Legal",
        diasSugeridos: 0
      }
    ]
  },
  {
    numero: "3",
    nombre: "Firmas Directivas y Partes",
    diasSugeridos: 3,
    subpasos: [
      {
        numero: "3.1",
        nombre: "Firmas Subdirector Administrativo y Director",
        diasSugeridos: 0
      },
      {
        numero: "3.2",
        nombre: "Fecha y Enumeración de Oficina de Partes",
        diasSugeridos: 0
      }
    ]
  },
  {
    numero: "4",
    nombre: "Publicación de Bases",
    diasSugeridos: 2
  },
  {
    numero: "5",
    nombre: "Periodo de Apertura y Evaluación Técnica de Ofertas",
    diasSugeridos: 10
  },
  {
    numero: "6",
    nombre: "Confección de Res, Preadjudicación y Comisión",
    diasSugeridos: 5
  },
  {
    numero: "7",
    nombre: "Presupuesto",
    diasSugeridos: 5
  },
  {
    numero: "8",
    nombre: "Firmas Resolución Adjudicación",
    diasSugeridos: 5,
    subpasos: [
      {
        numero: "8.1",
        nombre: "Firmas Jefatura de Unidad y Jefatura de Dpto.",
        diasSugeridos: 0
      }
    ]
  },
  {
    numero: "9",
    nombre: "Unidad Administrativa Legal",
    diasSugeridos: 5,
    subpasos: [
      {
        numero: "9.1",
        nombre: "Firma Jefatura Unidad Administrativo Legal",
        diasSugeridos: 0
      }
    ]
  },
  {
    numero: "10",
    nombre: "Firmas Directivos y Partes",
    diasSugeridos: 3,
    subpasos: [
      {
        numero: "10.1",
        nombre: "Firmas Subdirector Administrativo y Director(a)",
        diasSugeridos: 0
      },
      {
        numero: "10.2",
        nombre: "Fecha y Enumeración de Oficina de Partes",
        diasSugeridos: 0
      }
    ]
  },
  {
    numero: "11",
    nombre: "Publicación de Adjudicación o Deserción",
    diasSugeridos: 2
  }
]

export const FLUJO_LICITACION_SECUENCIA = [
  "1",
  "1.1",
  "2",
  "2.1",
  "3",
  "3.1",
  "3.2",
  "4",
  "5",
  "6",
  "7",
  "8",
  "8.1",
  "9",
  "9.1",
  "10",
  "10.1",
  "10.2",
  "11"
]

// Secuencia solo para avance manual (solo pasos principales)
export const FLUJO_LICITACION_AVANCE = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11"
]

export const getMainStepNumero = (numero) => {
  if (!numero) return "1"
  return String(numero).split(".")[0]
}

export const getParentStep = (numeroProceso) => {
  if (!numeroProceso) return null
  if (numeroProceso.includes(".")) {
    return numeroProceso.split(".")[0]
  }
  return numeroProceso
}

export const getStepIndex = (numero) => {
  return FLUJO_LICITACION_SECUENCIA.indexOf(String(numero))
}

export const isSubStep = (numeroPaso) => {
  return [
    2,
    4,
    11,
    13,
    18,
    20,
    22,
    23,
    29,
    31,
    33,
    34,
    40,
    42,
    44,
    45
  ].includes(Number(numeroPaso))
}

export const getLastStepNumberOfGroup = (mainStep) => {
  if (mainStep.subpasos && mainStep.subpasos.length > 0) {
    return mainStep.subpasos[mainStep.subpasos.length - 1].numero
  }
  return mainStep.numero
}

export const getMainStepState = (mainStep, currentStepNumero) => {
  const current = String(currentStepNumero)
  const main = String(mainStep.numero)

  const currentIndex = FLUJO_LICITACION_SECUENCIA.indexOf(current)
  const mainIndex = FLUJO_LICITACION_SECUENCIA.indexOf(main)

  const lastSubstepNumero =
    mainStep.subpasos && mainStep.subpasos.length > 0
      ? mainStep.subpasos[mainStep.subpasos.length - 1].numero
      : mainStep.numero

  const lastGroupIndex = FLUJO_LICITACION_SECUENCIA.indexOf(String(lastSubstepNumero))

  if (currentIndex === -1 || mainIndex === -1) {
    return "pending"
  }

  // Si estoy exactamente en el paso principal o en cualquier subpaso del principal
  if (current === main || current.startsWith(`${main}.`)) {
    return "current"
  }

  // Si ya pasé el último subpaso de este grupo, está completado
  if (lastGroupIndex < currentIndex) {
    return "completed"
  }

  return "pending"
}

export const getSubStepState = (subStepNumero, currentStepNumero) => {
  const subIndex = getStepIndex(subStepNumero)
  const currentIndex = getStepIndex(currentStepNumero)

  if (subIndex === -1 || currentIndex === -1) return "pending"

  if (String(subStepNumero) === String(currentStepNumero)) {
    return "current"
  }

  if (subIndex < currentIndex) {
    return "completed"
  }

  return "pending"
}

export const MAP_NUMERO_A_PROCESO_LICITACION = {
  "1": "Confección Bases Técnicas",
  "1.1": "Firmas Jefatura de Unidad y Jefatura de Depto.",
  "2": "Unidad Administrativa Legal",
  "2.1": "Firma Jefatura Unidad Administrativo Legal",
  "3": "Firmas Directivas y Partes",
  "3.1": "Firmas Subdirector Administrativo y Director",
  "3.2": "Fecha y Enumeración de Oficina de Partes",
  "4": "Publicación de Bases",
  "5": "Periodo de Apertura y Evaluación Técnica de Ofertas",
  "6": "Confección de Res, Preadjudicación y Comisión",
  "7": "Presupuesto",
  "8": "Firmas Resolución Adjudicación",
  "8.1": "Firmas Jefatura de Unidad y Jefatura de Dpto.",
  "9": "Unidad Administrativa Legal",
  "9.1": "Firma Jefatura Unidad Administrativo Legal",
  "10": "Firmas Directivos y Partes",
  "10.1": "Firmas Subdirector Administrativo y Director(a)",
  "10.2": "Fecha y Enumeración de Oficina de Partes",
  "11": "Publicación de Adjudicación o Deserción"
}

MAP_NUMERO_A_PROCESO_LICITACION["11"] = "Fecha y EnumeraciÃ³n de Oficina de Partes"
MAP_NUMERO_A_PROCESO_LICITACION["12"] = "PublicaciÃ³n de AdjudicaciÃ³n o DeserciÃ³n"

export const MAP_PROCESO_ANTIGUO_A_NUMERO = {
  "Confección de Bases": "1",
  "Requerimiento referente técnico": "1.1",
  "Jurídico": "2",
  "Firmas Directivos y Partes": "3",
  "Publicación": "4",
  "Publicada": "11",
  "Evaluación Técnica": "5",
  "Preadjudicación y Comisión": "6",
  "Presupuesto": "7",
  "Finalizada": "11"
}

// Mapeo del nuevo flujo al numeroPaso antiguo en la base de datos
export const MAP_FLUJO_NUEVO_A_NUMERO_PASO_ANTIGUO = {
  "1": 1,
  "2": 2,
  "3": 4,
  "4": 5,
  "5": 6,
  "6": 7,
  "7": 8,
  "8": 9,
  "9": 10,
  "10": 11,
  "11": 11
}

// Mapeo inverso: de numeroPaso antiguo a nuevo numero de flujo
export const MAP_NUMERO_PASO_ANTIGUO_A_FLUJO_NUEVO = {
  1: "1",
  2: "2",
  3: "2",
  4: "3",
  5: "4",
  6: "5",
  7: "6",
  8: "7",
  9: "8",
  10: "9",
  11: "11"
}

// Función para obtener el nombre del proceso actual basado en numeroPaso
export const getProcesoActualLabelByNumeroPaso = (numeroPaso) => {
  if (!numeroPaso) return "Pendiente"

  const numeroVisual = getStepLabel(numeroPaso)
  const nombreProceso = MAP_NUMERO_A_PROCESO_LICITACION[numeroVisual]

  return nombreProceso ? `${numeroVisual} ${nombreProceso}` : numeroVisual
}

export const getProcesoActualLicitacionLabel = (procesoActual) => {
  if (!procesoActual) return "Pendiente"

  console.log("getProcesoActualLicitacionLabel input:", procesoActual, typeof procesoActual)

  // Si es un objeto
  if (typeof procesoActual === 'object') {
    // Si tiene numeroPaso, usar el mapeo basado en numeroPaso
    if (procesoActual.numeroPaso !== undefined) {
      console.log("Usando numeroPaso:", procesoActual.numeroPaso)
      const numeroVisual = getStepLabel(procesoActual.numeroPaso)
      return procesoActual.tituloProceso
        ? `${numeroVisual} ${procesoActual.tituloProceso}`
        : getProcesoActualLabelByNumeroPaso(procesoActual.numeroPaso)
    }
    
    // Si tiene tituloProceso con formato "X Nombre", extraer el número y usarlo
    if (procesoActual.tituloProceso && /^\d+\s+/.test(procesoActual.tituloProceso)) {
      const numero = procesoActual.tituloProceso.split(" ")[0]
      console.log("Extrayendo numero desde tituloProceso:", numero)
      return procesoActual.tituloProceso
    }
    
    // Si tiene tituloProceso sin formato, usar el mapeo antiguo
    if (procesoActual.tituloProceso) {
      console.log("Usando tituloProceso con mapeo antiguo:", procesoActual.tituloProceso)
      const valor = procesoActual.tituloProceso.trim()
      
      if (MAP_PROCESO_ANTIGUO_A_NUMERO[valor]) {
        const numeroNuevo = MAP_PROCESO_ANTIGUO_A_NUMERO[valor]
        return MAP_NUMERO_A_PROCESO_LICITACION[numeroNuevo]
      }
      
      return valor
    }
  }

  // Si es un string, procesarlo normalmente
  const valor = String(procesoActual).trim()
  console.log("Procesando como string:", valor)

  if (MAP_NUMERO_A_PROCESO_LICITACION[valor]) {
    return MAP_NUMERO_A_PROCESO_LICITACION[valor]
  }

  if (MAP_PROCESO_ANTIGUO_A_NUMERO[valor]) {
    const numeroNuevo = MAP_PROCESO_ANTIGUO_A_NUMERO[valor]
    return MAP_NUMERO_A_PROCESO_LICITACION[numeroNuevo]
  }

  return valor
}

export const getProcesoActualWorkflowLabel = (licitacion) => {
  const procesoActual = licitacion?.procesoActual ?? licitacion?.proceso_actual

  if (!procesoActual) return "Pendiente"

  if (esFormatoConvenioMarco(licitacion)) {
    const numeroPaso = Number(procesoActual.numeroPaso ?? procesoActual.numero_paso)
    const monto = getMontoLicitacion(licitacion)
    const visualData = getVisualStepConvenioMarco(numeroPaso, monto)
    const titulo = procesoActual.tituloProceso ?? procesoActual.titulo_proceso ?? ""

    return visualData.hidden
      ? titulo || "Pendiente"
      : `${visualData.visual} ${titulo}`.trim()
  }

  if (esFormatoTratoDirecto(licitacion)) {
    const numeroPaso = Number(procesoActual.numeroPaso ?? procesoActual.numero_paso)
    const visualData = getVisualStepTratoDirecto(numeroPaso)
    const titulo = procesoActual.tituloProceso ?? procesoActual.titulo_proceso ?? ""

    return `${visualData.visual} ${titulo}`.trim()
  }

  if (esFormatoLicitacion(licitacion?.formatoLiquidacion?.titulo ?? licitacion?.formato_liquidacion?.titulo)) {
    return getProcesoActualLicitacionLabel(procesoActual)
  }

  return procesoActual.tituloProceso ?? procesoActual.titulo_proceso ?? String(procesoActual)
}

export const getProcesoActualNumero = (procesoActual) => {
  if (!procesoActual) return "1"

  const valor = String(procesoActual).trim()

  // Si el valor ya tiene el formato "X Nombre", extraer el número
  if (/^\d+\s+/.test(valor)) {
    const numero = valor.split(" ")[0]
    if (FLUJO_LICITACION_SECUENCIA.includes(numero)) {
      return numero
    }
  }

  if (FLUJO_LICITACION_SECUENCIA.includes(valor)) {
    return valor
  }

  if (MAP_PROCESO_ANTIGUO_A_NUMERO[valor]) {
    return MAP_PROCESO_ANTIGUO_A_NUMERO[valor]
  }

  const found = Object.entries(MAP_NUMERO_A_PROCESO_LICITACION)
    .find(([numero, nombre]) => nombre === valor)

  return found ? found[0] : "1"
}

export const isStepCurrent = (step, procesoActual) => {
  if (!procesoActual) return false
  if (step.numero === procesoActual) return true
  const parent = getParentStep(procesoActual)
  return step.numero === parent
}

export const isSubstepCurrent = (substep, procesoActual) => {
  return substep.numero === procesoActual
}

export const isStepCompleted = (step, procesoActual) => {
  if (!procesoActual) return false
  
  const currentIndex = FLUJO_LICITACION_SECUENCIA.indexOf(procesoActual)
  if (currentIndex === -1) return false
  
  const subpasos = step.subpasos || []
  if (subpasos.length === 0) {
    const stepIndex = FLUJO_LICITACION_SECUENCIA.indexOf(step.numero)
    return stepIndex < currentIndex
  }
  
  const lastSubstepIndex = FLUJO_LICITACION_SECUENCIA.indexOf(subpasos[subpasos.length - 1].numero)
  return lastSubstepIndex < currentIndex
}

export const esFormatoLicitacion = (formato) => {
  return formato === "Licitación" || formato === "Licitacion" || formato === "Adquisición"
}

export const getFormatoLabel = (formato) => {
  if (formato === "Adquisición") return "Licitación"
  return formato
}

export const getFormatoKey = (value) => {
  const titulo =
    value?.formatoLiquidacion?.titulo ??
    value?.formato_liquidacion?.titulo ??
    value?.titulo ??
    value?.formato ??
    value ??
    ""

  const normalized = String(titulo)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\//g, " ")
    .replace(/\s+/g, "_")

  if (
    normalized.includes("convenio_marco") ||
    normalized.includes("gran_compra")
  ) {
    return "convenio_marco"
  }

  return normalized
}

export const esFormatoTratoDirecto = (formato) => {
  return getFormatoKey(formato) === "trato_directo"
}

export const esFormatoConvenioMarco = (formato) => {
  return getFormatoKey(formato) === "convenio_marco"
}

const toMontoNumber = (value) => {
  if (value === null || value === undefined || value === "" || value === "null") return 0

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  const normalizedValue = String(value)
    .replace(/\./g, "")
    .replace(/[^0-9]/g, "")

  const number = Number(normalizedValue)
  return Number.isFinite(number) ? number : 0
}

export const getMontoLicitacion = (licitacion = {}) => {
  if (typeof licitacion !== "object" || licitacion === null) {
    return toMontoNumber(licitacion)
  }

  return toMontoNumber(
    licitacion.monto ??
      licitacion.montoPresupuestado ??
      licitacion.monto_presupuestado ??
      0
  )
}

export const LIMITE_1000_UTM_CLP = Number(
  process.env.LIMITE_1000_UTM_CLP ?? 70588000
)

export const normalizarMontoCLP = (monto) => {
  return Number(
    String(monto ?? 0)
      .replace(/\./g, "")
      .replace(/\$/g, "")
      .replace(/[^0-9]/g, "")
  )
}

export const requiereIntencionCompraConvenioMarco = (monto) => {
  return normalizarMontoCLP(monto) > LIMITE_1000_UTM_CLP
}

export const CONVENIO_MARCO_PROCESOS = [
  { numeroPaso: 1, tituloProceso: "Confeccion de Intencion de Compra", diasSugeridos: 5 },
  { numeroPaso: 2, tituloProceso: "Firma Jefatura de Unidad y Dpto.", diasSugeridos: 0 },
  { numeroPaso: 3, tituloProceso: "Unidad Administrativa Legal", diasSugeridos: 5 },
  { numeroPaso: 4, tituloProceso: "Firma Jefatura Unidad Administrativo Legal", diasSugeridos: 0 },
  { numeroPaso: 5, tituloProceso: "Firma Subdirector Administrativo y Direccion", diasSugeridos: 0 },
  { numeroPaso: 6, tituloProceso: "Fecha y Enumeracion de Oficina de Partes", diasSugeridos: 2 },
  { numeroPaso: 7, tituloProceso: "Publicacion en Mercado Publico", diasSugeridos: 1 },
  { numeroPaso: 8, tituloProceso: "Periodo de Apertura y Evaluacion Tecnica de Ofertas", diasSugeridos: 10 },
  { numeroPaso: 9, tituloProceso: "Confeccion de Res. Preseleccion de Oferta y Comision", diasSugeridos: 5 },
  { numeroPaso: 10, tituloProceso: "Presupuesto", diasSugeridos: 5 },
  { numeroPaso: 11, tituloProceso: "Firmas Jefatura de Unidad y Jefatura de Dpto.", diasSugeridos: 0 },
  { numeroPaso: 12, tituloProceso: "Unidad Administrativa Legal", diasSugeridos: 5 },
  { numeroPaso: 13, tituloProceso: "Firma Jefatura Unidad Administrativo Legal", diasSugeridos: 0 },
  { numeroPaso: 14, tituloProceso: "Firma Subdirector Administrativo", diasSugeridos: 0 },
  { numeroPaso: 15, tituloProceso: "Fecha y Enumeracion de Oficina de Partes", diasSugeridos: 2 },
  { numeroPaso: 16, tituloProceso: "Publicacion de Seleccion de Oferta o Desercion", diasSugeridos: 1 }
]

export const getVisualStepConvenioMarco = (numeroPasoInterno, monto) => {
  const incluyeIntencionCompra = requiereIntencionCompraConvenioMarco(monto)
  const step = Number(numeroPasoInterno)

  if (incluyeIntencionCompra) {
    const map = {
      1: { visual: "1", isSubstep: false, parentVisual: null },
      2: { visual: "1.1", isSubstep: true, parentVisual: "1" },
      3: { visual: "2", isSubstep: false, parentVisual: null },
      4: { visual: "2.1", isSubstep: true, parentVisual: "2" },
      5: { visual: "3", isSubstep: false, parentVisual: null },
      6: { visual: "3.1", isSubstep: true, parentVisual: "3" },
      7: { visual: "4", isSubstep: false, parentVisual: null },
      8: { visual: "5", isSubstep: false, parentVisual: null },
      9: { visual: "6", isSubstep: false, parentVisual: null },
      10: { visual: "7", isSubstep: false, parentVisual: null },
      11: { visual: "7.1", isSubstep: true, parentVisual: "7" },
      12: { visual: "8", isSubstep: false, parentVisual: null },
      13: { visual: "8.1", isSubstep: true, parentVisual: "8" },
      14: { visual: "9", isSubstep: false, parentVisual: null },
      15: { visual: "9.1", isSubstep: true, parentVisual: "9" },
      16: { visual: "10", isSubstep: false, parentVisual: null }
    }

    return map[step] ?? { visual: String(step), isSubstep: false, parentVisual: null }
  }

  const map = {
    1: { hidden: true },
    2: { visual: "1", isSubstep: false, parentVisual: null },
    3: { visual: "2", isSubstep: false, parentVisual: null },
    4: { visual: "2.1", isSubstep: true, parentVisual: "2" },
    5: { visual: "3", isSubstep: false, parentVisual: null },
    6: { visual: "3.1", isSubstep: true, parentVisual: "3" },
    7: { visual: "4", isSubstep: false, parentVisual: null },
    8: { visual: "5", isSubstep: false, parentVisual: null },
    9: { visual: "6", isSubstep: false, parentVisual: null },
    10: { visual: "7", isSubstep: false, parentVisual: null },
    11: { visual: "7.1", isSubstep: true, parentVisual: "7" },
    12: { visual: "8", isSubstep: false, parentVisual: null },
    13: { visual: "8.1", isSubstep: true, parentVisual: "8" },
    14: { visual: "9", isSubstep: false, parentVisual: null },
    15: { visual: "9.1", isSubstep: true, parentVisual: "9" },
    16: { visual: "10", isSubstep: false, parentVisual: null }
  }

  return map[step] ?? { visual: String(step), isSubstep: false, parentVisual: null }
}

export const getProcesosVisiblesConvenioMarco = (procesos, monto) => {
  const procesosBase = Array.isArray(procesos) ? procesos : []

  return procesosBase
    .map((proceso) => {
      const numeroPasoInterno = Number(proceso.numeroPaso ?? proceso.numero_paso)
      const visualData = getVisualStepConvenioMarco(numeroPasoInterno, monto)

      return {
        ...proceso,
        numeroPasoInterno,
        numeroPasoVisual: visualData.visual,
        isSubstep: Boolean(visualData.isSubstep),
        parentVisual: visualData.parentVisual ?? null,
        hidden: Boolean(visualData.hidden)
      }
    })
    .filter((proceso) => !proceso.hidden)
}

export const getInitialStepConvenioMarco = (monto) => {
  return requiereIntencionCompraConvenioMarco(monto) ? 1 : 2
}

export const getNextStepConvenioMarco = (currentStep, licitacion = {}) => {
  const current = Number(currentStep)
  const monto = getMontoLicitacion(licitacion)
  const incluyeIntencionCompra = requiereIntencionCompraConvenioMarco(monto)

  if (!incluyeIntencionCompra && current < 2) {
    return 2
  }

  if (current < 16) {
    return current + 1
  }

  return null
}

export const getPreviousStepConvenioMarco = (currentStep, licitacion = {}) => {
  const current = Number(currentStep)
  const initialStep = getInitialStepConvenioMarco(getMontoLicitacion(licitacion))

  if (current <= initialStep) return null
  if (current <= 16) return current - 1

  return null
}

export const LIMITE_TRATO_DIRECTO_1000_UTM_CLP = Number(
  process.env.LIMITE_1000_UTM_CLP ??
  process.env.LIMITE_TRATO_DIRECTO_1000_UTM_CLP ??
  70588000
)

export const esTratoDirectoMayorA1000UTM = (licitacionOrMonto = {}) => {
  const monto = getMontoLicitacion(licitacionOrMonto)
  return monto > LIMITE_TRATO_DIRECTO_1000_UTM_CLP
}

export const requierePasosContratoTratoDirecto = esTratoDirectoMayorA1000UTM
export const requiereContratoTratoDirecto = esTratoDirectoMayorA1000UTM

export const TRATO_DIRECTO_PROCESOS = [
  { numeroPaso: 1, tituloProceso: "MEMO TRATO DIRECTO", diasSugeridos: 2 },
  { numeroPaso: 2, tituloProceso: "Carga de certificados", diasSugeridos: 0 },
  { numeroPaso: 3, tituloProceso: "Firmas Jefatura de Unidad y Jefatura de Dpto.", diasSugeridos: 0 },
  { numeroPaso: 4, tituloProceso: "Unidad Administrativa Legal", diasSugeridos: 3 },
  { numeroPaso: 5, tituloProceso: "Ingreso codigo OC", diasSugeridos: 1 },
  { numeroPaso: 6, tituloProceso: "Unidad ADM. Legal Confeccion de contrato", diasSugeridos: 3 },
  { numeroPaso: 7, tituloProceso: "Contrato al Proveedor", diasSugeridos: 2 },
  { numeroPaso: 8, tituloProceso: "Firmas Jefatura de Unidad y Jefatura de Dpto.", diasSugeridos: 0 },
  { numeroPaso: 9, tituloProceso: "Unidad Administrativa Legal", diasSugeridos: 3 },
  { numeroPaso: 10, tituloProceso: "Firmas Subdirector Administrativo y Director", diasSugeridos: 0 },
  { numeroPaso: 11, tituloProceso: "Envio de OC", diasSugeridos: 1 }
]

export const getVisualStepTratoDirecto = (numeroPasoInterno) => {
  const step = Number(numeroPasoInterno)
  const map = {
    1: { visual: "1", isSubstep: false, parentVisual: null },
    2: { visual: "1.1", isSubstep: true, parentVisual: "1" },
    3: { visual: "1.2", isSubstep: true, parentVisual: "1" },
    4: { visual: "2", isSubstep: false, parentVisual: null },
    5: { visual: "3", isSubstep: false, parentVisual: null },
    6: { visual: "4", isSubstep: false, parentVisual: null },
    7: { visual: "5", isSubstep: false, parentVisual: null },
    8: { visual: "5.1", isSubstep: true, parentVisual: "5" },
    9: { visual: "6", isSubstep: false, parentVisual: null },
    10: { visual: "6.1", isSubstep: true, parentVisual: "6" },
    11: { visual: "7", isSubstep: false, parentVisual: null }
  }

  return map[step] ?? { visual: String(step), isSubstep: false, parentVisual: null }
}

export const getProcesosVisiblesTratoDirecto = (procesos, licitacionOrMonto = {}) => {
  const procesosBase = Array.isArray(procesos) ? procesos : []
  const mayorA1000UTM = esTratoDirectoMayorA1000UTM(licitacionOrMonto)

  return procesosBase
    .map((proceso) => {
      const numeroPasoInterno = Number(proceso.numeroPaso ?? proceso.numero_paso)
      const visualData = getVisualStepTratoDirecto(numeroPasoInterno)
      const hidden = !mayorA1000UTM && numeroPasoInterno > 6

      return {
        ...proceso,
        numeroPasoInterno,
        numeroPasoVisual: visualData.visual,
        isSubstep: Boolean(visualData.isSubstep),
        parentVisual: visualData.parentVisual ?? null,
        hidden
      }
    })
    .filter((proceso) => !proceso.hidden)
}

export const getNextStepTratoDirecto = (currentStep, licitacion = {}) => {
  const current = Number(currentStep)
  const mayorA1000UTM = esTratoDirectoMayorA1000UTM(licitacion)

  if (!mayorA1000UTM && current >= 6) return null
  if (mayorA1000UTM && current >= 11) return null

  return current + 1
}

export const getPreviousStepTratoDirecto = (currentStep) => {
  const step = Number(currentStep)

  if (step <= 1) return null
  if (step <= 11) return step - 1

  return null
}

// Helper para obtener número visual de Licitación basado en numero_paso
export const getNextStep = (currentStep, decision = null) => {
  const current = Number(currentStep)

  if (current < 16) return current + 1

  if (current === 16) {
    if (decision === "inicio_anticipado") return 17
    if (decision === "contrato") return 25
    return null
  }

  if (current >= 17 && current < 24) return current + 1
  if (current === 24) return null

  if (current >= 25 && current < 35) return current + 1

  if (current === 35) {
    if (decision === "addendum_si") return 36
    if (decision === "addendum_no") return null
    return null
  }

  if (current >= 36 && current < 46) return current + 1
  if (current === 46) return null

  return null
}

export const WORKFLOW_STEP_LABELS = {
  1: "1",
  2: "1.1",
  3: "2",
  4: "2.1",
  5: "3",
  6: "4",
  7: "5",
  8: "6",
  9: "7",
  10: "8",
  11: "8.1",
  12: "9",
  13: "9.1",
  14: "10",
  15: "11",
  16: "12",

  // Inicio anticipado
  17: "13",
  18: "13.1",
  19: "14",
  20: "14.1",
  21: "15",
  22: "15.1",
  23: "15.2",
  24: "16",

  // Contrato
  25: "13",
  26: "14",
  27: "15",
  28: "16",
  29: "16.1",
  30: "17",
  31: "17.1",
  32: "18",
  33: "18.1",
  34: "18.2",
  35: "19",

  // Addendum
  36: "24",
  37: "25",
  38: "26",
  39: "27",
  40: "27.1",
  41: "28",
  42: "28.1",
  43: "29",
  44: "29.1",
  45: "29.2",
  46: "30"
}

export const getStepLabel = (numeroPaso) => {
  return WORKFLOW_STEP_LABELS[Number(numeroPaso)] ?? String(numeroPaso)
}

// Dias sugeridos para Licitacion cuando productoServicio = "Bienes".
// Indexado por numero_paso interno (1-16, flujo principal).
// null = "no aplica" → se muestra como "-".
export const DIAS_SUGERIDOS_BIENES_LICITACION = {
  1: 20,
  2: 4,
  3: null,
  4: 7,
  5: 10,
  6: 2,
  7: 2,
  8: 20,
  9: 2,
  10: 2,
  11: 4,
  12: null,
  13: 7,
  14: 10,
  15: 2,
  16: 2,

  // Inicio anticipado (interno 17-24)
  17: 7,
  18: 4,
  19: 2,
  20: 2,
  21: null,
  22: 10,
  23: 2,
  24: 2,

  // Contrato (interno 25-35)
  25: 15,
  26: 7,
  27: 2,
  28: 2,
  29: 4,
  30: null,
  31: 7,
  32: null,
  33: 10,
  34: 2,
  35: 2,

  // Addendum (interno 36-46)
  36: 15,
  37: 7,
  38: 2,
  39: 2,
  40: 4,
  41: null,
  42: 7,
  43: null,
  44: 10,
  45: 2,
  46: 2
}

// Dias sugeridos para Licitacion cuando productoServicio = "Servicios".
// Igual que Bienes (los 46 pasos) salvo:
//   interno 1  (Confeccion Bases Tecnicas)  -> 30 (bienes 20)
//   interno 8  (Periodo Apertura/Eval)      -> 15 (bienes 20)
//   interno 25 (Confeccion de Contrato)     -> 20 (bienes 15)
// Inicio anticipado y addendum identicos a bienes.
export const DIAS_SUGERIDOS_SERVICIOS_LICITACION = {
  ...DIAS_SUGERIDOS_BIENES_LICITACION,
  1: 30,
  8: 15,
  25: 20
}

const DIAS_SUGERIDOS_LICITACION_POR_PRODUCTO = {
  Bienes: DIAS_SUGERIDOS_BIENES_LICITACION,
  Servicios: DIAS_SUGERIDOS_SERVICIOS_LICITACION
}

export const getDiasSugeridosProceso = (proceso, licitacion) => {
  const numeroPaso = Number(proceso?.numeroPaso ?? proceso?.numero_paso)
  const productoServicio = licitacion?.productoServicio ?? licitacion?.producto_servicio
  const mapa = DIAS_SUGERIDOS_LICITACION_POR_PRODUCTO[productoServicio]

  if (
    esFormatoLicitacion(licitacion?.formatoLiquidacion?.titulo) &&
    mapa &&
    Object.prototype.hasOwnProperty.call(mapa, numeroPaso)
  ) {
    return mapa[numeroPaso]
  }

  return proceso?.diasSugeridos ?? proceso?.dias_sugeridos ?? null
}

// Severidad del paso actual segun dias sugeridos vs transcurridos.
// "vencido" = pasado de dias | "alerta" = restan 0-3 dias | null = ok/no aplica/finalizada.
export const getSeveridadDiasSugeridos = (licitacion) => {
  const proceso = licitacion?.procesoActual ?? licitacion?.proceso_actual
  if (!proceso) return null

  const estado = (licitacion?.estado ?? "").toString().trim().toLowerCase()
  if (["finalizada", "finalizado", "terminada", "terminado"].includes(estado)) return null

  const diasSugeridos = getDiasSugeridosProceso(proceso, licitacion)
  if (diasSugeridos === null || diasSugeridos === undefined) return null

  const fechaInicio = licitacion?.fechaRecepcion ?? licitacion?.fecha_recepcion ?? licitacion?.createdAt
  if (!fechaInicio) return null

  const diff = Date.now() - new Date(fechaInicio).getTime()
  const transcurridos = diff <= 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24))
  const restante = Number(diasSugeridos) - transcurridos

  if (restante < 0) return "vencido"
  if (restante <= 3) return "alerta"
  return null
}

export const getNumeroPasoVisual = (proceso, licitacion) => {
  const numeroPaso = Number(proceso?.numeroPaso ?? proceso?.numero_paso)

  if (esFormatoConvenioMarco(licitacion)) {
    return proceso?.numeroPasoVisual ?? getVisualStepConvenioMarco(numeroPaso, getMontoLicitacion(licitacion)).visual
  }

  if (esFormatoTratoDirecto(licitacion)) {
    return proceso?.numeroPasoVisual ?? getVisualStepTratoDirecto(numeroPaso).visual
  }

  return getStepLabel(numeroPaso)
}

export const isSubpasoVisual = (proceso, licitacion) => {
  const numeroPaso = Number(proceso?.numeroPaso ?? proceso?.numero_paso)

  if (esFormatoConvenioMarco(licitacion)) {
    return Boolean(
      proceso?.isSubstep ??
      getVisualStepConvenioMarco(numeroPaso, getMontoLicitacion(licitacion)).isSubstep
    )
  }

  if (esFormatoTratoDirecto(licitacion)) {
    return Boolean(
      proceso?.isSubstep ??
      getVisualStepTratoDirecto(numeroPaso).isSubstep
    )
  }

  return isSubpasoVisualLicitacion(numeroPaso)
}

export const getNumeroVisualLicitacion = (numeroPaso) => {
  return getStepLabel(numeroPaso)
}

// Helper para identificar si es un subpaso visual en Licitación
export const isSubpasoVisualLicitacion = (numeroPaso) => {
  return isSubStep(numeroPaso)
}

export const getProcesosVisibles = (procesos, licitacion) => {
  const procesosBase = Array.isArray(procesos) ? procesos : []

  if (esFormatoTratoDirecto(licitacion)) {
    return getProcesosVisiblesTratoDirecto(procesosBase, licitacion)
  }

  if (esFormatoConvenioMarco(licitacion)) {
    return getProcesosVisiblesConvenioMarco(procesosBase, getMontoLicitacion(licitacion))
  }

  const flujoPostPaso12 =
    licitacion?.flujoPostPaso12 ??
    licitacion?.flujo_post_paso_12 ??
    licitacion?.flujoPostPaso11 ??
    licitacion?.flujo_post_paso_11 ??
    null

  const requiereAddendum =
    licitacion?.requiereAddendum === true ||
    licitacion?.requiere_addendum === true

  return procesosBase.filter((proceso) => {
    const numeroPaso = Number(proceso.numeroPaso ?? proceso.numero_paso)

    if (numeroPaso <= 16) return true

    if (numeroPaso >= 17 && numeroPaso <= 24) {
      return flujoPostPaso12 === "inicio_anticipado"
    }

    if (numeroPaso >= 25 && numeroPaso <= 35) {
      return flujoPostPaso12 === "contrato"
    }

    if (numeroPaso >= 36 && numeroPaso <= 46) {
      return flujoPostPaso12 === "contrato" && requiereAddendum === true
    }

    return false
  })
}
