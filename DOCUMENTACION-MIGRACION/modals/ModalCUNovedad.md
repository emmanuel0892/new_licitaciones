# Modal: ModalCUNovedad

## Descripción General
Modal para crear y editar novedades del sistema. Permite agregar título, descripción e imagen opcional.

## Ubicación
`src/components/ui/modals/ModalCUNovedad.jsx`

## Tipo de Componente
**forwardRef** con **useImperativeHandle**

## Estructura del Componente

### Estado
```javascript
const { userLogged } = useAuthContext()
const [loadingScreenC, setLoadingScreenC] = useState(true)
const [open, setOpen] = useState(false)

const [dataProcesos, setDataProcesos] = useState([])
const [idProcesoActual, setIdProcesoActual] = useState("")
const [titular, setTitular] = useState("")
const [descripcion, setDescripcion] = useState("")
const [file, setFile] = useState(null)
const [fileBD, setFileBD] = useState(null) // Para comparar al editar

const [isEdit, setIsEdit] = useState(false)
const [idNovedad, setIdNovedad] = useState("")
const [buttonEstado, setButtonEstado] = useState(false)
```

## Funcionalidades Principales

### 1. Carga de Datos para Edición

```javascript
const childFunction = async (id, action) => {
    setOpen(true)
    cleanInputs()
    
    if (action === "Edit") {
        setLoadingScreenC(true)
        setIsEdit(true)
        
        await axiosInstance.get("/api/getNovedadesId/" + id)
            .then((response) => {
                setTitular(response.data.titular)
                setDescripcion(response.data.descripcion)
                setFile(response.data.file_foto)
                setFileBD(response.data.file_foto)
                setIdNovedad(id)
            })
            .finally(() => {
                setLoadingScreenC(false)
            })
    } else {
        setIsEdit(false)
        cleanInputs()
        setLoadingScreenC(false)
    }
}
```

### 2. Creación de Novedad

```javascript
async function createNovedad() {
    if (titular === null || titular === "") {
        return message.error("Debe ingresar un titular")
    }
    
    if (descripcion === null || descripcion === "") {
        return message.error("Debe ingresar una descripción")
    }
    
    setButtonEstado(true)
    setLoadingScreenC(true)
    
    const formData = new FormData()
    formData.append("titular", titular)
    formData.append("descripcion", descripcion)
    formData.append("fk_usuario_id", userLogged.id)
    
    // Imagen es opcional
    if (file !== null) {
        formData.append("file", file)
    }
    
    await axiosInstance.post("/api/createNovedad", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
        .then((response) => {
            message.success(`La licitación se ha devuelto correctamente.`)
            setOpen(false)
            props.reloadTable()
        })
        .catch((error) => {
            message.error(`La licitación no ha podido devolverse.`)
        })
        .finally(() => {
            cleanInputs()
            setButtonEstado(false)
            setLoadingScreenC(false)
        })
}
```

### 3. Actualización de Novedad

```javascript
async function updateNovedad() {
    if (titular === null || titular === "") {
        return message.error("Debe ingresar un titular")
    }
    
    if (descripcion === null || descripcion === "") {
        return message.error("Debe ingresar una descripción")
    }
    
    setButtonEstado(true)
    setLoadingScreenC(true)
    
    const formData = new FormData()
    formData.append("titular", titular)
    formData.append("descripcion", descripcion)
    
    // Solo adjunta imagen si cambió
    if (file !== fileBD) {
        formData.append("file", file)
    }
    
    await axiosInstance.post("/api/updateNovedad/" + idNovedad, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
        .then((response) => {
            message.success(`La licitación se ha devuelto correctamente.`)
            setOpen(false)
            props.reloadTable()
        })
        .catch((error) => {
            message.error(`La licitación no ha podido devolverse.`)
        })
        .finally(() => {
            cleanInputs()
            setButtonEstado(false)
            setLoadingScreenC(false)
        })
}
```

## Campos del Formulario

### 1. Titular
```javascript
<Text>Titular:</Text>
<Input
    showCount
    maxLength={255}
    value={titular}
    placeholder="Ingrese titular"
    onChange={(event) => setTitular(event.target.value)}
/>
```

**Características**:
- Contador de caracteres visible
- Máximo 255 caracteres
- Campo requerido

### 2. Descripción
```javascript
<Text style={{ marginTop: "10px" }}>Descripcion:</Text>
<TextArea
    value={descripcion}
    style={{ resize: "none", height: "120px" }}
    onChange={(event) => setDescripcion(event.target.value)}
    placeholder="Ingrese descripción"
/>
```

**Características**:
- TextArea con altura fija de 120px
- No redimensionable (resize: none)
- Campo requerido
- Sin límite de caracteres

### 3. Imagen (Opcional)
```javascript
<Text style={{ marginTop: "10px" }}>Imagen (Opcional)</Text>
<FileInput
    value={file}
    icon={<IconUpload size={rem(14)} />}
    onChange={(newFile) => setFile(newFile)}
    placeholder="Ningun archivo seleccionado"
    accept=".jpg,.jpeg,.png"
/>
```

