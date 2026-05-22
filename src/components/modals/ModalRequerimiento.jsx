"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Form, Input, Select, App, Skeleton, Table, Button, InputNumber, Space, Divider, Typography, Tag, Timeline } from "antd"
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { createRequerimiento, updateRequerimiento, getRequerimientoById, addProductoRequerimiento, deleteProductoRequerimiento } from "@/actions/requerimientos"
import { formatDate } from "@/lib/helpers"

const { TextArea } = Input
const { Text } = Typography

const ModalRequerimiento = forwardRef(({ onSuccess }, ref) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [productoForm] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [mode, setMode] = useState("create")
  const [requerimientoId, setRequerimientoId] = useState(null)
  const [requerimiento, setRequerimiento] = useState(null)

  useImperativeHandle(ref, () => ({
    open: async (id, action) => {
      setOpen(true)
      setMode(action)
      form.resetFields()
      productoForm.resetFields()
      setRequerimiento(null)

      if ((action === "edit" || action === "view") && id) {
        setRequerimientoId(id)
        setLoadingData(true)

        const result = await getRequerimientoById(id)
        if (result.data) {
          setRequerimiento(result.data)
          form.setFieldsValue({
            titulo: result.data.titulo,
            descripcion: result.data.descripcion,
            estado: result.data.estado
          })
        }
        setLoadingData(false)
      } else {
        setRequerimientoId(null)
      }
    }
  }))

  const handleSubmit = async (values) => {
    setLoading(true)

    let result
    if (mode === "edit") {
      result = await updateRequerimiento(requerimientoId, values)
    } else {
      result = await createRequerimiento(values)
    }

    if (result.success) {
      message.success(mode === "edit" ? "Requerimiento actualizado" : "Requerimiento creado")
      setOpen(false)
      form.resetFields()
      onSuccess?.()
    } else {
      message.error(result.error || "Error al guardar")
    }

    setLoading(false)
  }

  const handleAddProducto = async (values) => {
    if (!requerimientoId) {
      message.warning("Primero guarde el requerimiento")
      return
    }

    const result = await addProductoRequerimiento(requerimientoId, values)
    if (result.success) {
      message.success("Producto agregado")
      productoForm.resetFields()
      const updated = await getRequerimientoById(requerimientoId)
      if (updated.data) setRequerimiento(updated.data)
    } else {
      message.error(result.error)
    }
  }

  const handleDeleteProducto = async (productoId) => {
    const result = await deleteProductoRequerimiento(productoId)
    if (result.success) {
      message.success("Producto eliminado")
      const updated = await getRequerimientoById(requerimientoId)
      if (updated.data) setRequerimiento(updated.data)
    } else {
      message.error(result.error)
    }
  }

  const productosColumns = [
    { title: "Producto", dataIndex: "nombreProducto", key: "nombreProducto" },
    { title: "Cantidad", dataIndex: "cantidad", key: "cantidad", width: 100 },
    { title: "Stock", dataIndex: "stock", key: "stock", width: 100 },
    { title: "Programada", dataIndex: "cantidadProgramada", key: "cantidadProgramada", width: 100 },
    ...(mode !== "view" ? [{
      title: "",
      key: "actions",
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteProducto(record.id)}
        />
      )
    }] : [])
  ]

  const isViewMode = mode === "view"

  return (
    <Modal
      title={mode === "create" ? "Nuevo Requerimiento" : mode === "edit" ? "Editar Requerimiento" : "Ver Requerimiento"}
      open={open}
      onCancel={() => setOpen(false)}
      onOk={isViewMode ? () => setOpen(false) : () => form.submit()}
      okText={isViewMode ? "Cerrar" : mode === "edit" ? "Actualizar" : "Crear"}
      cancelText={isViewMode ? null : "Cancelar"}
      cancelButtonProps={isViewMode ? { style: { display: "none" } } : {}}
      confirmLoading={loading}
      width={700}
      destroyOnHidden
    >
      {loadingData ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={isViewMode}>
            <Form.Item name="titulo" label="Título" rules={[{ required: true, message: "Ingrese el título" }]}>
              <Input placeholder="Título del requerimiento" />
            </Form.Item>

            <Form.Item name="descripcion" label="Descripción">
              <TextArea rows={3} placeholder="Descripción..." />
            </Form.Item>

            {mode === "edit" && (
              <Form.Item name="estado" label="Estado">
                <Select
                  options={[
                    { value: "Pendiente", label: "Pendiente" },
                    { value: "En Proceso", label: "En Proceso" },
                    { value: "Completado", label: "Completado" },
                    { value: "Cancelado", label: "Cancelado" }
                  ]}
                />
              </Form.Item>
            )}
          </Form>

          {requerimiento && (
            <>
              <Divider>Productos ({requerimiento.productos?.length || 0})</Divider>

              <Table
                dataSource={requerimiento.productos?.map((p) => ({ ...p, key: p.id })) || []}
                columns={productosColumns}
                size="small"
                pagination={false}
                style={{ marginBottom: 16 }}
              />

              {!isViewMode && (
                <Form form={productoForm} layout="inline" onFinish={handleAddProducto} style={{ marginBottom: 16 }}>
                  <Form.Item name="nombreProducto" rules={[{ required: true }]} style={{ flex: 1 }}>
                    <Input placeholder="Nombre del producto" />
                  </Form.Item>
                  <Form.Item name="cantidad" rules={[{ required: true }]}>
                    <InputNumber placeholder="Cant." min={1} style={{ width: 80 }} />
                  </Form.Item>
                  <Form.Item name="stock">
                    <InputNumber placeholder="Stock" min={0} style={{ width: 80 }} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>Agregar</Button>
                  </Form.Item>
                </Form>
              )}

              {requerimiento.historial?.length > 0 && (
                <>
                  <Divider>Historial</Divider>
                  <Timeline
                    items={requerimiento.historial.map((h) => ({
                      color: "#23aeaa",
                      children: (
                        <div>
                          <Text strong>{h.accion}</Text>
                          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{formatDate(h.createdAt)}</Text>
                          {h.descripcion && <div><Text type="secondary">{h.descripcion}</Text></div>}
                        </div>
                      )
                    }))}
                  />
                </>
              )}
            </>
          )}
        </>
      )}
    </Modal>
  )
})

ModalRequerimiento.displayName = "ModalRequerimiento"

export default ModalRequerimiento
