# Modal: ModalCULicitacion

## Descripción General
Modal para editar información básica de una licitación existente. Permite modificar requirente, número, nombre, vigencia y monto presupuestado.

## Ubicación
`src/components/ui/modals/ModalCULicitacion.jsx`

## Tipo de Componente
**forwardRef** con **useImperativeHandle**

## Estructura del Componente

### Estado
```javascript
const [loadingScreenC, setLoadingScreenC] = useState(true)
const [open, setOpen] = useState(false)

// Datos del formulario
const [formatoLiquidacion, setFormatoLiquidacion] = useState("")
const [numeroLicitacion, setNumeroLicitacion] = useState("")
const [requirente, setRequirente] = useState("")
const [vigencia, setVigencia] = useState("")
const [vigenciaBD, setVigenciaBD] = useState("") // Para comparar cambios
const [nombreLicitacion, setNombreLicitacion] = useState("")
const [montoPresupuestado, setMontoPresupuestado] = useState("")

const [isEdit, setIsEdit] = useState(false)
const [idLicitacion, setIdLicitacion] = useState("")
const [dataLicitacion, setDataLicitacion] = useState([])
const [dataRequirentes, setDataRequirentes] = useState([])

const { userLogged } = useAuthContext()
const [buttonEstado, setButtonEstado] = useState(false)

// Select autocompletable
const [list1Value, setList1Value] = useState(undefined)
const [newOption, setNewOption] = useState("")
const [isLoading, setIsLoading] = useState(false)
const [arregloDeStrings, setArregloDeStrings] = useState([])
```

## Funcionalidades Principales

### 1. Carga de Datos para Edición

```javascript
const childFunction = async (id, action) => {
    setOpen(true)
    if (action === "Edit") {
        setLoadingScreenC(true)
        setIsEdit(true)
        
        await axiosInstance.get("/api/CombinedQuerysRequirenteLicitacionId/" + id)
            .then((response) => {
                setDataLicitacion(response.data["Consulta1getLicitacionId"]["original"])
                setDataRequirentes(response.data["Consulta2getRequirentes"]["original"])
                
                // Cargar requirentes en select
                const nombres = response.data["Consulta2getRequirentes"]["original"]
                    .map((objeto) => objeto.nombre)
                setArregloDeStrings(nombres)
                
                // Cargar datos de la licitación
                const licitacion = response.data["Consulta1getLicitacionId"]["original"]["0"]
                setFormatoLiquidacion(licitacion.fk_formato_liquidacion_id)
                setNumeroLicitacion(
                    licitacion.numero_licitacion === "null" ? "" : licitacion.numero_licitacion
                )
                setRequirente(licitacion.requirente)
                
                if (licitacion.fk_formato_liquidacion_id !== 5) {
                    setVigencia(fecha_formateada(licitacion.vigencia))
                    setVigenciaBD(fecha_formateada(licitacion.vigencia))
                    setMontoPresupuestado(licitacion.monto_presupuestado)
                }
                
                setNombreLicitacion(licitacion.nombre_licitacion)
                setIdLicitacion(id)
            })
            .finally(() => {
                setLoadingScreenC(false)
            })
    }
}
```

### 2. Conversión de Formato de Fecha

```javascript
function convertDateFormat(originalDate) {
    // Parsear la fecha original en el formato 'dd-MM-yyyy'
    const parsedDate = parse(originalDate, "dd-MM-yyyy", new Date())
    // Formatear la fecha al formato 'yyyy-MM-dd'
    const formattedDate = format(parsedDate, "yyyy-MM-dd")
    return formattedDate
}
```

### 3. Actualización de Licitación

```javascript
async function updateLicitacion() {
    // Validaciones según formato
    if (formatoLiquidacion !== 5) {
        if (vigencia === "" || vigencia === null) {
            return message.error("Debe ingresar una Vigencia")
        }
        if (montoPresupuestado === "" || montoPresupuestado === null) {
            return message.error("Debe ingresar un Monto Presupuestado")
        }
        if (nombreLicitacion === "" || nombreLicitacion === null) {
            return message.error("Debe ingresar un nombre de licitacion")
        }
        if (!/^[0-9]+$/.test(montoPresupuestado)) {
            return message.error("Debe ingresar solo números en Monto Presupuestado")
        }
    }
    
    if (formatoLiquidacion !== 2) {
        if (numeroLicitacion === "" || numeroLicitacion === null) {
            return message.error("Debe ingresar un Número de Licitacion")
        }
    }
    
    if (requirente === "" || requirente === null) {
        return message.error("Debe ingresar un requirente")
    }
    if (nombreLicitacion === "" || nombreLicitacion === null) {
        return message.error("Debe ingresar un nombre de licitacion")
    }
    
    const formData = new FormData()
    formData.append("fk_formato_liquidacion_id", formatoLiquidacion)
    formData.append("requirente", requirente)
    
    // Número de licitación (null para formato Contraloría si está vacío)
    if (formatoLiquidacion === 2) {
        if (numeroLicitacion === "" || numeroLicitacion === null) {
            formData.append("numero_licitacion", 'null')
        } else {
            formData.append("numero_licitacion", numeroLicitacion)
        }
    } else if (formatoLiquidacion !== 2) {
        formData.append("numero_licitacion", numeroLicitacion)
    }
    
    // Vigencia y monto (no aplica para Otros Trámites)
    if (formatoLiquidacion !== 5) {
        if (vigenciaBD === vigencia) {
            formData.append("vigencia", convertDateFormat(vigencia))
        } else if (vigenciaBD !== vigencia) {
            formData.append("vigencia", convertDateFormat(fecha_formateada(vigencia)))
        }
        formData.append("monto_presupuestado", montoPresupuestado)
    }
    if (formatoLiquidacion === 5) {
        formData.append("monto_presupuestado", "null")
        formData.append("vigencia", null)
    }
    
    formData.append("nombre_licitacion", nombreLicitacion)
    
    setButtonEstado(true)
    setLoadingScreenC(true)
    
    await axiosInstance.put(
        "/api/updateLicitacion/" + idLicitacion + "/" + userLogged.id,
        formData
    )
        .then((response) => {
            if (response.data["msg"]) {
                message.error(`El Número de licitacion o MEMO ya existe`)
                setLoadingScreenC(false)
                setButtonEstado(false)
            } else {
                message.success(`La licitación se ha guardado correctamente.`)
                setOpen(false)
                props.reloadTable()
            }
        })
        .catch((error) => {
            message.error(`La licitación no ha podido actualizarse.`)
        })
        .finally(() => {
            if (!response.data["msg"]) {
                cleanInputs()
                setButtonEstado(false)
                setLoadingScreenC(false)
            }
        })
}
```

