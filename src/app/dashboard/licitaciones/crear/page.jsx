"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  Card, Form, Input, Select, DatePicker, Button, Typography, Timeline, 
  Space, App, Modal, Row, Col, InputNumber, Statistic, Progress, Tag,
  List, Empty, Divider, Alert, Tooltip, Badge, Table, Spin
} from "antd"
import { 
  FileTextOutlined, DollarOutlined, PieChartOutlined, WarningOutlined,
  ClockCircleOutlined, CheckCircleOutlined, SearchOutlined, AlertOutlined,
  RightOutlined, InfoCircleOutlined, ShoppingCartOutlined, DownOutlined,
  SyncOutlined
} from "@ant-design/icons"
import { 
  getFormatosLiquidacion, getRequirentes, createLicitacion,
  getDashboardStats, buscarLicitacionesSimilares, getLicitacionesMPByRequirenteConAlerta
} from "@/actions/licitaciones"
import { getAllLicitacionesMPForTable } from "@/actions/mercadoPublico"
import { formatMoney } from "@/lib/helpers"
import dayjs from "dayjs"
import styles from "./crear.module.css"

const { Title, Text } = Typography
const { Option } = Select

const FORMATOS_CONFIG = {
  1: {
    nombre: "Adquisición",
    pasos: [
      "Confección de Bases", "Requerimiento referente técnico", "Jurídico",
      "Firmas Directivos y Partes", "Publicación", "Evaluación Técnica",
      "Preadjudicación y Comisión", "Presupuesto", "Jurídico",
      "Firmas Directivos y Partes", "Publicar"
    ],
    requiereNumero: true,
    requiereVigencia: true,
    requiereMonto: true
  },
  2: {
    nombre: "Contraloría",
    pasos: [
      "Confección de Bases", "Requerimiento referente técnico", "Jurídico",
      "Firmas Directivos y Partes", "Contraloría", "Publicación",
      "Comisión Apertura", "Evaluación Técnica", "Preadjudicación y Comisión",
      "Presupuesto", "Jurídico", "Firmas Directivos y Partes", "Publicar"
    ],
    requiereNumero: false,
    requiereVigencia: true,
    requiereMonto: true
  },
  3: {
    nombre: "Contrato",
    pasos: [
      "Confección de contrato", "Revisión jurídico", "Envío a proveedor",
      "Recepción de proveedor", "Resolución de contrato", "Revisión Jurídico",
      "Firmas Directivos y Partes", "Publicar"
    ],
    requiereNumero: true,
    requiereVigencia: true,
    requiereMonto: true
  },
  4: {
    nombre: "Suministro",
    pasos: [
      "Confección de Bases", "Requerimiento referente técnico", "Jurídico",
      "Firmas Directivos y Partes", "Publicación", "Evaluación Técnica",
      "Preadjudicación y Comisión", "Presupuesto", "Jurídico",
      "Firmas Directivos y Partes", "Publicar"
    ],
    requiereNumero: true,
    requiereVigencia: true,
    requiereMonto: true
  },
  5: {
    nombre: "Otros Trámites",
    pasos: [
      "Confección Documento", "Jurídico", "Firmas Directivos y Partes", "Publicar"
    ],
    requiereNumero: true,
    requiereVigencia: false,
    requiereMonto: false
  }
}

