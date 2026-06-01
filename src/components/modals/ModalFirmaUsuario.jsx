"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Button, Space, Typography, Upload, Alert, Image, App, Divider, Popconfirm } from "antd"
import { DeleteOutlined, SaveOutlined, UploadOutlined } from "@ant-design/icons"
import { deleteUserSignature, updateUserSignature } from "@/actions/users"
import BotonFirmarWacom from "@/components/wacom/BotonFirmarWacom"

const { Text } = Typography

const ALLOWED_SIGNATURE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const MAX_SIGNATURE_SIZE_BYTES = 2 * 1024 * 1024

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = reject

    reader.readAsDataURL(file)
  })
}

const ModalFirmaUsuario = forwardRef(({ onSuccess }, ref) => {
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [preview, setPreview] = useState("")
  const [newSignature, setNewSignature] = useState("")
  const [selectedFileName, setSelectedFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [capturandoFirma, setCapturandoFirma] = useState(false)

  useImperativeHandle(ref, () => ({
    open: (selectedUser) => {
      setUser(selectedUser)
      setPreview(selectedUser?.firma || "")
      setNewSignature("")
      setSelectedFileName("")
      setOpen(true)
    }
  }))

  const handleCancel = () => {
    setOpen(false)
    setUser(null)
    setPreview("")
    setNewSignature("")
    setSelectedFileName("")
  }

  const handleBeforeUpload = async (file) => {
    if (!ALLOWED_SIGNATURE_TYPES.includes(file.type)) {
      message.error("Solo se permiten imagenes PNG, JPG, JPEG o WEBP")
      return false
    }

    if (file.size > MAX_SIGNATURE_SIZE_BYTES) {
      message.error("La firma no puede superar los 2MB")
      return false
    }

    try {
      const base64 = await fileToBase64(file)
      setNewSignature(base64)
      setPreview(base64)
      setSelectedFileName(file.name)
    } catch (error) {
      message.error("No se pudo leer la imagen seleccionada")
    }

    return false
  }

  const handleSave = async () => {
    if (!user?.id) {
      message.error("Usuario no valido")
      return
    }

    if (!newSignature) {
      message.error("Seleccione una imagen de firma")
      return
    }

    setLoading(true)
    const result = await updateUserSignature({
      userId: user.id,
      firmaBase64: newSignature
    })

    if (result.success) {
      message.success("Firma guardada correctamente")
      handleCancel()
      onSuccess?.()
    } else {
      message.error(result.error || "Error al guardar la firma")
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!user?.id) {
      message.error("Usuario no valido")
      return
    }

    setDeleting(true)
    const result = await deleteUserSignature(user.id)

    if (result.success) {
      message.success("Firma eliminada correctamente")
      handleCancel()
      onSuccess?.()
    } else {
      message.error(result.error || "Error al eliminar la firma")
    }

    setDeleting(false)
  }

  const handleFirmaCapturada = async (dataUrl) => {
    setCapturandoFirma(true)
    try {
      setNewSignature(dataUrl)
      setPreview(dataUrl)
      setSelectedFileName("firma_wacom.png")
      message.success("Firma capturada con Wacom correctamente")
    } catch (error) {
      message.error("Error al capturar la firma con Wacom")
    } finally {
      setCapturandoFirma(false)
    }
  }

  return (
    <Modal
      title="Subir firma"
      open={open}
      onCancel={handleCancel}
      width={620}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancelar
        </Button>,
        user?.firma ? (
          <Popconfirm
            key="delete"
            title="Eliminar firma"
            description="Esta accion eliminara la firma actual del usuario."
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true, loading: deleting }}
            onConfirm={handleDelete}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleting}>
              Eliminar firma
            </Button>
          </Popconfirm>
        ) : null,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          disabled={!newSignature}
          onClick={handleSave}
        >
          Guardar firma
        </Button>
      ]}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Text strong>{`${user?.name || ""} ${user?.lastname || ""}`.trim()}</Text>
          <br />
          <Text type="secondary">{user?.email}</Text>
        </div>

        <Divider style={{ margin: "4px 0" }} />

        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Text strong>Firma actual</Text>
          {user?.firma ? (
            <div style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 12 }}>
              <Image
                src={user.firma}
                alt="Firma actual"
                style={{ maxHeight: 140, objectFit: "contain" }}
              />
            </div>
          ) : (
            <Alert message="Este usuario no tiene firma registrada" type="info" showIcon />
          )}
        </Space>

        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Text strong>Nueva firma</Text>
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Upload
              accept="image/png,image/jpeg,image/jpg,image/webp"
              beforeUpload={handleBeforeUpload}
              showUploadList={false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />} disabled={capturandoFirma}>
                Seleccionar imagen
              </Button>
            </Upload>
            <Text type="secondary">o</Text>
            <BotonFirmarWacom
              nombreFirmante={`${user?.name ?? ""} ${user?.lastname ?? ""}`.trim() || "Usuario"}
              motivoFirma="Registro de firma de usuario"
              onFirmaCapturada={handleFirmaCapturada}
            />
            <Text type="secondary">Formatos permitidos: PNG, JPG, JPEG o WEBP. Maximo 2MB.</Text>
            {selectedFileName ? <Text type="secondary">Archivo: {selectedFileName}</Text> : null}
          </Space>
        </Space>

        {newSignature ? (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Text strong>Vista previa</Text>
            <div style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 12 }}>
              <Image
                src={preview}
                alt="Vista previa de firma"
                style={{ maxHeight: 140, objectFit: "contain" }}
              />
            </div>
          </Space>
        ) : null}
      </Space>
    </Modal>
  )
})

ModalFirmaUsuario.displayName = "ModalFirmaUsuario"

export default ModalFirmaUsuario
