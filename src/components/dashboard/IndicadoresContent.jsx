"use client"

import { Card, Row, Col, Statistic, Typography, Progress, Table, Tag, Empty, Alert } from "antd"
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  RollbackOutlined,
  DollarOutlined
} from "@ant-design/icons"
import { formatMoney } from "@/lib/helpers"
import styles from "@/app/dashboard/dashboard.module.css"

const { Title, Text } = Typography

const BRAND = "#93c01f"

const IndicadoresContent = ({ data, error }) => {
  if (error) {
    return <Alert type="error" showIcon title="No se pudieron cargar los indicadores" description={error} />
  }

  if (!data) {
    return <Empty description="Sin datos" />
  }

  const { resumen, plazos, etapas, topRequirentes, tendencia, calidad, montos } = data

  const totalPlazos = plazos.enRegla + plazos.porVencer + plazos.vencidas
  const pct = (n) => (totalPlazos ? Math.round((n / totalPlazos) * 100) : 0)
  const cumplimiento = totalPlazos ? Math.round((plazos.enRegla / totalPlazos) * 100) : 0

  const maxEtapa = etapas.reduce((m, e) => Math.max(m, e.total), 0)
  const maxMes = tendencia.reduce((m, t) => Math.max(m, t.total), 0)

  const requirentesColumns = [
    { title: "Requirente", dataIndex: "requirente", key: "requirente" },
    {
      title: "Licitaciones",
      dataIndex: "total",
      key: "total",
      width: 120,
      align: "right",
      render: (v) => <Tag color={BRAND}>{v}</Tag>
    }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Indicadores de Gestión</Title>
          <Text type="secondary">Panel de control del proceso de licitaciones y abastecimiento</Text>
        </div>
      </div>

      {/* Resumen general */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic title="Total Licitaciones" value={resumen.total}
              prefix={<FileTextOutlined style={{ color: BRAND }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic title="Activas" value={resumen.activas}
              prefix={<ClockCircleOutlined style={{ color: "#e5be01" }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic title="Finalizadas" value={resumen.finalizadas}
              prefix={<CheckCircleOutlined style={{ color: "#268e00" }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic title="Devueltas" value={resumen.devueltas}
              prefix={<RollbackOutlined style={{ color: "#e53935" }} />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Cumplimiento de plazos */}
        <Col xs={24} lg={10}>
          <Card title="Cumplimiento de Plazos (activas)" className={styles.card}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Progress
                type="dashboard"
                percent={cumplimiento}
                strokeColor={BRAND}
                format={(p) => `${p}%`}
              />
              <div><Text type="secondary">en regla según días sugeridos</Text></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <PlazoBar label="En regla" value={plazos.enRegla} pct={pct(plazos.enRegla)} color="#268e00" />
              <PlazoBar label="Por vencer (≤3 días)" value={plazos.porVencer} pct={pct(plazos.porVencer)} color="#fa8c16" />
              <PlazoBar label="Vencidas" value={plazos.vencidas} pct={pct(plazos.vencidas)} color="#e53935" />
            </div>
          </Card>
        </Col>

        {/* Distribucion por etapa (cuellos de botella) */}
        <Col xs={24} lg={14}>
          <Card title="Carga por Etapa Actual (cuellos de botella)" className={styles.card}>
            {etapas.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin licitaciones activas" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {etapas.slice(0, 8).map((e) => (
                  <div key={e.etapa}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text ellipsis style={{ maxWidth: "80%" }}>{e.etapa}</Text>
                      <Text strong>{e.total}</Text>
                    </div>
                    <Progress
                      percent={maxEtapa ? Math.round((e.total / maxEtapa) * 100) : 0}
                      strokeColor={BRAND}
                      showInfo={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Tendencia */}
        <Col xs={24} lg={14}>
          <Card title="Licitaciones Creadas (últimos 6 meses)" className={styles.card}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 180, padding: "8px 4px" }}>
              {tendencia.map((t) => (
                <div key={t.label} style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                  <Text strong style={{ fontSize: 13 }}>{t.total}</Text>
                  <div
                    style={{
                      margin: "6px auto 0",
                      width: "60%",
                      minHeight: 4,
                      height: `${maxMes ? (t.total / maxMes) * 130 : 0}px`,
                      background: `linear-gradient(180deg, ${BRAND}, #6f9417)`,
                      borderRadius: "6px 6px 0 0"
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 11, marginTop: 6 }}>{t.label}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Top requirentes */}
        <Col xs={24} lg={10}>
          <Card title="Top Requirentes" className={styles.card}>
            <Table
              size="small"
              rowKey="requirente"
              columns={requirentesColumns}
              dataSource={topRequirentes}
              pagination={false}
              locale={{ emptyText: "Sin datos" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Calidad del proceso */}
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <Statistic title="Devoluciones totales" value={calidad.totalDevoluciones}
              prefix={<RollbackOutlined style={{ color: "#e53935" }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <Statistic title="Promedio devoluciones / licitación"
              value={calidad.promedioDevoluciones} precision={2}
              prefix={<WarningOutlined style={{ color: "#fa8c16" }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <Statistic title="Ediciones totales" value={calidad.totalEdiciones}
              prefix={<FileTextOutlined style={{ color: BRAND }} />} />
          </Card>
        </Col>
      </Row>

      {/* Montos del año */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12}>
          <Card className={styles.statCard}>
            <Statistic title="Presupuestado (año en curso)"
              value={formatMoney(montos.presupuestoAno)} styles={{ content: { fontSize: 22 } }}
              prefix={<DollarOutlined style={{ color: BRAND }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className={styles.statCard}>
            <Statistic title="Comprometido (finalizadas, año)"
              value={formatMoney(montos.comprometidoAno)} styles={{ content: { fontSize: 22 } }}
              prefix={<CheckCircleOutlined style={{ color: "#268e00" }} />} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

const PlazoBar = ({ label, value, pct, color }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <Text>{label}</Text>
      <Text strong>{value} ({pct}%)</Text>
    </div>
    <Progress percent={pct} strokeColor={color} showInfo={false} />
  </div>
)

export default IndicadoresContent
