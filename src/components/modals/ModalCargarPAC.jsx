"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Upload, Button, App, Typography, Alert } from "antd"
import { UploadOutlined, FileExcelOutlined } from "@ant-design/icons"
import * as XLSX from "xlsx"
import { uploadPAC } from "@/actions/pac"

const { Text } = Typography

const ModalCargarPAC = forwardRef(({ onSuccess }, ref) => {
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fileData, setFileData] = useState(null)
  const [fileName, setFileName] = useState("")

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true)
      setFileData(null)
      setFileName("")
    }
  }))

  const handleFileUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const mappedData = jsonData.map((row) => ({
          servicio: row["Servicio"] || row["servicio"] || "",
          supraServicio: row["Supra Servicio"] || row["supra_servicio"] || "",
          bodega: row["Bodega"] || row["bodega"] || "",
          codigo: row["Código"] || row["codigo"] || "",
          detalle: row["Detalle"] || row["detalle"] || "",
          unidadMedida: row["U. Medida"] || row["unidad_medida"] || "",
          costoUnitario: row["Costo Unitario"] || row["costo_unitario"] || 0,
          cantidadAnual: row["Cant. Anual"] || row["cantidad_anual"] || 0,
          enero: row["Enero"] || row["enero"] || 0,
          febrero: row["Febrero"] || row["febrero"] || 0,
          marzo: row["Marzo"] || row["marzo"] || 0,
          abril: row["Abril"] || row["abril"] || 0,
          mayo: row["Mayo"] || row["mayo"] || 0,
          junio: row["Junio"] || row["junio"] || 0,
          julio: row["Julio"] || row["julio"] || 0,
          agosto: row["Agosto"] || row["agosto"] || 0,
          septiembre: row["Septiembre"] || row["septiembre"] || 0,
          octubre: row["Octubre"] || row["octubre"] || 0,
          noviembre: row["Noviembre"] || row["noviembre"] || 0,
          diciembre: row["Diciembre"] || row["diciembre"] || 0,
          mensual: row["Mensual"] || row["mensual"] || 0,
          anoPac: row["Año PAC"] || row["año_pac"] || new Date().getFullYear().toString()
        }))

        setFileData(mappedData)
        setFileName(file.name)
        message.success(`Archivo leído: ${mappedData.length} registros`)
      } catch (error) {
        message.error("Error al leer el archivo")
      }
    }
    reader.readAsBinaryString(file)
    return false
  }

  const handleSubmit = async () => {
    if (!fileData || fileData.length === 0) {
      message.warning("No hay datos para cargar")
      return
    }

    setLoading(true)
    const result = await uploadPAC(fileData)

    if (result.success) {
      message.success("PAC cargado correctamente")
      setOpen(false)
      setFileData(null)
      setFileName("")
      onSuccess?.()
    } else {
      message.error(result.error || "Error al cargar")
    }

    setLoading(false)
  }

  return (
    <Modal
      title="Cargar PAC desde Excel"
      open={open}
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      okText="Cargar"
      cancelText="Cancelar"
      confirmLoading={loading}
      okButtonProps={{ disabled: !fileData }}
      width={500}
    >
      <Alert
        message="Formato requerido"
        description="El archivo debe contener columnas: Servicio, Supra Servicio, Bodega, Código, Detalle, U. Medida, Costo Unitario, Cant. Anual, Enero-Diciembre, Mensual, Año PAC"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Upload
        beforeUpload={handleFileUpload}
        accept=".xlsx,.xls"
        maxCount={1}
        showUploadList={false}
      >
        <Button icon={<UploadOutlined />} block size="large">
          Seleccionar archivo Excel
        </Button>
      </Upload>

      {fileName && (
        <div style={{ marginTop: 16, padding: 12, background: "#f8fafa", borderRadius: 8 }}>
          <FileExcelOutlined style={{ color: "#22c55e", marginRight: 8 }} />
          <Text strong>{fileName}</Text>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            ({fileData?.length || 0} registros)
          </Text>
        </div>
      )}
    </Modal>
  )
})

ModalCargarPAC.displayName = "ModalCargarPAC"

export default ModalCargarPAC
