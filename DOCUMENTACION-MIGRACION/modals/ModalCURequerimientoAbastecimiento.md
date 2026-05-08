# Modal: ModalCURequerimientoAbastecimiento

## Descripción General
Modal completo para crear y editar requerimientos de abastecimiento con gestión de productos, documentos y formulario extenso de 16+ campos.

## Ubicación
`src/components/ui/modals/ModalCURequerimientoAbastecimiento.jsx`

## Tipo de Componente
**forwardRef** con **useImperativeHandle**

## Estructura del Componente

### Estado
```javascript
const { isAuthenticated, userLogged } = useAuthContext()
const [loadingScreenC, setLoadingScreenC] = useState(true)
const [open, setOpen] = useState(false)
const [isEdit, setIsEdit] = useState(false)
const [idRequerimientoAbastecimiento, setIdRequerimientoAbastecimiento] = useState("")
const [form] = Form.useForm() // Ant Design Form
const [idUser, setIdUser] = useState("")
const [file, setFile] = useState(null)
const resetRef = useRef(null)

// Gestión de productos
const [dataTable, setDataTable] = useState([])
const [selectedProducto, setSelectedProducto] = useState(null)
const [productosDisponibles, setProductosDisponibles] = useState(PRODUCTOS)
```

## Secciones del Formulario

### Sección 1: Información Básica

#### 1. Servicio Requirente
```javascript
<Form.Item
    label="Servicio Requirente"
    name="servicio_requirente"
    rules={[{ required: true }]}
>
    <Select
        showSearch
        placeholder="Seleccione un Servicio"
        optionFilterProp="children"
        filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={SERVICIOS}
    />
</Form.Item>
```

#### 2. Tipo de Documento
```javascript
<Form.Item
    label="Tipo de Documento"
    name="tipo_documento"
    rules={[{ required: true }]}
>
    <Select
        options={[
            { value: 'MEMO', label: 'MEMO' },
            { value: 'Resolución', label: 'Resolución' },
            { value: 'Antecedentes', label: 'Antecedentes' },
            { value: 'Solicitud de Compra', label: 'Solicitud de Compra' },
            { value: 'Guia de Despacho', label: 'Guia de Despacho' },
            { value: 'Factura', label: 'Factura' },
            { value: 'Otro', label: 'Otro' },
        ]}
    />
</Form.Item>
```

#### 3. N° Documento
```javascript
<Form.Item
    label="N° Documento"
    name="n_documento"
    rules={[{ required: true }]}
>
    <Input showCount maxLength={30}/>
</Form.Item>
```

#### 4. Documento Adjunto
```javascript
<Form.Item
    label="Documento"
    name="file"
>
    <Group position="center">
        <FileButton 
            resetRef={resetRef} 
            onChange={setFile} 
            accept=".doc, .docx, .pdf"
        >
            {(props) => <Button {...props}>Agregar Documento</Button>}
        </FileButton>
    </Group>
    
    {file && (
        <Text size="sm" align="center" mt="sm">{file.name}</Text>
    )}
</Form.Item>
```

#### 5. Derivado
```javascript
<Form.Item
    label="Derivado"
    name="fk_derivado_id"
    rules={[{ required: true }]}
>
    <Select
        showSearch
        placeholder="Seleccione un Derivado"
        options={props.dataDerivados}
    />
</Form.Item>
```

#### 6. Descripción
```javascript
<Form.Item
    label="Descripción"
    name="descripcion_solicitud"
>
    <TextArea rows={4} showCount maxLength={2000}/>
</Form.Item>
```

### Sección 2: Información de Compra

#### 7. Medio de Compra
```javascript
<Form.Item
    label="Medio de Compra"
    name="medio_compra"
>
    <Select
        options={[
            { value: 'Licitación', label: 'Licitación' },
            { value: 'Convenio Marco', label: 'Convenio Marco' },
            { value: 'Compra Ágil', label: 'Compra Ágil' },
            { value: 'Trato Directo', label: 'Trato Directo' },
            { value: 'Fondo Fijo', label: 'Fondo Fijo' },
        ]}
    />
</Form.Item>
```

#### 8. ID
```javascript
<Form.Item label="ID" name="id">
    <Input showCount maxLength={2000}/>
</Form.Item>
```

#### 9. Empresa
```javascript
<Form.Item label="Empresa" name="empresa">
    <Input showCount maxLength={2000}/>
</Form.Item>
```

