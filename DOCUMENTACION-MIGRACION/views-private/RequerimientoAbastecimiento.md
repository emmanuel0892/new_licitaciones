# Módulo: RequerimientoAbastecimiento

## Descripción General
Módulo para gestionar requerimientos de abastecimiento con seguimiento de productos, documentos y historial de estados.

## Ubicación
`src/views/private/RequerimientoAbastecimiento.jsx`

## Tecnologías y Librerías Utilizadas

### Dependencias Principales
- **React** (v18+): Hooks (useEffect, useState, useRef)
- **Mantine UI**: ActionIcon, Box, ScrollArea, Text, Timeline, Title, createStyles, rem
- **Ant Design**: Button, Card, Modal, Table
- **Tabler Icons**: IconFileCheck, IconHistory, IconEdit, IconShoppingCart, IconArrowNarrowDown
- **Axios**: axiosInstance con baseURL

## Estructura del Componente

### Estado
```javascript
const [loadingScreenC, setLoadingScreenC] = useState(false)
const [dataNamesAbastecimiento, setDataNamesAbastecimiento] = useState([])
const [data, setData] = useState([])
const childRef = useRef(null)
const [open, setOpen] = useState(false) // Modal productos
const [openHistory, setOpenHistory] = useState(false) // Modal historial
const [dataProductModal, setDataProductModal] = useState([])
const [dataHistorialModal, setDataHistorialModal] = useState([])
const [api, contextHolder] = notification.useNotification()
```

### Columnas de la Tabla Principal

1. **Correlativo**: Número de correlativo
2. **Servicio**: Servicio requirente
3. **Tipo Documento**: MEMO, Resolución, Antecedentes, etc.
4. **Documento**: Link descargable con icono
5. **Descripción**: Descripción de la solicitud
6. **Medio de Compra**: Licitación, Convenio Marco, etc.
7. **Empresa**: Nombre de la empresa
8. **Orden de Compra**: Número de OC
9. **Fecha de Envío OC**: Fecha formateada
10. **Acciones**: Ver productos, Editar, Ver historial

## Funcionalidades Principales

### 1. Carga de Datos

```javascript
const getUsersNamesAbastecimiento = async () => {
    setLoadingScreenC(true)
    try {
        const response = await axiosInstance.get("/api/getUsersNamesAbastecimiento")
        setDataNamesAbastecimiento(response.data)
    } catch (error) {
        console.log(error)
    } finally {
        setLoadingScreenC(false)
    }
}

const getRequerimientosAbastecimiento = async () => {
    setLoadingScreenC(true)
    try {
        const response = await axiosInstance.get("/api/getRequerimientosAbastecimiento")
        setData(response.data)
    } catch (error) {
        console.log(error)
    } finally {
        setLoadingScreenC(false)
    }
}
```

### 2. Modal de Productos

```javascript
const columnsProduct = [
    {
        title: "Código",
        dataIndex: "cod_producto",
        key: "cod_producto",
    },
    {
        title: "Descripción",
        dataIndex: "descripcion",
        key: "descripcion",
    },
    {
        title: "Cant. Programada",
        dataIndex: "cantidad_programada",
        key: "cantidad_programada",
    },
    {
        title: "Stock",
        dataIndex: "stock",
        key: "stock",
    },
]

// Renderizado de acción
render: (text, record) => 
    <div style={{ flexDirection: "row" }}>
        <ActionIcon onClick={()=> [ setOpen(true), setDataProductModal(text) ] }>
            <IconShoppingCart />
        </ActionIcon>
        <ActionIcon onClick={() => childRef.current.childFunction(record.id, "Edit") }>
            <IconEdit color={COLORS.Primary} />
        </ActionIcon>
        <ActionIcon onClick={()=> [ setOpenHistory(true), setDataHistorialModal(record.historial) ] }>
            <IconHistory color={COLORS.Secondary}/>
        </ActionIcon>
    </div>
```

### 3. Timeline de Historial

```javascript
const HistorialDetalles = (historial) => {
    if (historial) {
        return historial.map((item, index) => (
            <Timeline.Item 
                key={index} 
                bullet={<IconArrowNarrowDown size={12} />} 
                title={item.detalles}
            >
                <Text color="dimmed" size="sm">{item.usuario}</Text>
                <Text size="xs" mt={4}>{item.created_at}</Text>
            </Timeline.Item>
        ))
    } else {
        return null
    }
}

// Uso en modal
<Modal
    title={"Historial"}
    centered
    open={openHistory}
    onCancel={() => setOpenHistory(false)}
    footer={[]}
>
    <Timeline active={100} bulletSize={24} lineWidth={4} color="lime" mt={20}>
        {HistorialDetalles(dataHistorialModal)}
    </Timeline>
</Modal>
```

### 4. Descarga de Documentos

```javascript
{
    title: "Documento",
    dataIndex: "ruta_documento",
    key: "ruta_documento",
    render: (text) => (
        <a href={baseURL + text} target="_blank">
            <IconFileCheck style={{ color: COLORS.Primary }}/>
        </a>
    ),
}
```

## Control de Acceso

```javascript
if(userLogged){
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

- **ModalCURequerimientoAbastecimiento**: Crear/Editar requerimientos
  - Recibe `dataDerivados` como prop para selección de derivados

## Botones de Acción

```javascript
<div className="buttonsMain">
    <Title style={{ marginBottom: '10px' }}>Abastecimiento</Title>
    <Button
        type="primary"
        onClick={() => childRef.current.childFunction(null, "Save")}
    >
        Agregar Requerimiento
    </Button>
</div>
```

## API Endpoints

### GET
- `/api/getUsersNamesAbastecimiento`: Lista de usuarios de abastecimiento
- `/api/getRequerimientosAbastecimiento`: Todos los requerimientos

## Estructura de Datos

### Requerimiento
```javascript
{
    id: number,
    correlativo: string,
    servicio_requirente: string,
    tipo_documento: string,
    ruta_documento: string,
    descripcion_solicitud: string,
    medio_compra: string,
    empresa: string,
    orden_compra: string,
    fecha_envio_oc: string,
    productos: [
        {
            cod_producto: string,
            descripcion: string,
            cantidad_programada: number,
            stock: number
        }
    ],
    historial: [
        {
            detalles: string,
            usuario: string,
            created_at: string
        }
    ]
}
```

## Características Especiales

### 1. Sistema de Historial
- Timeline visual con Mantine
- Muestra usuario y fecha de cada cambio
- Detalles descriptivos de acciones

### 2. Gestión de Productos
- Modal separado para visualización
- Tabla con información de stock
- Validación de cantidades programadas

### 3. Documentos
- Link directo a descarga
- Icono visual con color del tema
- Apertura en nueva pestaña

## Consideraciones para Migración

1. **Timeline**: Mantener componente visual de historial
2. **Productos Anidados**: Considerar estructura normalizada
3. **Documentos**: Implementar preview antes de descargar
4. **Historial**: Sistema de auditoría completo
5. **Estados**: Workflow de estados del requerimiento
6. **Notificaciones**: Alertas al cambiar estado
7. **Validaciones**: Stock vs cantidad solicitada
8. **Búsqueda**: Filtros por servicio, estado, fecha
9. **Exportación**: Reportes de requerimientos
10. **Dashboard**: Resumen de requerimientos pendientes

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "antd": "^5.0.0",
  "@tabler/icons-react": "^2.0.0",
  "axios": "^1.0.0"
}
```
