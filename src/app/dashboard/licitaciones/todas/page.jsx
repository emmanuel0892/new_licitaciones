"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Table, Button, Space, Tag, Typography, Card, App, Input, Select, Tooltip, Popconfirm } from "antd"
import { SearchOutlined, ReloadOutlined, EyeOutlined, HistoryOutlined, FileTextOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons"
import { getLicitaciones, deleteLicitacion } from "@/actions/licitaciones"
import { getUsers } from "@/actions/users"
import { formatDate, formatMoney, getEstadoColor, ESTADOS_LICITACION } from "@/lib/helpers"
import ModalHistorial from "@/components/modals/ModalHistorial"
import ModalWorkflow from "@/components/modals/ModalWorkflow"
import ModalEditarLicitacion from "@/components/modals/ModalEditarLicitacion"
import * as XLSX from "xlsx"
import styles from "./todas.module.css"

const { Title, Text } = Typography

const TodasLicitacionesPage = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [licitaciones, setLicitaciones] = useState([])
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({
    numeroLicitacion: "",
    usuarioId: undefined,
    estado: undefined
  })
  const [generatingExcel, setGeneratingExcel] = useState(false)

  const modalHistorialRef = useRef(null)
  const modalWorkflowRef = useRef(null)
  const modalEditarRef = useRef(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [licResult, usersResult] = await Promise.all([
      getLicitaciones(filters),
      getUsers()
    ])

    if (licResult.data) {
      setLicitaciones(licResult.data.map((l) => ({ ...l, key: l.id })))
    }

    if (usersResult.data) {
      setUsers(usersResult.data)
    }

    setLoading(false)
  }, [filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSearch = () => {
    loadData()
  }

  const handleClearFilters = () => {
    setFilters({
      numeroLicitacion: "",
      usuarioId: undefined,
      estado: undefined
    })
  }

  const handleExportExcel = () => {
    setGeneratingExcel(true)

    const dataExcel = licitaciones.map((l) => ({
      "Número de Licitación": l.numeroLicitacion || "Sin número",
      "Nombre de Licitación": l.nombreLicitacion,
      "Formato": l.formatoLiquidacion.titulo,
      "Creador": `${l.usuario.name} ${l.usuario.lastname}`,
      "Requirente": l.requirente,
      "Monto Presupuestado": l.montoPresupuestado || "Sin Monto",
      "Vigencia": l.vigencia ? formatDate(l.vigencia) : "-",
      "Estado": l.estado,
      "Proceso Actual": l.procesoActual.tituloProceso,
      "Fecha de Creación": formatDate(l.createdAt)
    }))

    const ws = XLSX.utils.json_to_sheet(dataExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Todas las Licitaciones")
    XLSX.writeFile(wb, "Todas-Licitaciones.xlsx")

    setGeneratingExcel(false)
    message.success("Informe generado correctamente")
  }

  const handleDelete = async (id) => {
    const result = await deleteLicitacion(id)
    if (result.success) {
      message.success("Licitación eliminada correctamente")
      loadData()
    } else {
      message.error(result.error || "Error al eliminar la licitación")
    }
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
      width: 120
    },
    {
      title: "Nombre",
      dataIndex: "nombreLicitacion",
      key: "nombre",
      ellipsis: true
    },
    {
      title: "Creador",
      key: "creador",
      width: 150,
      render: (_, record) => `${record.usuario.name} ${record.usuario.lastname}`
    },
    {
      title: "Requirente",
      dataIndex: "requirente",
      key: "requirente",
      width: 150,
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
      width: 110,
      render: (text) => text ? formatDate(text) : "-"
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
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver historial">
            <Button
              type="text"
              size="small"
              icon={<HistoryOutlined style={{ color: "#722ed1" }} />}
              onClick={() => modalHistorialRef.current?.open(record.id, record)}
            />
          </Tooltip>

          <Tooltip title="Ver workflow">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: "#23aeaa" }} />}
              onClick={() => modalWorkflowRef.current?.open(record.id)}
            />
          </Tooltip>

          <Tooltip title="Editar">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: "#23aeaa" }} />}
              onClick={() => modalEditarRef.current?.open(record.id)}
            />
          </Tooltip>

          <Popconfirm
            title="¿Estás seguro de eliminar esta licitación?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Tooltip title="Eliminar">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined style={{ color: "#e53935" }} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3} style={{ margin: 0 }}>Todas las Licitaciones</Title>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            loading={generatingExcel}
          >
            Exportar Excel
          </Button>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <Text className={styles.filterLabel}>Filtrar Por:</Text>
          </div>

          <div className={styles.filterGroup}>
            <Text className={styles.filterLabel}>N° de Licitación | MEMO:</Text>
            <Input
              placeholder="Buscar por Número de Licitación o MEMO"
              value={filters.numeroLicitacion}
              onChange={(e) => setFilters({ ...filters, numeroLicitacion: e.target.value })}
              style={{ width: 250 }}
              allowClear
            />
          </div>

          <div className={styles.filterGroup}>
            <Text className={styles.filterLabel}>Creador:</Text>
            <Select
              placeholder="Seleccione usuario"
              value={filters.usuarioId}
              onChange={(value) => setFilters({ ...filters, usuarioId: value })}
              style={{ width: 200 }}
              allowClear
              options={users.map((u) => ({
                value: u.id,
                label: `${u.name} ${u.lastname}`
              }))}
            />
          </div>

          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Buscar
          </Button>

          <Button icon={<ReloadOutlined />} onClick={handleClearFilters}>
            Mostrar Todo
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
            showTotal: (total) => `Total: ${total} licitaciones`,
            position: ["bottomRight"]
          }}
        />
      </Card>

      <ModalHistorial ref={modalHistorialRef} />
      <ModalWorkflow ref={modalWorkflowRef} />
      <ModalEditarLicitacion ref={modalEditarRef} onSuccess={loadData} />
    </div>
  )
}

export default TodasLicitacionesPage