#### 10. Orden de Compra
```javascript
<Form.Item label="Orden de Compra" name="orden_compra">
    <Input showCount maxLength={2000}/>
</Form.Item>
```

#### 11. Fecha de Envío OC
```javascript
<Form.Item label="Fecha de Envío OC" name="fecha_envio_oc">
    <DatePicker style={{ width: "100%" }} format={"DD-MM-YYYY"}/>
</Form.Item>
```

### Sección 3: Gestión de Productos (Solo al Crear)

#### Formulario de Productos
```javascript
{!isEdit ? 
<>
    <Divider></Divider>
    <SimpleGrid cols={5}>
        <Form.Item label="Producto" name="cod_producto">
            <Select
                showSearch
                placeholder="Seleccione un Producto"
                options={productosDisponibles}
                onChange={handleProductoChange}
            />
        </Form.Item>
        
        <Form.Item label="Descripción" name="descripcion">
            <Input disabled/>
        </Form.Item>
        
        <Form.Item label="Cantidad programada" name="cantidad_programada">
            <Input disabled/>
        </Form.Item>
        
        <Form.Item label="Stock" name="stock">
            <Input disabled/>
        </Form.Item>
        
        <Button 
            style={{ width: "100%", marginTop: 30 }} 
            onClick={() => agregarProducto()}
        >
            Agregar
        </Button>
    </SimpleGrid>
    
    <Table columns={columns} dataSource={dataTable} scroll={{ x: 'max-content' }} />
</>
: null}
```

## Funcionalidades Principales

### 1. Carga de Datos para Edición

```javascript
const childFunction = async (id, action) => {
    form.resetFields()
    setOpen(true)
    
    if (action === "Edit") {
        setLoadingScreenC(true)
        setIsEdit(true)
        
        await axiosInstance.get("/api/getRequerimientosAbastecimientoById/" + id)
            .then((response) => {
                form.setFieldsValue({
                    servicio_requirente: response.data.servicio_requirente,
                    tipo_documento: response.data.tipo_documento,
                    n_documento: response.data.n_documento,
                    descripcion_solicitud: response.data.descripcion_solicitud,
                    medio_compra: response.data.medio_compra,
                    id_medio_compra: response.data.id_medio_compra,
                    empresa: response.data.empresa,
                    orden_compra: response.data.orden_compra,
                    fecha_envio_oc: response.data.fecha_envio_oc 
                        ? dayjs(response.data.fecha_envio_oc, 'DD/MM/YYYY') 
                        : null,
                    fk_derivado_id: response.data.fk_derivado_id
                })
                setIdRequerimientoAbastecimiento(id)
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

### 2. Gestión de Productos

```javascript
const handleProductoChange = (value) => {
    const selectedProduct = productosDisponibles.find((product) => product.value === value)
    setSelectedProducto(selectedProduct)
    form.setFieldsValue({
        descripcion: selectedProduct.value,
        cantidad_programada: selectedProduct.cantidad_programada,
        stock: selectedProduct.stock,
    })
}

const agregarProducto = () => {
    if (selectedProducto) {
        setDataTable([...dataTable, selectedProducto])
        setProductosDisponibles(
            productosDisponibles.filter((product) => product.value !== selectedProducto.value)
        )
        form.setFieldsValue({
            cod_producto: "",
            descripcion: "",
            cantidad_programada: "",
            stock: "",
        })
        setSelectedProducto(null)
    }
}

