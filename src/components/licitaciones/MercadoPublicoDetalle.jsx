"use client"

import dayjs from "dayjs"
import { Alert, Badge, Button, Empty, Progress, Spin, Table, Tag, Tooltip, Typography } from "antd"
import { MinusOutlined, PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons"
import styles from "./MercadoPublicoDetalle.module.css"

const { Text } = Typography

export const formatCLP = (amount) => {
  if (amount === null || amount === undefined) return "-"

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatDateCL = (date) => {
  return date ? dayjs(date).format("DD/MM/YYYY") : "-"
}

const getStatusColor = (status = "") => {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes("acept") || normalizedStatus.includes("adjudic") || normalizedStatus.includes("conforme")) {
    return "green"
  }

  if (normalizedStatus.includes("envi") || normalizedStatus.includes("pendiente")) return "gold"
  return "default"
}

const getConsumoColor = (porcentaje) => {
  if (porcentaje >= 90) return "#e53935"
  if (porcentaje >= 75) return "#fa8c16"
  if (porcentaje >= 50) return "#faad14"
  return "#52c41a"
}

const renderTruncatedText = (value) => {
  if (!value) return "-"

  return (
    <Tooltip title={value}>
      <span className={styles.clampedText}>{value}</span>
    </Tooltip>
  )
}

const ExpandButton = ({ expanded, onExpand, record, label }) => (
  <Button
    type="text"
    size="small"
    className={styles.nestedExpandButton}
    aria-label={expanded ? `Ocultar ${label}` : `Ver ${label}`}
    icon={expanded ? <MinusOutlined /> : <PlusOutlined />}
    onClick={(event) => onExpand(record, event)}
  />
)

const MercadoPublicoResumen = ({ data }) => {
  const porcentaje = Math.round(data.porcentajeConsumo ?? 0)
  const proveedorVisible = data.proveedoresAdjudicados?.join(", ") || "Sin adjudicacion"
  const consumoLabel = data.consumoParcial ? `${porcentaje}% parcial` : `${porcentaje}%`

  return (
    <div className={styles.summaryRow}>
      <div className={styles.summaryIdentity}>
        <Text strong>Mercado Publico</Text>
        <Text className={styles.summaryName}>
          {data.codigo ?? "-"} {data.nombre ? ` - ${data.nombre}` : ""}
        </Text>
      </div>
      <Tag color={getStatusColor(data.estado)}>{data.estado ?? "Sin estado"}</Tag>
      <div className={styles.summaryMetric}>
        <Text type="secondary">Monto adjudicado</Text>
        <Text strong>{formatCLP(data.montoAdjudicado)}</Text>
      </div>
      <div className={styles.summaryMetric}>
        <Text type="secondary">Requirente</Text>
        <Text>{data.requirente ?? "-"}</Text>
      </div>
      <div className={styles.summaryMetric}>
        <Text type="secondary">Proveedor adjudicado</Text>
        <Tooltip title={proveedorVisible}>
          <Text className={styles.summaryValue}>{proveedorVisible}</Text>
        </Tooltip>
      </div>
      <div className={styles.consumo}>
        <div className={styles.consumoHeader}>
          <Text type="secondary">Consumo</Text>
          <Text strong>{data.consumoDisponible || data.consumoParcial ? consumoLabel : "-"}</Text>
        </div>
        <Tooltip
          title={data.consumoDisponible || data.consumoParcial
            ? `Consumido: ${formatCLP(data.montoConsumido)}`
            : "No hay ordenes asociadas disponibles para calcular consumo"}
        >
          <div className={styles.consumoProgress}>
            <Progress
              percent={porcentaje}
              size="small"
              showInfo={false}
              strokeColor={getConsumoColor(porcentaje)}
            />
          </div>
        </Tooltip>
        {data.consumoDisponible || data.consumoParcial ? (
          <Text type="secondary">
            {formatCLP(data.montoConsumido)} / {formatCLP(data.montoAdjudicado)}
          </Text>
        ) : (
          <Text type="secondary">Sin codigos OC asociados para consultar en vivo</Text>
        )}
      </div>
    </div>
  )
}

export const TablaItemsOrdenCompra = ({
  items = [],
  title = "Items de la Orden",
  showAdjudicacion = false,
  emptyMessage = "Esta orden de compra no tiene items registrados."
}) => {
  const columns = [
    {
      title: "#",
      dataIndex: "correlativo",
      key: "correlativo",
      width: 54,
      render: (value, _, index) => value ?? index + 1
    },
    {
      title: "Codigo",
      dataIndex: "codigoProducto",
      key: "codigoProducto",
      width: 115,
      render: (value) => value || "-"
    },
    {
      title: "Producto",
      dataIndex: "nombreProducto",
      key: "nombreProducto",
      width: 230,
      render: renderTruncatedText
    },
    ...(showAdjudicacion ? [{
      title: "Proveedor adjudicado",
      dataIndex: "proveedor",
      key: "proveedor",
      width: 210,
      render: renderTruncatedText
    }] : []),
    {
      title: "Descripcion",
      dataIndex: "descripcion",
      key: "descripcion",
      width: 300,
      render: renderTruncatedText
    },
    {
      title: "Unidad",
      dataIndex: "unidadMedida",
      key: "unidadMedida",
      width: 98,
      render: (value) => value || "-"
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 100,
      align: "right",
      render: (value) => value?.toLocaleString("es-CL") ?? "-"
    }
  ]

  columns.push(
    {
      title: "P. Unitario",
      dataIndex: "precioUnitario",
      key: "precioUnitario",
      width: 130,
      align: "right",
      render: formatCLP
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 140,
      align: "right",
      render: (value) => <Text strong>{formatCLP(value)}</Text>
    }
  )

  if (showAdjudicacion) {
    columns.push({
      title: "Estado",
      key: "estado",
      width: 120,
      render: (_, item) => (
        <Tag color={item.adjudicado ? "green" : "default"}>
          {item.adjudicado ? "Adjudicado" : "No adjudicado"}
        </Tag>
      )
    })
  }

  if (items.length === 0) {
    return (
      <Empty
        className={styles.emptyState}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={emptyMessage}
      />
    )
  }

  return (
    <div className={styles.itemsSection}>
      <Text strong className={styles.itemsTitle}>{title} ({items.length})</Text>
      <div className={styles.tableContainer}>
        <Table
          className={styles.compactTable}
          columns={columns}
          dataSource={items}
          rowKey={(item, index) => `${item.correlativo ?? index}-${item.codigoProducto ?? ""}`}
          size="small"
          pagination={false}
          scroll={{ x: showAdjudicacion ? 1497 : 1167 }}
        />
      </div>
    </div>
  )
}

export const TablaOrdenesCompra = ({ ordenes = [], expandedRowKeys = [], onExpandedRowKeysChange }) => {
  const columns = [
    {
      title: "Codigo OC",
      dataIndex: "codigoOC",
      key: "codigoOC",
      width: 150,
      render: (value) => value ? <Text copyable={{ text: value }}>{value}</Text> : "-"
    },
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      width: 245,
      render: renderTruncatedText
    },
    {
      title: "Proveedor",
      dataIndex: "proveedor",
      key: "proveedor",
      width: 210,
      render: renderTruncatedText
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 155,
      render: (value) => value ? <Tag color={getStatusColor(value)}>{value}</Tag> : "-"
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 135,
      align: "right",
      render: (value) => <Text strong>{formatCLP(value)}</Text>
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      width: 78,
      align: "center",
      render: (items) => <Badge count={items?.length ?? 0} showZero color="#1890ff" />
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: 112,
      render: formatDateCL
    }
  ]

  return (
    <div className={styles.tableContainer}>
      <Table
        className={styles.compactTable}
        columns={columns}
        dataSource={ordenes}
        rowKey="codigoOC"
        size="small"
        pagination={false}
        scroll={{ x: 1085 }}
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: onExpandedRowKeysChange,
          expandIcon: (props) => <ExpandButton {...props} label="items de la orden" />,
          expandedRowRender: (orden) => <TablaItemsOrdenCompra items={orden.items} />
        }}
      />
    </div>
  )
}

