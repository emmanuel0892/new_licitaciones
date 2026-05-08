"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Form, Input, Button, Card, Typography, Alert, Space } from "antd"
import { UserOutlined, LockOutlined } from "@ant-design/icons"
import { loginAction } from "@/actions/auth"
import styles from "./login.module.css"

const { Title, Text } = Typography

const LoginPage = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (values) => {
    setLoading(true)
    setError("")

    const formData = new FormData()
    formData.append("email", values.email)
    formData.append("password", values.password)

    const result = await loginAction(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result?.success) {
      router.push("/dashboard")
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.branding}>
          <div className={styles.logo}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <Title level={2} className={styles.brandTitle}>
            HRR Licitaciones
          </Title>
          <Text className={styles.brandSubtitle}>
            Sistema de Gestión de Licitaciones
          </Text>
          <Text className={styles.brandDescription}>
            Hospital Regional Rancagua
          </Text>
        </div>
        <div className={styles.decorativeCircle1} />
        <div className={styles.decorativeCircle2} />
      </div>

      <div className={styles.rightPanel}>
        <Card className={styles.loginCard} variant="borderless">
          <Space orientation="vertical" size="large" style={{ width: "100%" }}>
            <div className={styles.cardHeader}>
              <Title level={3} style={{ margin: 0, color: "#1f2937" }}>
                Bienvenido
              </Title>
              <Text type="secondary">
                Ingresa tus credenciales para acceder al sistema
              </Text>
            </div>

            {error && (
              <Alert
                title={error}
                type="error"
                showIcon
                closable
                onClose={() => setError("")}
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="email"
                label="Correo Electrónico"
                rules={[
                  { required: true, message: "Ingresa tu correo electrónico" },
                  { type: "email", message: "Ingresa un correo válido" }
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "#9ca3af" }} />}
                  placeholder="correo@ejemplo.com"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Contraseña"
                rules={[
                  { required: true, message: "Ingresa tu contraseña" }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#9ca3af" }} />}
                  placeholder="••••••••"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className={styles.loginButton}
                >
                  Iniciar Sesión
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>

        <Text className={styles.footer}>
          © {new Date().getFullYear()} Hospital Regional Rancagua. Todos los derechos reservados.
        </Text>
      </div>
    </div>
  )
}

export default LoginPage