const quitarProducto = (codigo) => {
    const removedProduct = dataTable.find((product) => product.value === codigo)
    setDataTable(dataTable.filter((product) => product.value !== codigo))
    setProductosDisponibles([...productosDisponibles, removedProduct])
}
```

### 3. Submit del Formulario

```javascript
const onFinish = async (values) => {
    values.fk_usuario_id = idUser
    values.productos = JSON.stringify(dataTable)
    values.fecha_envio_oc = values.fecha_envio_oc 
        ? fecha_formateada(values.fecha_envio_oc) 
        : null
    values.file = file
    
    if (isEdit) {
        message.loading("Actualizando...")
        
        await axiosInstance.post(
            "/api/updateRequerimientosAbastecimiento/" + idRequerimientoAbastecimiento, 
            values, 
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        )
            .then((response) => {
                message.success("Actualizado correctamente!")
            })
            .catch((error) => {
                message.error("Error al guardar.")
            })
            .finally(() => {
                cleanInputs()
            })
            
    } else {
        // Validaciones al crear
        if (file === null) {
            return message.error("Debe adjuntar un documento.")
        }
        
        if (dataTable.length <= 0) {
            return message.error("Debe agregar productos a la tabla.")
        }
        
        message.loading("Guardando...")
        
        await axiosInstance.post("/api/createRequerimientoAbastecimiento", values, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then((response) => {
                message.success("Guardado correctamente!")
            })
            .catch((error) => {
                message.error("Error al guardar.")
            })
            .finally(() => {
                cleanInputs()
            })
    }
}
```

## Tabla de Productos

### Columnas
```javascript
const columns = [
    { title: 'Código', dataIndex: 'value', key: 'value' },
    { title: 'Descripción', dataIndex: 'descripcion', key: 'descripcion' },
    { title: 'Cantidad Programada', dataIndex: 'cantidad_programada', key: 'cantidad_programada' },
    { title: 'Stock', dataIndex: 'stock', key: 'stock' },
    {
        title: 'Quitar',
        key: 'action',
        render: (_, record) => (
            <Button onClick={() => quitarProducto(record.value)}>
                <IconX color="red"></IconX>
            </Button>
        ),
    },
]
```

## Validaciones

### Al Crear
1. ✓ Servicio requirente (requerido)
2. ✓ Tipo de documento (requerido)
3. ✓ N° documento (requerido, max 30 caracteres)
4. ✓ Derivado (requerido)
5. ✓ Descripción (opcional, max 2000 caracteres)
6. ✓ Documento adjunto (requerido)
7. ✓ Al menos un producto en la tabla

### Al Editar
- No requiere documento ni productos
- Solo actualiza campos del formulario

## Layout Responsive

```javascript
<SimpleGrid
    cols={4}
    breakpoints={[
        { maxWidth: '70rem', cols: 2, spacing: 'md' },
        { maxWidth: '40rem', cols: 1, spacing: 'md' },
    ]}
>
    {/* Campos del formulario */}
</SimpleGrid>
```

## Skeleton Loading

```javascript
function SkeletonsLoading() {
    return (
        <div>
            <Title style={{ marginBottom: 30 }}>
                Requerimiento Abastecimiento
            </Title>
            <SimpleGrid cols={4}>
                <SkeletonsInput/>
                {/* Más skeletons */}
            </SimpleGrid>
        </div>
    )
}
```

## API Endpoints

### GET
- `/api/getRequerimientosAbastecimientoById/:id`: Datos para edición

### POST
- `/api/createRequerimientoAbastecimiento`: Crear (multipart/form-data)
- `/api/updateRequerimientosAbastecimiento/:id`: Actualizar (multipart/form-data)

## Props

```javascript
{
    dataDerivados: Array<{value: string, label: string}>, // Lista de derivados
    reloadTable: Function
}
```

## Datos de Ayuda

### SERVICIOS (importado)
Array de servicios del hospital

### PRODUCTOS (importado)
```javascript
// Estructura de producto
{
    value: string,           // Código
    descripcion: string,
    cantidad_programada: number,
    stock: number
}
```

## Estructura FormData

```javascript
{
    // Básicos
    servicio_requirente: string,
    tipo_documento: string,
    n_documento: string,
    fk_derivado_id: number,
    descripcion_solicitud: string,
    fk_usuario_id: number,
    
    // Compra
    medio_compra: string,
    id: string,
    empresa: string,
    orden_compra: string,
    fecha_envio_oc: string | null,
    
    // Productos y archivo
    productos: string, // JSON stringified
    file: File
}
```

## Consideraciones para Migración

1. **Form Library**: Migrar a React Hook Form para mejor performance
2. **Validación**: Usar Zod para esquemas de validación
3. **Productos**: Lazy loading si son muchos
4. **Autocompletado**: Mejorar búsqueda de productos
5. **Tabla Editable**: Permitir editar cantidades en tabla
6. **Importación**: Importar productos desde Excel
7. **Plantillas**: Guardar configuraciones comunes
8. **Duplicar**: Clonar requerimientos similares
9. **Adjuntos Múltiples**: Permitir varios archivos
10. **Preview**: Vista previa antes de guardar

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "antd": "^5.0.0",
  "@tabler/icons-react": "^2.0.0",
  "dayjs": "^1.11.0",
  "axios": "^1.0.0"
}
```
