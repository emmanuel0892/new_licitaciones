"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Form, Input, App, Skeleton } from "antd"
import { createNovedad, updateNovedad, getNovedadById } from "@/actions/novedades"

const { TextArea } = Input

const ModalNovedad = forwardRef(({ onSuccess }, ref) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [novedadId, setNovedadId] = useState(null)

  useImperativeHandle(ref, () => ({
    open: async (id, action) => {
      setOpen(true)
      form.resetFields()

      if (action === "edit" && id) {
        setIsEdit(true)
        setNovedadId(id)
        setLoadingData(true)

        const result = await getNovedadById(id)
        if (result.data) {
          form.setFieldsValue({
            titular: result.data.titular,
            descripcion: result.data.descripcion
          })
        }
        setLoadingData(false)
      } else {
        setIsEdit(false)
        setNovedadId(null)
      }
    }
  }))

  const handleSubmit = async (values) => {
    setLoading(true)

    let result
    if (isEdit) {
      result = await updateNovedad(novedadId, values)
    } else {
      result = await createNovedad(values)
    }

    if (result.success) {
      message.success(isEdit ? "Novedad actualizada" : "Novedad creada")
      setOpen(false)
      form.resetFields()
      onSuccess?.()
    } else {
      message.error(result.error || "Error al guardar")
    }

    setLoading(false)
  }

  return (
    <Modal
      title={isEdit ? "Editar Novedad" : "Nueva Novedad"}
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
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="titular"
            label="Titular"
            rules={[{ required: true, message: "Ingrese el titular" }]}
          >
            <Input placeholder="Título de la novedad" />
          </Form.Item>

          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[{ required: true, message: "Ingrese la descripción" }]}
          >
            <TextArea rows={6} placeholder="Contenido de la novedad..." showCount maxLength={2000} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
})

ModalNovedad.displayName = "ModalNovedad"

export default ModalNovedad
