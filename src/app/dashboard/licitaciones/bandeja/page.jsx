"use client"

import { useState, useEffect, useRef } from "react"
import { Table, Button, Space, Tag, Typography, Card, App, Popconfirm, Input, Select, Tooltip } from "antd"
import {
  SearchOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  UploadOutlined,
  AlignLeftOutlined,
  TableOutlined,
  DownloadOutlined,
  HistoryOutlined
} from "@ant-design/icons"
import { useSession } from "next-auth/react"
import { getLicitaciones, avanzarLicitacion } from "@/actions/licitaciones"
import { getUsers } from "@/actions/users"
import { formatDate, formatMoney, getEstadoColor, ESTADOS_LICITACION } from "@/lib/helpers"
import ModalDevolver from "@/components/modals/ModalDevolver"
import ModalHistorial from "@/components/modals/ModalHistorial"
import ModalHistorialNuevo from "@/components/modals/ModalHistorialNuevo"
import ModalWorkflow from "@/components/modals/ModalWorkflow"
import ModalDocumentos from "@/components/modals/ModalDocumentos"
import * as XLSX from "xlsx"
import styles from "./bandeja.module.css"

const { Title, Text } = Typography

const BandejaPage = () => {
  const { message } = App.useApp()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [licitaciones, setLicitaciones] = useState([])
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({
    numeroLicitacion: "",
    usuarioId: undefined,
    estado: undefined,
    turno: undefined
  })
  const [generatingExcel, setGeneratingExcel] = useState(false)

  const modalDevolverRef = useRef(null)
  const modalHistorialRef = useRef(null)
  const modalHistorialNuevoRef = useRef(null)
  const modalWorkflowRef = useRef(null)
  const modalDocumentosRef = useRef(null)

  const userType = session?.user?.typeAccount
  const userId = session?.user?.id

  const loadData = async () => {
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
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSearch = async () => {
    if (!filters.numeroLicitacion && !filters.usuarioId && !filters.estado && !filters.turno) {
      message.warning("Debe ingresar al menos un filtro")
      return
    }
    await loadData()
  }

  const handleClearFilters = () => {
    setFilters({
      numeroLicitacion: "",
      usuarioId: undefined,
      estado: undefined,
      turno: undefined
    })
  }

  const handleAvanzar = async (id) => {
    message.loading("Avanzando licitación...")
    const result = await avanzarLicitacion(id)
    if (result.success) {
      message.success(result.message || "Licitación avanzada correctamente")
      loadData()
    } else {
      message.error(result.error || "Error al avanzar")
    }
  }

  const handleExportExcel = async () => {
    setGeneratingExcel(true)
    message.loading("Generando informe...")

    const dataExcel = licitaciones.map((l) => ({
      "Número de Licitación": l.numeroLicitacion || "Sin número",
      "Nombre de Licitación": l.nombreLicitacion,
      "Monto Presupuestado": l.montoPresupuestado || "Sin Monto",
      "Fecha de Creación": formatDate(l.createdAt),
      "Creador": `${l.usuario.name} ${l.usuario.lastname}`,
      "Proceso Actual": l.procesoActual.tituloProceso,
      "Estado": l.estado
    }))

    const ws = XLSX.utils.json_to_sheet(dataExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Licitaciones")
    XLSX.writeFile(wb, "Informe-Licitaciones.xlsx")

    setGeneratingExcel(false)
    message.success("Informe generado correctamente")
  }

  const canPerformAction = (record) => {
    if (userType === "Super Admin") return true
    return record.procesoActual.turno === userType
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
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 110,
      render: (text) => (
        <Tag color={getEstadoColor(text)}>{text}</Tag>
      )
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
      width: 220,
      render: (_, record) => {
        const isPublicada = record.procesoActual?.tituloProceso === "Publicada"
        const isFirstStep = record.procesoActual?.numeroPaso === 1

        return (
          <Space size="small">
            {/* 0. Ver Historial - Siempre visible */}
            <Tooltip title="Ver historial">
              <Button
                type="text"
                size="small"
                icon={<HistoryOutlined style={{ color: "#722ed1" }} />}
                onClick={() => modalHistorialNuevoRef.current?.open(record.id, record)}
              />
            </Tooltip>

            {/* 1. Ver Documentos - Solo si tiene documentos */}
            {record._count.documentos > 0 && (
              <Tooltip title="Ver documentos">
                <Button
                  type="text"
                  size="small"
                  icon={<FolderOpenOutlined style={{ color: "#FFD96D" }} />}
                  onClick={() => modalDocumentosRef.current?.open(record.id, false)}
                />
              </Tooltip>
            )}

            {/* 3. Subir Documento - Solo si no es Publicada y tiene permisos */}
            {canPerformAction(record) && !isPublicada && record.estado !== "Finalizada" && (
              <Tooltip title="Subir documento">
                <Button
                  type="text"
                  size="small"
                  icon={<UploadOutlined style={{ color: "#87CEEB" }} />}
                  onClick={() => modalDocumentosRef.current?.open(record.id, true)}
                />
              </Tooltip>
            )}

            {/* 4. Devolver - Solo si no es primer paso ni Publicada y tiene permisos */}
            {canPerformAction(record) && !isFirstStep && !isPublicada && record.estado !== "Finalizada" && (
              <Tooltip title="Devolver">
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowDownOutlined style={{ color: "#e53935" }} />}
                  onClick={() => modalDevolverRef.current?.open(record.id)}
                />
              </Tooltip>
            )}

            {/* 5. Avanzar - Solo si tiene permisos y no está finalizada */}
            {canPerformAction(record) && record.estado !== "Finalizada" && (
              <Popconfirm
                title="¿Desea avanzar esta licitación?"
                okText="Avanzar"
                cancelText="Cancelar"
                onConfirm={() => handleAvanzar(record.id)}
              >
                <Tooltip title="Avanzar">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowUpOutlined style={{ color: "#268e00" }} />}
                  />
                </Tooltip>
              </Popconfirm>
            )}

            {/* 6. Ver WorkFlow - Disponible para todos */}
            <Tooltip title="Ver workflow">
              <Button
                type="text"
                size="small"
                icon={<TableOutlined style={{ color: "#1890ff" }} />}
                onClick={() => modalWorkflowRef.current?.open(record.id)}
              />
            </Tooltip>

            {/* 7. Ver WorkFlow Super Admin - Solo para Super Admin */}
            {userType === "Super Admin" && (
              <Tooltip title="Workflow extendido">
                <Button
                  type="text"
                  size="small"
                  icon={<TableOutlined style={{ color: "#922b3e" }} />}
                  onClick={() => modalWorkflowRef.current?.open(record.id, true)}
                />
              </Tooltip>
            )}
          </Space>
        )
      }
    }
  ]

  const turnosOptions = [
    { value: "Licitador", label: "Licitador" },
    { value: "Secretario Juridico", label: "Secretario Jurídico" },
    { value: "Presupuesto", label: "Presupuesto" },
    { value: "Subdireccion Administrativa", label: "Subdirección Administrativa" }
  ]

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3} style={{ margin: 0 }}>Bandeja de Entrada</Title>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            loading={generatingExcel}
          >
            Generar Informe
          </Button>
        </div>

        <div className={styles.filters}>
          <Input
            placeholder="N° Licitación / MEMO"
            value={filters.numeroLicitacion}
            onChange={(e) => setFilters({ ...filters, numeroLicitacion: e.target.value })}
            style={{ width: 180 }}
            allowClear
          />

          {userType === "Super Admin" && (
            <Select
              placeholder="Creador"
              value={filters.usuarioId}
              onChange={(value) => setFilters({ ...filters, usuarioId: value })}
              style={{ width: 180 }}
              allowClear
              options={users.map((u) => ({
                value: u.id,
                label: `${u.name} ${u.lastname}`
              }))}
            />
          )}

          <Select
            placeholder="Estado"
            value={filters.estado}
            onChange={(value) => setFilters({ ...filters, estado: value })}
            style={{ width: 140 }}
            allowClear
            options={ESTADOS_LICITACION}
          />

          <Select
            placeholder="Filtrar por turno"
            value={filters.turno}
            onChange={(value) => setFilters({ ...filters, turno: value })}
            style={{ width: 200 }}
            allowClear
            options={userType === "Super Admin" ? turnosOptions : turnosOptions.filter(t => t.value === userType)}
          />

          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Buscar
          </Button>

          <Button icon={<ReloadOutlined />} onClick={() => { handleClearFilters(); loadData(); }}>
            Limpiar
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

      <ModalDevolver ref={modalDevolverRef} onSuccess={loadData} />
      <ModalHistorial ref={modalHistorialRef} />
      <ModalHistorialNuevo ref={modalHistorialNuevoRef} />
      <ModalWorkflow ref={modalWorkflowRef} />
      <ModalDocumentos ref={modalDocumentosRef} onSuccess={loadData} />
    </div>
  )
}

export default BandejaPage
