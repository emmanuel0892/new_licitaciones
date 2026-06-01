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
  ExclamationCircleOutlined,
  LockOutlined,
  EditOutlined,
  PlusOutlined,
  MinusOutlined
} from "@ant-design/icons"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getLicitaciones, avanzarLicitacion, avanzarLicitacionConInicioAnticipado, avanzarLicitacionConContrato, avanzarLicitacionConAddendum, finalizarLicitacionSinAddendum, getRoles } from "@/actions/licitaciones"
import { getLicitacionMercadoPublicoBandeja } from "@/actions/mercadoPublicoBandeja"
import { getUsers } from "@/actions/users"
import { formatDate, formatMoney, getEstadoColor, ESTADOS_LICITACION, getProcesoActualLicitacionLabel, esFormatoLicitacion, esFormatoTratoDirecto, getFormatoLabel, formatRoleLabel } from "@/lib/helpers"
import {
  getAdvancePermissionCode,
  getDocumentUploadPermissionCode,
  getDocumentViewPermissionCode,
  getHistoryPermissionCode,
  getMercadoPublicoEditPermissionCode,
  getReturnPermissionCode,
  getWorkflowViewPermissionCode
} from "@/lib/permissionCodes"
import ModalDevolver from "@/components/modals/ModalDevolver"
import ModalHistorial from "@/components/modals/ModalHistorial"
import ModalHistorialNuevo from "@/components/modals/ModalHistorialNuevo"
import ModalWorkflow from "@/components/modals/ModalWorkflow"
import ModalDocumentos from "@/components/modals/ModalDocumentos"
import ModalInicioAnticipado from "@/components/modals/ModalInicioAnticipado"
import ModalFirmarLicitacion from "@/components/modals/ModalFirmarLicitacion"
import ModalEditarCodigoMercadoPublico from "@/components/modals/ModalEditarCodigoMercadoPublico"
import MercadoPublicoDetalle from "@/components/licitaciones/MercadoPublicoDetalle"
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
  const [currentUserIsSuperAdmin, setCurrentUserIsSuperAdmin] = useState(false)
  const [currentUserPermissions, setCurrentUserPermissions] = useState([])
  const [filters, setFilters] = useState({
    numeroLicitacion: "",
    usuarioId: undefined,
    estado: undefined,
    roleId: undefined
  })
  const [generatingExcel, setGeneratingExcel] = useState(false)
  const [inicioAnticipadoModalData, setInicioAnticipadoModalData] = useState({ id: null, open: false })
  const [addendumModalData, setAddendumModalData] = useState({ id: null, open: false })
  const [codigoMercadoPublicoModalData, setCodigoMercadoPublicoModalData] = useState({ licitacion: null, open: false })
  const [expandedRows, setExpandedRows] = useState({})
  const [expandedOrdenesCompra, setExpandedOrdenesCompra] = useState({})
  const [mercadoPublicoData, setMercadoPublicoData] = useState({})
  const [loadingMercadoPublico, setLoadingMercadoPublico] = useState({})
  const [mercadoPublicoErrors, setMercadoPublicoErrors] = useState({})

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
      setCurrentUserIsSuperAdmin(Boolean(licResult.currentUser?.isSuperAdmin))
      setCurrentUserPermissions(licResult.currentUser?.permissions ?? [])
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
        setCurrentUserIsSuperAdmin(Boolean(licResult.currentUser?.isSuperAdmin))
        setCurrentUserPermissions(licResult.currentUser?.permissions ?? [])
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
      setCurrentUserIsSuperAdmin(Boolean(result.currentUser?.isSuperAdmin))
      setCurrentUserPermissions(result.currentUser?.permissions ?? [])
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

  const hasPermission = (permissionCode) => {
    return currentUserIsSuperAdmin || currentUserPermissions.includes(permissionCode)
  }

  const hasWorkflowPermission = (action, record) => {
    const currentStep = Number(record.procesoActual?.numeroPaso)
    const permissionCode = action === "avanzar"
      ? getAdvancePermissionCode(record, currentStep)
      : getReturnPermissionCode(record, currentStep)

    return hasPermission(permissionCode)
  }

  const getMissingWorkflowPermissionMessage = (action, record) => {
    if (!esFormatoTratoDirecto(record)) {
      return `No tienes permisos para ${action} este paso.`
    }

    return action === "avanzar"
      ? "No tienes permisos para avanzar este paso de Trato Directo."
      : "No tienes permisos para devolver este paso de Trato Directo."
  }

  const getCodigoMercadoPublico = (record) => {
    return record.codigoMercadoPublico ?? record.codigo_mercado_publico ?? null
  }

  const getCodigoVisible = (record) => {
    return getCodigoMercadoPublico(record) ??
      record.numeroLicitacion ??
      record.numero_licitacion ??
      null
  }

  const canViewMercadoPublico = (record) => {
    return Boolean(getCodigoMercadoPublico(record)) && hasPermission("mercado_publico.ver")
  }

  const handleLoadMercadoPublico = async (record) => {
    const codigoMercadoPublico = getCodigoMercadoPublico(record)
    const cachedResult = mercadoPublicoData[record.id]

    if (!codigoMercadoPublico || cachedResult?.codigo === codigoMercadoPublico) {
      return
    }

    setLoadingMercadoPublico((current) => ({ ...current, [record.id]: true }))
    setMercadoPublicoErrors((current) => ({ ...current, [record.id]: null }))

    try {
      const result = await getLicitacionMercadoPublicoBandeja(codigoMercadoPublico)

      if (result.error) {
        throw new Error(result.error || "No se pudo consultar Mercado Publico.")
      }

      setMercadoPublicoData((current) => ({
        ...current,
        [record.id]: {
          codigo: codigoMercadoPublico,
          data: result.data
        }
      }))
    } catch (error) {
      setMercadoPublicoErrors((current) => ({
        ...current,
        [record.id]: error.message || "No se pudo consultar Mercado Publico."
      }))
    } finally {
      setLoadingMercadoPublico((current) => ({ ...current, [record.id]: false }))
    }
  }

  const handleToggleMercadoPublicoRow = async (record) => {
    if (!canViewMercadoPublico(record)) return

    if (expandedRows[record.id]) {
      setExpandedRows((current) => ({ ...current, [record.id]: false }))
      return
    }

    setExpandedRows((current) => ({ ...current, [record.id]: true }))
    await handleLoadMercadoPublico(record)
  }

  const handleOpenCodigoMercadoPublico = (record) => {
    setCodigoMercadoPublicoModalData({ licitacion: record, open: true })
  }

  const handleCodigoMercadoPublicoSaved = (record, updatedMercadoPublicoFields) => {
    const updatedRecord = { ...record, ...updatedMercadoPublicoFields }

    setCodigoMercadoPublicoModalData({ licitacion: null, open: false })
    setLicitaciones((current) => current.map((licitacion) => (
      licitacion.id === record.id ? updatedRecord : licitacion
    )))

    setExpandedRows((current) => ({ ...current, [record.id]: false }))
    setExpandedOrdenesCompra((current) => ({ ...current, [record.id]: [] }))
    setMercadoPublicoData((current) => {
      const nextData = { ...current }
      delete nextData[record.id]
      return nextData
    })
    setMercadoPublicoErrors((current) => ({ ...current, [record.id]: null }))
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
      width: 180,
      render: (_, record) => {
        const codigoVisible = getCodigoVisible(record)
        const puedeExpandir = canViewMercadoPublico(record)
        const isExpanded = Boolean(expandedRows[record.id])

        return (
          <div className={styles.numeroLicitacionCell}>
            {puedeExpandir && (
              <Button
                type="text"
                size="small"
                className={styles.expandButton}
                aria-label={isExpanded ? "Ocultar datos Mercado Publico" : "Ver datos Mercado Publico"}
                title={isExpanded ? "Ocultar datos Mercado Publico" : "Ver datos Mercado Publico"}
                icon={isExpanded ? <MinusOutlined /> : <PlusOutlined />}
                onClick={() => handleToggleMercadoPublicoRow(record)}
              />
            )}
            {codigoVisible
              ? <span className={styles.numeroLicitacionText}>{codigoVisible}</span>
              : <Text type="secondary">Sin numero</Text>}
          </div>
        )
      }
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
      render: (text) => {
        return (
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
      }
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
      render: (text) => <Tag color={getEstadoColor(text)}>{text}</Tag>
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
        const hasPendingSignatures = requiredSignatures.some((signature) => !signature.completed)
        const canOpenSignatureModal = requiredSignatures.some((signature) => (
          !signature.completed && hasPermission(signature.permissionCode)
        ))

        if (requiredSignatures.length === 0) {
          return <Text type="secondary">No aplica</Text>
        }

        return (
          <Space direction="vertical" size={4} className={styles.signatureCell}>
            <Text strong>Firmas requeridas</Text>
            {requiredSignatures.map((signature) => {
              const blocked = signature.status === "bloqueada"
              const statusLabel = signature.completed ? "Firmada" : blocked ? "Bloqueada" : "Pendiente"
              const statusColor = signature.completed ? "success" : blocked ? "default" : "warning"
              const statusIcon = signature.completed
                ? <CheckCircleOutlined />
                : blocked
                  ? <LockOutlined />
                  : <ExclamationCircleOutlined />

              return (
                <Tag
                  key={signature.label}
                  color={statusColor}
                  icon={statusIcon}
                  className={styles.signatureTag}
                >
                  {signature.label}: {statusLabel}
                </Tag>
              )
            })}

            <Space size={0} split={<Text type="secondary">|</Text>}>
              <Button
                type="link"
                size="small"
                className={styles.signatureUploadButton}
                onClick={() => router.push("/dashboard/usuarios")}
              >
                Subir firma
              </Button>
              {!hasPendingSignatures ? null : canOpenSignatureModal ? (
                <Button
                  type="link"
                  size="small"
                  className={styles.signatureUploadButton}
                  onClick={() => modalFirmarRef.current?.open(record)}
                >
                  Firmar
                </Button>
              ) : (
                <Tooltip title="No tienes permisos para firmar en esta etapa.">
                  <span>
                    <Button
                      type="link"
                      size="small"
                      disabled
                      className={styles.signatureUploadButton}
                    >
                      Firmar
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Space>
          </Space>
        )
      }
    },
    {
      title: "Acciones",
      key: "actions",
      fixed: "right",
      width: 240,
      onHeaderCell: () => ({
        className: styles.actionsHeader
      }),
      onCell: () => ({
        className: styles.actionsCell
      }),
      render: (_, record) => {
        const isPublicada = record.procesoActual?.tituloProceso === "Publicada"
        const currentStep = Number(record.procesoActual?.numeroPaso)
        const isFirstStep = currentStep === 1
        const isTratoDirectoStepFive = esFormatoTratoDirecto(record) && currentStep === 5
        const canViewHistory = hasPermission(getHistoryPermissionCode(record))
        const canViewDocuments = hasPermission(getDocumentViewPermissionCode(record))
        const canUploadDocuments = hasPermission(getDocumentUploadPermissionCode(record))
        const canViewWorkflow = hasPermission(getWorkflowViewPermissionCode(record))
        const canEditMercadoPublicoCode = (
          hasPermission(getMercadoPublicoEditPermissionCode(record)) &&
          (
            (isFirstStep && esFormatoLicitacion(record.formatoLiquidacion.titulo)) ||
            isTratoDirectoStepFive
          )
        )
        const missingSignatures = record.signatureValidation?.missing || []
        const hasMissingSignatures = missingSignatures.length > 0
        const missingSignaturesMessage = getMissingSignaturesMessage(missingSignatures)

        return (
          <Space size={10} className={styles.actionsButtons}>
            {canEditMercadoPublicoCode && (
              <Tooltip title="Editar codigo Mercado Publico">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ color: "#1677ff" }} />}
                  onClick={() => handleOpenCodigoMercadoPublico(record)}
                />
              </Tooltip>
            )}

            {/* 0. Ver Historial */}
            {canViewHistory && (
              <Tooltip title="Ver historial">
              <Button
                type="text"
                size="small"
                icon={<HistoryOutlined style={{ color: "#722ed1" }} />}
                onClick={() => modalHistorialNuevoRef.current?.open(record.id, record)}
              />
              </Tooltip>
            )}

            {/* 1. Ver documentos asociados al numero de licitacion actual */}
            {canViewDocuments && (
              <Tooltip title="Ver documentos">
                <Button
                  type="text"
                  size="small"
                  icon={<FolderOpenOutlined style={{ color: "#FFD96D" }} />}
                  onClick={() => modalDocumentosRef.current?.open(record, false)}
                />
              </Tooltip>
            )}

            {/* 3. Subir Documento - Solo si no es Publicada y tiene permisos */}
            {(() => {
              const isLicitacion = esFormatoLicitacion(record.formatoLiquidacion.titulo)
              const currentStep = Number(record.procesoActual?.numeroPaso)
              const isLastStep = isLicitacion && currentStep === 24
              
              return canUploadDocuments && !isPublicada && record.estado !== "Finalizada" && !isLastStep
            })() && (
              <Tooltip title="Subir documento">
                <Button
                  type="text"
                  size="small"
                  icon={<UploadOutlined style={{ color: "#87CEEB" }} />}
                  onClick={() => modalDocumentosRef.current?.open(record, true)}
                />
              </Tooltip>
            )}

            {/* 4. Devolver - Visible durante el flujo y deshabilitado sin permiso */}
            {(() => {
              const isLicitacion = esFormatoLicitacion(record.formatoLiquidacion.titulo)
              const currentStep = Number(record.procesoActual?.numeroPaso)
              const isLastStep = isLicitacion && currentStep === 24
              
              return !isFirstStep && !isPublicada && record.estado !== "Finalizada" && !isLastStep
            })() && (
              hasWorkflowPermission("devolver", record) ? (
                <Tooltip title="Devolver">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowDownOutlined style={{ color: "#e53935" }} />}
                    onClick={() => modalDevolverRef.current?.open(record.id)}
                  />
                </Tooltip>
              ) : (
                <Tooltip title={getMissingWorkflowPermissionMessage("devolver", record)}>
                  <span>
                    <Button
                      type="text"
                      size="small"
                      disabled
                      icon={<ArrowDownOutlined />}
                    />
                  </span>
                </Tooltip>
              )
            )}

            {/* 5. Avanzar - Visible durante el flujo y deshabilitado sin permiso */}
            {(() => {
              const isLicitacion = esFormatoLicitacion(record.formatoLiquidacion.titulo)
              const currentStep = Number(record.procesoActual?.numeroPaso)
              const isLastStep = isLicitacion && currentStep === 24
              
              return record.estado !== "Finalizada" && !isLastStep
            })() && (
              !hasWorkflowPermission("avanzar", record) ? (
                <Tooltip title={getMissingWorkflowPermissionMessage("avanzar", record)}>
                  <span>
                    <Button
                      type="text"
                      size="small"
                      disabled
                      icon={<ArrowUpOutlined />}
                    />
                  </span>
                </Tooltip>
              ) : hasMissingSignatures ? (
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

            {/* 6. Ver WorkFlow */}
            {canViewWorkflow && (
              <Tooltip title="Ver workflow">
              <Button
                type="text"
                size="small"
                icon={<TableOutlined style={{ color: "#1890ff" }} />}
                onClick={() => modalWorkflowRef.current?.open(record.id)}
              />
              </Tooltip>
            )}

            {/* 7. Ver WorkFlow Super Admin - Solo para Super Admin */}
            {currentUserIsSuperAdmin && canViewWorkflow && (
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

        <div className={styles.tableWrapper}>
          <Table
            className={styles.bandejaTable}
            columns={columns}
            dataSource={licitaciones}
            loading={loading}
            scroll={{ x: 1960 }}
            expandable={{
              expandedRowKeys: Object.entries(expandedRows)
                .filter(([, expanded]) => expanded)
                .map(([id]) => Number(id)),
              rowExpandable: canViewMercadoPublico,
              showExpandColumn: false,
              expandedRowClassName: () => styles.mercadoPublicoExpandedRow,
              expandedRowRender: (record) => (
                <MercadoPublicoDetalle
                  data={mercadoPublicoData[record.id]?.data}
                  loading={loadingMercadoPublico[record.id]}
                  error={mercadoPublicoErrors[record.id]}
                  expandedOrdenKeys={expandedOrdenesCompra[record.id] ?? []}
                  onExpandedOrdenKeysChange={(keys) => {
                    setExpandedOrdenesCompra((current) => ({ ...current, [record.id]: keys }))
                  }}
                />
              )
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `Total: ${total} licitaciones`
            }}
          />
        </div>
      </Card>

      <ModalDevolver ref={modalDevolverRef} onSuccess={loadData} />
      <ModalHistorial ref={modalHistorialRef} />
      <ModalHistorialNuevo ref={modalHistorialNuevoRef} />
      <ModalWorkflow ref={modalWorkflowRef} />
      <ModalDocumentos ref={modalDocumentosRef} onSuccess={loadData} />
      <ModalFirmarLicitacion ref={modalFirmarRef} onSuccess={loadData} currentUserId={userId} />
      <ModalEditarCodigoMercadoPublico
        open={codigoMercadoPublicoModalData.open}
        licitacion={codigoMercadoPublicoModalData.licitacion}
        onCancel={() => setCodigoMercadoPublicoModalData({ licitacion: null, open: false })}
        onSuccess={handleCodigoMercadoPublicoSaved}
      />
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
