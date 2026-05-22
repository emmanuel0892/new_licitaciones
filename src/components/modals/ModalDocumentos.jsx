"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Upload, Button, List, Typography, App, Spin, Empty, Space } from "antd"
import { UploadOutlined, FileTextOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons"
import { getDocumentosLicitacion, uploadDocumento, deleteDocumento } from "@/actions/documentos"
import { formatDate } from "@/lib/helpers"

const { Text } = Typography

const ModalDocumentos = forwardRef(({ onSuccess }, ref) => {
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [documentos, setDocumentos] = useState([])
  const [licitacionId, setLicitacionId] = useState(null)
  const [canUpload, setCanUpload] = useState(false)

  const loadDocumentos = async (id) => {
    setLoading(true)
    const result = await getDocumentosLicitacion(id)
    if (result.data) {
      setDocumentos(result.data)
    }
    setLoading(false)
  }

  useImperativeHandle(ref, () => ({
    open: async (id, allowUpload = false) => {
      setOpen(true)
      setLicitacionId(id)
      setCanUpload(allowUpload)
      await loadDocumentos(id)
    }
  }))

  const handleUpload = async (info) => {
    const { file } = info

    if (file.status === "uploading") {
      setUploading(true)
      return
    }

    const formData = new FormData()
    formData.append("file", file.originFileObj || file)
    formData.append("licitacionId", licitacionId)

    const result = await uploadDocumento(formData)

    if (result.success) {
      message.success("Documento subido correctamente")
      await loadDocumentos(licitacionId)
      onSuccess?.()
    } else {
      message.error(result.error || "Error al subir documento")
    }

    setUploading(false)
  }

  const handleDelete = async (documentoId) => {
    const result = await deleteDocumento(documentoId)
    if (result.success) {
      message.success("Documento eliminado")
      await loadDocumentos(licitacionId)
      onSuccess?.()
    } else {
      message.error(result.error || "Error al eliminar")
    }
  }

  const customRequest = ({ file, onSuccess: onUploadSuccess }) => {
    setTimeout(() => {
      onUploadSuccess("ok")
    }, 0)
  }

  return (
    <Modal
      title="Documentos de la Licitación"
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={600}
      destroyOnHidden
    >
      {canUpload && (
        <Upload
          customRequest={customRequest}
          onChange={handleUpload}
          showUploadList={false}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        >
          <Button
            icon={<UploadOutlined />}
            loading={uploading}
            style={{ marginBottom: 16 }}
          >
            Subir Documento
          </Button>
        </Upload>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : documentos.length === 0 ? (
        <Empty description="No hay documentos adjuntos" />
      ) : (
        <List
          dataSource={documentos}
          renderItem={(doc) => (
            <List.Item
              actions={[
                <Button
                  key="download"
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  href={doc.rutaArchivo}
                  target="_blank"
                >
                  Descargar
                </Button>,
                canUpload && (
                  <Button
                    key="delete"
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(doc.id)}
                  >
                    Eliminar
                  </Button>
                )
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={<FileTextOutlined style={{ fontSize: 24, color: "#23aeaa" }} />}
                title={doc.nombreArchivo}
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Subido por: {doc.usuario.name} {doc.usuario.lastname}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Fecha: {formatDate(doc.createdAt)}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  )
})

ModalDocumentos.displayName = "ModalDocumentos"

export default ModalDocumentos
