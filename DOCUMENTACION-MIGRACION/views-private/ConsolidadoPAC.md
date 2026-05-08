# Módulo: ConsolidadoPAC (Consolidado PAC)

## Descripción General
Módulo para visualizar y gestionar el consolidado del Plan Anual de Compras (PAC). Permite ver información detallada de productos, stock, compras y proveedores con funcionalidades avanzadas de búsqueda y filtrado.

## Ubicación
`src/views/private/ConsolidadoPAC.jsx`

## Tecnologías y Librerías Utilizadas

### Dependencias Principales
- **React** (v18+): Hooks (useEffect, useRef, useState)
- **Ant Design**: Table, Button, Space, Input, DatePicker, notification
- **Mantine UI**: ScrollArea, Box, Title, createStyles, rem
- **Tabler Icons**: IconSearch, IconSettings
- **Day.js**: Manejo de fechas
- **React Highlight Words**: Para resaltar texto en búsquedas
- **Axios**: axiosInstance para peticiones HTTP

## Estructura del Componente

### Estado del Componente

```javascript
// Datos y paginación
const [data, setData] = useState()
const [loading, setLoading] = useState(false)
const [tableParams, setTableParams] = useState({
    pagination: {
        current: 1,
        pageSize: 10,
        showSizeChanger: false,
    },
})

// Búsqueda
const [searchText, setSearchText] = useState('')
const [searchedColumn, setSearchedColumn] = useState('')
const searchInput = useRef(null)

// Fecha y expandibles
const [dateSearch, setdateSearch] = useState(dayjs().format('YYYY-MM-DD'))
const [expandedRows, setExpandedRows] = useState([])

// Notificaciones
const [api, contextHolder] = notification.useNotification()
```

### Columnas de la Tabla

La tabla incluye 18 columnas con información completa del PAC:

1. **Medio Compra**: Tipo de adquisición
2. **ID Compra**: Identificador de compra
3. **Proveedor**: Nombre del proveedor
4. **Código**: Código del producto
5. **Producto**: Descripción (con expand/collapse para textos largos)
6. **Pac**: Plan anual de compras
7. **Stock Min**: Stock mínimo
8. **Stock Cri**: Stock crítico
9. **Stock Exp**: Stock esperado
10. **Comprar**: Cantidad a comprar
11. **Critico**: Indicador de criticidad
12. **Si/No**: Indicador booleano
13. **Precio Bruto**: Precio sin impuestos
14. **Oc**: Orden de compra
15. **Fecha Registro Oc**: Fecha de registro OC
16. **Llegada Aprox**: Fecha aproximada de llegada
17. **Cantidad**: Cantidad
18. **Observaciones**: Notas adicionales
19. **Fecha**: Fecha del PAC

## Funcionalidades Principales

### 1. Búsqueda Avanzada por Columna

```javascript
const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
                ref={searchInput}
                placeholder={`Buscar ${dataIndex}`}
                value={selectedKeys[0]}
                onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                style={{ marginBottom: 8, display: 'block' }}
            />
            <Space>
                <Button type="primary" onClick={() => handleSearch(selectedKeys, confirm, dataIndex)} size="small">
                    Buscar
                </Button>
                <Button onClick={() => clearFilters && handleReset(clearFilters)} size="small">
                    Resetear
                </Button>
                <Button type="link" size="small" onClick={() => { confirm({ closeDropdown: false }) }}>
                    Filtrar
                </Button>
                <Button type="link" size="small" onClick={() => close()}>
                    Cerrar
                </Button>
            </Space>
        </div>
    ),
    filterIcon: (filtered) => (
        <IconSearch size={16} style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value, record) => {
        const dataIndexValue = record[dataIndex]
        const text = dataIndexValue !== null ? dataIndexValue.toString() : ''
        return text.toLowerCase().includes(value.toLowerCase())
    },
    render: (text) =>
        searchedColumn === dataIndex ? (
            <Highlighter
                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                searchWords={[searchText]}
                autoEscape
                textToHighlight={text ? text.toString() : ''}
            />
        ) : text,
})
```

**Características**:
- Búsqueda individual por columna
- Resaltado de texto encontrado
- Filtros múltiples
- Case-insensitive

### 2. Expansión de Contenido

```javascript
const handleExpand = (key) => {
    setExpandedRows([...expandedRows, key])
}

const handleCollapse = (key) => {
    setExpandedRows(expandedRows.filter((k) => k !== key))
}

// Render de columna Producto con expand/collapse
render: (text, record) => {
    const isExpanded = expandedRows.includes(record.key)
    
    const contentStyle = {
        maxWidth: '300px',
        overflow: 'hidden',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        height: isExpanded ? 'auto' : '8em',
    }
    
    return (
        <div style={contentStyle}>
            {isExpanded ? text : text.slice(0, 20)}
            {text.length > 20 && (
                <span>
                    {isExpanded ? (
                        <Button type="link" onClick={() => handleCollapse(record.key)}>Ver menos</Button>
                    ) : (
                        <Button type="link" onClick={() => handleExpand(record.key)}>Ver más</Button>
                    )}
                </span>
            )}
        </div>
    )
}
```

### 3. Filtrado por Fecha

```javascript
<DatePicker 
    picker="date" 
    style={{ width: "100%", marginBottom: 20 }} 
    placeholder="Seleccionar año" 
    value={dayjs(dateSearch)} 
    onChange={(value) => setdateSearch(value.format("YYYY-MM-DD"))}
/>
```

### 4. Carga de Datos con Paginación

