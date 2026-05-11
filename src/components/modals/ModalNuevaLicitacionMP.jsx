"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { 
  Modal, Form, Input, InputNumber, Select, Button, Space, 
  Divider, Table, App, Tabs
} from "antd"
import { PlusOutlined, DeleteOutlined, SyncOutlined } from "@ant-design/icons"
import { createLicitacionMPManual, syncLicitacionMP } from "@/actions/mercadoPublico"
import { getRequirentes } from "@/actions/licitaciones"

const ModalNuevaLicitacionMP = forwardRef(({ onSuccess }, ref) => {
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [form] = Form.useForm()
  const [syncForm] = Form.useForm()
  const [items, setItems] = useState([])
  const [requirentes, setRequirentes] = useState([])
  const [activeTab, setActiveTab] = useState("manual")

  useImperativeHandle(ref, () => ({
    open: async () => {
      setOpen(true)
      const result = await getRequirentes()
      if (result.data) {
        setRequirentes(result.data.map(r => r.nombre))
      }
    }
  }))

  const handleClose = () => {
    setOpen(false)
    form.resetFields()
    syncForm.resetFields()
    setItems([])
    setActiveTab("manual")
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        key: Date.now(),
        correlativo: items.length + 1,
        nombreProducto: "",
        descripcion: "",
        unidadMedida: "Unidad",
        cantidadTotal: 0,
        montoUnitario: 0,
        nombreProveedor: ""
      }
    ])
  }

  const handleRemoveItem = (key) => {
    const newItems = items.filter(item => item.key !== key)
    setItems(newItems.map((item, index) => ({ ...item, correlativo: index + 1 })))
  }

  const handleItemChange = (key, field, value) => {
    setItems(items.map(item => 
      item.key === key ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmitManual = async (values) => {
    if (items.length === 0) {
      message.warning("Debe agregar al menos un item")
      return
    }

    setLoading(true)

    const montoAdjudicado = items.reduce(
      (acc, item) => acc + (item.cantidadTotal * item.montoUnitario), 
      0
    )

    const result = await createLicitacionMPManual({
      ...values,
      montoAdjudicado,
      items: items.map(item => ({
        correlativo: item.correlativo,
        nombreProducto: item.nombreProducto,
        descripcion: item.descripcion,
        unidadMedida: item.unidadMedida,
        cantidadTotal: item.cantidadTotal,
        montoUnitario: item.montoUnitario,
        nombreProveedor: item.nombreProveedor
      }))
    })

    if (result.success) {
      message.success("Licitación creada correctamente")
      handleClose()
      onSuccess?.()
    } else {
      message.error(result.error)
    }

    setLoading(false)
  }

  const handleSyncFromAPI = async (values) => {
    setSyncing(true)
    const result = await syncLicitacionMP(values.codigoLicitacion, values.requirente)
    
    if (result.success) {
      message.success("Licitación sincronizada correctamente")
      handleClose()
      onSuccess?.()
    } else {
      message.error(result.error)
    }
    
    setSyncing(false)
  }

  const itemColumns = [
    {
      title: "#",
      dataIndex: "correlativo",
      width: 50,
      align: "center"
    },
    {
      title: "Producto",
      dataIndex: "nombreProducto",
      render: (_, record) => (
        <Input
          value={record.nombreProducto}
          onChange={(e) => handleItemChange(record.key, "nombreProducto", e.target.value)}
          placeholder="Nombre del producto"
        />
      )
    },
    {
      title: "Cantidad",
      dataIndex: "cantidadTotal",
      width: 120,
      render: (_, record) => (
        <InputNumber
          value={record.cantidadTotal}
          onChange={(value) => handleItemChange(record.key, "cantidadTotal", value)}
          min={0}
          style={{ width: "100%" }}
        />
      )
    },
    {
      title: "P. Unitario",
      dataIndex: "montoUnitario",
      width: 140,
      render: (_, record) => (
        <InputNumber
          value={record.montoUnitario}
          onChange={(value) => handleItemChange(record.key, "montoUnitario", value)}
          min={0}
          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
          parser={(value) => value.replace(/\$\s?|(\.*)/g, "")}
          style={{ width: "100%" }}
        />
      )
    },
    {
      title: "Proveedor",
      dataIndex: "nombreProveedor",
      width: 180,
      render: (_, record) => (
        <Input
          value={record.nombreProveedor}
          onChange={(e) => handleItemChange(record.key, "nombreProveedor", e.target.value)}
          placeholder="Nombre proveedor"
        />
      )
    },
    {
      title: "",
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.key)}
        />
      )
    }
  ]

  const calcularTotal = () => {
    return items.reduce((acc, item) => acc + (item.cantidadTotal * item.montoUnitario), 0)
  }

  const tabItems = [
    {
      key: "manual",
      label: "Ingreso Manual",
      children: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitManual}
        >
          <Form.Item
            name="codigoExterno"
            label="Código Licitación"
            rules={[{ required: true, message: "Ingrese el código" }]}
          >
            <Input placeholder="Ej: 2080-262-LP25" />
          </Form.Item>

          <Form.Item
            name="nombre"
            label="Nombre de la Licitación"
            rules={[{ required: true, message: "Ingrese el nombre" }]}
          >
            <Input placeholder="Nombre descriptivo" />
          </Form.Item>

          <Form.Item
            name="requirente"
            label="Requirente/Servicio"
            rules={[{ required: true, message: "Seleccione el requirente" }]}
          >
            <Select
              showSearch
              allowClear
              placeholder="Seleccione o escriba el requirente"
              options={requirentes.map(r => ({ value: r, label: r }))}
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Space style={{ width: "100%" }}>
            <Form.Item
              name="tipo"
              label="Tipo"
              initialValue="LQ"
              style={{ width: 120 }}
            >
              <Select
                options={[
                  { value: "LQ", label: "LQ" },
                  { value: "LP", label: "LP" },
                  { value: "LE", label: "LE" },
                  { value: "SE", label: "SE" },
                  { value: "CM", label: "CM" }
                ]}
              />
            </Form.Item>

            <Form.Item
              name="vigenciaMeses"
              label="Vigencia (meses)"
              style={{ width: 150 }}
            >
              <InputNumber min={1} max={48} style={{ width: "100%" }} />
            </Form.Item>
          </Space>

          <Divider>Items de la Licitación</Divider>

          <Button
            type="dashed"
            onClick={handleAddItem}
            block
            icon={<PlusOutlined />}
            style={{ marginBottom: 16 }}
          >
            Agregar Item
          </Button>

          <Table
            dataSource={items}
            columns={itemColumns}
            rowKey="key"
            size="small"
            pagination={false}
            scroll={{ y: 200 }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3} align="right">
                    <strong>Total Adjudicado:</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} colSpan={3}>
                    <strong style={{ color: "#23aeaa" }}>
                      $ {calcularTotal().toLocaleString("es-CL")}
                    </strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />

          <div style={{ marginTop: 24, textAlign: "right" }}>
            <Space>
              <Button onClick={handleClose}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Crear Licitación
              </Button>
            </Space>
          </div>
        </Form>
      )
    },
    {
      key: "sync",
      label: "Sincronizar desde API",
      children: (
        <Form
          form={syncForm}
          layout="vertical"
          onFinish={handleSyncFromAPI}
        >
          <Form.Item
            name="codigoLicitacion"
            label="Código de Licitación"
            rules={[{ required: true, message: "Ingrese el código" }]}
            extra="Ingrese el código completo de la licitación en Mercado Público"
          >
            <Input placeholder="Ej: 2080-262-LP25" />
          </Form.Item>

          <Form.Item
            name="requirente"
            label="Requirente/Servicio"
            rules={[{ required: true, message: "Seleccione el requirente" }]}
            extra="Servicio al que pertenece esta licitación"
          >
            <Select
              showSearch
              allowClear
              placeholder="Seleccione o escriba el requirente"
              options={requirentes.map(r => ({ value: r, label: r }))}
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <div style={{ marginTop: 24, textAlign: "right" }}>
            <Space>
              <Button onClick={handleClose}>Cancelar</Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={syncing}
                icon={<SyncOutlined />}
              >
                Sincronizar
              </Button>
            </Space>
          </div>
        </Form>
      )
    }
  ]

  return (
    <Modal
      title="Nueva Licitación de Mercado Público"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={900}
      destroyOnHidden
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
      />
    </Modal>
  )
})

ModalNuevaLicitacionMP.displayName = "ModalNuevaLicitacionMP"

export default ModalNuevaLicitacionMP
