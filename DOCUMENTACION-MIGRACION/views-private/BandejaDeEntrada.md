# Módulo: BandejaDeEntrada (Bandeja de Entrada)

## Descripción General
Módulo principal para la gestión de licitaciones en el sistema. Permite visualizar, filtrar, gestionar y realizar acciones sobre las licitaciones según el rol del usuario.

## Ubicación
`src/views/private/BandejaDeEntrada.jsx`

## Tecnologías y Librerías Utilizadas

### Dependencias Principales
- **React** (v18+): Hooks (useState, useEffect, useRef)
- **React Router**: useNavigate para navegación
- **Mantine UI**: Componentes de interfaz (ActionIcon, ScrollArea, Box, Title, Text, createStyles)
- **Ant Design**: Table, Button, Input, Select, Popconfirm, message, notification
- **Tabler Icons**: IconArrowBackUp, IconArrowForwardUp, IconTableOptions, IconUpload, IconFolderOpen, IconAlignJustified
- **XLSX**: Para exportación de datos a Excel
- **Axios**: axiosInstance para peticiones HTTP

### Estilos
- Utiliza `createStyles` de Mantine para estilos dinámicos
- CSS externo: `../../styles/styles-bandeja-entrada.css`

## Estructura del Componente

### Estado del Componente

```javascript
// Loading y UI
const [loadingScreenC, setLoadingScreenC] = useState(false)

// Datos
const [dataLicitaciones, setDataLicitaciones] = useState([])
const [dataUsers, setDataUsers] = useState([])

// Filtros
const [numeroLicitacion, setNumeroLicitacion] = useState("")
const [usuarioSelected, setUsuarioSelected] = useState(undefined)
const [estado, setEstado] = useState(undefined)
const [turnoFiltrado, setTurnoFiltrado] = useState(undefined)

// Excel
const [buttonExcel, setButtonExcel] = useState(false)
const [textButtonExcel, setTextButtonExcel] = useState("Generar Informe de Retrasos")

// Referencias a modales
const childRef = useRef(null) // ModalCULicitacion
const childRefDocumento = useRef(null) // ModalCULicitacionDocumento
const childRefDevolver = useRef(null) // ModalCULicitacionDevolver
const childRefObservaciones = useRef(null) // ModalCUHistorial
const childRefWorkFlow = useRef(null) // ModalCUWorkFlow
const childRefWorkFlowSA = useRef(null) // ModalCUWorkFlowSA
const childRefVerDocumento = useRef(null) // ModalCUVerDocumentos
```

### Columnas de la Tabla

La tabla muestra las siguientes columnas:
1. **Número Licitación**: Muestra el número o "Sin número de licitación"
2. **Formato de liquidación**: Título del formato
3. **Nombre de Licitación**: Nombre descriptivo
4. **Creador**: Nombre completo del usuario creador
5. **Requirente**: Entidad requirente
6. **Monto**: Monto presupuestado o "Sin Monto"
7. **Vigencia**: Fecha de vigencia formateada
8. **Estado**: Badge visual (Pendiente/Devuelto/Finalizada) con colores:
   - Pendiente: #e5be01 (amarillo)
   - Devuelto: #e53935 (rojo)
   - Finalizada: #268e00 (verde)
9. **Fecha de Creación**: Fecha formateada
10. **Proceso Actual**: Título del proceso actual
11. **Acciones**: Iconos de acción según permisos

### Acciones de la Tabla

#### Iconos Condicionales
1. **Ver Observaciones** (IconAlignJustified): 
   - Se muestra si `contador_devoluciones > 0` o `contador_ediciones > 0`
   - Abre modal de historial de observaciones

2. **Ver Documentos** (IconFolderOpen):
   - Se muestra si `documento > 0`
   - Color: #FFD96D (amarillo)
   - Abre modal de documentos adjuntos

3. **Subir Documento** (IconUpload):
   - Visible solo si el proceso no es "Publicada" ni "No iniciado"
   - Solo para usuarios con turno actual o Super Admin
   - Color: #87CEEB (azul cielo)

