# Módulo: CrearLicitacion (Crear Licitación)

## Descripción General
Formulario para la creación de nuevas licitaciones en el sistema. Permite seleccionar diferentes formatos de licitación y muestra el flujo de trabajo correspondiente mediante un timeline visual.

## Ubicación
`src/views/private/CrearLicitacion.jsx`

## Tecnologías y Librerías Utilizadas

### Dependencias Principales
- **React** (v18+): Hooks (useEffect, useState, useRef)
- **React Router**: useNavigate
- **Mantine UI**: createStyles, Text, Title, Image, Timeline, rem
- **Ant Design**: Button, Input, Select, message, Modal, DatePicker
- **Lottie**: Animaciones (SendDataAnimation)
- **Day.js**: Manejo de fechas con locale español
- **date-fns**: parse y format para conversión de fechas
- **Axios**: axiosInstance

### Estilos
- CSS externo: `../../styles/CrearLicitacion.css`

## Estructura del Componente

### Estado del Componente

```javascript
// Loading
const [loadingScreenC, setLoadingScreenC] = useState(false)
const [data, setData] = useState(false)

// Modal de envío
const [isModalOpen, setIsModalOpen] = useState(false)

// Formato de Liquidación
const [formatoLiquidacion, setFormatoLiquidacion] = useState(undefined)
const [formatoAdquisicionSelected, setFormatoAdquisicionSelected] = useState(false)
const [formatoContraloriaSelected, setFormatoContraloriaSelected] = useState(false)
const [formatoContratoSelected, setFormatoContratoSelected] = useState(false)
const [formatoSuministroSelected, setFormatoSuministroSelected] = useState(false)
const [formatoOtrosTramitesSelected, setFormatoOtrosTramitesSelected] = useState(false)

// Campos del formulario
const [requirente, setRequirente] = useState("")
const [numeroLicitacion, setNumeroLicitacion] = useState("")
const [vigencia, setVigencia] = useState("")
const [nombreLicitacion, setNombreLicitacion] = useState("")
const [montoPresupuestado, setMontoPresupuestado] = useState("")
const [ocultarMontoSolictado, setOcultarMontoSolictado] = useState(false)

// Input Select autocompletable
const [list1Value, setList1Value] = useState(undefined)
const [newOption, setNewOption] = useState("")
const [isLoading, setIsLoading] = useState(false)
const [arregloDeStrings, setArregloDeStrings] = useState([])
```

## Formatos de Licitación

### 1. Adquisición (ID: 1)
**Proceso (11 pasos)**:
1. Confección de Bases
2. Requerimiento referente técnico
3. Jurídico
4. Firmas Directivos y Partes
5. Publicación
6. Evaluación Técnica
7. Preadjudicación y Comisión
8. Presupuesto
9. Jurídico
10. Firmas Directivos y Partes
11. Publicar

**Campos Requeridos**:
- Número de Licitación ✓
- Vigencia ✓
- Monto Presupuestado ✓

### 2. Contraloría (ID: 2)
**Proceso (13 pasos)**:
1. Confección de Bases
2. Requerimiento referente técnico
3. Jurídico
4. Firmas Directivos y Partes
5. Contraloría
6. Publicación
7. Comisión Apertura
8. Evaluación Técnica
9. Preadjudicación y Comisión
10. Presupuesto
11. Jurídico
12. Firmas Directivos y Partes
13. Publicar

**Campos Requeridos**:
- Número de Licitación: Opcional (se guarda como 'null')
- Vigencia ✓
- Monto Presupuestado ✓

### 3. Contrato (ID: 3)
**Proceso (8 pasos)**:
1. Confección de contrato
2. Revisión jurídico
3. Envío a proveedor
4. Recepción de proveedor
5. Resolución de contrato
6. Revisión Jurídico
7. Firmas Directivos y Partes
8. Publicar

**Campos Requeridos**:
- Número de Licitación ✓
- Vigencia ✓
- Monto Presupuestado ✓

### 4. Suministro (ID: 4)
**Proceso (11 pasos)**:
1. Confección de Bases
2. Requerimiento referente técnico
3. Jurídico
4. Firmas Directivos y Partes
5. Publicación
6. Evaluación Técnica
7. Preadjudicación y Comisión
8. Presupuesto
9. Jurídico
10. Firmas Directivos y Partes
11. Publicar

**Campos Requeridos**:
- Número de Licitación ✓
- Vigencia ✓
- Monto Presupuestado ✓

### 5. Otros Trámites (ID: 5)
**Proceso (4 pasos)**:
1. Confección Documento
2. Jurídico
3. Firmas Directivos y Partes
4. Publicar

**Campos Requeridos**:
- Número de Licitación ✓
- Vigencia: NO
- Monto Presupuestado: NO

