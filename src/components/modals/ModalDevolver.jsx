"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Form, Input, App, Typography } from "antd"
import { devolverLicitacion } from "@/actions/licitaciones"

const { TextArea } = Input
const { Text } = Typography

const ModalDevolver = forwardRef(({ onSuccess }, ref) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [licitacionId, setLicitacionId] = useState(null)

  useImperativeHandle(ref, () => ({
    open: (id) => {
      setLicitacionId(id)
      setOpen(true)
      form.resetFields()
    }
  }))

  const handleSubmit = async (values) => {
    setLoading(true)

    const result = await devolverLicitacion({
      licitacionId: licitacionId,
      observacion: values.observacion
    })

    if (result.success) {
      message.success("Licitación devuelta correctamente")
      setOpen(false)
      form.resetFields()
      onSuccess?.()
    } else {
      message.error(result.error || "Error al devolver la licitación")
    }

    setLoading(false)
  }

  return (
    <Modal
      title="Devolver Licitación"
      open={open}
      onCancel={() => setOpen(false)}
      onOk={() => form.submit()}
      okText="Devolver"
      okButtonProps={{ danger: true }}
      cancelText="Cancelar"
      confirmLoading={loading}
      width={500}
      destroyOnHidden
    >
      <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        Ingrese el motivo por el cual desea devolver esta licitación al proceso anterior.
      </Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="observacion"
          label="Motivo de Devolución"
          rules={[
            { required: true, message: "Ingrese el motivo" },
            { min: 10, message: "El motivo debe tener al menos 10 caracteres" }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Describa el motivo de la devolución..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
})

ModalDevolver.displayName = "ModalDevolver"

export default ModalDevolver
