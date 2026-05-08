"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Timeline, Typography, Tag, Spin, Descriptions, Divider } from "antd"
import { CheckCircleFilled, ClockCircleFilled, MinusCircleFilled } from "@ant-design/icons"
import { getLicitacionById } from "@/actions/licitaciones"
import { formatDate, formatMoney } from "@/lib/helpers"

const { Text, Title } = Typography

const ModalWorkflow = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [licitacion, setLicitacion] = useState(null)
  const [isExtended, setIsExtended] = useState(false)

  useImperativeHandle(ref, () => ({
    open: async (id, extended = false) => {
      setOpen(true)
      setLoading(true)
      setIsExtended(extended)

      const result = await getLicitacionById(id)
      if (result.data) {
        setLicitacion(result.data)
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

  const getStepColor = (status) => {
    switch (status) {
      case "completed":
        return "#268e00"
      case "current":
        return "#23aeaa"
      default:
        return "#d9d9d9"
    }
  }

  const getStepIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleFilled style={{ color: "#268e00" }} />
      case "current":
        return <ClockCircleFilled style={{ color: "#23aeaa" }} />
      default:
        return <MinusCircleFilled style={{ color: "#d9d9d9" }} />
    }
  }

  const calcularDiasEnProceso = () => {
    if (!licitacion?.fechaRecepcion) return 0
    const fechaRecepcion = new Date(licitacion.fechaRecepcion)
    const hoy = new Date()
    const diffTime = Math.abs(hoy - fechaRecepcion)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <Modal
      title={isExtended ? "Flujo de Trabajo (Extendido)" : "Flujo de Trabajo"}
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={isExtended ? 800 : 700}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : licitacion ? (
        <>
          <Descriptions column={2} size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="N° Licitación">
              {licitacion.numeroLicitacion || "Sin número"}
            </Descriptions.Item>
            <Descriptions.Item label="Formato">
              {licitacion.formatoLiquidacion.titulo}
            </Descriptions.Item>
            <Descriptions.Item label="Nombre" span={2}>
              {licitacion.nombreLicitacion}
            </Descriptions.Item>
            <Descriptions.Item label="Requirente">
              {licitacion.requirente}
            </Descriptions.Item>
            <Descriptions.Item label="Creador">
              {licitacion.usuario.name} {licitacion.usuario.lastname}
            </Descriptions.Item>
            <Descriptions.Item label="Monto">
              {formatMoney(licitacion.montoPresupuestado)}
            </Descriptions.Item>
            <Descriptions.Item label="Vigencia">
              {licitacion.vigencia ? formatDate(licitacion.vigencia) : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag color={
                licitacion.estado === "Finalizada" ? "#268e00" :
                licitacion.estado === "Devuelto" ? "#e53935" : "#e5be01"
              }>
                {licitacion.estado}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Fecha Creación">
              {formatDate(licitacion.createdAt)}
            </Descriptions.Item>

            {/* Información extendida para Super Admin */}
            {isExtended && (
              <>
                <Descriptions.Item label="Devoluciones">
                  <Tag color={licitacion.contadorDevoluciones > 0 ? "#e53935" : "#d9d9d9"}>
                    {licitacion.contadorDevoluciones}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ediciones">
                  <Tag color={licitacion.contadorEdiciones > 0 ? "#faad14" : "#d9d9d9"}>
                    {licitacion.contadorEdiciones}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Días en proceso actual">
                  <Tag color={calcularDiasEnProceso() > (licitacion.procesoActual?.diasSugeridos || 5) ? "#e53935" : "#52c41a"}>
                    {calcularDiasEnProceso()} días
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Días sugeridos">
                  {licitacion.procesoActual?.diasSugeridos || "-"} días
                </Descriptions.Item>
                <Descriptions.Item label="Documentos adjuntos">
                  {licitacion._count?.documentos || licitacion.documentos?.length || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Fecha recepción proceso">
                  {licitacion.fechaRecepcion ? formatDate(licitacion.fechaRecepcion) : "-"}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>

          <Divider />

          <Title level={5} style={{ marginBottom: 16 }}>Procesos</Title>

          {licitacion.formatoLiquidacion.procesos?.length > 0 ? (
            <Timeline
              items={licitacion.formatoLiquidacion.procesos
                .sort((a, b) => a.numeroPaso - b.numeroPaso)
                .map((proceso) => {
                  const status = getStepStatus(proceso, licitacion.procesoActual)
                  return {
                    color: getStepColor(status),
                    dot: getStepIcon(status),
                    label: null,
                    content: (
                      <div style={{
                        padding: "8px 12px",
                        background: status === "current" ? "rgba(35, 174, 170, 0.1)" : "transparent",
                        borderRadius: 8,
                        marginBottom: 4
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <Text strong={status === "current"}>
                              {proceso.numeroPaso}. {proceso.tituloProceso}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Turno: {proceso.turno}
                            </Text>
                          </div>
                          {status === "current" && (
                            <Tag color="#23aeaa">Actual</Tag>
                          )}
                          {status === "completed" && (
                            <Tag color="#268e00">Completado</Tag>
                          )}
                        </div>
                      </div>
                    )
                  }
                })}
            />
          ) : (
            <Text type="secondary">No hay procesos disponibles</Text>
          )}
        </>
      ) : null}
    </Modal>
  )
})

ModalWorkflow.displayName = "ModalWorkflow"

export default ModalWorkflow