4. **Devolver** (IconArrowBackUp):
   - Visible solo si el proceso no es "No iniciado" ni "Publicada"
   - Solo para usuarios con turno actual o Super Admin
   - Color: rojo
   - Permite devolver la licitación a un proceso anterior

5. **Avanzar** (IconArrowForwardUp):
   - Popconfirm para confirmar acción
   - Solo para usuarios con turno actual o Super Admin
   - Color: verde
   - Ejecuta función `avanzarLicitacion(id)`

6. **Ver WorkFlow** (IconTableOptions):
   - Color: azul
   - Disponible para todos los usuarios
   - Muestra el flujo de trabajo de la licitación

7. **Ver WorkFlow Super Admin** (IconTableOptions):
   - Color: #922b3e (vino)
   - Solo visible para Super Admin
   - Versión extendida del workflow

## Funcionalidades Principales

### 1. Carga de Datos
```javascript
const getLicitacionUsers = async () => {
    setLoadingScreenC(true)
    setNumeroLicitacion("")
    setUsuarioSelected(undefined)
    setEstado(undefined)
    setTurnoFiltrado(undefined)
    
    await axiosInstance.get("/api/CombinedQuerysUsersLicitacion")
        .then((response) => {
            setDataLicitaciones(response.data["Consulta1getLicitacion"]["original"])
            setDataUsers(response.data["Consulta2getUsers"]["original"])
        })
}
```

### 2. Filtrado de Licitaciones
```javascript
async function buscarLicitacionNumLicitacion() {
    // Validación: al menos un filtro debe estar presente
    if (numeroLicitacion === "" && 
        usuarioSelected === undefined && 
        estado === undefined && 
        turnoFiltrado === undefined) {
        return message.error("Debe ingresar algun filtro")
    }
    
    const formData = new FormData()
    formData.append("numero_licitacion", numeroLicitacion)
    
    if (usuarioSelected !== undefined) {
        formData.append("id_usuario", usuarioSelected)
    }
    if (estado !== undefined) {
        formData.append("estado", estado)
    }
    if (turnoFiltrado !== undefined) {
        formData.append("turno_filtrado", turnoFiltrado)
    }
    
    await axiosInstance.post("/api/getLicitacionSegunFiltro", formData)
}
```

**Filtros Disponibles**:
- **N° de Licitación | MEMO**: Búsqueda por texto
- **Creador**: Select con usuarios del sistema
- **Estado**: Pendiente, Finalizada, Devuelto
- **Filtrar por Turno**: Según el tipo de cuenta del usuario
  - Licitador
  - Secretario Jurídico
  - Subdireccion Administrativa
  - Presupuesto
  - Super Admin (ve todas las opciones)

### 3. Avanzar Licitación
```javascript
const avanzarLicitacion = async (id) => {
    message.loading("La licitación esta avanzando..")
    await axiosInstance.post("/api/avanzarLiquidacion/" + id + "/" + userLogged.id)
        .then((response) => {
            message.success(`La licitación avanzo correctamente.`)
            getLicitacionUsers()
        })
}
```

### 4. Generación de Informe Excel
```javascript
const generarExcelAPI = async () => {
    setButtonExcel(true)
    setTextButtonExcel("Generando informe...")
    
    await axiosInstance.get("/api/getLicitacionForExcel")
        .then((response) => {
            generarExcel(response.data)
        })
}

const generarExcel = async (response) => {
    const dataArray = response.map((item) => [
        item.numero_licitacion,
        item.nombre_licitacion,
        item.monto_presupuestado === "null" ? "Sin Monto" : item.monto_presupuestado,
        fecha_formateada(item.created_at),
        item.name + " " + item.lastname,
        item.titulo_proceso,
        item.fecha_recepcion,
        item.dias_sugeridos,
        item.dias_demora_habiles,
    ])
    
    const headerRow = [
        "Numero de Licitación",
        "Nombre de Licitación",
        "Monto Presupuestado",
        "Fecha de Creación",
        "Creador",
        "Proceso Actual",
        "Fecha Recepción del Proceso",
        "Tiempo Estimado",
        "Dias de Atraso Habiles",
    ]
    dataArray.unshift(headerRow)
    
    const ws = XLSX.utils.aoa_to_sheet(dataArray)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Datos")
    XLSX.writeFile(wb, "Informe-de-Retrasos.xlsx")
}
```