## Funcionalidades Principales

### 1. Selección de Formato

```javascript
const handleChangeFormatoLiquidacion = (value) => {
    switch (value) {
        case "1": // Adquisición
            setFormatoAdquisicionSelected(true)
            setFormatoContraloriaSelected(false)
            setFormatoContratoSelected(false)
            setFormatoSuministroSelected(false)
            setFormatoOtrosTramitesSelected(false)
            setOcultarMontoSolictado(false)
            break
        case "2": // Contraloría
            // ...
            break
        case "3": // Contrato
            // ...
            break
        case "4": // Suministro
            // ...
            break
        case "5": // Otros Trámites
            setOcultarMontoSolictado(true) // Oculta campos de vigencia y monto
            break
        default:
            // Reset all
            break
    }
    setFormatoLiquidacion(value)
}
```

### 2. Conversión de Fechas

```javascript
function convertDateFormat(originalDate) {
    // Parsear la fecha original en el formato 'dd-MM-yyyy'
    const parsedDate = parse(originalDate, "dd-MM-yyyy", new Date())
    // Formatear la fecha al formato 'yyyy-MM-dd'
    const formattedDate = format(parsedDate, "yyyy-MM-dd")
    return formattedDate
}
```

### 3. Creación de Licitación

```javascript
async function createLicitacion() {
    // Validaciones
    if (!formatoLiquidacion) {
        return message.error("Debe ingresar un Formato de Liquidación")
    }
    
    if (formatoLiquidacion !== "5") {
        if (!vigencia) {
            return message.error("Debe ingresar una Vigencia")
        }
        if (!montoPresupuestado) {
            return message.error("Debe ingresar un Monto Presupuestado")
        }
        if (!/^[0-9]+$/.test(montoPresupuestado)) {
            return message.error("Debe ingresar solo números en Monto Presupuestado")
        }
    }
    
    if (!requirente) {
        return message.error("Debe ingresar un Requirente")
    }
    
    if (formatoLiquidacion !== "2" && !numeroLicitacion) {
        return message.error("Debe ingresar un Numero de Licitacion")
    }
    
    if (!nombreLicitacion) {
        return message.error("Debe ingresar un Nombre Licitación")
    }
    
    const formData = new FormData()
    formData.append("fk_formato_liquidacion_id", formatoLiquidacion)
    formData.append("requirente", requirente)
    
    if (formatoLiquidacion === "2") {
        formData.append("numero_licitacion", "null")
    } else {
        formData.append("numero_licitacion", numeroLicitacion)
    }
    
    if (formatoLiquidacion === "5") {
        formData.append("vigencia", "null")
        formData.append("monto_presupuestado", "null")
    } else {
        formData.append("vigencia", convertDateFormat(fecha_formateada(vigencia)))
        formData.append("monto_presupuestado", montoPresupuestado)
    }
    
    formData.append("nombre_licitacion", nombreLicitacion)
    formData.append("fk_usuario_id", userLogged.id)
    
    setIsModalOpen(true)
    
    await axiosInstance.post("/api/createLicitacion", formData)
        .then((response) => {
            if (response.data["msg"]) {
                message.error(`El Número de licitacion o MEMO ya existe`)
            } else {
                message.success(`La licitación se ha guardado correctamente.`)
                setIsModalOpen(false)
                cleanInputs()
            }
        })
        .catch((error) => {
            message.error(`La licitación no ha podido guardarse.`)
            cleanInputs()
        })
        .finally(() => {
            setIsModalOpen(false)
            if (!response.data["msg"]) {
                cleanInputs()
            }
        })
}
```

### 4. Select Autocompletable con Creación Dinámica

```javascript
// Obtener requirentes existentes
const getRequirentes = async () => {
    setLoadingScreenC(true)
    try {
        const response = await axiosInstance.get("/api/getRequirentes")
        setData(response.data)
        const nombres = response.data.map((objeto) => objeto.nombre)
        setArregloDeStrings(nombres)
    } finally {
        setLoadingScreenC(false)
    }
}

// Cambio en select
const onChangeList1 = (value) => {
    setList1Value(value)
    setRequirente(value)
}

// Renderizado de opciones con posibilidad de crear nueva
<Select
    placeholder="Ingrese requirente"
    value={list1Value}
    style={{ width: "100%" }}
    loading={isLoading}
    showSearch
    optionFilterProp="children"
    onChange={onChangeList1}
    onSearch={(e) => {
        if (e.length > 0) setNewOption(e)
    }}
    filterOption={(input, option) =>
        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
    }
>
    {newOption && list1Options.filter((o) => o === newOption).length === 0 && (
        <Option key={newOption} value={newOption}>
            {newOption}
        </Option>
    )}
    {list1SelectOptions}
</Select>
```

### 5. Limpieza de Campos