const FilaLicitacionExpandable = ({
  data,
  expandedOrdenKeys,
  onExpandedOrdenKeysChange
}) => {
  const hasOrdenes = data.ordenesCompra?.length > 0
  const hasItems = data.items?.length > 0

  return (
    <div className={styles.detailPanel}>
      <MercadoPublicoResumen data={data} />
      {data.consumoParcial && (
        <Alert
          className={styles.partialWarning}
          type="warning"
          showIcon
          message="Algunas ordenes no respondieron desde Mercado Publico. El consumo mostrado es parcial."
        />
      )}

      {hasOrdenes && (
        <>
          <div className={styles.sectionHeader}>
            <ShoppingCartOutlined />
            <Text strong>Ordenes de Compra ({data.ordenesCompra.length})</Text>
          </div>
          <TablaOrdenesCompra
            ordenes={data.ordenesCompra}
            expandedRowKeys={expandedOrdenKeys}
            onExpandedRowKeysChange={onExpandedOrdenKeysChange}
          />
        </>
      )}

      {!hasOrdenes && hasItems && (
        <TablaItemsOrdenCompra
          items={data.items}
          title="Items de la Licitacion"
          showAdjudicacion
          emptyMessage="No se encontraron items asociados."
        />
      )}

      {!hasOrdenes && !hasItems && (
        <Empty
          className={styles.emptyState}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No se encontraron ordenes de compra ni items asociados."
        />
      )}
    </div>
  )
}

const MercadoPublicoDetalle = ({
  data,
  loading,
  error,
  expandedOrdenKeys,
  onExpandedOrdenKeysChange
}) => {
  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="small" />
        <Text type="secondary"> Cargando datos desde Mercado Publico...</Text>
      </div>
    )
  }

  if (error) return <Alert type="error" showIcon message={error} />

  if (!data) {
    return (
      <Empty
        className={styles.emptyState}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No se encontraron datos en Mercado Publico para esta licitacion."
      />
    )
  }

  return (
    <FilaLicitacionExpandable
      data={data}
      expandedOrdenKeys={expandedOrdenKeys}
      onExpandedOrdenKeysChange={onExpandedOrdenKeysChange}
    />
  )
}

export default MercadoPublicoDetalle
