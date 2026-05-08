"use client"

import { useState, useEffect, useRef } from "react"
import { Table, Button, Space, Tag, Typography, Card, App, Tooltip } from "antd"
import { EyeOutlined, EditOutlined, FileTextOutlined, HistoryOutlined } from "@ant-design/icons"
import { getMisLicitaciones } from "@/actions/licitaciones"
import { formatDate, formatMoney, getEstadoColor } from "@/lib/helpers"
import ModalHistorial from "@/components/modals/ModalHistorial"
import ModalWorkflow from "@/components/modals/ModalWorkflow"
import ModalEditarLicitacion from "@/components/modals/ModalEditarLicitacion"
import styles from "./mis-licitaciones.module.css"

const { Title, Text } = Typography

const MisLicitacionesPage = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [licitaciones, setLicitaciones] = useState([])

  const modalHistorialRef = useRef(null)
  const modalWorkflowRef = useRef(null)
  const modalEditarRef = useRef(null)

  const loadData = async () => {
    setLoading(true)
    const result = await getMisLicitaciones()
    if (result.data) {
      setLicitaciones(result.data.map((l) => ({ ...l, key: l.id })))
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const columns = [
    {
      title: "N° Licitación",
      dataIndex: "numeroLicitacion",
      key: "numeroLicitacion",
      width: 140,
      render: (text) => text || <Text type="secondary">Sin número</Text>
    },
    {
      title: "Formato",
      dataIndex: ["formatoLiquidacion", "titulo"],
      key: "formato",
      width: 120
    },
    {
      title: "Nombre",
      dataIndex: "nombreLicitacion",
      key: "nombre",
      ellipsis: true
    },
    {
      title: "Requirente",
      dataIndex: "requirente",
      key: "requirente",
      width: 180,
      ellipsis: true
    },
    {
      title: "Monto",
      dataIndex: "montoPresupuestado",
      key: "monto",
      width: 130,
      render: (text) => formatMoney(text)
    },
    {
      title: "Vigencia",
      dataIndex: "vigencia",
      key: "vigencia",
      width: 120,
      render: (text) => text ? formatDate(text) : <Text type="secondary">-</Text>
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 110,
      render: (text) => (
        <Tag color={getEstadoColor(text)}>{text}</Tag>
      )
    },
    {
      title: "Fecha Creación",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (text) => formatDate(text)
    },
    {
      title: "Proceso Actual",
      dataIndex: ["procesoActual", "tituloProceso"],
      key: "proceso",
      width: 180,
      ellipsis: true
    },
    {
      title: "Acciones",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {(record.contadorDevoluciones > 0 || record.contadorEdiciones > 0) && (
            <Tooltip title="Ver historial">
              <Button
                type="text"
                size="small"
                icon={<HistoryOutlined style={{ color: "#6B7280" }} />}
                onClick={() => modalHistorialRef.current?.open(record.id)}
              />
            </Tooltip>
          )}

          {record._count.documentos > 0 && (
            <Tooltip title="Ver documentos">
              <Button
                type="text"
                size="small"
                icon={<FileTextOutlined style={{ color: "#FFD96D" }} />}
              />
            </Tooltip>
          )}

          <Tooltip title="Ver workflow">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: "#23aeaa" }} />}
              onClick={() => modalWorkflowRef.current?.open(record.id)}
            />
          </Tooltip>

          {record.procesoActual.turno === "Licitador" && (
            <Tooltip title="Editar">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: "#23aeaa" }} />}
                onClick={() => modalEditarRef.current?.open(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3} style={{ margin: 0 }}>Mis Licitaciones</Title>
          <Button type="primary" href="/dashboard/licitaciones/crear">
            Crear Licitación
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={licitaciones}
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Total: ${total} licitaciones`
          }}
        />
      </Card>

      <ModalHistorial ref={modalHistorialRef} />
      <ModalWorkflow ref={modalWorkflowRef} />
      <ModalEditarLicitacion ref={modalEditarRef} onSuccess={loadData} />
    </div>
  )
}

export default MisLicitacionesPage
