# Modal: ModalCargarPAC

## Descripción General
Modal para carga masiva del Plan Anual de Compras (PAC) desde archivos Excel con procesamiento y validación de datos.

## Ubicación
`src/components/ui/modals/ModalCargarPAC.jsx`

## Tipo de Componente
**forwardRef** con **useImperativeHandle**

## Estructura del Componente

### Estado
```javascript
const [api, contextHolder] = notification.useNotification()
const [open, setOpen] = useState(false)
const [buttonEstado, setButtonEstado] = useState(false)
const [dataExcel, setDataExcel] = useState([])
const [dataFecha, setDataFecha] = useState("")
const [loading, setLoading] = useState(false)
```

## Funcionalidades Principales

### 1. Procesamiento de Archivo Excel

```javascript
const handleFileUpload = async (info) => {
    setLoading(true)
    const { file } = info
    const reader = new FileReader()
    
    reader.onload = async (e) => {
        const data = e.target.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0] // Primera hoja
        const worksheet = workbook.Sheets[sheetName]
        
        const excelData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,              // Array de arrays
            cellDates: true,        // Parsear fechas
            dateNF: 'DD-MM-YYYY',   // Formato de fecha
            raw: false,             // Formatear valores
            cellText: false,
        })
        
        setDataExcel(excelData)
        setLoading(false)
    }
    
    reader.readAsBinaryString(file)
}
```

**Configuración XLSX**:
- `header: 1`: Retorna array de arrays (no objetos)
- `cellDates: true`: Convierte fechas de Excel a objetos Date
- `dateNF: 'DD-MM-YYYY'`: Formato de fecha deseado
- `raw: false`: Formatea los valores según tipo
- `cellText: false`: No fuerza conversión a texto

### 2. Configuración del Upload

```javascript
const propsUpload = {
    name: 'file',
    customRequest: handleFileUpload, // Handler personalizado
    showUploadList: false,           // No muestra lista de archivos
}
```

### 3. Carga de Datos al Backend

```javascript
async function cargarPac() {
    setLoading(true)
    
    const formData = new FormData()
    formData.append("datos", JSON.stringify(dataExcel))
    formData.append("year", dataFecha)
    
    await axiosInstance.post("/api/insertarDatos", formData)
        .then((response) => {
            api.success({
                message: 'Bieen!',
                description: response.data["mensaje"],
            })
        })
        .catch((error) => {
            api.error({
                message: 'Ups!',
                description: "Ha ocurrido un error.",
            })
        })
        .finally(() => {
            setLoading(false)
            setButtonEstado(false)
            setDataExcel([])
            setDataFecha("")
        })
}
```

### 4. Limpieza al Cerrar

```javascript
async function onClose(){
    setOpen(false)
    setDataExcel([])
    setDataFecha("")
}
```

## Campos del Formulario

### 1. Upload de Archivo Excel
```javascript
<Upload style={{ width: '100%' }} {...propsUpload}>
    <Button icon={<IconUpload size={13} />}>
        Adjuntar PAC
    </Button>
</Upload>
```

### 2. Selector de Año
```javascript
<DatePicker 
    picker="year" 
    style={{ width: "100%", marginBottom: 20, marginTop: 20 }} 
    placeholder="Seleccionar año" 
    onChange={(value) => setDataFecha(value.format("YYYY"))}
/>
```

## Sistema de Notificaciones

### Notificación de Éxito
```javascript
api.success({
    message: 'Bieen!',
    description: response.data["mensaje"],
})
```

### Notificación de Error
```javascript
api.error({
    message: 'Ups!',
    description: "Ha ocurrido un error.",
})
```

## Estados de Carga

### Durante Procesamiento de Excel
```javascript
{!loading ? (
    <>
        <Upload {...propsUpload}>
            <Button icon={<IconUpload size={13} />}>Adjuntar PAC</Button>
        </Upload>
        <DatePicker ... />
    </> 
) : (
    <p>Cargando...</p>
)}
```

## Footer del Modal

```javascript
footer={[
    <Button key="back" onClick={() => setOpen(false)}>
        Cerrar
    </Button>,
    <Button
        onClick={() => cargarPac()}
        style={{ backgroundColor: COLORS.Primary, color: "white" }}
        disabled={buttonEstado}
    >
        Guardar
    </Button>,
]}
```

## Flujo de Trabajo

1. **Usuario abre modal**
2. **Selecciona archivo Excel**: Se procesa con XLSX
3. **Datos se extraen**: Se guarda en `dataExcel`
4. **Selecciona año**: Se guarda en `dataFecha`
5. **Click en Guardar**: 
   - Valida que hay datos
   - Envía a backend como JSON stringified
   - Backend procesa e inserta en BD
