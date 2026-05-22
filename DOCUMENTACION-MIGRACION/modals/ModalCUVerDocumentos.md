# Modal: ModalCUVerDocumentos

## Descripción General
Modal para visualizar todos los documentos adjuntos a una licitación, organizados cronológicamente desde el más reciente.

## Ubicación
`src/components/ui/modals/ModalCUVerDocumentos.jsx`

## Tipo de Componente
**forwardRef** con **useImperativeHandle**

## Estructura del Componente

### Estado
```javascript
// Notificaciones
const [api, contextHolder] = notification.useNotification()

const [loadingScreenC, setLoadingScreenC] = useState(true)
const [open, setOpen] = useState(false)
const [file, setFile] = useState(null)
const [fileBD, setFileBD] = useState(null)
const [procesoActualId, setProcesoActualId] = useState("")
const [procesoActualNombre, setProcesoActualNombre] = useState("")
const [isEdit, setIsEdit] = useState(false)
const [idLicitacion, setIdLicitacion] = useState("")
const [buttonEstado, setButtonEstado] = useState(false)
const [data, setData] = useState([]) // Documentos

const { userLogged } = useAuthContext()
```

## Funcionalidades Principales

### 1. Notificación de Descarga

```javascript
const openNotification = (placement) => {
    api.success({
        message: `Documento descargado con exito`,
        description: "Ya puedes ver el documento",
        placement,
    })
}
```

### 2. Carga de Documentos

```javascript
const childFunction = async (id, action) => {
    setOpen(true)
    
    if (action === "Edit") {
        setLoadingScreenC(true)
        setIsEdit(true)
        
        await axiosInstance.get("/api/getDocumentosLicitacionId/" + id)
            .then((response) => {
                setData(response.data)
            })
            .catch((error) => {
                console.log(error)
            })
            .finally(() => {
                setLoadingScreenC(false)
            })
    } else {
        setIsEdit(false)
        setLoadingScreenC(false)
    }
}
```

### 3. Renderizado de Documentos

```javascript
const links = data.map((item, index) => {
    return (
        <div className="documento">
            <div className="contenedor-file-img">
                <IconFile size={35} color="rgb(158, 187, 60)" />
            </div>
            
            <div className="contenedor-detalles">
                <Text style={{ lineHeight: "16px", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 500 }}>Subido En Proceso:</span> <br />
                    {item.titulo_proceso}
                </Text>
                
                <Text style={{ lineHeight: "16px", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 500 }}>Subido Por:</span> <br />
                    {item.name + " " + item.lastname}
                </Text>
                
                <Text>
                    <a 
                        onClick={() => openNotification("topLeft")} 
                        target="_blank" 
                        href={BASE_URL + item.ruta_documento}
                    >
                        Descargar documento
                    </a>
                </Text>
            </div>
        </div>
    )
})
```

## Estructura de Documento

Cada documento muestra:
1. **Icono de archivo**: Visual con color del tema (rgb(158, 187, 60))
2. **Proceso**: Desde qué proceso fue subido
3. **Usuario**: Quién lo subió (nombre completo)
4. **Link de descarga**: Abre en nueva pestaña y notifica

## Layout del Modal

```javascript
<Modal
    title={isEdit ? "Documentos adjuntados" : ""}
    centered
    width={"80%"}
    open={open}
    onCancel={() => setOpen(false)}
    footer={[
        <Button 
            style={{ marginTop: "20px" }} 
            key="back" 
            onClick={() => setOpen(false)}
        >
            Cerrar
        </Button>,
    ]}
>
    {loadingScreenC ? (
        <SkeletonsLoading />
    ) : (
        <>
            {contextHolder}
            <div style={{ display: "flex", marginBottom: "16px" }}>
                <Alert
                    className="alert"
                    variant="light"
                    color="orange"
                    title="Ordenados desde el más reciente"
                    icon={<IconInfoCircle />}
                />
            </div>
            <div className="contenedor-documentos">{links}</div>
        </>
    )}
</Modal>
```

## Características de Diseño

### 1. Alerta Informativa
```javascript
<Alert
    variant="light"
    color="orange"
    title="Ordenados desde el más reciente"
    icon={<IconInfoCircle />}
/>
```

