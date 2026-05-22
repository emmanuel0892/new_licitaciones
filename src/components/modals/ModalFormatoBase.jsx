"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Form, Input, Select, App, Skeleton, Upload, Button } from "antd"
import { UploadOutlined, FilePdfOutlined, FileWordOutlined } from "@ant-design/icons"
import { createFormatoBase, updateFormatoBase, getFormatoBaseById } from "@/actions/formato-bases"
import { CATEGORIAS_BASE } from "@/lib/helpers"

const ModalFormatoBase = forwardRef(({ onSuccess }, ref) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [baseId, setBaseId] = useState(null)
  const [fileList, setFileList] = useState([])
  const [uploadedFile, setUploadedFile] = useState(null)

  useImperativeHandle(ref, () => ({
    open: async (id, action) => {
      setOpen(true)
      form.resetFields()
      setFileList([])
      setUploadedFile(null)

      if (action === "edit" && id) {
        setIsEdit(true)
        setBaseId(id)
        setLoadingData(true)

        const result = await getFormatoBaseById(id)
        if (result.data) {
          form.setFieldsValue({
            titulo: result.data.titulo,
            tipoBase: result.data.tipoBase
          })
          if (result.data.rutaArchivo) {
            setUploadedFile({
              name: result.data.nombreArchivo,
              url: result.data.rutaArchivo
            })
          }
        }
        setLoadingData(false)
      } else {
        setIsEdit(false)
        setBaseId(null)
      }
    }
  }))

  const handleUpload = async (file) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      setUploading(true)
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        message.error(result.error || "Error al subir el archivo")
        return false
      }

      setUploadedFile({
        name: result.fileName,
        url: result.filePath
      })
      message.success("Archivo subido correctamente")
      return false
    } catch (error) {
      message.error("Error al subir el archivo")
      return false
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setFileList([])
  }

  const getFileIcon = (fileName) => {
    if (fileName?.toLowerCase().endsWith(".pdf")) {
      return <FilePdfOutlined style={{ color: "#f5222d", fontSize: 24 }} />
    }
    return <FileWordOutlined style={{ color: "#1890ff", fontSize: 24 }} />
  }

  const handleSubmit = async (values) => {
    setLoading(true)

    const data = {
      ...values,
      nombreArchivo: uploadedFile?.name || null,
      rutaArchivo: uploadedFile?.url || null
    }

    let result
    if (isEdit) {
      result = await updateFormatoBase(baseId, data)
    } else {
      result = await createFormatoBase(data)
    }

    if (result.success) {
      message.success(isEdit ? "Formato actualizado" : "Formato creado")
      setOpen(false)
      form.resetFields()
      setFileList([])
      setUploadedFile(null)
      onSuccess?.()
    } else {
      message.error(result.error || "Error al guardar")
    }

    setLoading(false)
  }

  return (
    <Modal
      title={isEdit ? "Editar Formato" : "Nuevo Formato"}
      open={open}
      onCancel={() => setOpen(false)}
      onOk={() => form.submit()}
      okText={isEdit ? "Actualizar" : "Crear"}
      cancelText="Cancelar"
      confirmLoading={loading}
      width={600}
      destroyOnHidden
    >
      {loadingData ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="titulo"
            label="Título"
            rules={[{ required: true, message: "Ingrese el título" }]}
          >
            <Input placeholder="Título del formato" />
          </Form.Item>

          <Form.Item
            name="tipoBase"
            label="Categoría"
            rules={[{ required: true, message: "Seleccione una categoría" }]}
          >
            <Select placeholder="Seleccione categoría" options={CATEGORIAS_BASE} />
          </Form.Item>

          <Form.Item label="Archivo (PDF o Word)">
            {!uploadedFile ? (
              <Upload
                fileList={fileList}
                beforeUpload={handleUpload}
                onRemove={() => setFileList([])}
                onChange={({ fileList }) => setFileList(fileList)}
                accept=".pdf,.doc,.docx"
                maxCount={1}
                disabled={uploading}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  Subir Archivo
                </Button>
              </Upload>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", border: "1px solid #d9d9d9", borderRadius: "6px" }}>
                {getFileIcon(uploadedFile.name)}
                <span style={{ flex: 1 }}>{uploadedFile.name}</span>
                <Button type="link" danger onClick={handleRemoveFile}>
                  Eliminar
                </Button>
              </div>
            )}
            <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
              Máximo 10MB. Formatos: PDF, DOC, DOCX
            </div>
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
})

ModalFormatoBase.displayName = "ModalFormatoBase"

export default ModalFormatoBase
