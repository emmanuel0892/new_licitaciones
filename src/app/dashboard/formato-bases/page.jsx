"use client"

import { useState, useEffect, useRef } from "react"
import { Card, Typography, Button, Row, Col, List, Empty, Spin, App, Popconfirm, Space, Tag } from "antd"
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, FileTextOutlined } from "@ant-design/icons"
import { useSession } from "next-auth/react"
import { getFormatoBases, deleteFormatoBase } from "@/actions/formato-bases"
import ModalFormatoBase from "@/components/modals/ModalFormatoBase"
import styles from "./formato-bases.module.css"

const { Title, Text } = Typography

const CategoriaCard = ({ titulo, data, color, onEdit, onDelete, canEdit }) => {
  const { message } = App.useApp()

  const handleDownload = (rutaArchivo, nombreArchivo) => {
    if (!rutaArchivo) {
      message.warning("No hay documento disponible")
      return
    }
    window.open(rutaArchivo, "_blank")
  }

  return (
    <Card
      className={styles.categoriaCard}
      title={
        <div className={styles.cardTitle}>
          <div className={styles.colorBar} style={{ background: color }} />
          <span>{titulo}</span>
          <Tag color={color}>{data.length}</Tag>
        </div>
      }
    >
      {data.length === 0 ? (
        <Empty description="Sin formatos" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={data}
          renderItem={(item) => (
            <List.Item
              className={styles.listItem}
              actions={[
                <Button
                  key="download"
                  type="text"
                  size="small"
                  icon={<DownloadOutlined style={{ color: "#23aeaa" }} />}
                  onClick={() => handleDownload(item.rutaArchivo, item.nombreArchivo)}
                />,
                ...(canEdit ? [
                  <Button
                    key="edit"
                    type="text"
                    size="small"
                    icon={<EditOutlined style={{ color: "#23aeaa" }} />}
                    onClick={() => onEdit(item.id)}
                  />,
                  <Popconfirm
                    key="delete"
                    title="¿Eliminar este formato?"
                    okText="Eliminar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onDelete(item.id)}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined style={{ color: "#e53935" }} />}
                    />
                  </Popconfirm>
                ] : [])
              ]}
            >
              <List.Item.Meta
                avatar={<FileTextOutlined style={{ fontSize: 20, color: color }} />}
                title={item.titulo}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}

const FormatoBasesPage = () => {
  const { message } = App.useApp()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [bases, setBases] = useState({ medicamentos: [], insumos: [], servicios: [], otros: [] })
  const modalRef = useRef(null)

  const isSuperAdmin = session?.user?.typeAccount === "Super Admin"

  const loadData = async () => {
    setLoading(true)
    const result = await getFormatoBases()
    if (result.data) {
      setBases(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id) => {
    const result = await deleteFormatoBase(id)
    if (result.success) {
      message.success("Formato eliminado correctamente")
      loadData()
    } else {
      message.error(result.error || "Error al eliminar")
    }
  }

  const handleEdit = (id) => {
    modalRef.current?.open(id, "edit")
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} style={{ margin: 0 }}>Formato Bases</Title>
        {isSuperAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => modalRef.current?.open(null, "create")}
          >
            Agregar Base
          </Button>
        )}
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <CategoriaCard
            titulo="Medicamentos"
            data={bases.medicamentos}
            color="#22c55e"
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={isSuperAdmin}
          />
        </Col>
        <Col xs={24} lg={12}>
          <CategoriaCard
            titulo="Insumos"
            data={bases.insumos}
            color="#3b82f6"
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={isSuperAdmin}
          />
        </Col>
        <Col xs={24} lg={12}>
          <CategoriaCard
            titulo="Servicios"
            data={bases.servicios}
            color="#f59e0b"
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={isSuperAdmin}
          />
        </Col>
        <Col xs={24} lg={12}>
          <CategoriaCard
            titulo="Otros Formatos"
            data={bases.otros}
            color="#8b5cf6"
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={isSuperAdmin}
          />
        </Col>
      </Row>

      <ModalFormatoBase ref={modalRef} onSuccess={loadData} />
    </div>
  )
}

export default FormatoBasesPage
