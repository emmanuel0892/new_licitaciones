"use client"

import { useState, useEffect } from "react"
import { Card, Typography, Row, Col, Empty, Spin, Button } from "antd"
import { CalendarOutlined, ArrowRightOutlined } from "@ant-design/icons"
import Link from "next/link"
import { getNovedades } from "@/actions/novedades"
import { getMonthAbbr } from "@/lib/helpers"
import styles from "./novedades.module.css"

const { Title, Text, Paragraph } = Typography

const NovedadesPage = () => {
  const [loading, setLoading] = useState(true)
  const [novedades, setNovedades] = useState([])

  useEffect(() => {
    const loadData = async () => {
      const result = await getNovedades()
      if (result.data) {
        setNovedades(result.data)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2} style={{ margin: 0 }}>Novedades</Title>
        <Text type="secondary">Mantente informado sobre las últimas noticias del sistema</Text>
      </div>

      {novedades.length === 0 ? (
        <Card className={styles.emptyCard}>
          <Empty description="No hay novedades disponibles" />
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {novedades.map((novedad) => {
            const date = new Date(novedad.createdAt)
            const day = date.getDate().toString().padStart(2, "0")
            const month = getMonthAbbr(novedad.createdAt)
            const year = date.getFullYear()

            return (
              <Col xs={24} key={novedad.id}>
                <Card className={styles.novedadCard} hoverable>
                  <div className={styles.novedadContent}>
                    <div className={styles.dateColumn}>
                      <Text className={styles.day}>{day}</Text>
                      <Text className={styles.month}>{month}</Text>
                      <Text className={styles.year}>{year}</Text>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.detailColumn}>
                      <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                        {novedad.titular}
                      </Title>
                      <Paragraph
                        type="secondary"
                        ellipsis={{ rows: 2 }}
                        style={{ marginBottom: 0 }}
                      >
                        {novedad.descripcion}
                      </Paragraph>
                    </div>

                    <div className={styles.actionColumn}>
                      <Link href={`/dashboard/novedades/${novedad.id}`}>
                        <Button type="default" icon={<ArrowRightOutlined />}>
                          Ver más
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </div>
  )
}

export default NovedadesPage