### 2. Tarjetas de Documento
Cada documento es una tarjeta con:
- Icono grande del archivo (35px)
- Información organizada verticalmente
- Link destacado para descarga

### 3. Notificación de Éxito
Al hacer clic en descargar:
- Muestra notificación success
- Se abre el documento en nueva pestaña
- Indicador visual de que la acción fue exitosa

## Estilos CSS

```css
/* ../../styles/styles-ver-documentos.css */

.contenedor-documentos {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.documento {
    display: flex;
    padding: 16px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #f9f9f9;
}

.contenedor-file-img {
    margin-right: 16px;
    display: flex;
    align-items: center;
}

.contenedor-detalles {
    flex: 1;
}
```

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

## API Endpoints

### GET
- `/api/getDocumentosLicitacionId/:id`: Lista de documentos de la licitación

## Estructura de Datos

### Documento
```javascript
{
    id: number,
    ruta_documento: string,        // Path relativo
    titulo_proceso: string,         // Proceso desde donde se subió
    name: string,                   // Nombre del usuario
    lastname: string,               // Apellido del usuario
    fk_proceso_subido_desde_id: number,
    fk_licitacion_id: number,
    fk_usuario_id: number,
    created_at: string
}
```

## Uso desde Componente Padre

```javascript
const childRef = useRef(null)

<Button onClick={() => childRef.current.childFunction(licitacionId, "Edit")}>
    Ver Documentos
</Button>

<ModalCUVerDocumentos ref={childRef} />
```

## Ordenamiento

Los documentos se muestran en orden cronológico inverso (más recientes primero), según cómo llegan del backend.

## Relación con Otros Módulos

- **BandejaDeEntrada**: Icono para abrir este modal
- **ModalCULicitacionDocumento**: Modal para subir documentos
- **BASE_URL**: Constante para construir rutas completas

## Consideraciones para Migración

1. **Preview**: Implementar visualizador de PDFs inline
2. **Filtros**: Por proceso, usuario, fecha
3. **Búsqueda**: Buscar en nombres de archivo
4. **Descarga Múltiple**: Descargar varios como ZIP
5. **Eliminación**: Permitir eliminar documentos (con permisos)
6. **Versiones**: Sistema de versionado
7. **Comentarios**: Agregar notas a documentos
8. **Tags**: Etiquetar documentos
9. **Thumbnails**: Generar previews de PDFs
10. **Compartir**: Generar links públicos temporales
11. **Impresión**: Opción de imprimir directamente
12. **OCR**: Búsqueda de texto en PDFs escaneados

## Mejoras Sugeridas

### 1. Preview de PDF
```javascript
import { Document, Page } from 'react-pdf'

const [showPreview, setShowPreview] = useState(false)
const [previewDoc, setPreviewDoc] = useState(null)

<Modal visible={showPreview}>
    <Document file={BASE_URL + previewDoc}>
        <Page pageNumber={1} />
    </Document>
</Modal>
```

### 2. Información Adicional
```javascript
<Text>
    <span style={{ fontWeight: 500 }}>Tamaño:</span> {item.file_size}
</Text>
<Text>
    <span style={{ fontWeight: 500 }}>Formato:</span> {item.file_extension}
</Text>
<Text>
    <span style={{ fontWeight: 500 }}>Fecha:</span> {fecha_formateada(item.created_at)}
</Text>
```

### 3. Iconos por Tipo
```javascript
const getFileIcon = (extension) => {
    switch(extension) {
        case 'pdf':
            return <IconFilePdf size={35} color="red" />
        case 'doc':
        case 'docx':
            return <IconFileWord size={35} color="blue" />
        default:
            return <IconFile size={35} color="gray" />
    }
}
```

### 4. Estados Vacíos
```javascript
{data.length === 0 && (
    <Empty 
        description="No hay documentos adjuntos"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
)}
```

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

## Dependencias Sugeridas

```json
{
  "react-pdf": "^7.0.0",
  "file-saver": "^2.0.5",
  "jszip": "^3.10.0"
}
```

## Seguridad

### Consideraciones
1. **Autenticación**: Verificar permisos antes de mostrar
2. **URLs Firmadas**: Usar URLs temporales
3. **Watermarks**: Agregar marca de agua a PDFs sensibles
4. **Logs de Descarga**: Auditoría de quién descargó qué
5. **Expiración**: Links con tiempo de vida limitado