## Modales Integrados

1. **ModalCULicitacion**: Edición de licitaciones
2. **ModalCULicitacionDevolver**: Devolución de licitaciones con motivo
3. **ModalCULicitacionDocumento**: Carga de documentos
4. **ModalCUHistorial**: Historial de observaciones y modificaciones
5. **ModalCUWorkFlow**: Visualización del flujo de trabajo
6. **ModalCUWorkFlowSA**: Flujo de trabajo extendido (Super Admin)
7. **ModalCUVerDocumentos**: Ver documentos adjuntos

## Permisos y Roles

### Control de Acceso por Turno
El sistema verifica si el usuario tiene el turno actual para habilitar acciones:
```javascript
userLogged.type_account === record.turno || 
userLogged.type_account === "Super Admin"
```

### Roles del Sistema
- **Licitador**: Crea y gestiona sus licitaciones
- **Secretario Jurídico**: Revisa aspectos legales
- **Presupuesto**: Revisa aspectos presupuestarios
- **Subdireccion Administrativa**: Aprueba aspectos administrativos
- **Super Admin**: Acceso total, puede ver workflows especiales

## Notificaciones

Utiliza Ant Design notification para:
- Confirmar descarga de documentos Excel
- Mensajes de éxito/error en operaciones

## Estilos Personalizados

```javascript
const useStyles = createStyles((theme) => ({
    wrapper: {
        display: "flex",
        borderRadius: theme.radius.md,
        backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.white,
        border: `${rem(1)} solid ${theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[3]}`,
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
        padding: theme.spacing.xl,
        paddingLeft: `calc(${theme.spacing.xl} * 2)`,
        
        // Barra lateral decorativa con gradiente
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
- `/api/CombinedQuerysUsersLicitacion`: Obtiene licitaciones y usuarios
- `/api/getLicitacionForExcel`: Datos para exportar a Excel

### POST
- `/api/avanzarLiquidacion/:id/:userId`: Avanza una licitación al siguiente proceso
- `/api/getLicitacionSegunFiltro`: Filtra licitaciones según criterios

## Datos de Ejemplo

### Estados de Licitación
- **Pendiente**: En proceso, esperando acción
- **Devuelto**: Requiere correcciones
- **Finalizada**: Completada exitosamente

### Procesos
- No iniciado
- Confección de Bases
- Requerimiento referente técnico
- Jurídico
- Firmas Directivos y Partes
- Publicación
- Evaluación Técnica
- Preadjudicación y Comisión
- Presupuesto
- Publicada

## Consideraciones para Migración

1. **Gestión de Estado**: Usar estado global (Context API, Redux, Zustand)
2. **Tabla**: Considerar usar TanStack Table (React Table v8) para mejor performance
3. **Filtros**: Implementar debounce en búsquedas
4. **Excel**: Mantener librería XLSX
5. **Modales**: Migrar a componentes reutilizables con composition
6. **Permisos**: Centralizar lógica de autorización
7. **Notificaciones**: Sistema unificado de notificaciones
8. **Iconos**: Mantener Tabler Icons o migrar a Lucide React
9. **Responsive**: Asegurar diseño móvil con breakpoints adecuados
10. **Optimización**: Implementar virtualización para tablas grandes

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "antd": "^5.0.0",
  "@tabler/icons-react": "^2.0.0",
  "xlsx": "^0.18.0",
  "axios": "^1.0.0",
  "react-router-dom": "^6.0.0"
}
```
