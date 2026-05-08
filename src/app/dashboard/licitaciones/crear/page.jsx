"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, Form, Input, Select, DatePicker, Button, Typography, Timeline, Space, App, Modal, Row, Col, InputNumber } from "antd"
import { getFormatosLiquidacion, getRequirentes, createLicitacion } from "@/actions/licitaciones"
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

  useEffect(() => {
    const loadData = async () => {
      const [formatosRes, requirentesRes] = await Promise.all([
        getFormatosLiquidacion(),
        getRequirentes()
      ])

      if (formatosRes.data) {
        setFormatos(formatosRes.data)
      }

      if (requirentesRes.data) {
        setRequirentes(requirentesRes.data.map(r => r.nombre))
      }
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
      router.push("/dashboard/licitaciones/mis-licitaciones")
    } else {
      message.error(result.error || "Error al crear la licitación")
    }
  }

  const config = selectedFormato ? FORMATOS_CONFIG[selectedFormato] : null

  return (
    <div className={styles.container}>
      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card className={styles.card}>
            <Title level={3} style={{ marginBottom: 24 }}>Crear Licitación</Title>

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
                label="Requirente"
                rules={[{ required: true, message: "Ingrese el requirente" }]}
              >
                <Select
                  showSearch
                  placeholder="Buscar o agregar requirente"
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  onSearch={(value) => setNewRequirente(value)}
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
              >
                <Input placeholder="Ingrese el nombre de la licitación" />
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
                  <Button onClick={() => form.resetFields()}>
                    Limpiar
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          {selectedFormato && config && (
            <Card className={styles.card} title={`Flujo: ${config.nombre}`}>
              <Timeline
                items={config.pasos.map((paso, index) => ({
                  color: "#23aeaa",
                  content: (
                    <div className={styles.timelineItem}>
                      <span className={styles.stepNumber}>{index + 1}</span>
                      <Text>{paso}</Text>
                    </div>
                  )
                }))}
              />
            </Card>
          )}

          {!selectedFormato && (
            <Card className={styles.card}>
              <div className={styles.emptyTimeline}>
                <Text type="secondary">
                  Seleccione un formato de liquidación para ver el flujo de trabajo
                </Text>
              </div>
            </Card>
          )}
        </Col>
      </Row>

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

export default CrearLicitacionPage