**Características**:
- Opcional (puede ser null)
- Acepta: .jpg, .jpeg, .png
- Icono de upload visible

## Validaciones

### Campos Requeridos
1. **Titular**: No puede estar vacío
2. **Descripción**: No puede estar vacía
3. **Imagen**: Opcional

### Validaciones de Imagen
```javascript
accept=".jpg,.jpeg,.png"
```

Solo acepta formatos de imagen comunes.

## API Endpoints

### GET
- `/api/getNovedadesId/:id`: Obtiene novedad por ID para edición

### POST
- `/api/createNovedad`: Crea nueva novedad (multipart/form-data)
- `/api/updateNovedad/:id`: Actualiza novedad (multipart/form-data)

## Skeleton Loading

```javascript
function SkeletonsLoading() {
    return (
        <SimpleGrid cols={1}>
            <Skeleton.Input style={{ width: "100%" }} />
            <Skeleton.Input style={{ width: "100%" }} />
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
        onClick={() => (isEdit ? updateNovedad() : createNovedad())}
        style={{ backgroundColor: COLORS.Primary, color: "white" }}
        disabled={buttonEstado}
    >
        {isEdit ? "Editar" : "Agregar"}
    </Button>,
]}
```

## Props

```javascript
{
    reloadTable: Function // Callback para recargar lista de novedades
}
```

## Estructura FormData

### Crear
```javascript
{
    titular: string,
    descripcion: string,
    fk_usuario_id: number,
    file?: File // Opcional
}
```

### Actualizar
```javascript
{
    titular: string,
    descripcion: string,
    file?: File // Solo si cambió
}
```

## Casos de Uso

### Ejemplo 1: Comunicado Importante
- **Titular**: "Nueva política de compras 2024"
- **Descripción**: "Se informa que a partir del 1 de enero de 2024 entra en vigencia la nueva política de compras del hospital..."
- **Imagen**: politica_compras.jpg

### Ejemplo 2: Mantenimiento
- **Titular**: "Mantenimiento programado del sistema"
- **Descripción**: "El sistema estará en mantenimiento el día sábado 15 de enero de 08:00 a 12:00 hrs."
- **Imagen**: Sin imagen

### Ejemplo 3: Capacitación
- **Titular**: "Capacitación nuevo módulo PAC"
- **Descripción**: "Se realizará capacitación sobre el nuevo módulo de PAC el próximo martes a las 15:00 hrs en sala de reuniones."
- **Imagen**: capacitacion.png

## Relación con Otros Módulos

- **GestionNovedades**: Vista de administración que usa este modal
- **Novedades**: Vista pública que muestra las novedades creadas
- **VerNovedad**: Vista detallada de cada novedad

## Consideraciones para Migración

1. **Editor Rico**: Implementar WYSIWYG (TinyMCE, Quill, Slate)
2. **Markdown**: Soporte para formato Markdown
3. **Imágenes**:
   - Validación de tamaño
   - Compresión automática
   - Crop/redimensión
   - Lazy loading
4. **Preview**: Vista previa antes de publicar
5. **Borrador**: Guardar como borrador
6. **Programación**: Publicar en fecha futura
7. **Categorías**: Clasificar novedades
8. **Tags**: Etiquetas para búsqueda
9. **Notificaciones**: Avisar a usuarios de nuevas novedades
10. **SEO**: Meta tags para cada novedad
11. **Estadísticas**: Vistas, clicks
12. **Comentarios**: Permitir feedback

## Mejoras Sugeridas

### 1. Validación de Imagen
```javascript
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

if (file && file.size > MAX_IMAGE_SIZE) {
    return message.error("La imagen no debe superar 5MB")
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
if (file && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return message.error("Solo se permiten imágenes JPG o PNG")
}
```

### 2. Preview de Imagen
```javascript
const [imagePreview, setImagePreview] = useState(null)

const handleImageChange = (newFile) => {
    setFile(newFile)
    if (newFile) {
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result)
        }
        reader.readAsDataURL(newFile)
    } else {
        setImagePreview(null)
    }
}

// En el render
{imagePreview && (
    <Image src={imagePreview} width={200} />
)}
```

### 3. Contador de Caracteres para Descripción
```javascript
<TextArea
    showCount
    maxLength={2000}
    value={descripcion}
    // ...
/>
```

### 4. Rich Text Editor
```javascript
import ReactQuill from 'react-quill'

<ReactQuill
    value={descripcion}
    onChange={setDescripcion}
    modules={{
        toolbar: [
            ['bold', 'italic', 'underline'],
            ['link', 'image'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }]
        ]
    }}
/>
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

## Dependencias Sugeridas para Migración

```json
{
  "react-quill": "^2.0.0",
  "react-image-crop": "^10.0.0",
  "image-compression": "^2.0.0"
}
```
