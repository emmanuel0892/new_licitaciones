"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, Typography, Button, Spin, Empty, Image } from "antd"
import { ArrowLeftOutlined, CalendarOutlined } from "@ant-design/icons"
import { getNovedadById } from "@/actions/novedades"
import { formatDate } from "@/lib/helpers"
import styles from "./ver-novedad.module.css"

const { Title, Text, Paragraph } = Typography

const VerNovedadPage = () => {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [novedad, setNovedad] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      const result = await getNovedadById(params.id)
      if (result.data) {
        setNovedad(result.data)
      }
      setLoading(false)
    }
    loadData()
  }, [params.id])

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    )
  }

  if (!novedad) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <Empty description="Novedad no encontrada" />
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Button onClick={() => router.back()}>Volver</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        className={styles.backButton}
      >
        Volver a novedades
      </Button>

      <Card className={styles.card}>
        <div className={styles.meta}>
          <CalendarOutlined style={{ color: "#23aeaa" }} />
          <Text type="secondary">{formatDate(novedad.createdAt)}</Text>
        </div>

        <Title level={2} className={styles.title}>
          {novedad.titular}
        </Title>

        {novedad.imagen && (
          <div className={styles.imageContainer}>
            <Image
              src={novedad.imagen}
              alt={novedad.titular}
              className={styles.image}
              fallback="/placeholder-image.png"
            />
          </div>
        )}

        <Paragraph className={styles.content}>
          {novedad.descripcion}
        </Paragraph>
      </Card>
    </div>
  )
}

export default VerNovedadPage
