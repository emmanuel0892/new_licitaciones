"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Badge, Dropdown, Button, Typography, Empty, Tag, Spin } from "antd"
import { BellOutlined } from "@ant-design/icons"
import { getAlertasDiasSugeridos } from "@/actions/licitaciones"

const { Text } = Typography

const REFRESH_MS = 5 * 60 * 1000

const severidadColor = {
  vencido: "#e53935",
  hoy: "#fa8c16",
  proximo: "#faad14"
}

const NotificacionesAlertas = () => {
  const router = useRouter()
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAlertasDiasSugeridos()
      setAlertas(res?.data ?? [])
    } catch {
      setAlertas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
    const id = setInterval(cargar, REFRESH_MS)
    return () => clearInterval(id)
  }, [cargar])

  const irALicitacion = (alerta) => {
    router.push(`/dashboard/licitaciones/bandeja?licitacion=${alerta.licitacionId}`)
    // Evento global: si la bandeja ya esta montada, abre el workflow de inmediato
    window.dispatchEvent(
      new CustomEvent("abrir-workflow-licitacion", { detail: { id: alerta.licitacionId } })
    )
  }

  const contenido = (
    <div
      style={{
        width: 360,
        maxHeight: "60vh",
        overflowY: "auto",
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        padding: 8
      }}
    >
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", marginBottom: 4 }}>
        <Text strong>Alertas de días sugeridos</Text>
      </div>

      {loading && alertas.length === 0 ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      ) : alertas.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Sin alertas"
          style={{ padding: 16 }}
        />
      ) : (
        alertas.map((a) => (
          <div
            key={a.licitacionId}
            onClick={() => irALicitacion(a)}
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              cursor: "pointer",
              borderLeft: `4px solid ${severidadColor[a.severidad] ?? "#faad14"}`,
              marginBottom: 4,
              background: "#fafafa"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <Text strong ellipsis style={{ maxWidth: 230 }}>
                {a.nombreLicitacion}
              </Text>
              <Tag color={severidadColor[a.severidad] ?? "#faad14"} style={{ margin: 0 }}>
                {a.mensaje}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {a.numeroLicitacion ? `${a.numeroLicitacion} · ` : ""}
              Paso {a.numeroPaso}: {a.pasoActual}
            </Text>
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {a.diasTranscurridos} / {a.diasSugeridos} días sugeridos
              </Text>
            </div>
          </div>
        ))
      )}
    </div>
  )

  return (
    <Dropdown
      popupRender={() => contenido}
      trigger={["click"]}
      placement="bottomRight"
      onOpenChange={(open) => { if (open) cargar() }}
    >
      <Badge count={alertas.length} size="small" offset={[-2, 2]}>
        <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
      </Badge>
    </Dropdown>
  )
}

export default NotificacionesAlertas
