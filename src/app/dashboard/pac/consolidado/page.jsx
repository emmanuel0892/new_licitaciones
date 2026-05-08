"use client"

import { useState, useEffect } from "react"
import { Table, Card, Typography, DatePicker, Input, Button, Tag } from "antd"
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import { getConsolidadoPAC } from "@/actions/pac"
import styles from "./consolidado.module.css"

const { Title } = Typography

const ConsolidadoPACPage = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"))
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [filters, setFilters] = useState({ servicio: "", codigo: "" })

  const loadData = async () => {
    setLoading(true)
    const result = await getConsolidadoPAC(date, {
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
  }, [date, pagination.current])

  const handleTableChange = (pag) => {
    setPagination({ ...pagination, current: pag.current })
  }

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    loadData()
  }

  const columns = [
    { title: "Servicio", dataIndex: "servicio", key: "servicio", width: 150, ellipsis: true },
    { title: "Supra Servicio", dataIndex: "supraServicio", key: "supraServicio", width: 150, ellipsis: true },
    { title: "Bodega", dataIndex: "bodega", key: "bodega", width: 100 },
    { title: "Código", dataIndex: "codigo", key: "codigo", width: 100 },
    { title: "Detalle", dataIndex: "detalle", key: "detalle", width: 250, ellipsis: true },
    { title: "U. Medida", dataIndex: "unidadMedida", key: "unidadMedida", width: 100 },
    { title: "Costo Unitario", dataIndex: "costoUnitario", key: "costoUnitario", width: 120, render: (v) => `$${v?.toLocaleString() || 0}` },
    { title: "Cantidad Anual", dataIndex: "cantidadAnual", key: "cantidadAnual", width: 120 },
    { title: "Mensual", dataIndex: "mensual", key: "mensual", width: 100, render: (v) => v?.toFixed(2) || "0.00" },
    { title: "Año PAC", dataIndex: "anoPac", key: "anoPac", width: 100, render: (v) => <Tag color="#23aeaa">{v}</Tag> }
  ]

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3} style={{ margin: 0 }}>Consolidado PAC</Title>
        </div>

        <div className={styles.filters}>
          <DatePicker
            value={dayjs(date)}
            onChange={(v) => setDate(v?.format("YYYY-MM-DD") || dayjs().format("YYYY-MM-DD"))}
            style={{ width: 150 }}
          />
          <Input
            placeholder="Servicio"
            value={filters.servicio}
            onChange={(e) => setFilters({ ...filters, servicio: e.target.value })}
            style={{ width: 180 }}
            allowClear
          />
          <Input
            placeholder="Código"
            value={filters.codigo}
            onChange={(e) => setFilters({ ...filters, codigo: e.target.value })}
            style={{ width: 140 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>Buscar</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setFilters({ servicio: "", codigo: "" }); loadData(); }}>Limpiar</Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1400 }}
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
    </div>
  )
}

export default ConsolidadoPACPage
