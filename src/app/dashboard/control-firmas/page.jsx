"use client"

import { useState, useRef, useEffect } from "react"
import { Card, Typography, Button, Space, Tag } from "antd"
import { DeleteOutlined, DisconnectOutlined, CheckCircleOutlined, LoadingOutlined } from "@ant-design/icons"
import Sidebar from "@/components/layout/Sidebar"

const { Title, Text } = Typography

// Configuración de la tableta Wacom STU-540
const TABLET_WIDTH = 800
const TABLET_HEIGHT = 480
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 300

const ControlFirmasPage = () => {
  const canvasRef = useRef(null)
  const [signaturePoints, setSignaturePoints] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("waiting") // waiting, connected, error
  const [socket, setSocket] = useState(null)

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.strokeStyle = "#000000"
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  // Conectar con servicio local de Wacom (preparado para integración)
  useEffect(() => {
    // NOTA: Esta es la estructura preparada para conectar con un servicio local o WebSocket
    // que reciba los eventos del SDK de Wacom STU-540.
    // 
    // Ejemplo de implementación futura:
    // 
    // const connectToWacomService = () => {
    //   const ws = new WebSocket("ws://localhost:PORT/wacom")
    //   
    //   ws.onopen = () => {
    //     setConnectionStatus("connected")
    //   }
    //   
    //   ws.onerror = () => {
    //     setConnectionStatus("error")
    //   }
    //   
    //   ws.onmessage = (event) => {
    //     const data = JSON.parse(event.data)
    //     
    //     if (data.type === "point") {
    //       handleTabletPoint(data)
    //     } else if (data.type === "clear") {
    //       handleClearSignature()
    //     }
    //   }
    //   
    //   setSocket(ws)
    // }
    // 
    // connectToWacomService()
    
    // Por ahora, simulamos estado de conexión
    setConnectionStatus("waiting")
    
    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [])

  // Dibujar punto en canvas
  const drawPoint = (x, y) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#000000"
    ctx.beginPath()
    ctx.arc(x, y, 1, 0, 2 * Math.PI)
    ctx.fill()
  }

  // Dibujar línea entre dos puntos
  const drawStroke = (x1, y1, x2, y2) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  // Manejar punto recibido de la tableta (preparado para integración)
  const handleTabletPoint = (point) => {
    const { x, y, pressure, isDown } = point
    
    // Escalar coordenadas de la tableta al canvas
    const scaleX = CANVAS_WIDTH / TABLET_WIDTH
    const scaleY = CANVAS_HEIGHT / TABLET_HEIGHT
    const canvasX = x * scaleX
    const canvasY = y * scaleY

    if (isDown) {
      if (!isDrawing) {
        setIsDrawing(true)
        drawPoint(canvasX, canvasY)
        setSignaturePoints(prev => [...prev, { x: canvasX, y: canvasY, isDown: true }])
      } else {
        const lastPoint = signaturePoints[signaturePoints.length - 1]
        drawStroke(lastPoint.x, lastPoint.y, canvasX, canvasY)
        setSignaturePoints(prev => [...prev, { x: canvasX, y: canvasY, isDown: true }])
      }
    } else {
      setIsDrawing(false)
      setSignaturePoints(prev => [...prev, { x: canvasX, y: canvasY, isDown: false }])
    }
  }

  // Limpiar firma
  const handleClearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    setSignaturePoints([])
    setIsDrawing(false)

    // Enviar instrucción de limpiar a la tableta (preparado para integración)
    // if (socket && socket.readyState === WebSocket.OPEN) {
    //   socket.send(JSON.stringify({ type: "clear" }))
    // }
  }

  // Conectar con tableta (preparado para integración)
  const handleConnectTablet = () => {
    // Implementación futura para conectar con el servicio local de Wacom
    setConnectionStatus("waiting")
    // Aquí se conectaría con el servicio local
  }

  // Fallback para dibujar con mouse (solo para pruebas)
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    drawPoint(x, y)
    setSignaturePoints(prev => [...prev, { x, y, isDown: true }])
  }

  const handleMouseMove = (e) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const lastPoint = signaturePoints[signaturePoints.length - 1]
    if (lastPoint) {
      drawStroke(lastPoint.x, lastPoint.y, x, y)
      setSignaturePoints(prev => [...prev, { x, y, isDown: true }])
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    setSignaturePoints(prev => [...prev, { ...prev[prev.length - 1], isDown: false }])
  }

  const getConnectionStatusTag = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Tableta conectada
          </Tag>
        )
      case "error":
        return (
          <Tag icon={<DisconnectOutlined />} color="error">
            Error al conectar con tableta
          </Tag>
        )
      default:
        return (
          <Tag icon={<LoadingOutlined />} color="warning">
            Esperando conexión con tableta
          </Tag>
        )
    }
  }

  return (
    <Sidebar>
      <div style={{ padding: "24px" }}>
        <Title level={2} style={{ marginBottom: "24px" }}>
          Control de firmas
        </Title>

        <Card
          style={{
            maxWidth: "900px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <Text strong style={{ fontSize: 16 }}>
              Estado de conexión:
            </Text>
            <div style={{ marginTop: "8px" }}>
              {getConnectionStatusTag()}
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <Text strong style={{ fontSize: 16 }}>
              Área de firma:
            </Text>
            <div 
              style={{
                marginTop: "16px",
                border: "1px solid #d9d9d9",
                borderRadius: "8px",
                overflow: "hidden",
                position: "relative"
              }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{
                  display: "block",
                  backgroundColor: "#ffffff",
                  cursor: "crosshair"
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              {signaturePoints.length === 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "#999999",
                    fontSize: "14px",
                    pointerEvents: "none"
                  }}
                >
                  Firme en la tableta Wacom STU-540
                </div>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 12, marginTop: "8px", display: "block" }}>
              NOTA: El dibujo con mouse es solo para pruebas. La integración con Wacom STU-540 requiere un servicio local.
            </Text>
          </div>

          <Space>
            <Button
              type="default"
              danger
              icon={<DeleteOutlined />}
              onClick={handleClearSignature}
            >
              Limpiar firma
            </Button>
            {/* Botón opcional para conectar tableta (preparado para integración) */}
            {/* <Button
              type="primary"
              icon={<ConnectOutlined />}
              onClick={handleConnectTablet}
            >
              Conectar tableta
            </Button> */}
          </Space>
        </Card>
      </div>
    </Sidebar>
  )
}

export default ControlFirmasPage
