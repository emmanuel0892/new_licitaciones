"use client"

import { useState, useEffect } from "react"
import { ConfigProvider, App } from "antd"
import esES from "antd/locale/es_ES"
import theme from "@/lib/theme"

const AntdProvider = ({ children }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ConfigProvider theme={theme} locale={esES}>
      <App>{children}</App>
    </ConfigProvider>
  )
}

export default AntdProvider
