"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Form, Input, Button, Typography, Alert } from "antd"
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
      <aside className={styles.leftPanel}>
        <div className={styles.heroImage}>
          <Image
            src="/foto-hospital.jpeg"
            alt="Hospital Dr. Franco Ravera Zunino"
            fill
            priority
            sizes="(max-width: 992px) 100vw, 55vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className={styles.heroOverlay} />

        <div className={styles.branding}>
          <Title level={1} className={styles.brandTitle}>
            Sistema de Gestión de Licitaciones
          </Title>
          <Text className={styles.brandSubtitle}>
            Hospital Dr. Franco Ravera Zunino
          </Text>
          <Text className={styles.brandDescription}>
            Plataforma interna para la administración, seguimiento y firma de
            procesos de licitación y abastecimiento.
          </Text>
        </div>

        <span className={styles.decorativeCircle1} />
        <span className={styles.decorativeCircle2} />
      </aside>

      <main className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <div className={styles.logoWrapper}>
            <Image
              src="/logohrr.png"
              alt="Logo Hospital Dr. Franco Ravera Zunino"
              width={250}
              height={80}
              priority
              className={styles.logo}
            />
          </div>

          <div className={styles.cardHeader}>
            <Title level={3} className={styles.welcomeTitle}>
              Bienvenido
            </Title>
            <Text type="secondary">
              Ingresa tus credenciales para acceder al sistema
            </Text>
          </div>

          {error && (
            <Alert
              className={styles.errorAlert}
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
            requiredMark={false}
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
              rules={[{ required: true, message: "Ingresa tu contraseña" }]}
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

          <Text className={styles.footer}>
            © {new Date().getFullYear()} Hospital Dr. Franco Ravera Zunino.
            Todos los derechos reservados.
          </Text>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
