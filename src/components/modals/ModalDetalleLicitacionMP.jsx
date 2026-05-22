"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { 
  Modal, Descriptions, Table, Progress, Tag, Tabs, Typography, 
  Spin, Card, Space, Divider, Empty, Timeline, Button, Tooltip
} from "antd"
import { 
  ShoppingCartOutlined, FileTextOutlined, WarningOutlined,
  CheckCircleFilled, ClockCircleFilled
} from "@ant-design/icons"
import { getLicitacionMPById } from "@/actions/mercadoPublico"
import { formatMoney, formatDate } from "@/lib/helpers"

const { Text, Title } = Typography

const ModalDetalleLicitacionMP = forwardRef(({ onSuccess }, ref) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [licitacion, setLicitacion] = useState(null)

  useImperativeHandle(ref, () => ({
    open: async (id) => {
      setOpen(true)
      setLoading(true)
      const result = await getLicitacionMPById(id)
      if (result.data) {
        setLicitacion(result.data)
      }
      setLoading(false)
    }
  }))

  const getConsumoColor = (porcentaje) => {
    if (porcentaje >= 90) return "#e53935"
    if (porcentaje >= 75) return "#fa8c16"
    if (porcentaje >= 50) return "#faad14"
    return "#52c41a"
  }

  const itemsColumns = [
    {
      title: "#",
      dataIndex: "correlativo",
      width: 50
    },
    {
      title: "Producto",
      dataIndex: "nombreProducto",
      ellipsis: true
    },
    {
      title: "Cantidad",
      dataIndex: "cantidadTotal",
      width: 100,
      align: "right",
      render: (value, record) => (
        <div>
          <div>{value.toLocaleString()}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.unidadMedida}
          </Text>
        </div>
      )
    },
    {
      title: "P. Unitario",
      dataIndex: "montoUnitario",
      width: 120,
      align: "right",
      render: (value) => formatMoney(value)
    },
    {
      title: "Total",
      dataIndex: "montoTotal",
      width: 130,
      align: "right",
      render: (value) => <Text strong>{formatMoney(value)}</Text>
    },
    {
      title: "Proveedor",
      dataIndex: "nombreProveedor",
      width: 180,
      ellipsis: true
    }
  ]

  const ordenesColumns = [
    {
      title: "Código OC",
      dataIndex: "codigo",
      width: 150,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: "Nombre",
      dataIndex: "nombre",
      ellipsis: true
    },
    {
      title: "Estado",
      dataIndex: "estado",
      width: 100,
      render: (estado) => (
        <Tag color={estado === "Aceptada" ? "#268e00" : "#1890ff"}>
          {estado}
        </Tag>
      )
    },
    {
      title: "Total",
      dataIndex: "total",
      width: 130,
      align: "right",
      render: (value) => <Text strong>{formatMoney(value)}</Text>
    },
    {
      title: "Fecha",
      dataIndex: "fechaCreacion",
      width: 110,
      render: (date) => formatDate(date)
    },
    {
      title: "Proveedor",
      dataIndex: "nombreProveedor",
      width: 180,
      ellipsis: true
    }
  ]

  const itemsOrdenColumns = [
    {
      title: "#",
      dataIndex: "correlativo",
      width: 50
    },
    {
      title: "Producto",
      dataIndex: "producto",
      ellipsis: true
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      width: 100,
      align: "right",
      render: (value) => value.toLocaleString()
    },
    {
      title: "P. Unitario",
      dataIndex: "precioNeto",
      width: 120,
      align: "right",
      render: (value) => formatMoney(value)
    },
    {
      title: "Total",
      dataIndex: "total",
      width: 130,
      align: "right",
      render: (value) => <Text strong>{formatMoney(value)}</Text>
    }
  ]

  const renderAlertas = () => {
    if (!licitacion?.alertas || licitacion.alertas.length === 0) {
      return <Empty description="Sin alertas registradas" />
    }

    return (
      <Timeline
        items={licitacion.alertas.map((alerta) => ({
          color: alerta.tipo === "critical" ? "red" : alerta.tipo === "urgent" ? "orange" : "gold",
          dot: alerta.tipo === "critical" 
            ? <WarningOutlined style={{ color: "#e53935" }} />
            : alerta.tipo === "urgent"
            ? <WarningOutlined style={{ color: "#fa8c16" }} />
            : <WarningOutlined style={{ color: "#faad14" }} />,
          children: (
            <div>
              <Text strong>{alerta.porcentaje}% de consumo alcanzado</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(alerta.createdAt)}
              </Text>
              <p style={{ marginTop: 4 }}>{alerta.mensaje}</p>
            </div>
          )
        }))}
      />
    )
  }

  const tabItems = [
    {
      key: "items",
      label: (
        <span>
          <FileTextOutlined /> Items ({licitacion?.items?.length || 0})
        </span>
      ),
      children: (
        <Table
          dataSource={licitacion?.items || []}
          columns={itemsColumns}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 300 }}
          summary={(data) => {
            const total = data.reduce((acc, item) => acc + item.montoTotal, 0)
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>Total Adjudicado</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Text strong style={{ color: "#23aeaa" }}>
                      {formatMoney(total)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} />
                </Table.Summary.Row>
              </Table.Summary>
            )
          }}
        />
      )
    },
    {
      key: "ordenes",
      label: (
        <span>
          <ShoppingCartOutlined /> Órdenes de Compra ({licitacion?.ordenesCompra?.length || 0})
        </span>
      ),
      children: (
        <div>
          {licitacion?.ordenesCompra?.map((orden) => (
            <Card 
              key={orden.id} 
              size="small" 
              style={{ marginBottom: 12 }}
              title={
                <Space>
                  <Text strong>{orden.codigo}</Text>
                  <Tag color={orden.estado === "Aceptada" ? "#268e00" : "#1890ff"}>
                    {orden.estado}
                  </Tag>
                </Space>
              }
              extra={<Text strong style={{ color: "#23aeaa" }}>{formatMoney(orden.total)}</Text>}
            >
              <Descriptions size="small" column={3}>
                <Descriptions.Item label="Proveedor">{orden.nombreProveedor}</Descriptions.Item>
                <Descriptions.Item label="RUT">{orden.rutProveedor}</Descriptions.Item>
                <Descriptions.Item label="Fecha">{formatDate(orden.fechaCreacion)}</Descriptions.Item>
              </Descriptions>
              <Divider style={{ margin: "12px 0" }} />
              <Table
                dataSource={orden.items || []}
                columns={itemsOrdenColumns}
                rowKey="id"
                size="small"
                pagination={false}
                summary={(data) => {
                  const totalNeto = data.reduce((acc, item) => acc + item.total, 0)
                  return (
                    <Table.Summary>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4} align="right">
                          <Text>Neto:</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">
                          {formatMoney(orden.totalNeto)}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4} align="right">
                          <Text>IVA (19%):</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">
                          {formatMoney(orden.impuestos)}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4} align="right">
                          <Text strong>Total:</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">
                          <Text strong style={{ color: "#23aeaa" }}>
                            {formatMoney(orden.total)}
                          </Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )
                }}
              />
            </Card>
          ))}
          {(!licitacion?.ordenesCompra || licitacion.ordenesCompra.length === 0) && (
            <Empty description="Sin órdenes de compra registradas" />
          )}
        </div>
      )
    },
    {
      key: "alertas",
      label: (
        <span>
          <WarningOutlined /> Alertas ({licitacion?.alertas?.length || 0})
        </span>
      ),
      children: renderAlertas()
    }
  ]

  return (
    <Modal
      title={`Detalle Licitación: ${licitacion?.codigoExterno || ""}`}
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : licitacion ? (
        <>
          {/* Información general */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Nombre" span={2}>
                <Text strong>{licitacion.nombre}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Requirente">
                {licitacion.requirente}
              </Descriptions.Item>
              <Descriptions.Item label="Estado">
                <Tag color={licitacion.estado === "Adjudicada" ? "#268e00" : "#1890ff"}>
                  {licitacion.estado}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Monto Adjudicado">
                <Text strong>{formatMoney(licitacion.montoAdjudicado)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Monto Consumido">
                <Text strong style={{ color: getConsumoColor(licitacion.porcentajeConsumo) }}>
                  {formatMoney(licitacion.montoConsumido)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Vigencia">
                {licitacion.vigenciaMeses ? `${licitacion.vigenciaMeses} meses` : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha Adjudicación">
                {licitacion.fechaAdjudicacion ? formatDate(licitacion.fechaAdjudicacion) : "-"}
              </Descriptions.Item>
            </Descriptions>

            {/* Barra de consumo */}
            <div style={{ marginTop: 16 }}>
              <Text strong>Porcentaje de Consumo</Text>
              <Progress 
                percent={Math.round(licitacion.porcentajeConsumo)} 
                strokeColor={getConsumoColor(licitacion.porcentajeConsumo)}
                format={(percent) => (
                  <span style={{ color: getConsumoColor(licitacion.porcentajeConsumo) }}>
                    {percent}%
                  </span>
                )}
              />
              {licitacion.porcentajeConsumo >= 50 && (
                <Tag 
                  color={getConsumoColor(licitacion.porcentajeConsumo)} 
                  icon={<WarningOutlined />}
                  style={{ marginTop: 8 }}
                >
                  {licitacion.porcentajeConsumo >= 90 
                    ? "¡Consumo crítico! Relicitar urgente"
                    : licitacion.porcentajeConsumo >= 75
                    ? "Consumo alto - Iniciar relicitación"
                    : "50% consumido - Planificar relicitación"}
                </Tag>
              )}
            </div>
          </Card>

          {/* Tabs con items, órdenes y alertas */}
          <Tabs items={tabItems} />
        </>
      ) : (
        <Empty description="No se pudo cargar la información" />
      )}
    </Modal>
  )
})

ModalDetalleLicitacionMP.displayName = "ModalDetalleLicitacionMP"

export default ModalDetalleLicitacionMP
