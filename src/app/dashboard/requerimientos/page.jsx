"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Result, Button } from "antd"

const RequerimientosPage = () => {
  const router = useRouter()

  useEffect(() => {
    router.push("/dashboard")
  }, [router])

  return (
    <Result
      status="403"
      title="Acceso No Autorizado"
      subTitle="Esta sección no está disponible actualmente."
      extra={
        <Button type="primary" onClick={() => router.push("/dashboard")}>
          Volver al Dashboard
        </Button>
      }
    />
  )
}

export default RequerimientosPage
