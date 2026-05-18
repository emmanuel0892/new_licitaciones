"use client"

import { useState } from "react"
import { Card, Typography, Button, Input, Space, Alert, Row, Col, Image, Upload } from "antd"
import {
  CheckCircleOutlined,
  SearchOutlined,
  UploadOutlined,
  SaveOutlined,
  FolderOpenOutlined
} from "@ant-design/icons"
import Sidebar from "@/components/layout/Sidebar"

const { Title, Text, Paragraph } = Typography

const GestionFirmasPage = () => {
  // Estados para consulta
  const [funcionarioRut, setFuncionarioRut] = useState("")
  const [consulting, setConsulting] = useState(false)
  const [signatureData, setSignatureData] = useState(null)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState("")

  // Estados para creación
  const [modificadoPor, setModificadoPor] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedSignature, setSelectedSignature] = useState(null)
  const [saving, setSaving] = useState(false)

  // Función para convertir archivo a Base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        const [prefix, base64] = result.split(",")
        resolve({
          base64,
          mime: file.type,
          dataUrl: result,
        })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  // Consultar firma
  const handleConsultar = async () => {
    if (!funcionarioRut) {
      setError("Debe ingresar el RUT del funcionario.")
      return
    }

    setConsulting(true)
    setError(null)
    setMessage("")

    try {
      const response = await fetch(`/api/firmas/consultar?func_rut=${encodeURIComponent(funcionarioRut)}`)
      const result = await response.json()

      if (result.success && result.data) {
        setSignatureData(result.data)
        setMessage(`Firma encontrada para ${funcionarioRut}`)
      } else {
        setSignatureData(null)
        setMessage(`No existe firma registrada para ${funcionarioRut}`)
      }
    } catch (err) {
      setError("Error al consultar la firma: " + err.message)
      setSignatureData(null)
    } finally {
      setConsulting(false)
    }
  }

  // Manejar selección de archivo
  const handleFileSelect = async (file) => {
    // Validar tipo de archivo
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      setError("Solo se permiten archivos PNG o JPG.")
      return false
    }

    try {
      const result = await fileToBase64(file)
      setSelectedFile(file)
      setSelectedSignature(result)
      setMessage("Imagen de firma lista para guardar.")
      setError(null)
      return false // Prevenir upload automático
    } catch (err) {
      setError("Error al procesar la imagen: " + err.message)
      return false
    }
  }

  // Guardar firma
  const handleGuardar = async () => {
    if (!funcionarioRut) {
      setError("Debe ingresar el RUT del funcionario.")
      return
    }

    if (!modificadoPor) {
      setError("Debe ingresar el RUT del usuario responsable.")
      return
    }

    if (!selectedSignature) {
      setError("Debe seleccionar una imagen de firma.")
      return
    }

    setSaving(true)
    setError(null)
    setMessage("")

    try {
      const response = await fetch("/api/firmas/crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          func_rut: funcionarioRut,
          firma_base64: selectedSignature.base64,
          formato_mime: selectedSignature.mime,
          modificado_por: modificadoPor,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage("Firma guardada correctamente.")
        setSignatureData({
          func_rut: funcionarioRut,
          firma_base64: selectedSignature.base64,
          formato_mime: selectedSignature.mime,
          modificado_por: modificadoPor,
        })
        setSelectedFile(null)
        setSelectedSignature(null)
      } else {
        setError("No se pudo guardar la firma. Revise la respuesta de la API.")
      }
    } catch (err) {
      setError("Error al guardar la firma: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Abrir carpeta de firmas
  const handleAbrirCarpeta = () => {
    setMessage("Puede capturar la firma utilizando ecoSignature_Tablet, exportarla como imagen PNG/JPG y luego cargarla aquí para guardarla en la API institucional.")
  }

  return (
    <Sidebar>
      <div style={{ padding: "24px" }}>
        <Title level={2} style={{ marginBottom: "8px" }}>
          Gestión de firmas
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: "24px" }}>
          Consulte, cargue y gestione firmas de funcionarios mediante la API institucional.
        </Paragraph>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: "24px" }}
          />
        )}

        {message && !error && (
          <Alert
            message="Información"
            description={message}
            type="info"
            showIcon
            closable
            onClose={() => setMessage("")}
            style={{ marginBottom: "24px" }}
          />
        )}

        <Row gutter={[24, 24]}>
          {/* Card de consulta de firma */}
          <Col xs={24} lg={12}>
            <Card
              title="Consultar firma"
              style={{ borderRadius: "8px" }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div>
                  <Text strong>RUT funcionario:</Text>
                  <Input
                    placeholder="Ej: 21133553-K"
                    value={funcionarioRut}
                    onChange={(e) => setFuncionarioRut(e.target.value)}
                    style={{ marginTop: "8px" }}
                  />
                </div>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleConsultar}
                  loading={consulting}
                  block
                >
                  Consultar firma
                </Button>
              </Space>
            </Card>
          </Col>

          {/* Card de vista previa de firma existente */}
          <Col xs={24} lg={12}>
            <Card
              title="Firma existente"
              style={{ borderRadius: "8px" }}
            >
              {signatureData ? (
                <div>
                  <div style={{ marginBottom: "16px" }}>
                    <Text strong>RUT: </Text>
                    <Text>{signatureData.func_rut}</Text>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <Text strong>Formato: </Text>
                    <Text>{signatureData.formato_mime}</Text>
                  </div>
                  {signatureData.modificado_por && (
                    <div style={{ marginBottom: "16px" }}>
                      <Text strong>Modificado por: </Text>
                      <Text>{signatureData.modificado_por}</Text>
                    </div>
                  )}
                  <Image
                    src={`data:${signatureData.formato_mime};base64,${signatureData.firma_base64}`}
                    alt="Firma"
                    style={{ width: "100%", border: "1px solid #d9d9d9", borderRadius: "4px" }}
                  />
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                  <Text type="secondary">No existe firma registrada para este funcionario</Text>
                </div>
              )}
            </Card>
          </Col>

          {/* Card de carga de nueva firma */}
          <Col xs={24} lg={24}>
            <Card
              title="Crear nueva firma"
              style={{ borderRadius: "8px" }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div>
                  <Text strong>RUT funcionario:</Text>
                  <Input
                    placeholder="Ej: 21133553-K"
                    value={funcionarioRut}
                    onChange={(e) => setFuncionarioRut(e.target.value)}
                    style={{ marginTop: "8px" }}
                  />
                </div>
                <div>
                  <Text strong>RUT modificador / usuario responsable:</Text>
                  <Input
                    placeholder="Ej: 98765432-1"
                    value={modificadoPor}
                    onChange={(e) => setModificadoPor(e.target.value)}
                    style={{ marginTop: "8px" }}
                  />
                </div>
                <div>
                  <Text strong>Seleccionar imagen de firma (PNG/JPG):</Text>
                  <Upload
                    accept="image/png,image/jpeg"
                    beforeUpload={handleFileSelect}
                    showUploadList={false}
                    style={{ marginTop: "8px" }}
                  >
                    <Button icon={<UploadOutlined />}>
                      Seleccionar imagen
                    </Button>
                  </Upload>
                </div>
                {selectedSignature && (
                  <div>
                    <Text strong>Vista previa:</Text>
                    <div style={{ marginTop: "8px" }}>
                      <Image
                        src={selectedSignature.dataUrl}
                        alt="Vista previa"
                        style={{ maxWidth: "300px", border: "1px solid #d9d9d9", borderRadius: "4px" }}
                      />
                    </div>
                  </div>
                )}
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleGuardar}
                  loading={saving}
                  disabled={!selectedSignature}
                  block
                >
                  Guardar firma
                </Button>
              </Space>
            </Card>
          </Col>

          {/* Card informativa sobre ecoSignature_Tablet */}
          <Col xs={24} lg={24}>
            <Card
              title="Información adicional"
              style={{ borderRadius: "8px" }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Paragraph>
                  Puede capturar la firma utilizando ecoSignature_Tablet, exportarla como imagen PNG/JPG y luego cargarla aquí para guardarla en la API institucional.
                </Paragraph>
                <Button
                  icon={<FolderOpenOutlined />}
                  onClick={handleAbrirCarpeta}
                >
                  Abrir carpeta de firmas
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </Sidebar>
  )
}

export default GestionFirmasPage
