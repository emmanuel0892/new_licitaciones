"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Typography, Tag, Spin, Table, Button, Row, Col } from "antd"
import { CheckCircleFilled, ClockCircleFilled, DownOutlined, RightOutlined } from "@ant-design/icons"
import { getLicitacionById, getHistorialLicitacion } from "@/actions/licitaciones"
import { formatDate, formatMoney, FLUJO_LICITACION, esFormatoLicitacion, getParentStep, getProcesoActualNumero, getMainStepState, getSubStepState } from "@/lib/helpers"

const { Text, Title } = Typography

// Estructura jerárquica de pasos y subpasos para la tabla
const FLUJO_LICITACION_TABLA = [
  {
    numero: "1",
    nombre: "Confección Bases Técnicas",
    diasSugeridos: 5,
    subpasos: [
      {
        numero: "1.1",
        nombre: "Firmas Jefatura de Unidad y Jefatura de Depto.",
        diasSugeridos: "-"
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
        diasSugeridos: "-"
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
        diasSugeridos: "-"
      },
      {
        numero: "3.2",
        nombre: "Fecha y Enumeración de Oficina de Partes",
        diasSugeridos: "-"
      }
    ]
  },
  {
    numero: "4",
    nombre: "Publicación de Bases",
    diasSugeridos: 2,
    subpasos: []
  },
  {
    numero: "5",
    nombre: "Periodo de Apertura y Evaluación Técnica de Ofertas",
    diasSugeridos: 10,
    subpasos: []
  },
  {
    numero: "6",
    nombre: "Confección de Res, Preadjudicación y Comisión",
    diasSugeridos: 5,
    subpasos: []
  },
  {
    numero: "7",
    nombre: "Presupuesto",
    diasSugeridos: 5,
    subpasos: []
  },
  {
    numero: "8",
    nombre: "Firmas Resolución Adjudicación",
    diasSugeridos: 5,
    subpasos: [
      {
        numero: "8.1",
        nombre: "Firmas Jefatura de Unidad y Jefatura de Dpto.",
        diasSugeridos: "-"
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
        diasSugeridos: "-"
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
        diasSugeridos: "-"
      },
      {
        numero: "10.2",
        nombre: "Fecha y Enumeración de Oficina de Partes",
        diasSugeridos: "-"
      }
    ]
  },
  {
    numero: "11",
    nombre: "Publicación de Adjudicación o Deserción",
    diasSugeridos: 2,
    subpasos: []
  }
]

