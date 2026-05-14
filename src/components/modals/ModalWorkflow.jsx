"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Typography, Tag, Spin, Table, Button, Row, Col } from "antd"
import { CheckCircleFilled, ClockCircleFilled } from "@ant-design/icons"
import { getLicitacionById, getHistorialLicitacion } from "@/actions/licitaciones"
import { formatDate, formatMoney } from "@/lib/helpers"

const { Text, Title } = Typography

const ModalWorkflow = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [licitacion, setLicitacion] = useState(null)
  const [historial, setHistorial] = useState([])
  const [isExtended, setIsExtended] = useState(false)

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

  const getFechaRecepcion = (proceso) => {
    if (proceso.numeroPaso === 1) {
      return licitacion.createdAt ? formatDate(licitacion.createdAt) : "Pendiente"
    }

    const historialProceso = historial.find((h) =>
      h.tipoAccion === "avance" && h.procesoDestino === proceso.tituloProceso
    )
    return historialProceso ? formatDate(historialProceso.createdAt) : "Pendiente"
  }

  const getFechaEmision = (proceso) => {
    const status = getStepStatus(proceso, licitacion.procesoActual)

    if (status === "pending") {
      return "Pendiente"
    }

    if (status === "current") {
      const esUltimaEtapa = proceso.numeroPaso === licitacion.formatoLiquidacion.cantidadPasos
      if (esUltimaEtapa) {
        const ultimoAvance = historial.find((h) =>
          h.tipoAccion === "avance" && h.procesoDestino === proceso.tituloProceso
        )
        return ultimoAvance ? formatDate(ultimoAvance.createdAt) : "En curso"
      }
      return "En curso"
    }

    const historialProceso = historial.find((h) =>
      h.tipoAccion === "avance" && h.procesoOrigen === proceso.tituloProceso
    )
    return historialProceso ? formatDate(historialProceso.createdAt) : "Pendiente"
  }

  const getUsuarioAprobador = (proceso) => {
    if (proceso.numeroPaso === 1) {
      if (licitacion.usuario) {
        return `${licitacion.usuario.name} ${licitacion.usuario.lastname}`
      }
      return "Pendiente"
    }

    const historialProceso = historial.find((h) =>
      h.tipoAccion === "avance" && h.procesoDestino === proceso.tituloProceso
    )
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
          backgroundColor: "#268e00",
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
          backgroundColor: "white",
          border: "2px solid #268e00",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#268e00",
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
        backgroundColor: "#d9d9d9",
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
      render: (text) => text || "-"
    },
    {
      title: "Proceso",
      dataIndex: "tituloProceso",
      key: "tituloProceso",
      width: 200,
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
              {licitacion.formatoLiquidacion.procesos?.length > 0 ? (
                <Row gutter={[8, 8]}>
                  {licitacion.formatoLiquidacion.procesos
                    .sort((a, b) => a.numeroPaso - b.numeroPaso)
                    .map((proceso) => {
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
              ) : (
                <Text type="secondary">No hay procesos disponibles</Text>
              )}
            </div>
          </Col>

          {/* Panel Derecho - 62% */}
          <Col span={15}>
            {/* Tabla Días en procesos */}
            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 16, color: "#268e00" }}>Días en procesos:</Title>
              <Table
                columns={diasEnProcesoColumns}
                dataSource={licitacion.formatoLiquidacion.procesos?.sort((a, b) => a.numeroPaso - b.numeroPaso) || []}
                pagination={false}
                size="small"
                rowKey="id"
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
