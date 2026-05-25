"use client"

import { Card, Row, Col, Statistic, Typography } from "antd"
import Link from "next/link"
import {
  FileTextOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from "@ant-design/icons"
import styles from "@/app/dashboard/dashboard.module.css"

const { Title, Text } = Typography

const DashboardContent = ({ user, stats, canCreateLicitacion }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Bienvenido, {user?.name}
          </Title>
          <Text type="secondary">
            Panel de control del Sistema de Gestión de Licitaciones
          </Text>
        </div>
      </div>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Total Licitaciones"
              value={stats.totalLicitaciones}
              prefix={<FileTextOutlined style={{ color: "#23aeaa" }} />}
              styles={{ content: { color: "#1f2937" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Pendientes"
              value={stats.pendientes}
              prefix={<ClockCircleOutlined style={{ color: "#e5be01" }} />}
              styles={{ content: { color: "#1f2937" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Finalizadas"
              value={stats.finalizadas}
              prefix={<CheckCircleOutlined style={{ color: "#268e00" }} />}
              styles={{ content: { color: "#1f2937" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="Devueltas"
              value={stats.enProceso}
              prefix={<InboxOutlined style={{ color: "#e53935" }} />}
              styles={{ content: { color: "#1f2937" } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Actividad Reciente" className={styles.card}>
            <div className={styles.emptyState}>
              <FileTextOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
              <Text type="secondary">No hay actividad reciente</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Accesos Rápidos" className={styles.card}>
            <div className={styles.quickLinks}>
              {canCreateLicitacion && (
              <Link href="/dashboard/licitaciones/crear" className={styles.quickLink}>
                <FileTextOutlined />
                <span>Crear Licitación</span>
              </Link>
              )}
              <Link href="/dashboard/licitaciones/bandeja" className={styles.quickLink}>
                <InboxOutlined />
                <span>Bandeja de Entrada</span>
              </Link>
              <Link href="/dashboard/novedades" className={styles.quickLink}>
                <ClockCircleOutlined />
                <span>Ver Novedades</span>
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardContent
