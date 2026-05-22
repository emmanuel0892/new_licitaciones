"use client"

import { useState, useEffect, useRef } from "react"
import { Table, Button, Space, Tag, Typography, Card, App, Popconfirm, Input, Select, Tooltip, Modal } from "antd"
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
  HistoryOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getLicitaciones, avanzarLicitacion, avanzarLicitacionConInicioAnticipado, avanzarLicitacionConContrato, avanzarLicitacionConAddendum, finalizarLicitacionSinAddendum, getRoles } from "@/actions/licitaciones"
import { getUsers } from "@/actions/users"
import { formatDate, formatMoney, getEstadoColor, ESTADOS_LICITACION, getProcesoActualLicitacionLabel, esFormatoLicitacion, getFormatoLabel, formatRoleLabel } from "@/lib/helpers"
import ModalDevolver from "@/components/modals/ModalDevolver"
import ModalHistorial from "@/components/modals/ModalHistorial"
import ModalHistorialNuevo from "@/components/modals/ModalHistorialNuevo"
import ModalWorkflow from "@/components/modals/ModalWorkflow"
import ModalDocumentos from "@/components/modals/ModalDocumentos"
import ModalInicioAnticipado from "@/components/modals/ModalInicioAnticipado"
import ModalFirmarLicitacion from "@/components/modals/ModalFirmarLicitacion"
import * as XLSX from "xlsx"
import styles from "./bandeja.module.css"

const { Title, Text } = Typography

