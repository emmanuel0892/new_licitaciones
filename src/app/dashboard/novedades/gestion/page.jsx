"use client"

import { useState, useEffect, useRef } from "react"
import { Table, Button, Space, Typography, Card, App, Popconfirm } from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons"
import Link from "next/link"
import { getNovedades, deleteNovedad } from "@/actions/novedades"
import { formatDate } from "@/lib/helpers"
import ModalNovedad from "@/components/modals/ModalNovedad"
import styles from "./gestion.module.css"

const { Title, Paragraph } = Typography

const GestionNovedadesPage = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [novedades, setNovedades] = useState([])
  const modalRef = useRef(null)

  const loadData = async () => {
    setLoading(true)
    const result = await getNovedades()
    if (result.data) {
      setNovedades(result.data.map((n) => ({ ...n, key: n.id })))
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id) => {
    const result = await deleteNovedad(id)
    if (result.success) {
      message.success("Novedad eliminada correctamente")
      loadData()
    } else {
      message.error(result.error || "Error al eliminar")
    }
  }

  const columns = [
    {
      title: "Titular",
      dataIndex: "titular",
      key: "titular",
      ellipsis: true
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      width: 300,
      render: (text) => (
        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
          {text}
        </Paragraph>
      )
    },
    {
      title: "Fecha de Creación",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (text) => formatDate(text)
    },
    {
      title: "Acciones",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Link href={`/dashboard/novedades/${record.id}`}>
            <Button type="text" icon={<EyeOutlined style={{ color: "#23aeaa" }} />} />
          </Link>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#23aeaa" }} />}
            onClick={() => modalRef.current?.open(record.id, "edit")}
          />
          <Popconfirm
            title="¿Desea eliminar esta novedad?"
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" icon={<DeleteOutlined style={{ color: "#e53935" }} />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3} style={{ margin: 0 }}>Gestión de Novedades</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => modalRef.current?.open(null, "create")}
          >
            Agregar Novedad
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={novedades}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Total: ${total} novedades`
          }}
        />
      </Card>

      <ModalNovedad ref={modalRef} onSuccess={loadData} />
    </div>
  )
}

export default GestionNovedadesPage
