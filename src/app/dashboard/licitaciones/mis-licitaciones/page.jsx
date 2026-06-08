"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Table, Button, Space, Tag, Typography, Card, App, Tooltip } from "antd"
import { EyeOutlined, EditOutlined, FileTextOutlined, HistoryOutlined } from "@ant-design/icons"
import { getMisLicitaciones } from "@/actions/licitaciones"
import { getCurrentAuthorization } from "@/actions/permisos"
import { formatDate, formatMoney, getEstadoColor, getProcesoActualWorkflowLabel, getFormatoLabel } from "@/lib/helpers"
import {
  getDocumentViewPermissionCode,
  getHistoryPermissionCode,
  getWorkflowViewPermissionCode
} from "@/lib/permissionCodes"
import ModalHistorial from "@/components/modals/ModalHistorial"
import ModalWorkflow from "@/components/modals/ModalWorkflow"
import ModalEditarLicitacion from "@/components/modals/ModalEditarLicitacion"
import ModalDocumentos from "@/components/modals/ModalDocumentos"
import styles from "./mis-licitaciones.module.css"

const { Title, Text } = Typography

const MisLicitacionesPage = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [licitaciones, setLicitaciones] = useState([])
  const [authorization, setAuthorization] = useState({ isSuperAdmin: false, permissions: [] })

  const modalHistorialRef = useRef(null)
  const modalWorkflowRef = useRef(null)
  const modalEditarRef = useRef(null)
  const modalDocumentosRef = useRef(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      const [result, authResult] = await Promise.all([
        getMisLicitaciones(),
        getCurrentAuthorization()
      ])

      if (result.data) {
        setLicitaciones(result.data.map((l) => ({ ...l, key: l.id })))
      }

      if (authResult.data) {
        setAuthorization(authResult.data)
      }
    } catch (error) {
      message.error("Error al obtener mis licitaciones")
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    const timerId = setTimeout(() => {
      void loadData()
    }, 0)

    return () => clearTimeout(timerId)
  }, [loadData])

  const hasPermission = (permissionCode) => {
    return authorization.isSuperAdmin || authorization.permissions.includes(permissionCode)
  }

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
      width: 120,
      render: (titulo) => getFormatoLabel(titulo)
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
      ellipsis: true,
      render: (titulo, record) => {
        return getProcesoActualWorkflowLabel(record) || titulo
      }
    },
    {
      title: "Acciones",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => {
        const canViewHistory = hasPermission(getHistoryPermissionCode(record))
        const canViewDocuments = hasPermission(getDocumentViewPermissionCode(record))
        const canViewWorkflow = hasPermission(getWorkflowViewPermissionCode(record))

        return (
          <Space size="small">
          {canViewHistory && (
          <Tooltip title="Ver historial">
            <Button
              type="text"
              size="small"
              icon={<HistoryOutlined style={{ color: "#722ed1" }} />}
              onClick={() => modalHistorialRef.current?.open(record.id, record)}
            />
          </Tooltip>
          )}

          {canViewDocuments && (
            <Tooltip title="Ver documentos">
              <Button
                type="text"
                size="small"
                icon={<FileTextOutlined style={{ color: "#FFD96D" }} />}
                onClick={() => modalDocumentosRef.current?.open(record, false)}
              />
            </Tooltip>
          )}

          {canViewWorkflow && (
          <Tooltip title="Ver workflow">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: "#23aeaa" }} />}
              onClick={() => modalWorkflowRef.current?.open(record.id)}
            />
          </Tooltip>
          )}

          <Tooltip title="Editar">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: "#23aeaa" }} />}
              onClick={() => modalEditarRef.current?.open(record.id)}
            />
          </Tooltip>
        </Space>
        )
      }
    }
  ]

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3} style={{ margin: 0 }}>Mis Licitaciones</Title>
          {hasPermission("licitacion.crear") && (
          <Button type="primary" href="/dashboard/licitaciones/crear">
            Crear Licitación
          </Button>
          )}
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
      <ModalDocumentos ref={modalDocumentosRef} onSuccess={loadData} />
    </div>
  )
}

export default MisLicitacionesPage
