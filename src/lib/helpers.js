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

export const isSubStep = (numero) => {
  return String(numero).includes(".")
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
  
  const nuevoNumero = MAP_NUMERO_PASO_ANTIGUO_A_FLUJO_NUEVO[numeroPaso]
  if (!nuevoNumero) return "Pendiente"
  
  const proceso = FLUJO_LICITACION.find(p => p.numero === nuevoNumero)
  return proceso ? `${proceso.numero} ${proceso.nombre}` : "Pendiente"
}

export const getProcesoActualLicitacionLabel = (procesoActual) => {
  if (!procesoActual) return "Pendiente"

  console.log("getProcesoActualLicitacionLabel input:", procesoActual, typeof procesoActual)

  // Si es un objeto
  if (typeof procesoActual === 'object') {
    // Si tiene numeroPaso, usar el mapeo basado en numeroPaso
    if (procesoActual.numeroPaso !== undefined) {
      console.log("Usando numeroPaso:", procesoActual.numeroPaso)
      return getProcesoActualLabelByNumeroPaso(procesoActual.numeroPaso)
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

// Helper para obtener número visual de Licitación basado en numero_paso
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
    // Inicio anticipado
    16: "12",
    17: "12.1",
    18: "13",
    19: "13.1",
    20: "14",
    21: "14.1",
    22: "14.2",
    23: "15",
    // Contrato
    24: "12",
    25: "13",
    26: "14",
    27: "15",
    28: "15.1",
    29: "16",
    30: "16.1",
    31: "17",
    32: "17.1",
    33: "17.2",
    34: "18"
}

export const getStepLabel = (numeroPaso) => {
  return WORKFLOW_STEP_LABELS[Number(numeroPaso)] ?? String(numeroPaso)
}

export const getNumeroVisualLicitacion = (numeroPaso) => {
  return getStepLabel(numeroPaso)
}

// Helper para identificar si es un subpaso visual en Licitación
export const isSubpasoVisualLicitacion = (numeroPaso) => {
  return [2, 4, 11, 13, 17, 19, 21, 22, 28, 30, 32, 33].includes(Number(numeroPaso))
}
