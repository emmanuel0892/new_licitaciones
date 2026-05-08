"use client"

import { useState, useImperativeHandle, forwardRef, useEffect } from "react"
import { Modal, Form, Input, Select, DatePicker, InputNumber, App, Skeleton } from "antd"
import { getLicitacionById, updateLicitacion, getRequirentes } from "@/actions/licitaciones"
import dayjs from "dayjs"

const { Option } = Select

const ModalEditarLicitacion = forwardRef(({ onSuccess }, ref) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [licitacionId, setLicitacionId] = useState(null)
  const [licitacion, setLicitacion] = useState(null)
  const [requirentes, setRequirentes] = useState([])

  useImperativeHandle(ref, () => ({
    open: async (id) => {
      setOpen(true)
      setLicitacionId(id)
      setLoadingData(true)
      form.resetFields()

      const [licitacionRes, requirentesRes] = await Promise.all([
        getLicitacionById(id),
        getRequirentes()
      ])

      if (licitacionRes.data) {
        setLicitacion(licitacionRes.data)
        form.setFieldsValue({
          numeroLicitacion: licitacionRes.data.numeroLicitacion,
          nombreLicitacion: licitacionRes.data.nombreLicitacion,
          requirente: licitacionRes.data.requirente,
          montoPresupuestado: licitacionRes.data.montoPresupuestado ? parseFloat(licitacionRes.data.montoPresupuestado) : null,
          vigencia: licitacionRes.data.vigencia ? dayjs(licitacionRes.data.vigencia) : null
        })
      }

      if (requirentesRes.data) {
        setRequirentes(requirentesRes.data.map(r => r.nombre))
      }

      setLoadingData(false)
    }
  }))

  const handleSubmit = async (values) => {
    setLoading(true)

    const data = {
      id: licitacionId,
      numeroLicitacion: values.numeroLicitacion || null,
      nombreLicitacion: values.nombreLicitacion,
      requirente: values.requirente,
      montoPresupuestado: values.montoPresupuestado ? String(values.montoPresupuestado) : null,
      vigencia: values.vigencia ? values.vigencia.format("YYYY-MM-DD") : null
    }

    const result = await updateLicitacion(data)

    if (result.success) {
      message.success("Licitación actualizada")
      setOpen(false)
      form.resetFields()
      onSuccess?.()
    } else {
      message.error(result.error || "Error al actualizar")
    }

    setLoading(false)
  }

  return (
    <Modal
      title="Editar Licitación"
      open={open}
      onCancel={() => setOpen(false)}
      onOk={() => form.submit()}
      okText="Guardar"
      cancelText="Cancelar"
      confirmLoading={loading}
      width={600}
      destroyOnHidden
    >
      {loadingData ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="numeroLicitacion"
            label="Número de Licitación"
          >
            <Input placeholder="Ej: 2024-LP-001" />
          </Form.Item>

          <Form.Item
            name="nombreLicitacion"
            label="Nombre de la Licitación"
            rules={[{ required: true, message: "Ingrese el nombre" }]}
          >
            <Input placeholder="Nombre de la licitación" />
          </Form.Item>

          <Form.Item
            name="requirente"
            label="Requirente"
            rules={[{ required: true, message: "Seleccione el requirente" }]}
          >
            <Select
              showSearch
              placeholder="Seleccione requirente"
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {requirentes.map((req) => (
                <Option key={req} value={req} label={req}>{req}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="montoPresupuestado"
            label="Monto Presupuestado"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Ingrese monto"
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            name="vigencia"
            label="Vigencia"
          >
            <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
})

ModalEditarLicitacion.displayName = "ModalEditarLicitacion"

export default ModalEditarLicitacion
