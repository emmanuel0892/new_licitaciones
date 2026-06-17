import { getFormatoKey } from "@/lib/helpers"

export const isTratoDirectoPermissionTarget = (licitacion) => {
  return getFormatoKey(licitacion) === "trato_directo"
}

export const isConvenioMarcoPermissionTarget = (licitacion) => {
  return getFormatoKey(licitacion) === "convenio_marco"
}

export const isCompraAgilPermissionTarget = (licitacion) => {
  return getFormatoKey(licitacion) === "compra_agil"
}

export const getWorkflowActionPermissionCode = (licitacion, action, numeroPasoActual) => {
  const step = Number(numeroPasoActual)

  if (isTratoDirectoPermissionTarget(licitacion)) {
    return `workflow.trato_directo.${action}.${step}`
  }

  if (isConvenioMarcoPermissionTarget(licitacion)) {
    return `workflow.convenio_marco.${action}.${step}`
  }

  if (isCompraAgilPermissionTarget(licitacion)) {
    return `workflow.compra_agil.${action}.${step}`
  }

  return `workflow.${action}.${step}`
}

export const getAdvancePermissionCode = (licitacion, numeroPasoActual) => {
  return getWorkflowActionPermissionCode(licitacion, "avanzar", numeroPasoActual)
}

export const getReturnPermissionCode = (licitacion, numeroPasoActual) => {
  return getWorkflowActionPermissionCode(licitacion, "devolver", numeroPasoActual)
}

export const getDocumentViewPermissionCode = (licitacion) => {
  if (isConvenioMarcoPermissionTarget(licitacion)) {
    return "convenio_marco.ver_documentos"
  }

  return isTratoDirectoPermissionTarget(licitacion)
    ? "trato_directo.ver_documentos"
    : "licitacion.ver_documentos"
}

export const getDocumentUploadPermissionCode = (licitacion) => {
  if (isConvenioMarcoPermissionTarget(licitacion)) {
    return "convenio_marco.subir_documento"
  }

  return isTratoDirectoPermissionTarget(licitacion)
    ? "trato_directo.subir_documento"
    : "licitacion.subir_documento"
}

export const getCertificateUploadPermissionCode = (licitacion) => {
  return isTratoDirectoPermissionTarget(licitacion)
    ? "trato_directo.subir_certificados"
    : getDocumentUploadPermissionCode(licitacion)
}

export const getWorkflowViewPermissionCode = (licitacion) => {
  if (isConvenioMarcoPermissionTarget(licitacion)) {
    return "convenio_marco.ver_flujo"
  }

  return isTratoDirectoPermissionTarget(licitacion)
    ? "trato_directo.ver_flujo"
    : "licitacion.ver_flujo"
}

export const getHistoryPermissionCode = (licitacion) => {
  if (isConvenioMarcoPermissionTarget(licitacion)) {
    return "convenio_marco.ver_historial"
  }

  return isTratoDirectoPermissionTarget(licitacion)
    ? "trato_directo.ver_historial"
    : "licitacion.ver_historial"
}

export const getMercadoPublicoEditPermissionCode = (licitacion) => {
  if (isConvenioMarcoPermissionTarget(licitacion)) {
    return "convenio_marco.editar_codigo_mercado_publico"
  }

  return isTratoDirectoPermissionTarget(licitacion)
    ? "trato_directo.editar_codigo_mercado_publico"
    : "mercado_publico.editar_codigo"
}

export const getTratoDirectoPermissionOrder = (permission) => {
  const code = permission.codigo ?? permission.code ?? ""

  if (code === "trato_directo.ver_flujo") return 1
  if (code === "trato_directo.ver_historial") return 2
  if (code === "trato_directo.subir_documento") return 3
  if (code === "trato_directo.ver_documentos") return 4
  if (code === "trato_directo.editar_codigo_mercado_publico") return 5
  if (code === "trato_directo.subir_certificados") return 6

  const avanzarMatch = code.match(/^workflow\.trato_directo\.avanzar\.(\d+)$/)
  if (avanzarMatch) return 100 + Number(avanzarMatch[1])

  const devolverMatch = code.match(/^workflow\.trato_directo\.devolver\.(\d+)$/)
  if (devolverMatch) return 200 + Number(devolverMatch[1])

  return 999
}

export const getConvenioMarcoPermissionOrder = (permission) => {
  const code = permission.codigo ?? permission.code ?? ""

  if (code === "convenio_marco.ver_flujo") return 1
  if (code === "convenio_marco.ver_historial") return 2
  if (code === "convenio_marco.subir_documento") return 3
  if (code === "convenio_marco.ver_documentos") return 4
  if (code === "convenio_marco.editar_codigo_mercado_publico") return 5

  const avanzarMatch = code.match(/^workflow\.convenio_marco\.avanzar\.(\d+)$/)
  if (avanzarMatch) return 100 + Number(avanzarMatch[1])

  const devolverMatch = code.match(/^workflow\.convenio_marco\.devolver\.(\d+)$/)
  if (devolverMatch) return 200 + Number(devolverMatch[1])

  return 999
}