```javascript
function cleanInputs() {
    setFormatoLiquidacion(undefined)
    handleChangeFormatoLiquidacion(undefined)
    setRequirente("")
    setNumeroLicitacion("")
    setVigencia("")
    setNombreLicitacion("")
    setMontoPresupuestado("")
    setList1Value(undefined)
}
```

## Visualización del Timeline

El componente muestra diferentes timelines según el formato seleccionado:

```javascript
{formatoAdquisicionSelected ? (
    <Timeline className={"Adquisicion"} active={17} bulletSize={25} lineWidth={2}>
        <Timeline.Item className={classes.timeLine} color="lime" bullet={1}>
            <Text size="sm">Confección de Bases</Text>
        </Timeline.Item>
        // ... más items
    </Timeline>
) : formatoContraloriaSelected ? (
    <Timeline className={"Contraloria"} active={17} bulletSize={25} lineWidth={2}>
        // ...
    </Timeline>
) : /* ... otros formatos ... */}
```

**Características del Timeline**:
- Color: lime (verde)
- Tamaño de bullet: 25px
- Ancho de línea: 2px
- Siempre activo hasta el final (active={17})
- Cada paso numerado visualmente

## Modal de Envío

```javascript
<Modal
    footer={null}
    closable={false}
    maskClosable={false}
    title="Enviando..."
    open={isModalOpen}
>
    {isModalOpen && <Lottie animationData={SendDataAnimation} loop={true} />}
</Modal>
```

**Características**:
- No se puede cerrar mientras está abierto
- Muestra animación Lottie
- Se cierra automáticamente al completar

## Control de Acceso

```javascript
if(userLogged){
    if(userLogged.type_account === 'Licitador' || 
       userLogged.type_account === 'Super Admin'){
        // Acceso permitido
    } else {
        window.location.href = "/"
    }
}
```

**Roles con Acceso**:
- Licitador
- Super Admin

## Diseño Responsive

```javascript
const useStyles = createStyles((theme) => ({
    pantallaContenedor: {
        width: "100%",
        display: "flex",
        gap: "10px",
        justifyContent: "space-between",
        flexWrap: "wrap",
    },
    
    div_input: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
    },
    
    // Ajustes según formato seleccionado
    style={{ 
        gridTemplateColumns: formatoLiquidacion === "2" || formatoLiquidacion === "5" 
            ? "1fr" 
            : null 
    }}
}))
```

## Validaciones

### Validación de Monto
```javascript
if (!/^[0-9]+$/.test(montoPresupuestado)) {
    return message.error("Debe ingresar solo números en Monto Presupuestado")
}
```

### Validación de Duplicados
El servidor valida si el número de licitación ya existe:
```javascript
if (response.data["msg"]) {
    message.error(`El Número de licitacion o MEMO ya existe`)
}
```

## API Endpoints

### GET
- `/api/getRequirentes`: Obtiene lista de requirentes existentes

### POST
- `/api/createLicitacion`: Crea nueva licitación
  - Campos: fk_formato_liquidacion_id, requirente, numero_licitacion, vigencia, monto_presupuestado, nombre_licitacion, fk_usuario_id

## Consideraciones para Migración

1. **Timeline**: Migrar a componente custom o librería alternativa
2. **Select Autocompletable**: Implementar con Combobox moderno (Shadcn/ui, Headless UI)
3. **DatePicker**: Usar react-day-picker o similar
4. **Validaciones**: Usar React Hook Form + Zod
5. **Animaciones**: Mantener Lottie o migrar a Framer Motion
6. **Formato de Fechas**: Centralizar lógica de conversión
7. **FormData**: Considerar usar objeto JSON en lugar de FormData
8. **Estados de Formato**: Usar reducer para manejar complejidad
9. **Loading States**: Skeleton loaders consistentes
10. **Mensajes**: Sistema unificado de notificaciones

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "antd": "^5.0.0",
  "lottie-react": "^2.4.0",
  "dayjs": "^1.11.0",
  "date-fns": "^2.30.0",
  "axios": "^1.0.0",
  "react-router-dom": "^6.0.0"
}
```

## Estructura de Datos

### FormData Enviado
```javascript
{
    fk_formato_liquidacion_id: "1", // 1-5
    requirente: "Nombre del Requirente",
    numero_licitacion: "2024-LP-001" | "null",
    vigencia: "2024-12-31" | "null",
    monto_presupuestado: "1500000" | "null",
    nombre_licitacion: "Nombre descriptivo",
    fk_usuario_id: 123
}
```

## Flujos Especiales

### Formato Contraloría
- Número de licitación es opcional
- Se guarda como "null" si está vacío

### Formato Otros Trámites
- No requiere vigencia
- No requiere monto presupuestado
- Flujo simplificado de 4 pasos
