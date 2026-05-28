"use client"

import { useEffect, useState } from "react"
import { App, Button, Form, Input, Modal, Space } from "antd"
import { updateCodigoMercadoPublico } from "@/actions/mercadoPublicoCodigo"

const ModalEditarCodigoMercadoPublico = ({ open, licitacion, onCancel, onSuccess }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    form.setFieldsValue({
      codigoMercadoPublico: licitacion?.codigoMercadoPublico ?? licitacion?.numeroLicitacion ?? ""
    })
  }, [form, licitacion, open])

  const handleSave = async () => {
    const values = await form.validateFields()

    setSaving(true)

    const result = await updateCodigoMercadoPublico({
      licitacionId: licitacion.id,
      codigoMercadoPublico: values.codigoMercadoPublico
    })

    setSaving(false)

    if (!result.success) {
      message.error(result.error || "No se pudo guardar el codigo Mercado Publico.")
      return
    }

    if (result.warning) {
      message.warning(result.warning)
    } else {
      message.success("Codigo y monto Mercado Publico actualizados correctamente.")
    }

    form.resetFields()
    onSuccess(licitacion, result.data)
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="Editar codigo Mercado Publico"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item
          label="Codigo Mercado Publico"
          name="codigoMercadoPublico"
          rules={[
            { required: true, whitespace: true, message: "Ingrese el codigo Mercado Publico." },
            { max: 50, message: "El codigo no puede superar 50 caracteres." }
          ]}
        >
          <Input
            placeholder="Ej: 2080-148-LE25"
            maxLength={50}
            onChange={(event) => {
              form.setFieldValue("codigoMercadoPublico", event.target.value.toUpperCase())
            }}
          />
        </Form.Item>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={handleCancel}>Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            Guardar y consultar
          </Button>
        </Space>
      </Form>
    </Modal>
  )
}

export default ModalEditarCodigoMercadoPublico
