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
  { value: "Medicamentos", label: "Medicamentos" },
  { value: "Insumos", label: "Insumos" },
  { value: "Servicios", label: "Servicios" },
  { value: "Otros Formatos", label: "Otros Formatos" }
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