const BandejaPage = () => {
  const { message } = App.useApp()
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [licitaciones, setLicitaciones] = useState([])
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [filters, setFilters] = useState({
    numeroLicitacion: "",
    usuarioId: undefined,
    estado: undefined,
    roleId: undefined
  })
  const [generatingExcel, setGeneratingExcel] = useState(false)
  const [inicioAnticipadoModalData, setInicioAnticipadoModalData] = useState({ id: null, open: false })
  const [addendumModalData, setAddendumModalData] = useState({ id: null, open: false })

  const modalDevolverRef = useRef(null)
  const modalHistorialRef = useRef(null)
  const modalHistorialNuevoRef = useRef(null)
  const modalWorkflowRef = useRef(null)
  const modalDocumentosRef = useRef(null)
  const modalFirmarRef = useRef(null)

  const userType = session?.user?.typeAccount
  const userId = session?.user?.id

  const loadData = async () => {
    setLoading(true)
    const [licResult, usersResult, rolesResult] = await Promise.all([
      getLicitaciones(filters),
      getUsers(),
      getRoles()
    ])

    if (licResult.data) {
      setLicitaciones(licResult.data.map((l) => ({ ...l, key: l.id })))
    }

    if (usersResult.data) {
      setUsers(usersResult.data)
    }

    if (rolesResult.data) {
      setRoles(rolesResult.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    let ignore = false

    const loadInitialData = async () => {
      const initialFilters = {
        numeroLicitacion: "",
        usuarioId: undefined,
        estado: undefined,
        roleId: undefined
      }

      const [licResult, usersResult, rolesResult] = await Promise.all([
        getLicitaciones(initialFilters),
        getUsers(),
        getRoles()
      ])

      if (ignore) {
        return
      }

      if (licResult.data) {
        setLicitaciones(licResult.data.map((l) => ({ ...l, key: l.id })))
      }

      if (usersResult.data) {
        setUsers(usersResult.data)
      }

      if (rolesResult.data) {
        setRoles(rolesResult.data)
      }

      setLoading(false)
    }

    loadInitialData()

    return () => {
      ignore = true
    }
  }, [])

  const handleSearch = async () => {
    if (!filters.numeroLicitacion && !filters.usuarioId && !filters.estado && !filters.roleId) {
      message.warning("Debe ingresar al menos un filtro")
      return
    }
    await loadData()
  }

  const handleClearFilters = async () => {
    const emptyFilters = {
      numeroLicitacion: "",
      usuarioId: undefined,
      estado: undefined,
      roleId: undefined
    }
    setFilters(emptyFilters)
    
    const result = await getLicitaciones(emptyFilters)
    if (result.data) {
      setLicitaciones(result.data.map((l) => ({ ...l, key: l.id })))
    }
  }

  const handleAvanzar = async (id) => {
    message.loading("Avanzando licitación...")
    const result = await avanzarLicitacion(id)
    if (result.success) {
      message.success(result.message || "Licitación avanzada correctamente")
      loadData()
    } else if (result.showInicioAnticipadoModal) {
      message.destroy()
      setInicioAnticipadoModalData({ id, open: true })
    } else if (result.showAddendumModal) {
      message.destroy()
      setAddendumModalData({ id, open: true })
    } else {
      message.error(result.error || "Error al avanzar")
    }
  }

  const handleInicioAnticipadoConfirm = async () => {
    if (inicioAnticipadoModalData.id) {
      message.loading("Iniciando flujo anticipado...")
      const result = await avanzarLicitacionConInicioAnticipado(inicioAnticipadoModalData.id)
      if (result.success) {
        message.success("Flujo inicio anticipado iniciado correctamente")
        loadData()
      } else {
        message.error(result.error || "Error al iniciar flujo anticipado")
      }
    }
    setInicioAnticipadoModalData({ id: null, open: false })
  }

  const handleContratoConfirm = async () => {
    if (inicioAnticipadoModalData.id) {
      message.loading("Iniciando flujo de contrato...")
      const result = await avanzarLicitacionConContrato(inicioAnticipadoModalData.id)
      if (result.success) {
        message.success("Flujo de contrato iniciado correctamente")
        loadData()
      } else {
        message.error(result.error || "Error al iniciar flujo de contrato")
      }
    }
    setInicioAnticipadoModalData({ id: null, open: false })
  }

  const handleInicioAnticipadoCancel = () => {
    setInicioAnticipadoModalData({ id: null, open: false })
  }

  const handleAddendumConfirm = async () => {
    if (addendumModalData.id) {
      message.loading("Iniciando flujo Addendum...")
      const result = await avanzarLicitacionConAddendum(addendumModalData.id)

      if (result.success) {
        message.success("Flujo Addendum iniciado correctamente")
        loadData()
      } else {
        message.error(result.error || "Error al iniciar flujo Addendum")
      }
    }

    setAddendumModalData({ id: null, open: false })
  }

  const handleAddendumReject = async () => {
    if (addendumModalData.id) {
      message.loading("Finalizando licitación...")
      const result = await finalizarLicitacionSinAddendum(addendumModalData.id)

      if (result.success) {
        message.success(result.message || "Licitación finalizada correctamente")
        loadData()
      } else {
        message.error(result.error || "Error al finalizar licitación")
      }
    }

    setAddendumModalData({ id: null, open: false })
  }

  const handleAddendumCancel = () => {
    setAddendumModalData({ id: null, open: false })
  }

  const handleExportExcel = async () => {
    setGeneratingExcel(true)
    message.loading("Generando informe...")

    const dataExcel = licitaciones.map((l) => ({
      "Número de Licitación": l.numeroLicitacion || "Sin número",
      "Nombre de Licitación": l.nombreLicitacion,
      "Formato": getFormatoLabel(l.formatoLiquidacion.titulo),
      "Creador": `${l.usuario.name} ${l.usuario.lastname}`,
      "Requirente": l.requirente,
      "Monto Presupuestado": l.montoPresupuestado || "Sin Monto",
      "Vigencia": l.vigencia ? formatDate(l.vigencia) : "-",
      "Estado": l.estado,
      "Proceso Actual": esFormatoLicitacion(l.formatoLiquidacion.titulo) ? getProcesoActualLicitacionLabel(l.procesoActual) : l.procesoActual.tituloProceso,
      "Fecha de Creación": formatDate(l.createdAt)
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
    return record.procesoActual.roleId === userType
  }

  const getMissingSignaturesMessage = (missingSignatures = []) => {
    if (missingSignatures.length === 0) {
      return ""
    }

    return `Faltan firmas obligatorias: ${missingSignatures.join(", ")}`
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
      title: "Nombre de la Licitación",
      dataIndex: "nombreLicitacion",
      key: "nombre",
      width: 280,
      render: (text) => (
        <Tooltip title={text || "Sin nombre"}>
          <div style={{
            minWidth: "240px",
            maxWidth: "280px",
            whiteSpace: "normal",
            wordBreak: "break-word",
            lineHeight: "1.3",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {text || <Text type="secondary">Sin nombre</Text>}
          </div>
        </Tooltip>
      )
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
      width: 200,
      render: (titulo, record) => {
        let procesoLabel = esFormatoLicitacion(record.formatoLiquidacion.titulo) 
          ? getProcesoActualLicitacionLabel(record.procesoActual) 
          : titulo
        
        // Quitar el número inicial si tiene formato "X Nombre"
        if (procesoLabel && /^\d+\s+/.test(procesoLabel)) {
          procesoLabel = procesoLabel.replace(/^\d+\s+/, "")
        }
        
        return (
          <Tooltip title={procesoLabel}>
            <div className={styles.procesoActualCell}>
              <span className={styles.procesoActualText}>
                {procesoLabel}
              </span>
            </div>
          </Tooltip>
        )
      }
    },
    {
      title: "Rol Responsable",
      dataIndex: ["procesoActual", "role", "name"],
      key: "rol",
      width: 150,
      render: (roleName) => roleName ? formatRoleLabel(roleName) : <Text type="secondary">Sin asignar</Text>
    },
    {
      title: "Firmas requeridas",
      key: "firmas",
      width: 230,
      render: (_, record) => {
        const requiredSignatures = record.signatureValidation?.required || []

        if (requiredSignatures.length === 0) {
          return <Text type="secondary">No aplica</Text>
        }

        return (
          <Space direction="vertical" size={4} className={styles.signatureCell}>
            <Text strong>Firmas requeridas</Text>
            {requiredSignatures.map((signature) => (
              <Tag
                key={signature.label}
                color={signature.completed ? "success" : "warning"}
                icon={signature.completed ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                className={styles.signatureTag}
              >
                {signature.label}: {signature.completed ? "Firmada" : "Pendiente"}
              </Tag>
            ))}

            <Space size={0} split={<Text type="secondary">|</Text>}>
              <Button
                type="link"
                size="small"
                className={styles.signatureUploadButton}
                onClick={() => router.push("/dashboard/usuarios")}
              >
                Subir firma
              </Button>
              <Button
                type="link"
                size="small"
                className={styles.signatureUploadButton}
                onClick={() => modalFirmarRef.current?.open(record)}
              >
                Firmar
              </Button>
            </Space>
          </Space>
        )
      }
    },
    {
      title: "Acciones",
      key: "actions",
      fixed: "right",
      width: 220,
      render: (_, record) => {
        const isPublicada = record.procesoActual?.tituloProceso === "Publicada"
        const isFirstStep = record.procesoActual?.numeroPaso === 1
        const missingSignatures = record.signatureValidation?.missing || []
        const hasMissingSignatures = missingSignatures.length > 0
        const missingSignaturesMessage = getMissingSignaturesMessage(missingSignatures)

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
            {(() => {
              const isLicitacion = esFormatoLicitacion(record.formatoLiquidacion.titulo)
              const currentStep = Number(record.procesoActual?.numeroPaso)
              const isLastStep = isLicitacion && currentStep === 24
              
              return canPerformAction(record) && !isPublicada && record.estado !== "Finalizada" && !isLastStep
            })() && (
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
            {(() => {
              const isLicitacion = esFormatoLicitacion(record.formatoLiquidacion.titulo)
              const currentStep = Number(record.procesoActual?.numeroPaso)
              const isLastStep = isLicitacion && currentStep === 24
              
              return canPerformAction(record) && !isFirstStep && !isPublicada && record.estado !== "Finalizada" && !isLastStep
            })() && (
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
            {(() => {
              const isLicitacion = esFormatoLicitacion(record.formatoLiquidacion.titulo)
              const currentStep = Number(record.procesoActual?.numeroPaso)
              const isLastStep = isLicitacion && currentStep === 24
              
              return canPerformAction(record) && record.estado !== "Finalizada" && !isLastStep
            })() && (
              hasMissingSignatures ? (
                <Tooltip title={missingSignaturesMessage}>
                  <span>
                    <Button
                      type="text"
                      size="small"
                      disabled
                      icon={<ArrowUpOutlined />}
                    />
                  </span>
                </Tooltip>
              ) : (
                [16, 35].includes(Number(record.procesoActual?.numeroPaso)) ? (
                  <Tooltip title="Avanzar">
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowUpOutlined style={{ color: "#268e00" }} />}
                      onClick={() => handleAvanzar(record.id)}
                    />
                  </Tooltip>
                ) : (
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
                )
              )
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

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3} style={{ margin: 0 }}>Bandeja de Entrada</Title>
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              loading={generatingExcel}
            >
              Generar Informe
            </Button>
          </Space>
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
            placeholder="Filtrar por rol"
            value={filters.roleId}
            onChange={(value) => setFilters({ ...filters, roleId: value })}
            style={{ width: 200 }}
            allowClear
            options={userType === "Super Admin" ? roles.map(r => ({ value: r.id, label: formatRoleLabel(r.name) })) : roles.filter(r => r.id === userType).map(r => ({ value: r.id, label: formatRoleLabel(r.name) }))}
          />

          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Buscar
          </Button>

          <Button icon={<ReloadOutlined />} onClick={handleClearFilters}>
            Limpiar
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={licitaciones}
          loading={loading}
          scroll={{ x: 1960 }}
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
      <ModalFirmarLicitacion ref={modalFirmarRef} onSuccess={loadData} currentUserId={userId} />
      <ModalInicioAnticipado
        open={inicioAnticipadoModalData.open}
        onConfirm={handleInicioAnticipadoConfirm}
        onContrato={handleContratoConfirm}
        onCancel={handleInicioAnticipadoCancel}
      />
      <Modal
        title="¿Requiere Addendum?"
        open={addendumModalData.open}
        onCancel={handleAddendumCancel}
        footer={[
          <Button key="no" onClick={handleAddendumReject}>
            No
          </Button>,
          <Button key="yes" type="primary" onClick={handleAddendumConfirm}>
            Sí
          </Button>
        ]}
      >
        <p>¿Requiere Addendum?</p>
      </Modal>
    </div>
  )
}

export default BandejaPage
