"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Table, Card, Typography, Progress, Tag, Button, Space, Input, 
  Select, Tooltip, Badge, App, Row, Col, Statistic 
} from "antd"
import { 
  SearchOutlined, SyncOutlined, PlusOutlined, EyeOutlined,
  WarningOutlined, AlertOutlined, ExclamationCircleOutlined,
  FileTextOutlined
} from "@ant-design/icons"
import { getLicitacionesMP, getRequirentesMPUnicos, syncOrdenesCompraMP } from "@/actions/mercadoPublico"
import { formatMoney, formatDate } from "@/lib/helpers"
import ModalDetalleLicitacionMP from "@/components/modals/ModalDetalleLicitacionMP"
import ModalNuevaLicitacionMP from "@/components/modals/ModalNuevaLicitacionMP"
import styles from "./consumo.module.css"

const { Title, Text } = Typography

const ConsumoPage = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(null)
  const [licitaciones, setLicitaciones] = useState([])
  const [requirentes, setRequirentes] = useState([])
  const [filters, setFilters] = useState({
    requirente: undefined,
    codigo: "",
    alertaActiva: false
  })

  const modalDetalleRef = useRef(null)
  const modalNuevaRef = useRef(null)

  const loadData = async () => {
    setLoading(true)
    const [licResult, reqResult] = await Promise.all([
      getLicitacionesMP(filters),
      getRequirentesMPUnicos()
    ])

    if (licResult.data) {
      setLicitaciones(licResult.data)
    }

    if (reqResult.data) {
      setRequirentes(reqResult.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSearch = () => {
    loadData()
  }

  const handleSync = async (id) => {
    setSyncing(id)
    const result = await syncOrdenesCompraMP(id)
    if (result.success) {
      message.success("Sincronización completada")
      loadData()
    } else {
      message.error(result.error)
    }
    setSyncing(null)
  }

  const getConsumoColor = (porcentaje) => {
    if (porcentaje >= 90) return "#e53935"
    if (porcentaje >= 75) return "#fa8c16"
    if (porcentaje >= 50) return "#faad14"
    return "#52c41a"
  }

  const getAlertaIcon = (porcentaje) => {
    if (porcentaje >= 90) return <ExclamationCircleOutlined style={{ color: "#e53935" }} />
    if (porcentaje >= 75) return <AlertOutlined style={{ color: "#fa8c16" }} />
    if (porcentaje >= 50) return <WarningOutlined style={{ color: "#faad14" }} />
    return null
  }

  // Estadísticas generales
  const stats = {
    total: licitaciones.length,
    alerta50: licitaciones.filter(l => l.porcentajeConsumo >= 50 && l.porcentajeConsumo < 75).length,
    alerta75: licitaciones.filter(l => l.porcentajeConsumo >= 75 && l.porcentajeConsumo < 90).length,
    alerta90: licitaciones.filter(l => l.porcentajeConsumo >= 90).length,
    montoTotal: licitaciones.reduce((acc, l) => acc + (l.montoAdjudicado || 0), 0),
    montoConsumido: licitaciones.reduce((acc, l) => acc + (l.montoConsumido || 0), 0)
  }

  const columns = [
    {
      title: "Código",
      dataIndex: "codigoExterno",
      key: "codigo",
      width: 150,
      render: (text, record) => (
        <Space>
          {getAlertaIcon(record.porcentajeConsumo)}
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      ellipsis: true
    },
    {
      title: "Requirente",
      dataIndex: "requirente",
      key: "requirente",
      width: 200,
      ellipsis: true
    },
    {
      title: "Monto Adjudicado",
      dataIndex: "montoAdjudicado",
      key: "montoAdjudicado",
      width: 150,
      render: (value) => formatMoney(value)
    },
    {
      title: "Consumo",
      key: "consumo",
      width: 200,
      render: (_, record) => (
        <div>
          <Progress 
            percent={Math.round(record.porcentajeConsumo)} 
            strokeColor={getConsumoColor(record.porcentajeConsumo)}
            size="small"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatMoney(record.montoConsumido)} / {formatMoney(record.montoAdjudicado)}
          </Text>
        </div>
      )
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 120,
      render: (estado) => (
        <Tag color={estado === "Adjudicada" ? "#268e00" : "#1890ff"}>
          {estado}
        </Tag>
      )
    },
    {
      title: "Órdenes",
      key: "ordenes",
      width: 80,
      align: "center",
      render: (_, record) => (
        <Badge count={record._count.ordenesCompra} showZero color="#1890ff" />
      )
    },
    {
      title: "Acciones",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver detalle">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: "#23aeaa" }} />}
              onClick={() => modalDetalleRef.current?.open(record.id)}
            />
          </Tooltip>
          <Tooltip title="Sincronizar órdenes">
            <Button
              type="text"
              size="small"
              loading={syncing === record.id}
              icon={<SyncOutlined style={{ color: "#1890ff" }} />}
              onClick={() => handleSync(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2}>Seguimiento de Consumo</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => modalNuevaRef.current?.open()}
        >
          Nueva Licitación
        </Button>
      </div>

      {/* Estadísticas */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic 
              title="Total Licitaciones" 
              value={stats.total} 
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic 
              title="Alerta 50%" 
              value={stats.alerta50}
              valueStyle={{ color: "#faad14" }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic 
              title="Alerta 75%" 
              value={stats.alerta75}
              valueStyle={{ color: "#fa8c16" }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic 
              title="Crítico 90%" 
              value={stats.alerta90}
              valueStyle={{ color: "#e53935" }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic 
              title="Monto Total" 
              value={stats.montoTotal}
              formatter={(value) => formatMoney(value)}
              valueStyle={{ fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic 
              title="Consumido" 
              value={stats.montoConsumido}
              formatter={(value) => formatMoney(value)}
              valueStyle={{ fontSize: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className={styles.filtersCard}>
        <Space wrap>
          <Input
            placeholder="Buscar por código"
            prefix={<SearchOutlined />}
            value={filters.codigo}
            onChange={(e) => setFilters({ ...filters, codigo: e.target.value })}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="Filtrar por requirente"
            allowClear
            style={{ width: 250 }}
            value={filters.requirente}
            onChange={(value) => setFilters({ ...filters, requirente: value })}
            options={requirentes.map(r => ({ value: r, label: r }))}
          />
          <Button
            type={filters.alertaActiva ? "primary" : "default"}
            danger={filters.alertaActiva}
            icon={<WarningOutlined />}
            onClick={() => setFilters({ ...filters, alertaActiva: !filters.alertaActiva })}
          >
            Con Alerta
          </Button>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Buscar
          </Button>
        </Space>
      </Card>

      {/* Tabla */}
      <Card>
        <Table
          dataSource={licitaciones}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Total: ${total} licitaciones`
          }}
          rowClassName={(record) => {
            if (record.porcentajeConsumo >= 90) return styles.rowCritical
            if (record.porcentajeConsumo >= 75) return styles.rowUrgent
            if (record.porcentajeConsumo >= 50) return styles.rowWarning
            return ""
          }}
        />
      </Card>

      <ModalDetalleLicitacionMP ref={modalDetalleRef} onSuccess={loadData} />
      <ModalNuevaLicitacionMP ref={modalNuevaRef} onSuccess={loadData} />
    </div>
  )
}

export default ConsumoPage
