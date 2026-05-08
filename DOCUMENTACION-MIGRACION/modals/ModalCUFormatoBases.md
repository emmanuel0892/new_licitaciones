# Modal: ModalCUFormatoBases

## Descripción General
Modal para crear y editar formatos de bases de licitación. Permite cargar documentos PDF o Word y asignarlos a categorías específicas.

## Ubicación
`src/components/ui/modals/ModalCUFormatoBases.jsx`

## Tipo de Componente
**forwardRef** con **useImperativeHandle** para control externo

## Estructura del Componente

### Estado
```javascript
const [loadingScreenC, setLoadingScreenC] = useState(true)
const [open, setOpen] = useState(false)
const [titulo, setTitulo] = useState("")
const [tipoCategoria, setTipoCategoria] = useState(undefined)
const [file, setFile] = useState(null)
const [fileBD, setFileBD] = useState(null) // Para comparar al editar
const [isEdit, setIsEdit] = useState(false)
const [idBase, setIdBase] = useState("")
const [buttonEstado, setButtonEstado] = useState(false)
```

## Funcionalidades Principales

### 1. Función Pública (childFunction)

```javascript
const childFunction = async (id, action) => {
    setOpen(true)
    cleanInputs()
    
    if (action === "Edit") {
        setLoadingScreenC(true)
        setIsEdit(true)
        await axiosInstance.get("/api/getBaseId/" + id)
            .then((response) => {
                setTitulo(response.data["titulo"])
                setTipoCategoria(response.data["tipo_base"])
                setFile(response.data["documento"])
                setFileBD(response.data["documento"])
                setIdBase(id)
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

useImperativeHandle(ref, () => ({
    childFunction,
}))
```

### 2. Creación de Base

```javascript
async function createBase() {
    // Validaciones
    if (titulo === "") {
        return message.error(`Ingrese un titulo válido`)
    }
    if (tipoCategoria === "" || tipoCategoria === undefined) {
        return message.error(`Ingrese una categoria válido`)
    }
    if (file === null) {
        return message.error(`Ingrese un documento válido`)
    }
    
    // Validación de formato
    const formData = new FormData()
    if (file !== null) {
        if (!(file.name.includes(".pdf") || file.name.includes(".docx") || file.name.includes(".doc"))) {
            return message.error("Debe subir un documeno valido, PDF o Word")
        }
        formData.append("file", file)
    }
    
    formData.append("titulo", titulo)
    formData.append("tipo_base", tipoCategoria)
    
    setLoadingScreenC(true)
    setButtonEstado(true)
    
    await axiosInstance.post("/api/createBase", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
        .then((response) => {
            message.success(`La base se ha guardado correctamente.`)
            setOpen(false)
            props.reloadTable()
        })
        .catch((error) => {
            message.error(`La base no ha podido guardarse.`)
        })
        .finally(() => {
            cleanInputs()
            setLoadingScreenC(false)
            setButtonEstado(false)
        })
}
```

### 3. Actualización de Base

```javascript
async function updateBase() {
    // Validaciones similares a createBase
    
    const formData = new FormData()
    formData.append("titulo", titulo)
    formData.append("tipo_base", tipoCategoria)
    
    // Solo adjunta file si cambió
    if (file !== fileBD) {
        if (!(file.name.includes(".pdf") || file.name.includes(".docx") || file.name.includes(".doc"))) {
            return message.error("Debe subir un documeno valido, PDF o Word")
        }
        formData.append("file", file)
    }
    
    setButtonEstado(true)
    setLoadingScreenC(true)
    
    await axiosInstance.post("/api/updateBase/" + idBase, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
        .then((response) => {
            message.success(`La base se ha actualizado correctamente.`)
            setOpen(false)
            
            // Recarga página después de 1 segundo
            setTimeout(() => {
                location.reload()
            }, 1000)
        })
        .finally(() => {
            cleanInputs()
            setButtonEstado(false)
            setLoadingScreenC(false)
        })
}
```

## Campos del Formulario

### 1. Título
```javascript
<Text style={{ fontWeight: "600" }}>Titulo:</Text>
<Input
    placeholder="Ingresa titulo"
    value={titulo}
    onChange={(event) => setTitulo(event.target.value)}
    type="text"
/>
```

### 2. Tipo de Categoria
```javascript
<Select
    defaultValue={tipoCategoria}
    style={{ width: "100%" }}
    placeholder="Seleccione algún tipo de categoria"
    onChange={(e) => setTipoCategoria(e)}
    options={[
        { value: "Medicamentos", label: "Medicamentos" },
        { value: "Insumos", label: "Insumos" },
        { value: "Servicios", label: "Servicios" },
        { value: "Otros Formatos", label: "Otros Formatos" },
    ]}
/>
```

### 3. Documento (PDF o Word)
```javascript
<FileInput
    value={file}
    accept=".pdf,.doc,.docx"
    icon={<IconUpload size={rem(14)} />}
    onChange={(newFile) => setFile(newFile)}
    style={{ marginBottom: "30px" }}
    placeholder="Ningun documento seleccionado"
/>
```

## Validaciones

1. **Título**: No puede estar vacío
2. **Categoría**: Debe seleccionar una
3. **Archivo**: 
   - Requerido
   - Solo PDF (.pdf) o Word (.doc, .docx)
   - Validación por extensión del nombre

## API Endpoints

### GET
- `/api/getBaseId/:id`: Obtiene base por ID para edición

### POST
- `/api/createBase`: Crea nueva base (multipart/form-data)
- `/api/updateBase/:id`: Actualiza base existente (multipart/form-data)

## Props

```javascript
{
    reloadTable: Function // Callback para recargar tabla padre
}
```

## Uso desde Componente Padre

```javascript
const childRef = useRef(null)

// Abrir modal para crear
<Button onClick={() => childRef.current.childFunction(null, "Save")}>
    Agregar Base
</Button>

// Abrir modal para editar
<Button onClick={() => childRef.current.childFunction(baseId, "Edit")}>
    Editar
</Button>

<ModalCUFormatoBases ref={childRef} reloadTable={getBases} />
```

## Loading States

### Skeleton
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
        onClick={() => (isEdit ? updateBase() : createBase())}
        style={{ backgroundColor: COLORS.Primary, color: "white" }}
        disabled={buttonEstado}
    >
        {isEdit ? "Editar" : "Guardar"}
    </Button>,
]}
```

## Consideraciones para Migración

1. **Upload de Archivos**: Implementar drag & drop
2. **Preview**: Vista previa del documento antes de guardar
3. **Validación de Tamaño**: Limitar tamaño de archivo
4. **Múltiples Archivos**: Permitir subir versiones
5. **Progress**: Barra de progreso de upload
6. **Tipos MIME**: Validación más robusta de tipos
7. **Categorías Dinámicas**: Cargar desde API
8. **Versiones**: Sistema de versionado de documentos
9. **Metadata**: Agregar más campos (autor, fecha vigencia)
10. **Búsqueda**: Indexar contenido del documento

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

## Estructura FormData

### Crear
```javascript
{
    file: File,
    titulo: string,
    tipo_base: "Medicamentos" | "Insumos" | "Servicios" | "Otros Formatos"
}
```

### Actualizar
```javascript
{
    titulo: string,
    tipo_base: string,
    file?: File // Solo si cambió
}
```
