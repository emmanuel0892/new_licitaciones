# Modal: ModalCULicitacionDocumento

## Descripción General
Modal para adjuntar documentos a una licitación en el proceso actual. Cada documento queda registrado con el proceso desde el cual fue subido.

## Ubicación
`src/components/ui/modals/ModalCULicitacionDocumento.jsx`

## Tipo de Componente
**forwardRef** con **useImperativeHandle**

## Estructura del Componente

### Estado
```javascript
const [loadingScreenC, setLoadingScreenC] = useState(true)
const [open, setOpen] = useState(false)

const [file, setFile] = useState(null)
const [fileBD, setFileBD] = useState(null) // Para comparar si se cambió

const [procesoActualId, setProcesoActualId] = useState("")
const [procesoActualNombre, setProcesoActualNombre] = useState("")

const [isEdit, setIsEdit] = useState(false)
const [idLicitacion, setIdLicitacion] = useState("")
const [buttonEstado, setButtonEstado] = useState(false)

const { userLogged } = useAuthContext()
```

## Funcionalidades Principales

### 1. Carga de Información de Proceso

```javascript
const childFunction = async (id, action) => {
    setOpen(true)
    cleanInputs()
    
    if (action === "Edit") {
        setLoadingScreenC(true)
        setIsEdit(true)
        
        await axiosInstance.get("/api/getLicitacionId/" + id)
            .then((response) => {
                const licitacion = response.data[0]
                console.log(response.data[0])
                
                setIdLicitacion(id)
                setProcesoActualId(licitacion.fk_proceso_actual_id)
                setProcesoActualNombre(licitacion.titulo_proceso)
            })
            .finally(() => {
                setLoadingScreenC(false)
            })
    }
}
```

### 2. Subida de Documento

```javascript
async function updateLicitacion() {
    if (file === null) {
        return message.error("Debe subir un documeno valido, PDF o Word")
    }
    
    const formData = new FormData()
    
    // Validación de formato
    if (!(file.name.includes(".pdf") || file.name.includes(".docx") || file.name.includes(".doc"))) {
        return message.error("Debe subir un documeno valido, PDF o Word")
    }
    
    formData.append("file", file)
    formData.append("fk_proceso_subido_desde_id", procesoActualId)
    formData.append("fk_licitacion_id", idLicitacion)
    formData.append("fk_usuario_id", userLogged.id)
    
    setButtonEstado(true)
    setLoadingScreenC(true)
    
    console.log(file)
    
    await axiosInstance.post("/api/createDocumentoLicitacion", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
        .then((response) => {
            message.success(`La licitación se ha actualizado correctamente.`)
            setOpen(false)
            props.reloadTable()
        })
        .catch((error) => {
            message.error(`La licitación no ha podido actualizarse.`)
        })
        .finally(() => {
            cleanInputs()
            setButtonEstado(false)
            setLoadingScreenC(false)
        })
}
```

## Campos del Formulario

### 1. Proceso Actual (Solo Lectura)
```javascript
<Text>Proceso Actual:</Text>
<Input
    disabled
    value={procesoActualNombre}
    style={{ marginBottom: "15px" }}
/>
```

### 2. Selector de Documento
```javascript
<Text>Documento:</Text>
<FileInput
    value={file}
    accept=".pdf,.doc,.docx"
    icon={<IconUpload size={rem(14)} />}
    onChange={(newFile) => setFile(newFile)}
    placeholder="Ningun documento seleccionado"
/>
```

## Validaciones

### Validación de Archivo
1. **Requerido**: Debe seleccionar un archivo
2. **Formato**: Solo PDF (.pdf) o Word (.doc, .docx)
3. **Validación por extensión**: Verifica nombre del archivo

```javascript
if (!(file.name.includes(".pdf") || file.name.includes(".docx") || file.name.includes(".doc"))) {
    return message.error("Debe subir un documeno valido, PDF o Word")
}
```

## Registro en Base de Datos

Cada documento se guarda con:
- `file`: Archivo físico
- `fk_proceso_subido_desde_id`: ID del proceso actual
- `fk_licitacion_id`: ID de la licitación
- `fk_usuario_id`: Usuario que subió
- `ruta_documento`: Path generado automáticamente
- Timestamp de creación

## API Endpoints

### GET
- `/api/getLicitacionId/:id`: Información de la licitación

