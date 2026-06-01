"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Typography, Table, Alert, Spin, Button, Image } from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
import { getHistorialLicitacion } from "@/actions/licitaciones"
import { getHistorialFirmasLicitacion } from "@/actions/historialFirmas"
import { formatDateTime } from "@/lib/helpers"

const { Title } = Typography

const ModalHistorialNuevo = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [historial, setHistorial] = useState([])
  const [licitacion, setLicitacion] = useState(null)
  const [firmas, setFirmas] = useState([])
  const [loadingFirmas, setLoadingFirmas] = useState(false)

  useImperativeHandle(ref, () => ({
    open: async (id, licitacionData = null) => {
      setOpen(true)
      setLoading(true)
      setLoadingFirmas(true)
      if (licitacionData) {
        setLicitacion(licitacionData)
      }

      const result = await getHistorialLicitacion(id)
      if (result.data) {
        setHistorial(result.data)
      }

      const firmasResult = await getHistorialFirmasLicitacion(id)
      if (firmasResult.data) {
        setFirmas(firmasResult.data)
      }

      setLoading(false)
      setLoadingFirmas(false)
    }
  }))

  const avancesColumns = [
    {
      title: "Desde",
      dataIndex: "procesoOrigen",
      key: "procesoOrigen",
      render: (text) => text || "-"
    },
    {
      title: "Hacia",
      dataIndex: "procesoDestino",
      key: "procesoDestino",
      render: (text) => text || "-"
    },
    {
      title: "Avanzado por",
      key: "usuario",
      render: (_, record) => record.usuario ? `${record.usuario.name} ${record.usuario.lastname}` : "-"
    },
    {
      title: "Requirente",
      dataIndex: "requirente",
      key: "requirente",
      render: (text) => text || licitacion?.requirente || "-"
    },
    {
      title: "Fecha avance",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => formatDateTime(text)
    }
  ]

  const observacionesColumns = [
    {
      title: "Devuelto A",
      dataIndex: "procesoDestino",
      key: "procesoDestino",
      render: (text) => text || "-"
    },
    {
      title: "Desde",
      dataIndex: "procesoOrigen",
      key: "procesoOrigen",
      render: (text) => text || "-"
    },
    {
      title: "Motivo",
      dataIndex: "observacion",
      key: "observacion",
      render: (text) => text || "-"
    },
    {
      title: "Devuelto por",
      key: "usuario",
      render: (_, record) => record.usuario ? `${record.usuario.name} ${record.usuario.lastname}` : "-"
    },
    {
      title: "Requirente",
      dataIndex: "requirente",
      key: "requirente",
      render: (text) => text || licitacion?.requirente || "-"
    },
    {
      title: "Fecha Devolución",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => formatDateTime(text)
    }
  ]

  const modificacionesColumns = [
    {
      title: "Modificación",
      dataIndex: "observacion",
      key: "observacion",
      render: (text) => text || "-"
    },
    {
      title: "Editado por",
      key: "usuario",
      render: (_, record) => record.usuario ? `${record.usuario.name} ${record.usuario.lastname}` : "-"
    },
    {
      title: "Fecha",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => formatDateTime(text)
    }
  ]

  const firmasColumns = [
    {
      title: "Firmado por",
      dataIndex: "firmadoPor",
      key: "firmadoPor"
    },
    {
      title: "Tipo de firma",
      dataIndex: "tipoFirma",
      key: "tipoFirma"
    },
    {
      title: "Paso",
      dataIndex: "procesoNombre",
      key: "procesoNombre"
    },
    {
      title: "Fecha firma",
      dataIndex: "fechaFirma",
      key: "fechaFirma",
      render: (text) => formatDateTime(text)
    },
    {
      title: "Firma",
      dataIndex: "firmaBase64",
      key: "firmaBase64",
      render: (firmaBase64) => {
        if (!firmaBase64) return <span style={{ color: "#999" }}>Sin firma visual</span>
        return (
          <Image
            src={firmaBase64}
            alt="Firma usada"
            style={{ maxWidth: 120, maxHeight: 48, objectFit: "contain", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: 4 }}
            preview={false}
          />
        )
      }
    }
  ]

  const avancesData = historial.filter((h) => h.tipoAccion === "avance")
  const observacionesData = historial.filter((h) => h.tipoAccion === "devolucion")
  const modificacionesData = historial.filter((h) => h.tipoAccion === "edicion")

  return (
    <Modal
      title="Historial"
      open={open}
      onCancel={() => setOpen(false)}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button type="primary" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </div>
      }
      width={1000}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <div>
          <Alert
            message="Ordenadas desde la más reciente"
            type="info"
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16, backgroundColor: "#FFF7E6", borderColor: "#FFD591" }}
          />

          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ color: "#52c41a", marginBottom: 12 }}>
              Avances de etapa:
            </Title>
            {avancesData.length > 0 ? (
              <Table
                columns={avancesColumns}
                dataSource={avancesData}
                pagination={false}
                size="small"
                rowKey="id"
                style={{
                  backgroundColor: "#f6ffed",
                  borderRadius: 4
                }}
                headerStyle={{
                  backgroundColor: "#f6ffed",
                  color: "#52c41a"
                }}
              />
            ) : (
              <div style={{ padding: 16, textAlign: "center", color: "#999" }}>
                No existen avances registrados.
              </div>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ color: "#52c41a", marginBottom: 12 }}>
              Firmas:
            </Title>
            {loadingFirmas ? (
              <div style={{ textAlign: "center", padding: 16 }}>
                <Spin size="small" />
              </div>
            ) : firmas.length > 0 ? (
              <Table
                columns={firmasColumns}
                dataSource={firmas}
                pagination={false}
                size="small"
                rowKey="id"
                scroll={{ x: 1000 }}
                style={{
                  backgroundColor: "#f6ffed",
                  borderRadius: 4
                }}
              />
            ) : (
              <div style={{ padding: 16, textAlign: "center", color: "#999" }}>
                No existen firmas registradas.
              </div>
            )}
          </div>

          <div>
            <Title level={5} style={{ color: "#52c41a", marginBottom: 12 }}>
              Modificaciones:
            </Title>
            <div style={{ marginBottom: 8, color: "#666", fontSize: 12 }}>
              (Dato Antiguo) » (Dato Nuevo)
            </div>
            {modificacionesData.length > 0 ? (
              <Table
                columns={modificacionesColumns}
                dataSource={modificacionesData}
                pagination={false}
                size="small"
                rowKey="id"
                style={{
                  backgroundColor: "#f6ffed",
                  borderRadius: 4
                }}
              />
            ) : (
              <div style={{ padding: 16, textAlign: "center", color: "#999" }}>
                No existen modificaciones registradas.
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
})

ModalHistorialNuevo.displayName = "ModalHistorialNuevo"

export default ModalHistorialNuevo
