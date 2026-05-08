"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Form, Input, Select, App, Skeleton } from "antd"
import { createFormatoBase, updateFormatoBase, getFormatoBaseById } from "@/actions/formato-bases"
import { CATEGORIAS_BASE } from "@/lib/helpers"

const ModalFormatoBase = forwardRef(({ onSuccess }, ref) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [baseId, setBaseId] = useState(null)

  useImperativeHandle(ref, () => ({
    open: async (id, action) => {
      setOpen(true)
      form.resetFields()

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
        }
        setLoadingData(false)
      } else {
        setIsEdit(false)
        setBaseId(null)
      }
    }
  }))

  const handleSubmit = async (values) => {
    setLoading(true)

    let result
    if (isEdit) {
      result = await updateFormatoBase(baseId, values)
    } else {
      result = await createFormatoBase(values)
    }

    if (result.success) {
      message.success(isEdit ? "Formato actualizado" : "Formato creado")
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
      title={isEdit ? "Editar Formato" : "Nuevo Formato"}
      open={open}
      onCancel={() => setOpen(false)}
      onOk={() => form.submit()}
      okText={isEdit ? "Actualizar" : "Crear"}
      cancelText="Cancelar"
      confirmLoading={loading}
      width={500}
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
        </Form>
      )}
    </Modal>
  )
})

ModalFormatoBase.displayName = "ModalFormatoBase"

export default ModalFormatoBase
