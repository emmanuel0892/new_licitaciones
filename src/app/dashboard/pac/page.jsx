"use client"

import { useState, useEffect, useRef } from "react"
import { Table, Button, Card, Typography, DatePicker, Input, Space, App, Tag } from "antd"
import { SearchOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import { getPAC } from "@/actions/pac"
import ModalCargarPAC from "@/components/modals/ModalCargarPAC"
import styles from "./pac.module.css"

const { Title, Text } = Typography

const PACPage = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [year, setYear] = useState(dayjs().format("YYYY"))
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [filters, setFilters] = useState({ servicio: "", codigo: "", detalle: "" })
  const modalRef = useRef(null)

  const loadData = async () => {
    setLoading(true)
    const result = await getPAC(year, {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...filters
    })

    if (result.data) {
      setData(result.data.map((item, idx) => ({ ...item, key: item.id || idx })))
      setTotal(result.total)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [year, pagination.current])

  const handleTableChange = (pag) => {
    setPagination({ ...pagination, current: pag.current })
  }

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    loadData()
  }

  const handleClear = () => {
    setFilters({ servicio: "", codigo: "", detalle: "" })
    setPagination({ ...pagination, current: 1 })
  }

  const columns = [
    { title: "Servicio", dataIndex: "servicio", key: "servicio", width: 150, ellipsis: true },
    { title: "Supra Servicio", dataIndex: "supraServicio", key: "supraServicio", width: 150, ellipsis: true },
    { title: "Bodega", dataIndex: "bodega", key: "bodega", width: 100 },
    { title: "Código", dataIndex: "codigo", key: "codigo", width: 100 },
    { title: "Detalle", dataIndex: "detalle", key: "detalle", width: 200, ellipsis: true },
    { title: "U. Medida", dataIndex: "unidadMedida", key: "unidadMedida", width: 100 },
    { title: "Costo Unit.", dataIndex: "costoUnitario", key: "costoUnitario", width: 100, render: (v) => `$${v?.toLocaleString() || 0}` },
    { title: "Cant. Anual", dataIndex: "cantidadAnual", key: "cantidadAnual", width: 100 },
    { title: "Ene", dataIndex: "enero", key: "enero", width: 60 },
    { title: "Feb", dataIndex: "febrero", key: "febrero", width: 60 },
    { title: "Mar", dataIndex: "marzo", key: "marzo", width: 60 },
    { title: "Abr", dataIndex: "abril", key: "abril", width: 60 },
    { title: "May", dataIndex: "mayo", key: "mayo", width: 60 },
    { title: "Jun", dataIndex: "junio", key: "junio", width: 60 },
    { title: "Jul", dataIndex: "julio", key: "julio", width: 60 },
    { title: "Ago", dataIndex: "agosto", key: "agosto", width: 60 },
    { title: "Sep", dataIndex: "septiembre", key: "septiembre", width: 60 },
    { title: "Oct", dataIndex: "octubre", key: "octubre", width: 60 },
    { title: "Nov", dataIndex: "noviembre", key: "noviembre", width: 60 },
    { title: "Dic", dataIndex: "diciembre", key: "diciembre", width: 60 },
    { title: "Año PAC", dataIndex: "anoPac", key: "anoPac", width: 80, render: (v) => <Tag color="#23aeaa">{v}</Tag> }
  ]

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3} style={{ margin: 0 }}>Plan Anual de Compras</Title>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => modalRef.current?.open()}>
            Cargar PAC
          </Button>
        </div>

        <div className={styles.filters}>
          <DatePicker
            picker="year"
            value={dayjs(year)}
            onChange={(v) => setYear(v?.format("YYYY") || dayjs().format("YYYY"))}
            style={{ width: 120 }}
          />
          <Input
            placeholder="Servicio"
            value={filters.servicio}
            onChange={(e) => setFilters({ ...filters, servicio: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="Código"
            value={filters.codigo}
            onChange={(e) => setFilters({ ...filters, codigo: e.target.value })}
            style={{ width: 120 }}
            allowClear
          />
          <Input
            placeholder="Detalle"
            value={filters.detalle}
            onChange={(e) => setFilters({ ...filters, detalle: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>Buscar</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { handleClear(); loadData(); }}>Limpiar</Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1800 }}
          onChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: false,
            showTotal: (t) => `Total: ${t} registros`
          }}
        />
      </Card>

      <ModalCargarPAC ref={modalRef} onSuccess={loadData} />
    </div>
  )
}

export default PACPage
