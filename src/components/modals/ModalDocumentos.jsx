"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Alert, Modal, Upload, Button, List, Typography, App, Spin, Empty, Space, Tag } from "antd"
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
  const [documentContext, setDocumentContext] = useState(null)
  const [modalOptions, setModalOptions] = useState({
    title: "Documentos de la Licitacion",
    uploadButtonText: "Subir Documento",
    emptyDescription: "No hay documentos adjuntos",
    tipoDocumento: null
  })

  const loadDocumentos = async (id, options = {}) => {
    setLoading(true)
    const result = await getDocumentosLicitacion(id, {
      tipoDocumento: options.tipoDocumento ?? null
    })

    if (result.data) {
      setDocumentos(result.data)
      setDocumentContext(result.context)
    } else {
      setDocumentos([])
      message.error(result.error || "No se pudieron obtener los documentos")
    }

    setLoading(false)
  }

  useImperativeHandle(ref, () => ({
    open: async (licitacion, allowUpload = false, options = {}) => {
      const id = typeof licitacion === "object" ? licitacion.id : licitacion

      setOpen(true)
      setLicitacionId(id)
      setCanUpload(allowUpload)
      setDocumentos([])
      setDocumentContext(null)
      setModalOptions({
        title: options.title ?? "Documentos de la Licitacion",
        uploadButtonText: options.uploadButtonText ?? "Subir Documento",
        emptyDescription: options.emptyDescription ?? "No hay documentos adjuntos",
        tipoDocumento: options.tipoDocumento ?? null
      })
      await loadDocumentos(id, options)
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

    if (modalOptions.tipoDocumento) {
      formData.append("tipoDocumento", modalOptions.tipoDocumento)
    }

    const result = await uploadDocumento(formData)

    if (result.success) {
      message.success("Documento subido correctamente")
      await loadDocumentos(licitacionId, modalOptions)
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
      await loadDocumentos(licitacionId, modalOptions)
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
      title={modalOptions.title}
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={820}
      destroyOnHidden
    >
      {documentContext && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Nro. Licitacion actual: ${documentContext.numeroLicitacion}`}
          description={`Proceso actual: Paso ${documentContext.numeroPaso ?? "-"} - ${documentContext.procesoNombre}`}
        />
      )}

      {canUpload && (
        <Upload
          customRequest={customRequest}
          onChange={handleUpload}
          showUploadList={false}
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        >
          <Button
            icon={<UploadOutlined />}
            loading={uploading}
            style={{ marginBottom: 16 }}
          >
            {modalOptions.uploadButtonText}
          </Button>
        </Upload>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : documentos.length === 0 ? (
        <Empty description={modalOptions.emptyDescription} />
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
                  href={`/api/documentos/${doc.id}/download`}
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
                title={doc.nombreOriginal || doc.nombreArchivo}
                description={
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Nro. Licitacion: {doc.numeroLicitacion}
                    </Text>
                    <Space size={6}>
                      <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                        Paso {doc.numeroPaso ?? "-"}
                      </Tag>
                      {doc.tipoDocumento === "certificado_trato_directo" && (
                        <Tag color="gold" style={{ marginInlineEnd: 0 }}>
                          Certificado
                        </Tag>
                      )}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {doc.procesoNombre || "Sin proceso"}
                      </Text>
                    </Space>
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