## Campos del Formulario

### 1. Requirente (Select Autocompletable)
```javascript
<Select
    placeholder="Ingrese requirente"
    value={requirente}
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

### 2. Número de Licitación
```javascript
<Input
    value={numeroLicitacion}
    onChange={(event) => setNumeroLicitacion(event.target.value)}
    placeholder="Ingrese N° de licitación"
/>
```

### 3. Nombre Licitación
```javascript
<Input
    value={nombreLicitacion}
    onChange={(event) => setNombreLicitacion(event.target.value)}
    placeholder="Ingrese Nombre de Licitación"
/>
```

### 4. Vigencia (Condicional)
Solo para formatos diferentes a "Otros Trámites" (ID 5):
```javascript
{formatoLiquidacion !== 5 ? (
    <>
        <Text style={{ marginTop: "10px" }}>Vigencia:</Text>
        <DatePicker
            defaultValue={dayjs(vigencia, dateFormatList[0])}
            format={"DD-MM-YYYY"}
            style={{ width: "100%" }}
            onChange={(value) => setVigencia(value)}
        />
    </>
) : ""}
```

### 5. Monto Presupuestado (Condicional)
Solo para formatos diferentes a "Otros Trámites":
```javascript
{formatoLiquidacion !== 5 ? (
    <>
        <Text style={{ marginTop: "10px" }}>Monto Presupuestado:</Text>
        <Input
            style={{ marginBottom: "20px" }}
            value={montoPresupuestado}
            onChange={(event) => setMontoPresupuestado(event.target.value)}
            placeholder="Ingrese Monto Presupuestado"
        />
    </>
) : ""}
```

## Validaciones

### Por Formato de Licitación

**Formato 2 (Contraloría)**:
- Número de licitación opcional (se guarda como 'null')

**Formato 5 (Otros Trámites)**:
- No requiere vigencia
- No requiere monto presupuestado

**Otros Formatos**:
- Todos los campos requeridos
- Monto solo números

### Validación de Duplicados
El backend valida si el número ya existe:
```javascript
if (response.data["msg"]) {
    message.error(`El Número de licitacion o MEMO ya existe`)
}
```

## API Endpoints

### GET
- `/api/CombinedQuerysRequirenteLicitacionId/:id`: Datos de licitación y requirentes

### PUT
- `/api/updateLicitacion/:idLicitacion/:userId`: Actualiza licitación

## Registro de Cambios

El sistema registra automáticamente:
- Qué campos cambiaron
- Valores antiguos y nuevos
- Usuario que realizó el cambio
- Fecha y hora del cambio

Esto se visualiza en **ModalCUHistorial**

## Props

```javascript
{
    reloadTable: Function // Callback para recargar tabla padre
}
```

## DatePicker Configuration

```javascript
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import "dayjs/locale/es"
import locale from "antd/es/date-picker/locale/es_ES"

dayjs.extend(customParseFormat)

const dateFormatList = ["DD/MM/YYYY", "DD/MM/YY", "DD-MM-YYYY", "DD-MM-YY"]
```

## Skeleton Loading

```javascript
function SkeletonsLoading() {
    return (
        <SimpleGrid cols={1}>
            <Skeleton.Input style={{ width: "100%" }} />
            <Skeleton.Input style={{ width: "100%" }} />
            <Skeleton.Input style={{ width: "100%" }} />
            {formatoLiquidacion === 5 ? "" : (
                <>
                    <Skeleton.Input style={{ width: "100%" }} />
                    <Skeleton.Input style={{ width: "100%" }} />
                </>
            )}
        </SimpleGrid>
    )
}
```

## Consideraciones para Migración

1. **Auditoría de Cambios**: Sistema de tracking ya implementado
2. **Validaciones Dinámicas**: Según formato de licitación
3. **Select con Creación**: Permite agregar requirentes on-the-fly
4. **Conversión de Fechas**: Centralizar lógica
5. **FormData vs JSON**: Considerar migrar a JSON
6. **Validación de Duplicados**: Del lado del servidor
7. **Estados Condicionales**: Usar computed properties
8. **Date Handling**: Estandarizar librería
9. **Type Safety**: Migrar a TypeScript
10. **Form Library**: Usar React Hook Form

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "antd": "^5.0.0",
  "dayjs": "^1.11.0",
  "date-fns": "^2.30.0",
  "axios": "^1.0.0"
}
```