6. **Notificación**: Éxito o error
7. **Limpieza**: Resetea estado

## API Endpoints

### POST
- `/api/insertarDatos`: Recibe datos del PAC
  - `datos`: JSON string de array de arrays
  - `year`: Año en formato "YYYY"

## Formato de Datos Enviados

```javascript
{
    datos: "[
        ['Servicio', 'Bodega', 'Código', ...],
        ['Servicio 1', 'Bodega 1', '001', ...],
        ['Servicio 2', 'Bodega 2', '002', ...],
        ...
    ]",
    year: "2024"
}
```

## Validaciones

### Cliente
1. Archivo debe ser seleccionado
2. Año debe ser seleccionado
3. Archivo debe ser Excel válido

### Servidor (Asumido)
1. Validar estructura de datos
2. Validar tipos de datos
3. Validar duplicados
4. Validar integridad referencial

## Estructura Esperada del Excel

Asumiendo estructura típica de PAC:
```
| Servicio | Supra Servicio | Bodega | Código | Detalle | U.Medida | Costo | Cant.Anual | Enero | Feb | ... |
|----------|----------------|--------|--------|---------|----------|-------|------------|-------|-----|-----|
| Valor1   | Valor2         | Valor3 | ...    | ...     | ...      | ...   | ...        | ...   | ... | ... |
```

## Consideraciones para Migración

1. **Validación de Estructura**: Validar columnas requeridas antes de enviar
2. **Preview**: Mostrar preview de datos antes de guardar
3. **Validación en Cliente**: Validaciones más robustas
4. **Progress Bar**: Indicador de progreso de carga
5. **Errores Detallados**: Mostrar qué filas tienen errores
6. **Template**: Proveer template de Excel descargable
7. **Columnas Dinámicas**: Mapeo flexible de columnas
8. **Múltiples Hojas**: Soporte para múltiples hojas
9. **Formatos**: Soporte para CSV además de Excel
10. **Dry Run**: Opción de validar sin guardar
11. **Rollback**: Poder deshacer carga
12. **Historial**: Ver cargas anteriores

## Mejoras Sugeridas

### 1. Validación de Estructura
```javascript
const validateExcelStructure = (data) => {
    if (!data || data.length === 0) {
        throw new Error("El archivo está vacío")
    }
    
    const headers = data[0]
    const requiredColumns = ['Servicio', 'Código', 'Detalle']
    
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    if (missingColumns.length > 0) {
        throw new Error(`Faltan columnas: ${missingColumns.join(', ')}`)
    }
    
    return true
}
```

### 2. Preview de Datos
```javascript
const [previewData, setPreviewData] = useState([])

// Mostrar primeras 5 filas
<Table 
    dataSource={dataExcel.slice(0, 5)} 
    columns={/* columnas dinámicas */}
    pagination={false}
/>
```

### 3. Template Descargable
```javascript
const downloadTemplate = () => {
    const template = [
        ['Servicio', 'Bodega', 'Código', 'Detalle', ...],
        ['Ejemplo 1', 'Bodega A', '001', 'Producto ejemplo', ...],
    ]
    
    const ws = XLSX.utils.aoa_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "PAC Template")
    XLSX.writeFile(wb, "plantilla_pac.xlsx")
}

<Button onClick={downloadTemplate}>
    Descargar Plantilla
</Button>
```

### 4. Manejo de Errores del Backend
```javascript
.catch((error) => {
    const errorDetails = error.response?.data?.errors || []
    
    api.error({
        message: 'Error al cargar PAC',
        description: (
            <div>
                <p>Ha ocurrido un error:</p>
                <ul>
                    {errorDetails.map((err, idx) => (
                        <li key={idx}>Fila {err.row}: {err.message}</li>
                    ))}
                </ul>
            </div>
        ),
        duration: 0, // No auto-cerrar
    })
})
```

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "antd": "^5.0.0",
  "@tabler/icons-react": "^2.0.0",
  "xlsx": "^0.18.0",
  "axios": "^1.0.0"
}
```

## Props

```javascript
// No recibe props, usa ref pattern
```

## Uso desde Componente Padre

```javascript
const childRef = useRef(null)

<Button onClick={() => childRef.current.childFunction(null, "Save")}>
    Cargar PAC
</Button>

<ModalCargarPAC ref={childRef} />
```

## Seguridad

### Consideraciones
1. **Validación de Tamaño**: Limitar tamaño de archivo
2. **Timeout**: Timeout para archivos muy grandes
3. **Sanitización**: Sanitizar datos antes de insertar
4. **Transacciones**: Usar transacciones en BD
5. **Logs**: Registrar quién cargó qué
6. **Backup**: Backup antes de carga masiva
