# Módulo: PAC (Plan Anual de Compras)

## Descripción General
Módulo para visualizar el Plan Anual de Compras con paginación del lado del servidor y búsqueda avanzada por columna.

## Ubicación
`src/views/private/PAC.jsx`

## Tecnologías y Librerías Utilizadas

Similar a ConsolidadoPAC pero con enfoque en año específico.

## Estructura del Componente

### Estado
```javascript
const [data, setData] = useState()
const [loading, setLoading] = useState(false)
const [tableParams, setTableParams] = useState({
    pagination: {
        current: 1,
        pageSize: 10,
        showSizeChanger: false,
    },
})
const [searchText, setSearchText] = useState('')
const [searchedColumn, setSearchedColumn] = useState('')
const searchInput = useRef(null)
const [yearSearch, setYearSearch] = useState(dayjs().format('YYYY'))
const [expandedRows, setExpandedRows] = useState([])
```

### Columnas de la Tabla

1. **Servicio**
2. **Supra Servicio**
3. **Bodega**
4. **Código**
5. **Detalle** (con expand/collapse)
6. **U. Medida**
7. **Costo Unitario**
8. **Cant. Anual**
9. **Enero** - **Diciembre** (12 columnas)
10. **Mensual**
11. **Año Pac**

## Funcionalidades Principales

### 1. Filtrado por Año

```javascript
<DatePicker 
    picker="year" 
    style={{ width: "100%", marginBottom: 20 }} 
    placeholder="Seleccionar año" 
    value={dayjs(yearSearch)} 
    onChange={(value) => setYearSearch(value.format("YYYY"))}
/>
```

### 2. Carga de Datos

```javascript
const fetchData = async () => {
    setLoading(true)
    
    const searchParams = {
        ...getRandomuserParams(tableParams),
        servicio: Array.isArray(tableParams.servicio) ? tableParams.servicio[0] : tableParams.servicio,
        // ... todos los parámetros de búsqueda
        año_pac: Array.isArray(tableParams.año_pac) ? tableParams.año_pac[0] : tableParams.año_pac,
    }
    
    try {
        const response = await axiosInstance.get(`/api/getPacs/${yearSearch}`, {
            params: searchParams,
        })
        
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
        setLoading(false)
    }
}
```

### 3. Búsqueda por Columna

Implementa `getColumnSearchProps` igual que ConsolidadoPAC con:
- Búsqueda individual
- Resaltado de texto
- Filtros acumulativos

### 4. Expand/Collapse para Detalles

```javascript
const handleExpand = (key) => {
    setExpandedRows([...expandedRows, key])
}

const handleCollapse = (key) => {
    setExpandedRows(expandedRows.filter((k) => k !== key))
}

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

- **ModalCargarPAC**: Para cargar datos del PAC

## API Endpoints

### GET
- `/api/getPacs/:year`: Obtiene PAC por año
  - Parámetros: Filtros de todas las columnas
  - Paginación: current, pageSize
  - Respuesta: `{ data: [], total: number }`

## Diferencias con ConsolidadoPAC

1. **Filtro Principal**: Por año en lugar de fecha específica
2. **Estructura de Columnas**: Incluye meses individuales
3. **Endpoint**: `/api/getPacs/:year` vs `/api/getConsolidado/:date`
4. **Propósito**: Planificación anual vs consolidado diario

## Consideraciones para Migración

1. **DatePicker de Año**: Componente específico para selección anual
2. **Columnas Dinámicas**: Los 12 meses podrían generarse dinámicamente
3. **Totales**: Agregar fila de totales por mes
4. **Exportación**: Excel con formato mensual
5. **Comparativas**: Comparar años diferentes
6. **Gráficos**: Visualización de distribución mensual
7. **Performance**: Virtualización para grandes datasets
8. **Edición Inline**: Para ajustes rápidos
9. **Historial**: Ver cambios en el PAC
10. **Validaciones**: Suma de meses = cantidad anual

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

## Estructura de Datos

```javascript
{
    id: number,
    servicio: string,
    supra_servicio: string,
    bodega: string,
    codigo: string,
    detalle: string,
    unidad_medida: string,
    costo_unitario: number,
    cantidad_anual: number,
    enero: number,
    febrero: number,
    marzo: number,
    abril: number,
    mayo: number,
    junio: number,
    julio: number,
    agosto: number,
    septiembre: number,
    octubre: number,
    noviembre: number,
    diciembre: number,
    mensual: number,
    año_pac: string
}
```