```javascript
const fetchData = async () => {
    setLoading(true)
    
    const searchParams = {
        ...getRandomuserParams(tableParams),
        medio_compra: Array.isArray(tableParams.medio_compra) ? tableParams.medio_compra[0] : tableParams.medio_compra,
        id_compra: Array.isArray(tableParams.id_compra) ? tableParams.id_compra[0] : tableParams.id_compra,
        // ... más parámetros
    }
    
    // Notificación si la consulta tarda más de 10 segundos
    let requestCompleted = false
    const alertTimeout = setTimeout(() => {
        if (!requestCompleted) {
            api.open({
                message: 'Hola!',
                description: 'La consulta puede demorar hasta 3 minutos. La siguiente consulta por este día será más rápida!. Por favor no cerrar ni recargar la página.',
                duration: 0,
                icon: <IconSettings style={{ color: COLORS.Primary }} />,
            })
        }
    }, 10000)
    
    try {
        const response = await axiosInstance.get(`/api/getConsolidado/${dateSearch}`, {
            params: searchParams,
        })
        
        clearTimeout(alertTimeout)
        
        setData(response.data["data"])
        setTableParams({
            ...tableParams,
            pagination: {
                ...tableParams.pagination,
                total: response.data["total"],
            },
        })
    } catch (error) {
        console.error(error)
    } finally {
        clearTimeout(alertTimeout)
        setLoading(false)
    }
}
```

**Características de Carga**:
- Paginación del lado del servidor
- Notificación de espera para consultas largas
- Manejo de timeout
- Cache en servidor (consultas subsecuentes más rápidas)

### 5. Manejo de Cambios en Tabla

```javascript
const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
        pagination,
        ...filters,
        ...sorter,
    })
    
    if (pagination.pageSize !== tableParams.pagination?.pageSize) {
        setData([])
    }
}

useEffect(() => {
    fetchData()
}, [JSON.stringify(tableParams), dateSearch])
```

## Control de Acceso

```javascript
if (userLogged) {
    if(userLogged.type_account === 'Secretaria Abastecimiento' || 
       userLogged.type_account === 'Super Admin'){
        // Acceso permitido
    } else {
        window.location.href = "/"
    }
}
```

**Roles con Acceso**:
- Secretaria Abastecimiento
- Super Admin

## Modales Integrados

- **ModalCargarPAC**: Para cargar datos del PAC desde archivo Excel

## Notificaciones del Sistema

### Notificación de Carga Larga
```javascript
api.open({
    message: 'Hola!',
    description: 'La consulta puede demorar hasta 3 minutos. La siguiente consulta por este día será más rápida!. Por favor no cerrar ni recargar la página.',
    duration: 0,
    icon: <IconSettings style={{ color: COLORS.Primary }} />,
})
```

## Estilos

```javascript
const useStyles = createStyles((theme) => ({
    wrapper: {
        display: "block",
        borderRadius: theme.radius.md,
        backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.white,
        border: `${rem(1)} solid ${theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[3]}`,
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
        padding: theme.spacing.xl,
        paddingLeft: `calc(${theme.spacing.xl} * 2)`,
        
        "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: rem(6),
            backgroundImage: theme.fn.linearGradient(0, theme.colors.cyan[6], theme.colors.lime[6]),
        },
    },
}))
```

## API Endpoints

### GET
- `/api/getConsolidado/:date`: Obtiene consolidado PAC por fecha
  - Parámetros: Todos los filtros de columnas
  - Paginación: current, pageSize
  - Respuesta: `{ data: [], total: number }`

## Características Especiales

### 1. Optimización de Búsqueda
- Filtros aplicados del lado del servidor
- Resaltado visual de términos buscados
- Búsqueda por columna independiente

### 2. Gestión de Performance
- Notificación proactiva para consultas largas
- Cache en servidor para consultas repetidas
- Paginación para grandes volúmenes de datos

### 3. UX Mejorada
- Expand/collapse para textos largos
- DatePicker con formato español
- Loading states claros
- Mensajes informativos

## Consideraciones para Migración

1. **Tabla con Búsqueda**: Implementar con TanStack Table + filtros del servidor
2. **Highlighter**: Migrar a librería compatible o implementar custom
3. **DatePicker**: Usar librería moderna (React Day Picker, date-fns)
4. **Notificaciones**: Sistema unificado de toasts/notifications
5. **Paginación**: Mantener lógica server-side
6. **Filtros**: Implementar debounce en búsquedas
7. **Expand/Collapse**: Componente reutilizable
8. **Loading States**: Skeleton loaders
9. **Cache**: Implementar con React Query o SWR
10. **Acceso**: Middleware de autorización

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "antd": "^5.0.0",
  "@tabler/icons-react": "^2.0.0",
  "dayjs": "^1.11.0",
  "react-highlight-words": "^0.20.0",
  "axios": "^1.0.0"
}
```

## Datos de Ejemplo

### Estructura de Respuesta API
```javascript
{
    "data": [
        {
            "id": 1,
            "medio_compra": "Licitación Pública",
            "id_compra": "LP-2024-001",
            "proveedor": "Proveedor XYZ",
            "codigo": "PROD-001",
            "producto": "Producto de ejemplo con descripción larga...",
            "pac": "PAC-2024",
            "stock_min": 100,
            "stock_cri": 50,
            "stock_exp": 200,
            "comprar": 150,
            "critico": "Si",
            "si_no": "Si",
            "precio_bruto": "1500000",
            "oc": "OC-2024-001",
            "fecha_registro_oc": "2024-01-15",
            "llegada_aprox": "2024-02-15",
            "cantidad": 100,
            "observaciones": "Observaciones importantes",
            "fecha_pac": "2024-01-01"
        }
    ],
    "total": 1000
}
```
