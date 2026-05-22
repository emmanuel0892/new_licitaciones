"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Timeline, Typography, Tag, Empty, Spin } from "antd"
import { ArrowUpOutlined, ArrowDownOutlined, EditOutlined } from "@ant-design/icons"
import { getHistorialLicitacion } from "@/actions/licitaciones"
import { formatDateTime } from "@/lib/helpers"

const { Text, Paragraph } = Typography

const ModalHistorial = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [historial, setHistorial] = useState([])

  useImperativeHandle(ref, () => ({
    open: async (id) => {
      setOpen(true)
      setLoading(true)

      const result = await getHistorialLicitacion(id)
      if (result.data) {
        setHistorial(result.data)
      }

      setLoading(false)
    }
  }))

  const getIcon = (tipo) => {
    switch (tipo) {
      case "avance":
        return <ArrowUpOutlined style={{ color: "#268e00" }} />
      case "devolucion":
        return <ArrowDownOutlined style={{ color: "#e53935" }} />
      case "edicion":
        return <EditOutlined style={{ color: "#23aeaa" }} />
      default:
        return null
    }
  }

  const getColor = (tipo) => {
    switch (tipo) {
      case "avance":
        return "#268e00"
      case "devolucion":
        return "#e53935"
      case "edicion":
        return "#23aeaa"
      default:
        return "#6B7280"
    }
  }

  const getLabel = (tipo) => {
    switch (tipo) {
      case "avance":
        return "Avance"
      case "devolucion":
        return "Devolución"
      case "edicion":
        return "Edición"
      default:
        return tipo
    }
  }

  return (
    <Modal
      title="Historial de la Licitación"
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={600}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : historial.length === 0 ? (
        <Empty description="No hay historial disponible" />
      ) : (
        <Timeline
          mode="left"
          items={historial.map((item) => ({
            color: getColor(item.tipoAccion),
            dot: getIcon(item.tipoAccion),
            children: (
              <div style={{ paddingBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Tag color={getColor(item.tipoAccion)}>{getLabel(item.tipoAccion)}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDateTime(item.createdAt)}
                  </Text>
                </div>

                <Text strong style={{ display: "block", marginBottom: 4 }}>
                  {item.usuario.name} {item.usuario.lastname}
                </Text>

                {item.procesoOrigen && item.procesoDestino && (
                  <Text type="secondary" style={{ display: "block", fontSize: 13 }}>
                    {item.procesoOrigen} → {item.procesoDestino}
                  </Text>
                )}

                {item.observacion && (
                  <Paragraph
                    style={{
                      marginTop: 8,
                      padding: 12,
                      background: "#f8fafa",
                      borderRadius: 8,
                      marginBottom: 0
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>Observación:</Text>
                    <br />
                    {item.observacion}
                  </Paragraph>
                )}
              </div>
            )
          }))}
        />
      )}
    </Modal>
  )
})

ModalHistorial.displayName = "ModalHistorial"

export default ModalHistorial
