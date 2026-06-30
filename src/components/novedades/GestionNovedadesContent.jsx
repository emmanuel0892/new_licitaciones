"use client"

import { useEffect, useRef, useState } from "react"
import { Table, Button, Space, Typography, Card, App, Popconfirm } from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons"
import Link from "next/link"
import { getNovedadesGestion, deleteNovedad } from "@/actions/novedades"
import { formatDate } from "@/lib/helpers"
import ModalNovedad from "@/components/modals/ModalNovedad"
import styles from "@/app/dashboard/novedades/gestion/gestion.module.css"

const { Title, Paragraph } = Typography

const addTableKeys = (novedades) => {
  return novedades.map((novedad) => ({ ...novedad, key: novedad.id }))
}

const GestionNovedadesContent = ({
  initialNovedades,
  initialError,
  canCreateNovedades,
  canEditNovedades,
  canDeleteNovedades
}) => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [novedades, setNovedades] = useState(() => addTableKeys(initialNovedades))
  const modalRef = useRef(null)
  const showActionsColumn = canEditNovedades || canDeleteNovedades

  useEffect(() => {
    if (initialError) {
      message.error(initialError)
    }
  }, [initialError, message])

  const loadData = async () => {
    setLoading(true)
    const result = await getNovedadesGestion()

    if (result.data) {
      setNovedades(addTableKeys(result.data))
    } else {
      message.error(result.error || "Error al obtener novedades")
    }

    setLoading(false)
  }

  const handleDelete = async (id) => {
    const result = await deleteNovedad(id)

    if (result.success) {
      message.success("Novedad eliminada correctamente")
      await loadData()
      return
    }

    message.error(result.error || "Error al eliminar")
  }

  const columns = [
    {
      title: "Titular",
      dataIndex: "titular",
      key: "titular",
      ellipsis: true,
      render: (text, record) => (
        <Link href={`/dashboard/novedades/${record.id}`}>{text}</Link>
      )
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
    }
  ]

  if (showActionsColumn) {
    columns.push({
      title: "Acciones",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {canEditNovedades && (
            <Button
              type="text"
              aria-label="Editar novedad"
              icon={<EditOutlined style={{ color: "#93c01f" }} />}
              onClick={() => modalRef.current?.open(record.id, "edit")}
            />
          )}
          {canDeleteNovedades && (
            <Popconfirm
              title="¿Desea eliminar esta novedad?"
              okText="Eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="text"
                aria-label="Eliminar novedad"
                icon={<DeleteOutlined style={{ color: "#e53935" }} />}
              />
            </Popconfirm>
          )}
        </Space>
      )
    })
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3} style={{ margin: 0 }}>Gestión de Novedades</Title>
          {canCreateNovedades && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => modalRef.current?.open(null, "create")}
            >
              Agregar Novedad
            </Button>
          )}
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

      {(canCreateNovedades || canEditNovedades) && (
        <ModalNovedad ref={modalRef} onSuccess={loadData} />
      )}
    </div>
  )
}

export default GestionNovedadesContent
