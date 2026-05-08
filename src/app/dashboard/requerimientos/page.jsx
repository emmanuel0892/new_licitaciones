"use client"

import { useState, useEffect, useRef } from "react"
import { Table, Button, Space, Tag, Typography, Card, App, Popconfirm, Timeline } from "antd"
import { PlusOutlined, EditOutlined, EyeOutlined, HistoryOutlined } from "@ant-design/icons"
import { getRequerimientos } from "@/actions/requerimientos"
import { formatDate } from "@/lib/helpers"
import ModalRequerimiento from "@/components/modals/ModalRequerimiento"
import styles from "./requerimientos.module.css"

const { Title, Text, Paragraph } = Typography

const RequerimientosPage = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [requerimientos, setRequerimientos] = useState([])
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const modalRef = useRef(null)

  const loadData = async () => {
    setLoading(true)
    const result = await getRequerimientos()
    if (result.data) {
      setRequerimientos(result.data.map((r) => ({ ...r, key: r.id })))
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const getEstadoColor = (estado) => {
    const colors = {
      Pendiente: "#e5be01",
      "En Proceso": "#23aeaa",
      Completado: "#268e00",
      Cancelado: "#e53935"
    }
    return colors[estado] || "#6B7280"
  }

  const columns = [
    {
      title: "Título",
      dataIndex: "titulo",
      key: "titulo",
      ellipsis: true
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      width: 250,
      render: (text) => (
        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
          {text || "-"}
        </Paragraph>
      )
    },
    {
      title: "Productos",
      key: "productos",
      width: 100,
      render: (_, record) => (
        <Tag color="#23aeaa">{record.productos?.length || 0}</Tag>
      )
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 120,
      render: (text) => <Tag color={getEstadoColor(text)}>{text}</Tag>
    },
    {
      title: "Fecha Creación",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (text) => formatDate(text)
    },
    {
      title: "Acciones",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: "#23aeaa" }} />}
            onClick={() => modalRef.current?.open(record.id, "view")}
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#23aeaa" }} />}
            onClick={() => modalRef.current?.open(record.id, "edit")}
          />
        </Space>
      )
    }
  ]

  const expandedRowRender = (record) => {
    if (!record.historial || record.historial.length === 0) {
      return <Text type="secondary">Sin historial</Text>
    }

    return (
      <div style={{ padding: "16px 0" }}>
        <Text strong style={{ marginBottom: 12, display: "block" }}>Historial</Text>
        <Timeline
          items={record.historial.map((h) => ({
            color: "#23aeaa",
            children: (
              <div>
                <Text strong>{h.accion}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(h.createdAt)}</Text>
                {h.descripcion && <Paragraph style={{ margin: "4px 0 0" }}>{h.descripcion}</Paragraph>}
              </div>
            )
          }))}
        />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3} style={{ margin: 0 }}>Requerimientos de Abastecimiento</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => modalRef.current?.open(null, "create")}
          >
            Nuevo Requerimiento
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={requerimientos}
          loading={loading}
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpandedRowsChange: setExpandedRowKeys
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Total: ${total} requerimientos`
          }}
        />
      </Card>

      <ModalRequerimiento ref={modalRef} onSuccess={loadData} />
    </div>
  )
}

export default RequerimientosPage