### POST
- `/api/createDocumentoLicitacion`: Crea registro de documento (multipart/form-data)

## Skeleton Loading

```javascript
function SkeletonsLoading() {
    return (
        <SimpleGrid cols={1}>
            <Skeleton.Input style={{ width: "100%" }} />
        </SimpleGrid>
    )
}
```

## Footer del Modal

```javascript
footer={[
    <Button key="back" onClick={() => setOpen(false)}>
        Cerrar
    </Button>,
    <Button
        onClick={() => (isEdit ? updateLicitacion() : null)}
        style={{ backgroundColor: COLORS.Primary, color: "white" }}
        disabled={buttonEstado}
    >
        {isEdit ? "Subir" : ""}
    </Button>,
]}
```

## Props

```javascript
{
    reloadTable: Function // Callback para recargar tabla padre
}
```

## Casos de Uso

### Ejemplo 1: Bases Técnicas
- **Proceso**: Confección de Bases
- **Documento**: bases_tecnicas_2024.pdf
- **Usuario**: Licitador

### Ejemplo 2: Informe Jurídico
- **Proceso**: Jurídico
- **Documento**: informe_legal.docx
- **Usuario**: Secretario Jurídico

### Ejemplo 3: Acta de Adjudicación
- **Proceso**: Preadjudicación y Comisión
- **Documento**: acta_adjudicacion.pdf
- **Usuario**: Comisión

## Visualización de Documentos

Los documentos subidos se pueden visualizar en:
- **ModalCUVerDocumentos**: Lista todos los documentos de la licitación
- Muestra proceso desde el cual se subió
- Usuario que subió
- Link de descarga

## Estructura FormData

```javascript
{
    file: File,                        // Archivo PDF o Word
    fk_proceso_subido_desde_id: number,// ID del proceso actual
    fk_licitacion_id: number,          // ID de la licitación
    fk_usuario_id: number              // ID del usuario
}
```

## Consideraciones para Migración

1. **Drag & Drop**: Implementar arrastrar y soltar
2. **Preview**: Vista previa del documento antes de subir
3. **Múltiples Archivos**: Permitir subir varios a la vez
4. **Tamaño Máximo**: Validación de tamaño de archivo
5. **Tipos MIME**: Validación más robusta por tipo MIME
6. **Progress Bar**: Indicador de progreso de subida
7. **Versiones**: Sistema de versionado de documentos
8. **Metadatos**: Agregar descripción, tags
9. **Comprensión**: Comprimir archivos grandes
10. **Seguridad**: Escaneo antivirus de archivos subidos
11. **Almacenamiento**: Considerar cloud storage (S3, Azure Blob)
12. **Thumbnails**: Generar thumbnails para PDFs

## Mejoras Sugeridas

### 1. Vista Previa
```javascript
// Implementar preview para PDFs
import { Document, Page } from 'react-pdf'
```

### 2. Validación de Tamaño
```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

if (file.size > MAX_FILE_SIZE) {
    return message.error("El archivo no debe superar 10MB")
}
```

### 3. Validación MIME Type
```javascript
const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

if (!ALLOWED_TYPES.includes(file.type)) {
    return message.error("Formato de archivo no válido")
}
```

### 4. Progress Tracking
```javascript
const [uploadProgress, setUploadProgress] = useState(0)

await axiosInstance.post("/api/createDocumentoLicitacion", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
        )
        setUploadProgress(percentCompleted)
    }
})
```

## Relación con Otros Módulos

- **BandejaDeEntrada**: Botón para abrir este modal
- **ModalCUVerDocumentos**: Visualiza documentos subidos
- **Backend**: Almacena archivos en servidor/cloud

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

## Seguridad

### Validaciones del Cliente
- Extensión de archivo
- Tamaño (recomendado)
- Tipo MIME (recomendado)

### Validaciones del Servidor
- Verificación de tipo de archivo real
- Escaneo antivirus
- Renombrado seguro
- Almacenamiento fuera de webroot
- Permisos de acceso

## Organización de Archivos

Estructura recomendada en servidor:
```
uploads/
├── licitaciones/
│   ├── 2024/
│   │   ├── licitacion_123/
│   │   │   ├── proceso_1_documento_uuid.pdf
│   │   │   ├── proceso_3_documento_uuid.docx
│   │   │   └── ...
```

Naming convention:
```
proceso_{id}_documento_{uuid}.{extension}
```