const ModalWorkflow = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [licitacion, setLicitacion] = useState(null)
  const [historial, setHistorial] = useState([])
  const [isExtended, setIsExtended] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState(new Set())
  const [expandedTableRows, setExpandedTableRows] = useState(new Set())

  const toggleStepExpansion = (stepNumero) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stepNumero)) {
        newSet.delete(stepNumero)
      } else {
        newSet.add(stepNumero)
      }
      return newSet
    })
  }

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
  const transformTableData = () => {
    if (!esFormatoLicitacion(licitacion.formatoLiquidacion.titulo)) {
      return licitacion.formatoLiquidacion.procesos?.sort((a, b) => a.numeroPaso - b.numeroPaso) || []
    }

    const tableData = []
    FLUJO_LICITACION_TABLA.forEach(paso => {
      const pasoProcess = licitacion.formatoLiquidacion.procesos.find(p => p.numero === paso.numero || String(p.numeroPaso) === paso.numero)
      const tituloProceso = pasoProcess ? pasoProcess.tituloProceso : `${paso.numero} ${paso.nombre}`
      
      tableData.push({
        key: paso.numero,
        numero: paso.numero,
        nombre: paso.nombre,
        tituloProceso: tituloProceso,
        diasSugeridos: paso.diasSugeridos,
        hasSubpasos: paso.subpasos && paso.subpasos.length > 0,
        subpasos: paso.subpasos,
        isSubstep: false
      })
    })
    return tableData
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
      const currentNumero = getProcesoActualNumero(procesoActual?.tituloProceso || procesoActual)
      if (!currentNumero) return "pending"
      
      if (proceso.numero) {
        const state = getMainStepState(proceso, currentNumero)
        return state
      }
      
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
    if (!licitacion?.formatoLiquidacion?.procesos) return { dias: 0, meses: 0 }

    let totalDias = 0

    licitacion.formatoLiquidacion.procesos.forEach((proceso) => {
      const status = getStepStatus(proceso, licitacion.procesoActual)
      if (status === "completed") {
        totalDias += 1
      } else if (status === "current") {
        totalDias += calcularDiasEnProceso()
      }
    })

    const meses = (totalDias / 30.44).toFixed(1)
    return { dias: totalDias, meses }
  }

  // Mapeo de nombres nuevos a antiguos para buscar en historial
  const nombreNuevoAAntiguo = {
    "1 Confección Bases Técnicas": "Confección de Bases",
    "1.1 Firmas Jefatura de Unidad y Jefatura de Depto.": null,
    "2 Unidad Administrativa Legal": "Requerimiento referente técnico",
    "2.1 Firma Jefatura Unidad Administrativo Legal": null,
    "3 Firmas Directivas y Partes": "Jurídico",
    "3.1 Firmas Subdirector Administrativo y Director": null,
    "3.2 Fecha y Enumeración de Oficina de Partes": null,
    "4 Publicación de Bases": "Firmas Directivos y Partes",
    "5 Periodo de Apertura y Evaluación Técnica de Ofertas": "Publicación",
    "6 Confección de Res, Preadjudicación y Comisión": "Evaluación Técnica",
    "7 Presupuesto": "Confección de Res, Preadjudicación y Comisión",
    "8 Firmas Resolución Adjudicación": "Presupuesto",
    "8.1 Firmas Jefatura de Unidad y Jefatura de Dpto.": null,
    "9 Unidad Administrativa Legal": "Firmas Resolución Adjudicación",
    "9.1 Firma Jefatura Unidad Administrativo Legal": null,
    "10 Firmas Directivos y Partes": "Unidad Administrativa Legal",
    "10.1 Firmas Subdirector Administrativo y Director(a)": null,
    "10.2 Fecha y Enumeración de Oficina de Partes": null,
    "11 Publicación de Adjudicación o Deserción": "Firmas Directivos y Partes"
  }

  const buscarEnHistorialPorDestino = (proceso) => {
    const tituloProceso = proceso.tituloProceso
    const nombreAntiguo = nombreNuevoAAntiguo[tituloProceso]
    
    // Buscar por nombre nuevo
    let historialProceso = historial.find((h) =>
      h.tipoAccion === "avance" && h.procesoDestino === tituloProceso
    )
    
    // Si no encuentra y tiene nombre antiguo, buscar por nombre antiguo
    if (!historialProceso && nombreAntiguo) {
      historialProceso = historial.find((h) =>
        h.tipoAccion === "avance" && h.procesoDestino === nombreAntiguo
      )
    }
    
    return historialProceso
  }

  const buscarEnHistorialPorOrigen = (proceso) => {
    const tituloProceso = proceso.tituloProceso
    const nombreAntiguo = nombreNuevoAAntiguo[tituloProceso]
    
    // Buscar por nombre nuevo
    let historialProceso = historial.find((h) =>
      h.tipoAccion === "avance" && h.procesoOrigen === tituloProceso
    )
    
    // Si no encuentra y tiene nombre antiguo, buscar por nombre antiguo
    if (!historialProceso && nombreAntiguo) {
      historialProceso = historial.find((h) =>
        h.tipoAccion === "avance" && h.procesoOrigen === nombreAntiguo
      )
    }
    
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

    // Verificar si es subpaso (tiene punto en el número)
    const esSubpaso = proceso.numero && proceso.numero.includes(".")
    
    if (esSubpaso) {
      // Obtener el número del paso principal
      const parentNumero = proceso.numero.split(".")[0]
      const parentProcess = licitacion.formatoLiquidacion.procesos.find(p => p.numero === parentNumero || String(p.numeroPaso) === parentNumero)
      
      if (parentProcess) {
        // Buscar historial del paso principal
        const historialParent = buscarEnHistorialPorDestino(parentProcess)
        if (historialParent) {
          return formatDate(historialParent.createdAt)
        }
        // Si no hay historial del padre y es el paso 1, usar fechaCreacion
        if (parentNumero === "1" && licitacion.createdAt) {
          return formatDate(licitacion.createdAt)
        }
      }
    }

    const historialProceso = buscarEnHistorialPorDestino(proceso)
    return historialProceso ? formatDate(historialProceso.createdAt) : "Pendiente"
  }

  const getFechaEmision = (proceso) => {
    const status = getStepStatus(proceso, licitacion.procesoActual)

    if (status === "pending") {
      return "Pendiente"
    }

    if (status === "current") {
      return "En curso"
    }

    // Verificar si es subpaso (tiene punto en el número)
    const esSubpaso = proceso.numero && proceso.numero.includes(".")
    
    if (esSubpaso) {
      // Obtener el número del paso principal
      const parentNumero = proceso.numero.split(".")[0]
      const parentProcess = licitacion.formatoLiquidacion.procesos.find(p => p.numero === parentNumero || String(p.numeroPaso) === parentNumero)
      
      if (parentProcess) {
        // Buscar historial del paso principal
        const historialParent = buscarEnHistorialPorOrigen(parentProcess)
        if (historialParent) {
          return formatDate(historialParent.createdAt)
        }
      }
    }

    const historialProceso = buscarEnHistorialPorOrigen(proceso)
    return historialProceso ? formatDate(historialProceso.createdAt) : "Pendiente"
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

    // Verificar si es subpaso (tiene punto en el número)
    const esSubpaso = proceso.numero && proceso.numero.includes(".")
    
    if (esSubpaso) {
      // Obtener el número del paso principal
      const parentNumero = proceso.numero.split(".")[0]
      const parentProcess = licitacion.formatoLiquidacion.procesos.find(p => p.numero === parentNumero || String(p.numeroPaso) === parentNumero)
      
      if (parentProcess) {
        // Buscar historial del paso principal
        const historialParent = buscarEnHistorialPorDestino(parentProcess)
        if (historialParent && historialParent.usuario) {
          return `${historialParent.usuario.name} ${historialParent.usuario.lastname}`
        }
        // Si no hay historial del padre y es el paso 1, usar usuario de la licitación
        if (parentNumero === "1" && licitacion.usuario) {
          return `${licitacion.usuario.name} ${licitacion.usuario.lastname}`
        }
      }
    }

    const historialProceso = buscarEnHistorialPorDestino(proceso)
    if (historialProceso && historialProceso.usuario) {
      return `${historialProceso.usuario.name} ${historialProceso.usuario.lastname}`
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
      width: 100,
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {record.hasSubpasos && (
            <button
              onClick={() => toggleTableRowExpansion(record.key)}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "1px solid #14B8A6",
                color: "#0F766E",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: "bold"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#CCFBF1"
                e.target.style.transform = "scale(1.05)"
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "white"
                e.target.style.transform = "scale(1)"
              }}
            >
              {expandedTableRows.has(record.key) ? "–" : "+"}
            </button>
          )}
          <span>{text || "-"}</span>
        </div>
      )
    },
    {
      title: "Proceso",
      dataIndex: "tituloProceso",
      key: "tituloProceso",
      width: 250,
      render: (text) => <Text style={{ fontSize: 12 }}>{text}</Text>
    },
    {
      title: "Fecha de recepción",
      dataIndex: "fechaRecepcion",
      key: "fechaRecepcion",
      align: "center",
      width: 120,
      render: (text, record) => getFechaRecepcion(record)
    },
    {
      title: "Fecha de emisión",
      dataIndex: "fechaEmision",
      key: "fechaEmision",
      align: "center",
      width: 120,
      render: (text, record) => getFechaEmision(record)
    },
    {
      title: "Días demorados",
      dataIndex: "diasDemorados",
      key: "diasDemorados",
      align: "center",
      width: 100,
      render: (text, record) => {
        const status = getStepStatus(record, licitacion.procesoActual)
        if (status === "completed") {
          return 1
        }
        if (status === "current") {
          return calcularDiasEnProceso()
        }
        return 0
      }
    },
    {
      title: "Aprobado por",
      dataIndex: "aprobadoPor",
      key: "aprobadoPor",
      width: 150,
      render: (text, record) => getUsuarioAprobador(record)
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
      width={1100}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : licitacion ? (
        <Row gutter={24}>
          {/* Panel Izquierdo - 38% */}
          <Col span={9}>
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
                  <Text style={{ marginLeft: 8 }}>{licitacion.formatoLiquidacion.titulo}</Text>
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
              {(() => {
                const pasos = esFormatoLicitacion(licitacion.formatoLiquidacion.titulo)
                  ? FLUJO_LICITACION
                  : licitacion.formatoLiquidacion.procesos?.sort((a, b) => a.numeroPaso - b.numeroPaso) || []

                if (pasos.length === 0) {
                  return <Text type="secondary">No hay procesos disponibles</Text>
                }

                if (!esFormatoLicitacion(licitacion.formatoLiquidacion.titulo)) {
                  return (
                    <Row gutter={[8, 8]}>
                      {pasos.map((proceso) => {
                        const status = getStepStatus(proceso, licitacion.procesoActual)
                        return (
                          <Col span={12} key={proceso.id}>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 0"
                            }}>
                              {renderStepIcon(status, proceso.numeroPaso)}
                              <Text style={{ fontSize: 12 }}>{proceso.tituloProceso}</Text>
                            </div>
                          </Col>
                        )
                      })}
                    </Row>
                  )
                }

                return (
                  <Row gutter={[8, 8]}>
                    {pasos.map((paso) => {
                      const hasSubpasos = paso.subpasos && paso.subpasos.length > 0
                      const isExpanded = expandedSteps.has(paso.numero)
                      const status = getStepStatus(paso, licitacion.procesoActual)
                      return (
                        <Col span={12} key={paso.numero}>
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 0",
                                cursor: hasSubpasos ? 'pointer' : 'default',
                                backgroundColor: status === "current" ? "#E6FFFA" : "transparent",
                                padding: status === "current" ? "8px" : "0",
                                borderRadius: status === "current" ? "8px" : "0"
                              }}
                              onClick={() => hasSubpasos && toggleStepExpansion(paso.numero)}
                            >
                              {renderStepIcon(status, paso.numero)}
                              <Text 
                                style={{ 
                                  fontSize: 12,
                                  fontWeight: status === "current" ? "bold" : "normal",
                                  color: status === "current" ? "#0F766E" : "inherit"
                                }}
                              >
                                {paso.numero} {paso.nombre}
                              </Text>
                              {hasSubpasos && (
                                <span style={{ marginLeft: 4, fontSize: 10 }}>
                                  {isExpanded ? '▼' : '▶'}
                                </span>
                              )}
                            </div>
                            {hasSubpasos && isExpanded && (
                              <div style={{ marginLeft: 32, marginTop: 4, backgroundColor: '#f5f5f5', padding: 6, borderRadius: 4 }}>
                                {paso.subpasos.map((subpaso) => {
                                  const currentNumero = getProcesoActualNumero(licitacion.procesoActual?.tituloProceso || licitacion.procesoActual)
                                  const subStatus = currentNumero ? getSubStepState(subpaso.numero, currentNumero) : "pending"
                                  return (
                                    <div key={subpaso.numero} style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                                      {renderStepIcon(subStatus, subpaso.numero)}
                                      <Text 
                                        style={{ 
                                          fontSize: 11, 
                                          fontWeight: subStatus === "current" ? "bold" : "normal",
                                          color: subStatus === "current" ? "#0F766E" : "inherit"
                                        }}
                                      >
                                        {subpaso.numero} {subpaso.nombre}
                                      </Text>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </Col>
                      )
                    })}
                  </Row>
                )
              })()}
            </div>
          </Col>

          {/* Panel Derecho - 62% */}
          <Col span={15}>
            {/* Tabla Días en procesos */}
            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 16, color: "#14B8A6" }}>Días en procesos:</Title>
              <Table
                columns={diasEnProcesoColumns}
                dataSource={transformTableData()}
                pagination={false}
                size="small"
                rowKey="key"
                expandedRowKeys={Array.from(expandedTableRows)}
                onExpand={(expanded, record) => {
                  if (record.hasSubpasos) {
                    toggleTableRowExpansion(record.key)
                  }
                }}
                expandable={{
                  expandedRowRender: (record) => {
                    if (!record.hasSubpasos || !expandedTableRows.has(record.key)) {
                      return null
                    }
                    
                    return (
                      <div style={{ padding: "8px 12px 12px 42px", margin: 0 }}>
                        <div style={{
                          borderLeft: "3px solid #14B8A6",
                          background: "#F0FDFA",
                          borderRadius: 12,
                          padding: 10,
                          animation: "fadeSlideDown 0.22s ease-out"
                        }}>
                          {record.subpasos.map((subpaso, index) => {
                            const subpasoProcess = licitacion.formatoLiquidacion.procesos.find(p => p.numero === subpaso.numero)
                            const tituloProceso = subpasoProcess ? subpasoProcess.tituloProceso : `${subpaso.numero} ${subpaso.nombre}`
                            const subpasoRecord = {
                              ...subpaso,
                              tituloProceso: tituloProceso,
                              numeroPaso: subpasoProcess ? subpasoProcess.numeroPaso : undefined
                            }
                            
                            const fechaRecepcion = getFechaRecepcion(subpasoRecord)
                            const fechaEmision = getFechaEmision(subpasoRecord)
                            const diasDemorados = calcularDiasEnProceso()
                            const aprobadoPor = getUsuarioAprobador(subpasoRecord)
                            
                            return (
                              <div key={subpaso.numero} style={{
                                background: "white",
                                border: "1px solid #CCFBF1",
                                borderRadius: 10,
                                padding: "10px 12px",
                                marginBottom: index < record.subpasos.length - 1 ? 8 : 0,
                                boxShadow: "0 2px 8px rgba(15, 118, 110, 0.06)"
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                  <span style={{
                                    background: "#CCFBF1",
                                    color: "#0F766E",
                                    fontWeight: 700,
                                    fontSize: 12,
                                    borderRadius: "50%",
                                    padding: "3px 8px"
                                  }}>
                                    {subpaso.numero}
                                  </span>
                                  <span style={{ fontWeight: 600, color: "#0F172A", fontSize: 12 }}>
                                    {subpaso.nombre}
                                  </span>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", fontSize: 12, color: "#475569" }}>
                                  <span><strong style={{ color: "#0F766E" }}>Recepción:</strong> {fechaRecepcion}</span>
                                  <span><strong style={{ color: "#0F766E" }}>Emisión:</strong> {fechaEmision}</span>
                                  <span><strong style={{ color: "#0F766E" }}>Días:</strong> {diasDemorados}</span>
                                  <span><strong style={{ color: "#0F766E" }}>Aprobado por:</strong> {aprobadoPor}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  },
                  rowExpandable: (record) => record.hasSubpasos
                }}
                style={{
                  backgroundColor: "white",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #CCFBF1"
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
              <style>{`
                @keyframes fadeSlideDown {
                  from {
                    opacity: 0;
                    transform: translateY(-4px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
            </div>

            {/* Tabla Total tiempo transcurrido */}
            <div>
              <Title level={5} style={{ marginBottom: 16, color: "#268e00" }}>Total tiempo transcurrido:</Title>
              <Table
                columns={totalTiempoColumns}
                dataSource={[calcularTotalTiempo()]}
                pagination={false}
                size="small"
                rowKey="dias"
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
