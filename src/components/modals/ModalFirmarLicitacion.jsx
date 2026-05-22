"use client"

import { forwardRef, useImperativeHandle, useState } from "react"
import { Alert, App, Button, Divider, List, Modal, Space, Spin, Tag, Typography } from "antd"
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
    if (!licitacionId || !statusData?.licitacion?.numeroPaso) return

    setSigningKey(signature.key)
    const result = await signLicitacionStep({
      licitacionId,
      numeroPaso: statusData.licitacion.numeroPaso,
      firmaKey: signature.key,
      currentUserId
    })

    if (result.success) {
      message.success("Firma registrada correctamente")
      await loadSignatureStatus(licitacionId)
      await onSuccess?.()
    } else {
      message.error(result.error || "Error al firmar")
    }

    setSigningKey(null)
  }

  const signatures = statusData?.signatures ?? []

  return (
    <Modal
      title="Firmar etapa"
      open={open}
      onCancel={handleClose}
      width={680}
      footer={[
        <Button key="close" onClick={handleClose}>
          Cerrar
        </Button>
      ]}
    >
      {loading && !statusData ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <Spin />
        </div>
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