const CrearLicitacionPage = () => {
  const { message } = App.useApp()
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [formatos, setFormatos] = useState([])
  const [requirentes, setRequirentes] = useState([])
  const [selectedFormato, setSelectedFormato] = useState(null)
  const [newRequirente, setNewRequirente] = useState("")
  
  // Dashboard stats
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)
  
  // Panel inteligente
  const [licitacionesSimilares, setLicitacionesSimilares] = useState({ internas: [], mercadoPublico: [] })
  const [alertasRequirente, setAlertasRequirente] = useState([])
  const [searchingSimiles, setSearchingSimiles] = useState(false)

  // Tabla de Licitaciones MP
  const [licitacionesMP, setLicitacionesMP] = useState([])
  const [loadingLicitacionesMP, setLoadingLicitacionesMP] = useState(true)
  const [expandedLicKeys, setExpandedLicKeys] = useState([])
  const [expandedOCKeys, setExpandedOCKeys] = useState({})
  const [refreshingTable, setRefreshingTable] = useState(false)
  
  // Filtros de búsqueda
  const [searchText, setSearchText] = useState("")
  const [searchType, setSearchType] = useState("all")

  useEffect(() => {
    const loadData = async () => {
      const [formatosRes, requirentesRes, statsRes, licitacionesMPRes] = await Promise.all([
        getFormatosLiquidacion(),
        getRequirentes(),
        getDashboardStats(),
        getAllLicitacionesMPForTable()
      ])

      if (formatosRes.data) {
        setFormatos(formatosRes.data)
      }

      if (requirentesRes.data) {
        setRequirentes(requirentesRes.data.map(r => r.nombre))
      }

      if (statsRes.data) {
        setStats(statsRes.data)
      }

      if (licitacionesMPRes.data) {
        setLicitacionesMP(licitacionesMPRes.data)
      }

      setLoadingStats(false)
      setLoadingLicitacionesMP(false)
    }

    loadData()
  }, [])

  const handleFormatoChange = (value) => {
    setSelectedFormato(value ? parseInt(value) : null)
    form.setFieldsValue({
      numeroLicitacion: undefined,
      vigencia: undefined,
      montoPresupuestado: undefined
    })
  }

  const handleRequirenteChange = async (value) => {
    if (value) {
      const result = await getLicitacionesMPByRequirenteConAlerta(value)
      if (result.data) {
        setAlertasRequirente(result.data)
      }
    } else {
      setAlertasRequirente([])
    }
  }

  // Funciones para tabla expandible de Licitaciones MP
  const handleExpandLicitacion = (expanded, record) => {
    setExpandedLicKeys(expanded 
      ? [...expandedLicKeys, record.id] 
      : expandedLicKeys.filter(k => k !== record.id)
    )
  }

  const handleExpandOrden = (expanded, record, licitacionId) => {
    setExpandedOCKeys(prev => ({
      ...prev,
      [licitacionId]: expanded 
        ? [...(prev[licitacionId] || []), record.id]
        : (prev[licitacionId] || []).filter(k => k !== record.id)
    }))
  }

  const handleRefreshTable = async () => {
    setRefreshingTable(true)
    const result = await getAllLicitacionesMPForTable()
    if (result.data) {
      setLicitacionesMP(result.data)
      setExpandedLicKeys([])
      setExpandedOCKeys({})
      message.success("Datos actualizados correctamente")
    } else {
      message.error("Error al actualizar datos")
    }
    setRefreshingTable(false)
  }

  // Extraer código de item desde especificación (ej: "1 LAB-0611 descripción..." -> "LAB-0611")
  const extractCodigoItem = (especificacion) => {
    if (!especificacion) return ""
    const parts = especificacion.split(" ")
    return parts.length > 1 ? parts[1].toUpperCase() : ""
  }

  // Filtrar licitaciones según búsqueda
  const filteredLicitacionesMP = licitacionesMP.filter((lic) => {
    if (!searchText.trim()) return true
    
    const search = searchText.toUpperCase().trim()
    
    // Buscar en código de licitación
    const matchLicitacion = lic.codigoExterno?.toUpperCase().includes(search)
    
    // Buscar en órdenes de compra
    const matchOC = lic.ordenesCompra?.some((oc) => 
      oc.codigo?.toUpperCase().includes(search)
    )
    
    // Buscar en código de item (extraído de especificación)
    const matchItem = lic.ordenesCompra?.some((oc) =>
      oc.items?.some((item) => {
        const codigoItem = extractCodigoItem(item.especificacionComprador)
        return codigoItem.includes(search) || 
               String(item.codigoProducto || "").toUpperCase().includes(search)
      })
    )
    
    if (searchType === "licitacion") return matchLicitacion
    if (searchType === "oc") return matchOC
    if (searchType === "item") return matchItem
    
    // "all" - buscar en todos
    return matchLicitacion || matchOC || matchItem
  })

  const handleNombreChange = useCallback(
    debounce(async (nombre) => {
      const requirente = form.getFieldValue("requirente")
      if (nombre && nombre.length >= 5) {
        setSearchingSimiles(true)
        const result = await buscarLicitacionesSimilares(nombre, requirente)
        if (result.data) {
          setLicitacionesSimilares(result.data)
        }
        setSearchingSimiles(false)
      } else {
        setLicitacionesSimilares({ internas: [], mercadoPublico: [] })
      }
    }, 500),
    []
  )

  const handleSubmit = async (values) => {
    setLoading(true)
    setModalVisible(true)

    const config = FORMATOS_CONFIG[selectedFormato]

    const data = {
      formatoLiquidacionId: values.formatoLiquidacion,
      requirente: values.requirente,
      nombreLicitacion: values.nombreLicitacion,
      numeroLicitacion: config?.requiereNumero ? values.numeroLicitacion : "null",
      vigencia: config?.requiereVigencia && values.vigencia 
        ? values.vigencia.format("YYYY-MM-DD") 
        : "null",
      montoPresupuestado: config?.requiereMonto ? String(values.montoPresupuestado) : "null"
    }

    const result = await createLicitacion(data)

    setModalVisible(false)
    setLoading(false)

    if (result.success) {
      message.success("Licitación creada correctamente")
      form.resetFields()
      setSelectedFormato(null)
      setLicitacionesSimilares({ internas: [], mercadoPublico: [] })
      setAlertasRequirente([])
      router.push("/dashboard/licitaciones/mis-licitaciones")
    } else {
      message.error(result.error || "Error al crear la licitación")
    }
  }

  const config = selectedFormato ? FORMATOS_CONFIG[selectedFormato] : null

  const getConsumoColor = (porcentaje) => {
    if (porcentaje >= 90) return "#e53935"
    if (porcentaje >= 75) return "#fa8c16"
    if (porcentaje >= 50) return "#faad14"
    return "#52c41a"
  }

  const hasSimilares = licitacionesSimilares.internas?.length > 0 || licitacionesSimilares.mercadoPublico?.length > 0

  return (
    <div className={styles.container}>
      {/* Dashboard Superior - Cards de Estadísticas */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={12} sm={12} md={6}>
          <Card size="small" className={styles.statCard}>
            <Statistic
              title={
                <span className={styles.statTitle}>
                  <FileTextOutlined /> Licitaciones Activas
                </span>
              }
              value={stats?.licitacionesActivas || 0}
              styles={{ content: { color: "#1890ff" } }}
              suffix={
                stats?.proximasVencer > 0 && (
                  <Tooltip title="Próximas a vencer (30 días)">
                    <Badge count={stats.proximasVencer} style={{ backgroundColor: "#faad14" }} />
                  </Tooltip>
                )
              }
            />
            {stats?.proximasVencer > 0 && (
              <Text type="warning" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> {stats.proximasVencer} próximas a vencer
              </Text>
            )}
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card size="small" className={styles.statCard}>
            <Statistic
              title={
                <span className={styles.statTitle}>
                  <DollarOutlined /> Presupuesto Anual
                </span>
              }
              value={stats?.presupuestoTotal || 0}
              formatter={(value) => formatMoney(value)}
              styles={{ content: { fontSize: 18 } }}
            />
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Utilizado: {formatMoney(stats?.montoComprometido || 0)}
              </Text>
              <br />
              <Text style={{ fontSize: 11, color: "#52c41a" }}>
                Disponible: {formatMoney(stats?.saldoDisponible || 0)}
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card size="small" className={styles.statCard}>
            <Statistic
              title={
                <span className={styles.statTitle}>
                  <PieChartOutlined /> Ejecución Presupuestaria
                </span>
              }
              value={Math.round(stats?.porcentajeEjecucion || 0)}
              suffix="%"
              styles={{ content: { color: getConsumoColor(stats?.porcentajeEjecucion || 0) } }}
            />
            <Progress 
              percent={Math.round(stats?.porcentajeEjecucion || 0)} 
              strokeColor={getConsumoColor(stats?.porcentajeEjecucion || 0)}
              size="small"
              showInfo={false}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card size="small" className={styles.statCard}>
            <Statistic
              title={
                <span className={styles.statTitle}>
                  <WarningOutlined /> Alertas Consumo MP
                </span>
              }
              value={stats?.alertasActivas || 0}
              styles={{ content: { color: stats?.alertasActivas > 0 ? "#e53935" : "#52c41a" } }}
              prefix={stats?.alertasActivas > 0 ? <AlertOutlined /> : <CheckCircleOutlined />}
            />
            {stats?.porcentajeConsumoMP > 0 && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Consumo MP: {Math.round(stats.porcentajeConsumoMP)}%
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Contenido Principal */}
      <Row gutter={24}>
        {/* Formulario de Creación */}
        <Col xs={24} lg={10}>
          <Card className={styles.card}>
            <Title level={4} style={{ marginBottom: 20 }}>
              <FileTextOutlined style={{ marginRight: 8, color: "#23aeaa" }} />
              Crear Nueva Licitación
            </Title>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="large"
            >
              <Form.Item
                name="formatoLiquidacion"
                label="Formato de Liquidación"
                rules={[{ required: true, message: "Seleccione un formato" }]}
              >
                <Select
                  placeholder="Seleccione un formato"
                  onChange={handleFormatoChange}
                >
                  {Object.entries(FORMATOS_CONFIG).map(([key, value]) => (
                    <Option key={key} value={key}>{value.nombre}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="requirente"
                label="Requirente / Servicio"
                rules={[{ required: true, message: "Ingrese el requirente" }]}
                extra="Al seleccionar un requirente se mostrarán alertas de consumo relacionadas"
              >
                <Select
                  showSearch
                  placeholder="Buscar o agregar requirente"
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  onSearch={(value) => setNewRequirente(value)}
                  onChange={handleRequirenteChange}
                >
                  {newRequirente && !requirentes.includes(newRequirente) && (
                    <Option key={newRequirente} value={newRequirente} label={`${newRequirente} (nuevo)`}>
                      {newRequirente} (nuevo)
                    </Option>
                  )}
                  {requirentes.map((req) => (
                    <Option key={req} value={req} label={req}>{req}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="nombreLicitacion"
                label="Nombre de la Licitación"
                rules={[{ required: true, message: "Ingrese el nombre" }]}
                extra="Se buscarán automáticamente licitaciones similares"
              >
                <Input 
                  placeholder="Ingrese el nombre de la licitación" 
                  onChange={(e) => handleNombreChange(e.target.value)}
                  suffix={searchingSimiles ? <SearchOutlined spin /> : null}
                />
              </Form.Item>

              {config?.requiereNumero && (
                <Form.Item
                  name="numeroLicitacion"
                  label="Número de Licitación"
                  rules={[{ required: true, message: "Ingrese el número" }]}
                >
                  <Input placeholder="Ej: 2024-LP-001" />
                </Form.Item>
              )}

              <Row gutter={16}>
                {config?.requiereVigencia && (
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="vigencia"
                      label="Vigencia"
                      rules={[{ required: true, message: "Seleccione la fecha" }]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        format="DD-MM-YYYY"
                        placeholder="Seleccione fecha"
                      />
                    </Form.Item>
                  </Col>
                )}

                {config?.requiereMonto && (
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="montoPresupuestado"
                      label="Monto Presupuestado"
                      rules={[{ required: true, message: "Ingrese el monto" }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        placeholder="Ingrese el monto"
                        formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                        parser={(value) => value.replace(/\$\s?|(\.)/g, "")}
                        min={0}
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              <Form.Item style={{ marginTop: 24 }}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Crear Licitación
                  </Button>
                  <Button onClick={() => {
                    form.resetFields()
                    setSelectedFormato(null)
                    setLicitacionesSimilares({ internas: [], mercadoPublico: [] })
                    setAlertasRequirente([])
                  }}>
                    Limpiar
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Panel Derecho - Flujo y Análisis */}
        <Col xs={24} lg={14} className={styles.rightPanel}>
          <Row gutter={24}>
            {/* Flujo de Trabajo */}
            <Col xs={24} className={styles.rightPanelCol}>
              {selectedFormato && config ? (
                <Card 
                  size="small" 
                  title={
                    <span>
                      <RightOutlined style={{ color: "#23aeaa", marginRight: 8 }} />
                      Flujo: {config.nombre}
                    </span>
                  }
                  className={styles.flowCard}
                >
                  <Timeline
                    mode="start"
                    items={config.pasos.map((paso, index) => ({
                      color: "#23aeaa",
                      children: (
                        <div className={styles.timelineItem}>
                          <Tag color="#23aeaa">{index + 1}</Tag>
                          <Text>{paso}</Text>
                        </div>
                      )
                    }))}
                  />
                </Card>
              ) : (
                <Card size="small" className={styles.emptyCard}>
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Seleccione un formato para ver el flujo de trabajo"
                  />
                </Card>
              )}
            </Col>

            {/* Alertas de Consumo del Requirente */}
            {alertasRequirente.length > 0 && (
              <Col xs={24}>
                <Card 
                  size="small"
                  title={
                    <span style={{ color: "#e53935" }}>
                      <AlertOutlined /> Alertas de Consumo del Requirente
                    </span>
                  }
                  className={styles.alertCard}
                >
                  <List
                    size="small"
                    dataSource={alertasRequirente}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <Space>
                              <Text strong>{item.codigoExterno}</Text>
                              <Tag color={getConsumoColor(item.porcentajeConsumo)}>
                                {Math.round(item.porcentajeConsumo)}% consumido
                              </Tag>
                            </Space>
                          }
                          description={item.nombre}
                        />
                        <Progress 
                          type="circle" 
                          percent={Math.round(item.porcentajeConsumo)} 
                          width={40}
                          strokeColor={getConsumoColor(item.porcentajeConsumo)}
                        />
                      </List.Item>
                    )}
                  />
                  <Alert
                    type="warning"
                    message="Se recomienda revisar estas licitaciones antes de crear una nueva"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
            )}

            {/* Licitaciones Similares */}
            {hasSimilares && (
              <Col xs={24}>
                <Card 
                  size="small"
                  title={
                    <span style={{ color: "#1890ff" }}>
                      <SearchOutlined /> Licitaciones Similares Encontradas
                    </span>
                  }
                  className={styles.similarCard}
                >
                  {licitacionesSimilares.internas?.length > 0 && (
                    <>
                      <Text strong style={{ display: "block", marginBottom: 8 }}>
                        <FileTextOutlined /> Internas ({licitacionesSimilares.internas.length})
                      </Text>
                      <List
                        size="small"
                        dataSource={licitacionesSimilares.internas}
                        renderItem={(item) => (
                          <List.Item>
                            <List.Item.Meta
                              title={item.nombreLicitacion}
                              description={
                                <Space size="small">
                                  <Tag>{item.formatoLiquidacion?.titulo}</Tag>
                                  <Tag color={item.estado === "Finalizada" ? "green" : "blue"}>
                                    {item.estado}
                                  </Tag>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </>
                  )}

                  {licitacionesSimilares.mercadoPublico?.length > 0 && (
                    <>
                      <Divider style={{ margin: "12px 0" }} />
                      <Text strong style={{ display: "block", marginBottom: 8 }}>
                        <PieChartOutlined /> Mercado Público ({licitacionesSimilares.mercadoPublico.length})
                      </Text>
                      <List
                        size="small"
                        dataSource={licitacionesSimilares.mercadoPublico}
                        renderItem={(item) => (
                          <List.Item>
                            <List.Item.Meta
                              title={
                                <Space>
                                  <Text strong>{item.codigoExterno}</Text>
                                  {item.porcentajeConsumo >= 50 && (
                                    <Tag color={getConsumoColor(item.porcentajeConsumo)}>
                                      {Math.round(item.porcentajeConsumo)}% consumido
                                    </Tag>
                                  )}
                                </Space>
                              }
                              description={item.nombre}
                            />
                          </List.Item>
                        )}
                      />
                    </>
                  )}

                  <Alert
                    type="info"
                    message="Verifique si alguna de estas licitaciones cubre la necesidad actual"
                    showIcon
                    icon={<InfoCircleOutlined />}
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
            )}
          </Row>
        </Col>
      </Row>

      {/* Tabla de Licitaciones Mercado Público */}
      <Card 
        className={styles.tableCard}
        title={
          <Space>
            <ShoppingCartOutlined style={{ color: "#23aeaa" }} />
            <span>Licitaciones Mercado Público</span>
            <Badge count={filteredLicitacionesMP.length} style={{ backgroundColor: "#23aeaa" }} />
            {searchText && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                (de {licitacionesMP.length} totales)
              </Text>
            )}
          </Space>
        }
        extra={
          <Space>
            <Space.Compact>
              <Select
                value={searchType}
                onChange={setSearchType}
                style={{ width: 140 }}
              >
                <Option value="all">Buscar en todo</Option>
                <Option value="licitacion">Cód. Licitación</Option>
                <Option value="oc">Cód. OC</Option>
                <Option value="item">Cód. Item</Option>
              </Select>
              <Input
                placeholder="Buscar..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Space.Compact>
            <Tooltip title="Los datos se sincronizan automáticamente cada 5 minutos">
              <Button 
                icon={<SyncOutlined spin={refreshingTable} />}
                onClick={handleRefreshTable}
                loading={refreshingTable}
              >
                Actualizar
              </Button>
            </Tooltip>
          </Space>
        }
      >
        <Table
          dataSource={filteredLicitacionesMP}
          rowKey="id"
          loading={loadingLicitacionesMP}
          size="small"
          expandable={{
            expandedRowKeys: expandedLicKeys,
            onExpand: handleExpandLicitacion,
            expandedRowRender: (record) => (
              <div style={{ padding: "8px 0" }}>
                <Text strong style={{ marginBottom: 8, display: "block" }}>
                  <ShoppingCartOutlined /> Órdenes de Compra ({record.ordenesCompra?.length || 0})
                </Text>
                {record.ordenesCompra?.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 20, color: "#999" }}>
                    No hay órdenes de compra registradas
                  </div>
                ) : (
                  <Table
                    dataSource={record.ordenesCompra || []}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    expandable={{
                      expandedRowKeys: expandedOCKeys[record.id] || [],
                      onExpand: (expanded, ocRecord) => handleExpandOrden(expanded, ocRecord, record.id),
                      expandedRowRender: (ocRecord) => (
                        <div style={{ padding: "8px 0" }}>
                          <Text strong style={{ marginBottom: 8, display: "block" }}>
                            Items de la Orden ({ocRecord.items?.length || 0})
                          </Text>
                          {ocRecord.items?.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 16, color: "#999" }}>
                              No hay items registrados
                            </div>
                          ) : (
                            <Table
                              dataSource={ocRecord.items || []}
                              rowKey="id"
                              size="small"
                              pagination={false}
                              columns={[
                                { title: "#", dataIndex: "correlativo", width: 50 },
                                { title: "Código", dataIndex: "codigoProducto", width: 100 },
                                { 
                                  title: "Producto", 
                                  dataIndex: "producto",
                                  ellipsis: true
                                },
                                { 
                                  title: "Especificación", 
                                  dataIndex: "especificacionComprador",
                                  ellipsis: true,
                                  width: 200
                                },
                                { 
                                  title: "Cantidad", 
                                  dataIndex: "cantidad",
                                  width: 90,
                                  align: "right",
                                  render: (v) => v?.toLocaleString("es-CL")
                                },
                                { 
                                  title: "P. Unitario", 
                                  dataIndex: "precioNeto",
                                  width: 110,
                                  align: "right",
                                  render: (v) => formatMoney(v)
                                },
                                { 
                                  title: "Total", 
                                  dataIndex: "total",
                                  width: 120,
                                  align: "right",
                                  render: (v) => <Text strong>{formatMoney(v)}</Text>
                                }
                              ]}
                            />
                          )}
                        </div>
                      )
                    }}
                    columns={[
                      { 
                        title: "Código OC", 
                        dataIndex: "codigo",
                        width: 150,
                        render: (v) => <Text copyable={{ text: v }}>{v}</Text>
                      },
                      { 
                        title: "Nombre", 
                        dataIndex: "nombre",
                        ellipsis: true
                      },
                      { 
                        title: "Proveedor", 
                        dataIndex: "nombreProveedor",
                        ellipsis: true,
                        width: 180
                      },
                      { 
                        title: "Estado", 
                        dataIndex: "estado",
                        width: 100,
                        render: (v) => (
                          <Tag color={v === "Aceptada" ? "green" : "blue"}>{v}</Tag>
                        )
                      },
                      { 
                        title: "Total", 
                        dataIndex: "total",
                        width: 120,
                        align: "right",
                        render: (v) => <Text strong>{formatMoney(v)}</Text>
                      },
                      { 
                        title: "Items", 
                        dataIndex: "_count",
                        width: 70,
                        align: "center",
                        render: (v) => <Badge count={v?.items || 0} style={{ backgroundColor: "#1890ff" }} />
                      },
                      { 
                        title: "Fecha", 
                        dataIndex: "fechaCreacion",
                        width: 100,
                        render: (v) => v ? dayjs(v).format("DD/MM/YYYY") : "-"
                      }
                    ]}
                  />
                )}
              </div>
            )
          }}
          columns={[
            { 
              title: "Código", 
              dataIndex: "codigoExterno",
              width: 140,
              render: (v) => <Text strong copyable={{ text: v }}>{v}</Text>
            },
            { 
              title: "Nombre Licitación", 
              dataIndex: "nombre",
              ellipsis: true
            },
            { 
              title: "Requirente", 
              dataIndex: "requirente",
              width: 150,
              ellipsis: true
            },
            { 
              title: "Monto Adjudicado", 
              dataIndex: "montoAdjudicado",
              width: 140,
              align: "right",
              render: (v) => formatMoney(v)
            },
            { 
              title: "Consumo", 
              dataIndex: "porcentajeConsumo",
              width: 180,
              render: (v, record) => {
                const percent = Math.round(v || 0)
                const color = percent >= 90 ? "#e53935" : percent >= 75 ? "#fa8c16" : percent >= 50 ? "#faad14" : "#52c41a"
                return (
                  <Tooltip title={`Consumido: ${formatMoney(record.montoConsumido)}`}>
                    <Progress 
                      percent={percent} 
                      size="small" 
                      strokeColor={color}
                      format={(p) => `${p}%`}
                    />
                  </Tooltip>
                )
              }
            },
            { 
              title: "OC", 
              dataIndex: "_count",
              width: 60,
              align: "center",
              render: (v) => <Badge count={v?.ordenesCompra || 0} style={{ backgroundColor: "#1890ff" }} />
            },
            { 
              title: "Estado", 
              dataIndex: "estado",
              width: 100,
              render: (v) => <Tag color={v === "Adjudicada" ? "green" : "blue"}>{v}</Tag>
            }
          ]}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true, 
            showTotal: (total) => `${total} licitaciones`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        open={modalVisible}
        footer={null}
        closable={false}
        centered
        width={300}
      >
        <div className={styles.loadingModal}>
          <div className={styles.spinner} />
          <Text>Creando licitación...</Text>
        </div>
      </Modal>
    </div>
  )
}

// Utilidad debounce
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export default CrearLicitacionPage
