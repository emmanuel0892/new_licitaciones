"use client"

import { forwardRef, useImperativeHandle, useState } from "react"
import { Alert, App, Button, Divider, List, Modal, Space, Spin, Tag, Typography, Image } from "antd"
import { CheckCircleOutlined, ClockCircleOutlined, LockOutlined, SignatureOutlined } from "@ant-design/icons"
import { getLicitacionSignatureStatus, signLicitacionStep } from "@/actions/licitaciones"
import { formatDate } from "@/lib/helpers"

const { Text, Title } = Typography

const getStatusTag = (status) => {
  if (status === "firmada") {
    return <Tag color="success" icon={<CheckCircleOutlined />}>Firmada</Tag>
  }

  if (status === "bloqueada") {
    return <Tag color="default" icon={<LockOutlined />}>Bloqueada</Tag>
  }

  return <Tag color="warning" icon={<ClockCircleOutlined />}>Pendiente</Tag>
}

const ModalFirmarLicitacion = forwardRef(({ onSuccess, currentUserId }, ref) => {
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signingKey, setSigningKey] = useState(null)
  const [statusData, setStatusData] = useState(null)
  const [licitacionId, setLicitacionId] = useState(null)
  const [previewPdfFirma, setPreviewPdfFirma] = useState(false)
  const [firmaSeleccionada, setFirmaSeleccionada] = useState(null)

  const loadSignatureStatus = async (id) => {
    setLoading(true)
    const result = await getLicitacionSignatureStatus({ licitacionId: id })

    if (result.data) {
      setStatusData(result.data)
    } else {
      message.error(result.error || "Error al obtener firmas")
      setStatusData(null)
    }

    setLoading(false)
  }

  useImperativeHandle(ref, () => ({
    open: async (record) => {
      setOpen(true)
      setLicitacionId(record.id)
      await loadSignatureStatus(record.id)
    }
  }))

  const handleClose = () => {
    setOpen(false)
    setStatusData(null)
    setLicitacionId(null)
  }

  const handleSign = async (signature) => {
    if (!statusData?.currentUser?.firma && !statusData?.currentUser?.isSuperAdmin) {
      message.error("Debe subir su firma desde el apartado Usuarios antes de firmar.")
      return
    }

    setFirmaSeleccionada(signature)
    setPreviewPdfFirma(true)
  }

  const handleConfirmarFirma = async () => {
    if (!firmaSeleccionada || !licitacionId) return

    try {
      setSigningKey(firmaSeleccionada.key)
      const result = await signLicitacionStep({
        licitacionId,
        numeroPaso: statusData.licitacion.numeroPaso,
        firmaKey: firmaSeleccionada.key,
        currentUserId
      })

      if (result.success) {
        message.success("Firma registrada correctamente")
        setPreviewPdfFirma(false)
        setFirmaSeleccionada(null)
        await loadSignatureStatus(licitacionId)
        await onSuccess?.()
      } else {
        message.error(result.error || "Error al firmar")
      }
    } catch (error) {
      message.error(error.message || "Error al firmar")
    } finally {
      setSigningKey(null)
    }
  }

  const handleVolver = () => {
    setPreviewPdfFirma(false)
    setFirmaSeleccionada(null)
  }

  const signatures = statusData?.signatures ?? []

  return (
    <Modal
      title="Firmar etapa"
      open={open}
      onCancel={handleClose}
      width={previewPdfFirma ? 900 : 680}
      footer={previewPdfFirma ? [
        <Button key="volver" onClick={handleVolver}>
          Volver
        </Button>,
        <Button
          key="confirmar"
          type="primary"
          loading={signingKey === firmaSeleccionada?.key}
          onClick={handleConfirmarFirma}
        >
          Confirmar firma
        </Button>
      ] : [
        <Button key="close" onClick={handleClose}>
          Cerrar
        </Button>
      ]}
    >
      {loading && !statusData ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <Spin />
        </div>
      ) : previewPdfFirma ? (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Title level={5}>Documento a firmar</Title>
          <div style={{ width: "100%", height: 520, border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", background: "#f8fafc" }}>
            <iframe
              src="/documento%20de%20prueba.pdf"
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Documento de prueba"
            />
          </div>
          {statusData?.currentUser?.firma && (
            <div style={{ marginTop: 12, padding: 10, border: "1px solid #dbeafe", borderRadius: 8, background: "#f8fbff" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Firma que se aplicará</Text>
              <div style={{ marginTop: 4 }}>
                <Image
                  src={statusData.currentUser.firma}
                  alt="Firma del usuario"
                  style={{ maxWidth: 240, maxHeight: 90, objectFit: "contain", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: 6 }}
                  preview={false}
                />
              </div>
            </div>
          )}
        </Space>
      ) : (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Text type="secondary">Seleccione la firma que desea aplicar en esta etapa.</Text>

          {statusData?.licitacion && (
            <div>
              <Title level={5} style={{ marginBottom: 4 }}>
                {statusData.licitacion.nombreLicitacion}
              </Title>
              <Text type="secondary">
                Paso actual: {statusData.licitacion.procesoActual}
              </Text>
            </div>
          )}

          {!statusData?.currentUser?.hasStoredSignature && (
            <Alert
              type="warning"
              showIcon
              message="Debe subir su firma antes de firmar."
            />
          )}

          <Divider style={{ margin: "4px 0" }} />

          <div>
            <Title level={5}>Firmas requeridas</Title>
            {signatures.length === 0 ? (
              <Text type="secondary">No hay firmas requeridas para este paso.</Text>
            ) : (
              <List
                itemLayout="vertical"
                dataSource={signatures}
                renderItem={(signature) => (
                  <List.Item
                    actions={[
                      signature.canSign ? (
                        <Button
                          key="sign"
                          type="primary"
                          size="small"
                          icon={<SignatureOutlined />}
                          loading={signingKey === signature.key}
                          onClick={() => handleSign(signature)}
                        >
                          Firmar
                        </Button>
                      ) : (
                        <Text key="message" type="secondary">
                          {signature.actionMessage}
                        </Text>
                      )
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space wrap>
                          <Text strong>{signature.label}</Text>
                          {getStatusTag(signature.status)}
                        </Space>
                      }
                      description={
                        signature.status === "firmada" ? (
                          <Space direction="vertical" size={0}>
                            <Text type="secondary">Firmado por: {signature.signedBy || "Sin usuario"}</Text>
                            <Text type="secondary">Fecha: {signature.signedAt ? formatDate(signature.signedAt) : "Sin fecha"}</Text>
                          </Space>
                        ) : null
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </Space>
      )}
    </Modal>
  )
})

ModalFirmarLicitacion.displayName = "ModalFirmarLicitacion"

export default ModalFirmarLicitacion
