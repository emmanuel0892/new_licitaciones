"use client"

import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { Modal, Typography, Tag, Spin, Table, Button, Row, Col } from "antd"
import { CheckCircleFilled, ClockCircleFilled, DownOutlined, RightOutlined } from "@ant-design/icons"
import { getLicitacionById, getHistorialLicitacion, getProcesosByFormato } from "@/actions/licitaciones"
import { formatDate, formatMoney, FLUJO_LICITACION, FLUJO_LICITACION_SECUENCIA, FLUJO_LICITACION_AVANCE, esFormatoLicitacion, getParentStep, getProcesoActualNumero, getMainStepState, getSubStepState, getFormatoLabel, getMainStepNumero, getProcesoActualLabelByNumeroPaso, MAP_NUMERO_PASO_ANTIGUO_A_FLUJO_NUEVO, getStepLabel, isSubpasoVisualLicitacion } from "@/lib/helpers"
import "./ModalWorkflow.css"

const { Text, Title } = Typography

// Función para normalizar texto y evitar problemas de mayúsculas, tildes o espacios
const normalizar = (texto = "") => {
  return texto
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

const ModalWorkflow = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [licitacion, setLicitacion] = useState(null)
  const [historial, setHistorial] = useState([])
  const [isExtended, setIsExtended] = useState(false)
  const [expandedTableRows, setExpandedTableRows] = useState(new Set())
  const [procesosFormato, setProcesosFormato] = useState([])

  const toggleTableRowExpansion = (rowKey) => {
    setExpandedTableRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey)
      } else {
        newSet.add(rowKey)
      }
      return newSet
    })
  }

  // Transformar datos jerárquicos para la tabla expandible
  // Calcular procesos visibles para la lista de Procesos según flujoPostPaso11
  const getProcesosVisibles = () => {
    if (!esFormatoLicitacion(licitacion.formatoLiquidacion.titulo)) {
      return licitacion.formatoLiquidacion.procesos?.sort((a, b) => a.numeroPaso - b.numeroPaso) || []
    }

    const flujoPostPaso11 =
      licitacion?.flujoPostPaso11 ??
      licitacion?.flujo_post_paso_11 ??
      null

    return procesosFormato.filter((proceso) => {
      const numeroPaso = Number(proceso.numeroPaso ?? proceso.numero_paso)

      // Siempre mostrar flujo normal
      if (numeroPaso <= 15) return true

      // Mostrar inicio anticipado solo si fue elegido
      if (numeroPaso >= 16 && numeroPaso <= 23) {
        return flujoPostPaso11 === "inicio_anticipado"
      }

      // Mostrar contrato solo si fue elegido
      if (numeroPaso >= 24 && numeroPaso <= 34) {
        return flujoPostPaso11 === "contrato"
      }

      return false
    })
  }

  const getHistorialOrdenado = () => {
    return [...historial].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }

  const getProcesoTitulo = (proceso) => {
    return proceso?.tituloProceso ?? proceso?.titulo_proceso ?? ""
  }

  const getProcesoNumero = (proceso) => {
    return Number(proceso?.numeroPaso ?? proceso?.numero_paso)
  }

  const getPasoActual = () => {
    return Number(
      licitacion.numeroPasoActual ??
      licitacion.numeroPaso ??
      licitacion.pasoActual ??
      licitacion.procesoActual?.numeroPaso
    )
  }

  const getUltimaDevolucionReset = (historialOrdenado, procesos) => {
    const procesosNormales = new Set(
      procesos
        .filter((proceso) => getProcesoNumero(proceso) <= 15)
        .map((proceso) => normalizar(getProcesoTitulo(proceso)))
    )
    const procesosPosteriores = new Set(
      procesos
        .filter((proceso) => getProcesoNumero(proceso) > 15 && getProcesoNumero(proceso) <= 34)
        .map((proceso) => normalizar(getProcesoTitulo(proceso)))
    )

    return [...historialOrdenado].reverse().find((h) => {
      const origen = normalizar(h.procesoOrigen ?? h.proceso_origen)
      const destino = normalizar(h.procesoDestino ?? h.proceso_destino)

      return h.tipoAccion === "devolucion" &&
        procesosPosteriores.has(origen) &&
        procesosNormales.has(destino)
    })
  }

  const findHistorialTransicion = (historialOrdenado, procesoOrigen, procesoDestino, options = {}) => {
    if (!procesoOrigen || !procesoDestino) return null

    const fechaMinima = options.fechaMinima ? new Date(options.fechaMinima) : null
    const origenEsperado = normalizar(getProcesoTitulo(procesoOrigen))
    const destinoEsperado = normalizar(getProcesoTitulo(procesoDestino))

    return [...historialOrdenado].reverse().find((h) => {
      const fechaHistorial = new Date(h.createdAt)

      if (fechaMinima && fechaHistorial < fechaMinima) return false

      return h.tipoAccion === "avance" &&
        normalizar(h.procesoOrigen ?? h.proceso_origen) === origenEsperado &&
        normalizar(h.procesoDestino ?? h.proceso_destino) === destinoEsperado
    })
  }

  const getFechaInicioRamaInicioAnticipado = (historialOrdenado, procesos) => {
    const pasoDecision = procesos.find((proceso) => getProcesoNumero(proceso) === 15)
    const primerPasoInicioAnticipado = procesos.find((proceso) => getProcesoNumero(proceso) === 16)
    const historialInicioRama = findHistorialTransicion(
      historialOrdenado,
      pasoDecision,
      primerPasoInicioAnticipado
    )

    return historialInicioRama?.createdAt ?? historialInicioRama?.created_at ?? null
  }

  const isPasoInicioAnticipado = (numeroPaso) => {
    return numeroPaso >= 16 && numeroPaso <= 23
  }

  const getAprobadoPor = (historialProceso) => {
    if (!historialProceso) return null

    if (historialProceso.usuario) {
      return `${historialProceso.usuario.name ?? ""} ${historialProceso.usuario.lastname ?? ""}`.trim()
    }

    return historialProceso.usuarioNombre ?? historialProceso.aprobadoPor ?? null
  }

  const calcularDiasDemorados = (fechaRecepcion, fechaEmision, esPasoActual) => {
    if (!fechaRecepcion) return 0

    const fechaFin = fechaEmision || (esPasoActual ? new Date() : null)
    if (!fechaFin) return 0

    const diffTime = Math.abs(new Date(fechaFin) - new Date(fechaRecepcion))
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const transformTableData = () => {
    const procesosVisiblesOrdenados = getProcesosVisibles()
      .slice()
      .sort((a, b) => getProcesoNumero(a) - getProcesoNumero(b))
    const historialOrdenado = getHistorialOrdenado()
    const procesosBase = esFormatoLicitacion(licitacion.formatoLiquidacion.titulo)
      ? procesosFormato
      : licitacion.formatoLiquidacion.procesos ?? []
    const ultimaDevolucionReset = getUltimaDevolucionReset(historialOrdenado, procesosBase)
    const fechaReset = ultimaDevolucionReset?.createdAt ?? null
    const pasoActual = getPasoActual()
    const flujoPostPaso11 =
      licitacion?.flujoPostPaso11 ??
      licitacion?.flujo_post_paso_11 ??
      null
    const fechaInicioRamaInicioAnticipado =
      flujoPostPaso11 === "inicio_anticipado"
        ? getFechaInicioRamaInicioAnticipado(historialOrdenado, procesosBase)
        : null

    return procesosVisiblesOrdenados.map((proceso, index) => {
      const procesoAnterior = procesosVisiblesOrdenados[index - 1]
      const procesoSiguiente = procesosVisiblesOrdenados[index + 1]
      const numeroPaso = getProcesoNumero(proceso)
      const numeroVisual = getStepLabel(numeroPaso)
      const debeCortarPorReset = Boolean(
        fechaReset &&
        !flujoPostPaso11 &&
        (
          numeroPaso >= 15 ||
          getProcesoNumero(procesoAnterior) > 15 ||
          getProcesoNumero(procesoSiguiente) > 15
        )
      )
      const getFechaMinimaTransicion = (procesoOrigen, procesoDestino) => {
        const involucraInicioAnticipado =
          isPasoInicioAnticipado(getProcesoNumero(procesoOrigen)) ||
          isPasoInicioAnticipado(getProcesoNumero(procesoDestino))

        if (
          flujoPostPaso11 === "inicio_anticipado" &&
          fechaInicioRamaInicioAnticipado &&
          involucraInicioAnticipado
        ) {
          return fechaInicioRamaInicioAnticipado
        }

        if (debeCortarPorReset) {
          return fechaReset
        }

        return null
      }
      const historialRecepcion = index === 0
        ? null
        : findHistorialTransicion(historialOrdenado, procesoAnterior, proceso, {
          fechaMinima: getFechaMinimaTransicion(procesoAnterior, proceso)
        })
      const historialEmision = procesoSiguiente
        ? findHistorialTransicion(historialOrdenado, proceso, procesoSiguiente, {
          fechaMinima: getFechaMinimaTransicion(proceso, procesoSiguiente)
        })
        : null
      const esDestinoUltimaDevolucionReset = Boolean(
        ultimaDevolucionReset &&
        pasoActual <= 15 &&
        !flujoPostPaso11 &&
        numeroPaso === pasoActual &&
        normalizar(ultimaDevolucionReset.procesoDestino ?? ultimaDevolucionReset.proceso_destino) === normalizar(getProcesoTitulo(proceso))
      )
      let fechaRecepcion = esDestinoUltimaDevolucionReset
        ? ultimaDevolucionReset.createdAt
        : index === 0
        ? licitacion.createdAt
        : historialRecepcion?.createdAt ?? null
      const fechaEmision = historialEmision?.createdAt ?? null
      const esPasoActual = numeroPaso === pasoActual
      const fechaEmisionParaDias = esPasoActual ? null : fechaEmision
      const devolucionAlPasoActual = esPasoActual
        ? [...historialOrdenado].reverse().find((h) =>
          ["devolucion", "retroceso"].includes(normalizar(h.tipoAccion ?? h.tipo_accion)) &&
          normalizar(h.procesoDestino ?? h.proceso_destino) === normalizar(getProcesoTitulo(proceso))
        )
        : null

      if (devolucionAlPasoActual) {
        fechaRecepcion = devolucionAlPasoActual.createdAt
      }

      if (!fechaRecepcion && numeroPaso === 15 && fechaEmision && procesoAnterior) {
        const recepcionPaso15 = findHistorialTransicion(historialOrdenado, procesoAnterior, proceso, {
          fechaMinima: getFechaMinimaTransicion(procesoAnterior, proceso)
        })

        if (recepcionPaso15) {
          fechaRecepcion = recepcionPaso15.createdAt
        }
      }

      const fueAlcanzado = Boolean(fechaRecepcion)

      return {
        ...proceso,
        key: proceso.id || `proceso-${index}`,
        numero: numeroVisual,
        nombre: proceso.tituloProceso,
        tituloProceso: `${numeroVisual} ${proceso.tituloProceso}`,
        diasSugeridos: proceso.diasSugeridos,
        numeroPaso,
        hasSubpasos: false,
        isSubstep: isSubpasoVisualLicitacion(numeroPaso),
        subpasos: [],
        fechaRecepcion: fechaRecepcion ? formatDate(fechaRecepcion) : "Pendiente",
        fechaEmision: esPasoActual && fueAlcanzado
          ? "En curso"
          : fechaEmision
            ? formatDate(fechaEmision)
            : "Pendiente",
        diasDemorados: calcularDiasDemorados(fechaRecepcion, fechaEmisionParaDias, esPasoActual),
        aprobadoPor: esPasoActual ? "Pendiente" : getAprobadoPor(historialEmision) ?? "Pendiente"
      }
    })
  }

  useImperativeHandle(ref, () => ({
    open: async (id, extended = false) => {
      setOpen(true)
      setLoading(true)
      setIsExtended(extended)

      const [licResult, histResult] = await Promise.all([
        getLicitacionById(id),
        getHistorialLicitacion(id)
      ])

      if (licResult.data) {
        setLicitacion(licResult.data)

        // Si es formato Licitación, cargar procesos desde BD
        if (esFormatoLicitacion(licResult.data.formatoLiquidacion.titulo)) {
          const procesosResult = await getProcesosByFormato(licResult.data.formatoLiquidacionId)
          if (procesosResult.data) {
            setProcesosFormato(procesosResult.data)
          }
        } else {
          setProcesosFormato([])
        }
      }

      if (histResult.data) {
        setHistorial(histResult.data)
      }

      setLoading(false)
    }
  }))

  const getStepStatus = (proceso, procesoActual) => {
    if (!licitacion) return "pending"
    
    if (esFormatoLicitacion(licitacion.formatoLiquidacion.titulo)) {
      // Para formato Licitación, usar numeroPaso entero
      const currentNumeroPaso = procesoActual?.numeroPaso
      const stepNumeroPaso = proceso.numeroPaso
      
      if (!currentNumeroPaso || !stepNumeroPaso) return "pending"
      
      const step = Number(stepNumeroPaso)
      const current = Number(currentNumeroPaso)
      
      if (step < current) return "completed"
      if (step === current) return "current"
      return "pending"
    }
    
    if (proceso.numeroPaso < procesoActual.numeroPaso) {
      return "completed"
    }
    if (proceso.id === procesoActual.id) {
      return "current"
    }
    return "pending"
  }

  const calcularDiasEnProceso = () => {
    if (!licitacion?.fechaRecepcion) return 0
    const fechaRecepcion = new Date(licitacion.fechaRecepcion)
    const hoy = new Date()
    const diffTime = Math.abs(hoy - fechaRecepcion)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const calcularTotalTiempo = () => {
    const rows = transformTableData()
    const totalDias = rows.reduce((acc, row) => acc + (Number(row.diasDemorados) || 0), 0)

    const meses = (totalDias / 30.44).toFixed(1)
    return { dias: totalDias, meses }
  }

  const buscarEnHistorialPorDestino = (proceso) => {
    const tituloProceso = proceso.tituloProceso
    
    // Buscar por tituloProceso directo (viene de BD)
    let historialProceso = historial.find((h) =>
      h.tipoAccion === "avance" && h.procesoDestino === tituloProceso
    )
    
    return historialProceso
  }

  const buscarEnHistorialPorOrigen = (proceso) => {
    const tituloProceso = proceso.tituloProceso
    
    // Buscar por tituloProceso directo (viene de BD)
    let historialProceso = historial.find((h) =>
      h.tipoAccion === "avance" && h.procesoOrigen === tituloProceso
    )
    
    return historialProceso
  }

  const getFechaRecepcion = (proceso) => {
    const status = getStepStatus(proceso, licitacion.procesoActual)
    
    // Si está pendiente, no mostrar fecha
    if (status === "pending") {
      return "Pendiente"
    }
    
    // Paso 1 usa fechaCreacion
    if (proceso.numero === "1" || proceso.numeroPaso === 1) {
      return licitacion.createdAt ? formatDate(licitacion.createdAt) : "Pendiente"
    }

    // Verificar si es subpaso usando la nueva lógica
    if (proceso.isSubstep && esFormatoLicitacion(licitacion.formatoLiquidacion.titulo)) {
      // Para subpasos, buscar el proceso principal en procesosFormato
      // Los subpasos visuales (1.1, 2.1, 8.1, 9.1) corresponden a numeroPaso 2, 4, 11, 13
      // Sus padres son numeroPaso 1, 3, 10, 12 respectivamente
      let parentNumeroPaso = null
      if (proceso.numeroPaso === 2) parentNumeroPaso = 1
      else if (proceso.numeroPaso === 4) parentNumeroPaso = 3
      else if (proceso.numeroPaso === 11) parentNumeroPaso = 10
      else if (proceso.numeroPaso === 13) parentNumeroPaso = 12
      
      if (parentNumeroPaso) {
        const parentProcess = procesosFormato.find(p => p.numeroPaso === parentNumeroPaso)
        if (parentProcess) {
          const historialParent = buscarEnHistorialPorDestino(parentProcess)
          if (historialParent) {
            return formatDate(historialParent.createdAt)
          }
        }
      }
    }

    const historialProceso = buscarEnHistorialPorDestino(proceso)
    if (historialProceso) {
      return formatDate(historialProceso.createdAt)
    }

    // Fallback para el nuevo paso 2 (1.1 visual) para licitaciones antiguas
    const esNuevoPaso2 = proceso.numeroPaso === 2 || 
      normalizar(proceso.tituloProceso || "").includes("firmas jefatura de unidad y jefatura de dpto")
    
    if (esNuevoPaso2 && esFormatoLicitacion(licitacion.formatoLiquidacion.titulo)) {
      const historialFallback = historial.find((h) =>
        normalizar(h.procesoOrigen || "").includes("confeccion bases tecnicas") &&
        normalizar(h.procesoDestino || "").includes("unidad administrativa legal")
      )
      
      if (historialFallback) {
        return formatDate(historialFallback.createdAt)
      }
    }

    return "Pendiente"
  }

  const getFechaEmision = (proceso) => {
    const status = getStepStatus(proceso, licitacion.procesoActual)

    if (status === "pending") {
      return "Pendiente"
    }

    if (status === "current") {
      return "En curso"
    }

    // Verificar si es subpaso usando la nueva lógica
    if (proceso.isSubstep && esFormatoLicitacion(licitacion.formatoLiquidacion.titulo)) {
      // Para subpasos, buscar el proceso principal en procesosFormato
      // Los subpasos visuales (1.1, 2.1, 8.1, 9.1) corresponden a numeroPaso 2, 4, 11, 13
      // Sus padres son numeroPaso 1, 3, 10, 12 respectivamente
      let parentNumeroPaso = null
      if (proceso.numeroPaso === 2) parentNumeroPaso = 1
      else if (proceso.numeroPaso === 4) parentNumeroPaso = 3
      else if (proceso.numeroPaso === 11) parentNumeroPaso = 10
      else if (proceso.numeroPaso === 13) parentNumeroPaso = 12
      
      if (parentNumeroPaso) {
        const parentProcess = procesosFormato.find(p => p.numeroPaso === parentNumeroPaso)
        if (parentProcess) {
          const historialParent = buscarEnHistorialPorOrigen(parentProcess)
          if (historialParent) {
            return formatDate(historialParent.createdAt)
          }
        }
      }
    }

    const historialProceso = buscarEnHistorialPorOrigen(proceso)
    if (historialProceso) {
      return formatDate(historialProceso.createdAt)
    }

    // Fallback para el nuevo paso 2 (1.1 visual) para licitaciones antiguas
    const esNuevoPaso2 = proceso.numeroPaso === 2 || 
      normalizar(proceso.tituloProceso || "").includes("firmas jefatura de unidad y jefatura de dpto")
    
    if (esNuevoPaso2 && esFormatoLicitacion(licitacion.formatoLiquidacion.titulo)) {
      const historialFallback = historial.find((h) =>
        normalizar(h.procesoOrigen || "").includes("confeccion bases tecnicas") &&
        normalizar(h.procesoDestino || "").includes("unidad administrativa legal")
      )
      
      if (historialFallback) {
        return formatDate(historialFallback.createdAt)
      }
    }

    return "Pendiente"
  }

  const getUsuarioAprobador = (proceso) => {
    const status = getStepStatus(proceso, licitacion.procesoActual)
    
    // Si está pendiente o actual, no mostrar aprobador
    if (status === "pending" || status === "current") {
      return "Pendiente"
    }
    
    // Paso 1 usa usuario de la licitación
    if (proceso.numero === "1" || proceso.numeroPaso === 1) {
      if (licitacion.usuario) {
        return `${licitacion.usuario.name} ${licitacion.usuario.lastname}`
      }
      return "Pendiente"
    }

    // Verificar si es subpaso usando la nueva lógica
    if (proceso.isSubstep && esFormatoLicitacion(licitacion.formatoLiquidacion.titulo)) {
      // Para subpasos, buscar el proceso principal en procesosFormato
      // Los subpasos visuales (1.1, 2.1, 8.1, 9.1) corresponden a numeroPaso 2, 4, 11, 13
      // Sus padres son numeroPaso 1, 3, 10, 12 respectivamente
      let parentNumeroPaso = null
      if (proceso.numeroPaso === 2) parentNumeroPaso = 1
      else if (proceso.numeroPaso === 4) parentNumeroPaso = 3
      else if (proceso.numeroPaso === 11) parentNumeroPaso = 10
      else if (proceso.numeroPaso === 13) parentNumeroPaso = 12
      
      if (parentNumeroPaso) {
        const parentProcess = procesosFormato.find(p => p.numeroPaso === parentNumeroPaso)
        if (parentProcess) {
          const historialParent = buscarEnHistorialPorDestino(parentProcess)
          if (historialParent && historialParent.usuario) {
            return `${historialParent.usuario.name} ${historialParent.usuario.lastname}`
          }
        }
      }
    }

    const historialProceso = buscarEnHistorialPorDestino(proceso)
    if (historialProceso && historialProceso.usuario) {
      return `${historialProceso.usuario.name} ${historialProceso.usuario.lastname}`
    }

    // Fallback para el nuevo paso 2 (1.1 visual) para licitaciones antiguas
    const esNuevoPaso2 = proceso.numeroPaso === 2 || 
      normalizar(proceso.tituloProceso || "").includes("firmas jefatura de unidad y jefatura de dpto")
    
    if (esNuevoPaso2 && esFormatoLicitacion(licitacion.formatoLiquidacion.titulo)) {
      const historialFallback = historial.find((h) =>
        normalizar(h.procesoOrigen || "").includes("confeccion bases tecnicas") &&
        normalizar(h.procesoDestino || "").includes("unidad administrativa legal")
      )
      
      if (historialFallback) {
        if (historialFallback.usuario) {
          return `${historialFallback.usuario.name} ${historialFallback.usuario.lastname}`
        }
        if (historialFallback.aprobadoPor) {
          return historialFallback.aprobadoPor
        }
      }
    }

    return "Pendiente"
  }

  const renderStepIcon = (status, numero) => {
    if (status === "completed") {
      return (
        <div style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          backgroundColor: "#63B72F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 12,
          fontWeight: "bold"
        }}>
          <CheckCircleFilled style={{ fontSize: 14 }} />
        </div>
      )
    }
    if (status === "current") {
      return (
        <div style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          backgroundColor: "#14B8A6",
          boxShadow: "0 0 0 4px rgba(20, 184, 166, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 12,
          fontWeight: "bold"
        }}>
          {numero}
        </div>
      )
    }
    return (
      <div style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        backgroundColor: "#D9D9D9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: 12,
        fontWeight: "bold"
      }}>
        {numero}
      </div>
    )
  }

  const diasEnProcesoColumns = [
    {
      title: "Días sugeridos",
      dataIndex: "diasSugeridos",
      key: "diasSugeridos",
      align: "center",
      width: 84,
      render: (text) => text || "-"
    },
    {
      title: "Proceso",
      dataIndex: "tituloProceso",
      key: "tituloProceso",
      width: 230,
      render: (text, record) => (
        <div style={{ marginLeft: record.isSubstep ? 24 : 0 }}>
          <Text style={{ fontSize: 12 }}>{text}</Text>
        </div>
      )
    },
    {
      title: "Fecha de recepción",
      dataIndex: "fechaRecepcion",
      key: "fechaRecepcion",
      align: "center",
      width: 110
    },
    {
      title: "Fecha de emisión",
      dataIndex: "fechaEmision",
      key: "fechaEmision",
      align: "center",
      width: 110
    },
    {
      title: "Días demorados",
      dataIndex: "diasDemorados",
      key: "diasDemorados",
      align: "center",
      width: 88
    },
    {
      title: "Aprobado por",
      dataIndex: "aprobadoPor",
      key: "aprobadoPor",
      width: 130
    }
  ]

  const totalTiempoColumns = [
    {
      title: "Total Días",
      dataIndex: "dias",
      key: "dias",
      align: "center",
      render: (text) => text || 0
    },
    {
      title: "Total en Meses",
      dataIndex: "meses",
      key: "meses",
      align: "center",
      render: (text) => text || 0
    }
  ]

  return (
    <Modal
      title={isExtended ? "Flujo de Trabajo (Extendido)" : "Flujo de Trabajo"}
      open={open}
      onCancel={() => setOpen(false)}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button type="primary" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </div>
      }
      width="min(96vw, 1320px)"
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : licitacion ? (
        <Row gutter={24}>
          {/* Panel Izquierdo - 38% */}
          <Col span={7}>
            {/* Información General */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Licitación:</Tag>
                  <Text style={{ marginLeft: 8 }}>{licitacion.numeroLicitacion || "Sin número"}</Text>
                </div>
              </div>
              <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Nombre:</Tag>
                  <Text style={{ marginLeft: 8 }}>{licitacion.nombreLicitacion}</Text>
                </div>
              </div>
              <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Requirente:</Tag>
                  <Text style={{ marginLeft: 8 }}>{licitacion.requirente}</Text>
                </div>
              </div>
              <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Monto:</Tag>
                  <Text style={{ marginLeft: 8 }}>{formatMoney(licitacion.montoPresupuestado)}</Text>
                </div>
              </div>
              <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Estado:</Tag>
                  <Tag
                    color={
                      licitacion.estado === "Finalizada" ? "#268e00" :
                      licitacion.estado === "Devuelto" ? "#e53935" : "#e5be01"
                    }
                    style={{ marginLeft: 8 }}
                  >
                    {licitacion.estado}
                  </Tag>
                </div>
              </div>
              <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Formato:</Tag>
                  <Text style={{ marginLeft: 8 }}>{getFormatoLabel(licitacion.formatoLiquidacion.titulo)}</Text>
                </div>
              </div>
              <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Creador:</Tag>
                  <Text style={{ marginLeft: 8 }}>{licitacion.usuario.name} {licitacion.usuario.lastname}</Text>
                </div>
              </div>
              <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Vigencia:</Tag>
                  <Text style={{ marginLeft: 8 }}>{licitacion.vigencia ? formatDate(licitacion.vigencia) : "-"}</Text>
                </div>
              </div>
              <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Fecha de creación:</Tag>
                  <Text style={{ marginLeft: 8 }}>{formatDate(licitacion.createdAt)}</Text>
                </div>
              </div>

              {isExtended && (
                <>
                  <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Devoluciones:</Tag>
                      <Tag color={licitacion.contadorDevoluciones > 0 ? "#e53935" : "#d9d9d9"} style={{ marginLeft: 8 }}>
                        {licitacion.contadorDevoluciones}
                      </Tag>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Ediciones:</Tag>
                      <Tag color={licitacion.contadorEdiciones > 0 ? "#faad14" : "#d9d9d9"} style={{ marginLeft: 8 }}>
                        {licitacion.contadorEdiciones}
                      </Tag>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Días en proceso actual:</Tag>
                      <Tag color={calcularDiasEnProceso() > (licitacion.procesoActual?.diasSugeridos || 5) ? "#e53935" : "#52c41a"} style={{ marginLeft: 8 }}>
                        {calcularDiasEnProceso()} días
                      </Tag>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <Tag color="#9BC331" style={{ fontSize: 12, fontWeight: "bold" }}>Fecha recepción proceso:</Tag>
                      <Text style={{ marginLeft: 8 }}>{licitacion.fechaRecepcion ? formatDate(licitacion.fechaRecepcion) : "-"}</Text>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Pasos del Workflow */}
            <div>
              <Title level={5} style={{ marginBottom: 16 }}>Procesos</Title>
              <div style={{
                maxHeight: 420,
                overflowY: "auto",
                overflowX: "hidden",
                paddingRight: 8
              }}>
                <style>{`
                  .workflow-process-scroll::-webkit-scrollbar {
                    width: 6px;
                  }
                  .workflow-process-scroll::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .workflow-process-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 999px;
                  }
                  .workflow-process-scroll::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                  }
                  .workflow-process-list {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding-left: 26px;
                  }
                  .workflow-process-list::before {
                    content: "";
                    position: absolute;
                    left: 12px;
                    top: 8px;
                    bottom: 8px;
                    width: 2px;
                    background: #e5e7eb;
                    border-radius: 999px;
                  }
                  .workflow-process-item {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    min-height: 34px;
                  }
                  .workflow-process-item-sub {
                    margin-left: 32px;
                  }
                  .workflow-process-marker {
                    z-index: 1;
                    min-width: 26px;
                    height: 26px;
                    border-radius: 999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 700;
                    transition: all 0.2s ease;
                  }
                  .workflow-process-marker-completed {
                    background: #65b934;
                    color: #ffffff;
                  }
                  .workflow-process-marker-current {
                    background: #14b8a6;
                    color: #ffffff;
                    box-shadow: 0 0 0 5px rgba(20, 184, 166, 0.16);
                  }
                  .workflow-process-marker-pending {
                    background: #d9d9d9;
                    color: #ffffff;
                  }
                  .workflow-process-content {
                    flex: 1;
                    padding: 6px 10px;
                    border-radius: 12px;
                    line-height: 1.35;
                    transition: all 0.2s ease;
                  }
                  .workflow-process-content-current {
                    background: #e6fffa;
                    border: 1px solid #99f6e4;
                    color: #0f766e;
                    font-weight: 700;
                  }
                  .workflow-process-content-sub {
                    font-size: 12px;
                  }
                  .workflow-process-content:hover {
                    background: #f8fafc;
                  }
                `}</style>
                <div className="workflow-process-scroll">
                  <div className="workflow-process-list">
                    {esFormatoLicitacion(licitacion.formatoLiquidacion.titulo) ? (
                      <>
                        {getProcesosVisibles().map((proceso) => {
                          const numeroVisual = getStepLabel(proceso.numeroPaso)
                          const isSubpaso = isSubpasoVisualLicitacion(proceso.numeroPaso)

                          // Calcular estado basado en numeroPaso entero
                          const step = Number(proceso.numeroPaso)
                          const current = Number(
                            licitacion.numeroPasoActual ??
                            licitacion.numeroPaso ??
                            licitacion.pasoActual ??
                            licitacion.procesoActual?.numeroPaso
                          )
                          
                          let status = "pending"
                          if (step < current) {
                            status = "completed"
                          } else if (step === current) {
                            status = "current"
                          }

                          return (
                            <div
                              key={proceso.id}
                              className={`workflow-process-item ${isSubpaso ? "workflow-process-item-sub" : ""}`}
                            >
                              <span className={`workflow-process-marker workflow-process-marker-${status}`}>
                                {status === "completed" ? "✓" : numeroVisual}
                              </span>
                              <div
                                className={`workflow-process-content ${
                                  status === "current" ? "workflow-process-content-current" : ""
                                } ${isSubpaso ? "workflow-process-content-sub" : ""}`}
                              >
                                {numeroVisual} {proceso.tituloProceso}
                              </div>
                            </div>
                          )
                        })}

                      </>
                    ) : (
                      <>
                        {getProcesosVisibles().map((proceso) => {
                          const status = getStepStatus(proceso, licitacion.procesoActual)
                          const numeroVisual = getStepLabel(proceso.numeroPaso)
                          const isSubpaso = isSubpasoVisualLicitacion(proceso.numeroPaso)

                          return (
                            <div
                              key={proceso.id}
                              className={`workflow-process-item ${isSubpaso ? "workflow-process-item-sub" : ""}`}
                            >
                              <span className={`workflow-process-marker workflow-process-marker-${status}`}>
                                {status === "completed" ? "✓" : numeroVisual}
                              </span>
                              <div
                                className={`workflow-process-content ${
                                  status === "current" ? "workflow-process-content-current" : ""
                                } ${isSubpaso ? "workflow-process-content-sub" : ""}`}
                              >
                                {numeroVisual} {proceso.tituloProceso}
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Col>

          {/* Panel Derecho - 62% */}
          <Col span={17}>
            {/* Tabla Días en procesos */}
            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 16, color: "#14B8A6" }}>Días en procesos:</Title>
              <div className="dias-procesos-table-scroll">
                <Table
                  columns={diasEnProcesoColumns}
                  dataSource={transformTableData()}
                  pagination={false}
                  size="small"
                  scroll={{ y: "calc(100vh - 380px)" }}
                  sticky
                  tableLayout="fixed"
                  rowKey="key"
                  style={{
                    backgroundColor: "white",
                    borderRadius: 8,
                    overflow: "hidden"
                  }}
                  headerStyle={{
                    backgroundColor: "#F0FDFA",
                    color: "#0F766E",
                    fontWeight: "bold",
                    borderBottom: "2px solid #14B8A6"
                  }}
                  rowClassName={(record) => {
                    const status = getStepStatus(record, licitacion.procesoActual)
                    if (status === "current") {
                      return "table-row-current"
                    }
                    return ""
                  }}
                  onRow={(record) => {
                    const status = getStepStatus(record, licitacion.procesoActual)
                    return {
                      style: status === "current" ? {
                        backgroundColor: "#E6FFFA",
                        color: "#0F766E",
                        fontWeight: 500
                      } : {}
                    }
                  }}
                />
              </div>
            </div>

            {/* Tabla Total tiempo transcurrido */}
            <div>
              <Title level={5} style={{ marginBottom: 16, color: "#268e00" }}>Total tiempo transcurrido:</Title>
              <Table
                columns={totalTiempoColumns}
                dataSource={[calcularTotalTiempo()]}
                pagination={false}
                size="small"
                rowKey={() => "total"}
                style={{
                  backgroundColor: "white",
                  borderRadius: 8,
                  overflow: "hidden"
                }}
                headerStyle={{
                  backgroundColor: "#e8f5e9",
                  color: "#268e00",
                  fontWeight: "bold"
                }}
              />
            </div>
          </Col>
        </Row>
      ) : null}
    </Modal>
  )
})

ModalWorkflow.displayName = "ModalWorkflow"

export default ModalWorkflow
