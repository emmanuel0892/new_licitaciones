# Modal: ModalCULicitacionDevolver

## Descripción General
Modal para devolver una licitación a un proceso anterior con motivo. Permite retroceder en el workflow cuando se detectan problemas que requieren corrección.

## Ubicación
`src/components/ui/modals/ModalCULicitacionDevolver.jsx`

## Tipo de Componente
**forwardRef** con **useImperativeHandle**

## Estructura del Componente

### Estado
```javascript
const { userLogged } = useAuthContext()
const [loadingScreenC, setLoadingScreenC] = useState(true)
const [open, setOpen] = useState(false)

const [dataProcesos, setDataProcesos] = useState([])
const [procesos, setProcesos] = useState(undefined)
const [motivo, setMotivo] = useState("")
const [procesoActual, setProcesoActual] = useState("")
const [idProcesoActual, setIdProcesoActual] = useState("")

const [isEdit, setIsEdit] = useState(false)
const [idLicitacion, setIdLicitacion] = useState("")
const [buttonEstado, setButtonEstado] = useState(false)
```

## Funcionalidades Principales

### 1. Carga de Datos

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
                setProcesoActual(licitacion.titulo_proceso)
                setIdProcesoActual(licitacion.fk_proceso_actual_id)
                
                // Traer los pasos según el formato
                const formatoLiquidacionId = licitacion.fk_formato_liquidacion_id
                
                axiosInstance.get(`/api/getProcesosSegunFormato/` + formatoLiquidacionId)
                    .then((response) => {
                        const datosAdicionales = response.data
                        setDataProcesos(datosAdicionales)
                    })
                    .catch((error) => {
                        console.log("Error en la segunda solicitud:", error)
                    })
                
                setIdLicitacion(id)
            })
            .finally(() => {
                setLoadingScreenC(false)
            })
    }
}
```

### 2. Filtrado de Procesos Disponibles

```javascript
const dataArray = dataProcesos
    .filter((item) =>
        item.titulo_proceso !== "No iniciado" &&
        item.titulo_proceso !== "Publicada"
    )
    .filter((item) => item.titulo_proceso !== procesoActual) // Excluir proceso actual
    .filter((item) => item.id <= idProcesoActual) // Solo procesos anteriores
    .map((item) => ({
        value: `${item.id}`,
        label: `${item.titulo_proceso}`,
    }))
```

**Lógica de Filtrado**:
1. Excluye "No iniciado" y "Publicada"
2. Excluye el proceso actual (no se puede devolver a sí mismo)
3. Solo permite procesos anteriores al actual (`item.id <= idProcesoActual`)

### 3. Devolución de Licitación

```javascript
async function devolverLicitacion() {
    if (procesos === null || procesos === undefined) {
        return message.error("Ingrese el proceso a donde debe volver la licitación")
    }
    
    if (motivo === null || motivo === "") {
        return message.error("Debe ingresar un motivo")
    }
    
    setButtonEstado(true)
    setLoadingScreenC(true)
    
    const formData = new FormData()
    formData.append("devuelto_a", procesos)
    formData.append("devuelto_desde", idProcesoActual)
    formData.append("motivo", motivo)
    formData.append("id_usuario", userLogged.id)
    
    await axiosInstance.put("/api/devolverLicitacion/" + idLicitacion, formData)
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

### 1. Proceso Actual (Solo Lectura)
```javascript
<Text>Proceso Actual:</Text>
<Input value={procesoActual} disabled />
```

### 2. Proceso a Devolver (Select)
```javascript
<Text style={{ marginTop: "10px" }}>Proceso a devolver:</Text>
<Select
    placeholder="Seleccione proceso"
    style={{ width: "100%" }}
    options={dataArray}
    onChange={(value) => setProcesos(value)}
    value={procesos}
/>
```

### 3. Motivo (TextArea)
```javascript
<Text style={{ marginTop: "10px" }}>Motivo:</Text>
<TextArea
    value={motivo}
    style={{ marginBottom: "20px", resize: "none" }}
    onChange={(event) => setMotivo(event.target.value)}
    placeholder="Ingrese motivo"
/>
```

## Validaciones

1. **Proceso destino**: Requerido
2. **Motivo**: Requerido, no puede estar vacío
3. **Proceso válido**: Solo procesos anteriores al actual

## Registro en Base de Datos

La devolución crea un registro de observación con:
- `devuelto_a`: ID del proceso destino
- `devuelto_desde`: ID del proceso actual
- `motivo`: Texto explicativo
- `id_usuario`: Usuario que devolvió
- Timestamp automático

Este registro se visualiza posteriormente en **ModalCUHistorial**

## API Endpoints

### GET
- `/api/getLicitacionId/:id`: Datos de la licitación
- `/api/getProcesosSegunFormato/:formatoId`: Procesos del formato

### PUT
- `/api/devolverLicitacion/:id`: Devuelve y cambia estado

## Flujo Completo

1. Usuario abre modal desde licitación
2. Sistema carga proceso actual
3. Sistema carga procesos disponibles del formato
4. Filtra solo procesos anteriores
5. Usuario selecciona proceso destino
6. Usuario ingresa motivo
7. Sistema valida campos
8. Sistema actualiza estado de licitación
9. Sistema registra observación
10. Notifica al responsable del proceso destino

## Props

```javascript
{
    reloadTable: Function // Callback para recargar tabla padre
}
```

## Casos de Uso

### Ejemplo 1: Error en Documentación
- **Proceso Actual**: Jurídico
- **Devolver a**: Confección de Bases
- **Motivo**: "Falta especificación técnica en bases"

### Ejemplo 2: Corrección de Montos
- **Proceso Actual**: Presupuesto
- **Devolver a**: Preadjudicación y Comisión
- **Motivo**: "Monto sobrepasa presupuesto disponible"

### Ejemplo 3: Revisión Legal
- **Proceso Actual**: Firmas Directivos
- **Devolver a**: Jurídico
- **Motivo**: "Cláusulas contractuales requieren revisión"

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
        onClick={() => (isEdit ? devolverLicitacion() : null)}
        style={{ backgroundColor: COLORS.Primary, color: "white" }}
        disabled={buttonEstado}
    >
        {isEdit ? "Devolver" : ""}
    </Button>,
]}
```

## Consideraciones para Migración

1. **Notificaciones**: Implementar sistema de alertas al responsable
2. **Validación de Reglas**: Reglas de negocio para qué procesos pueden devolverse
3. **Comentarios Adicionales**: Permitir adjuntar documentos con la devolución
4. **Historial Detallado**: Mostrar todas las devoluciones previas
5. **Plantillas**: Motivos predefinidos comunes
6. **Aprobación**: Requerir aprobación para ciertas devoluciones
7. **Límites**: Limitar número de devoluciones por licitación
8. **Estadísticas**: Tracking de razones de devolución más comunes
9. **Workflow Dinámico**: Configuración de reglas de devolución
10. **Escalamiento**: Opción de escalar a supervisor

## Estructura FormData

```javascript
{
    devuelto_a: string,        // ID del proceso destino
    devuelto_desde: string,    // ID del proceso actual
    motivo: string,            // Texto explicativo
    id_usuario: number         // ID del usuario
}
```

## Impacto en el Sistema

Cuando se devuelve una licitación:
1. **Estado cambia**: `fk_proceso_actual_id` se actualiza
2. **Se registra observación**: En tabla de historial
3. **Turno cambia**: Al responsable del proceso destino
4. **Notificación**: (Si está implementada) al nuevo responsable
5. **Badge de estado**: Puede cambiar a "Devuelto"

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "antd": "^5.0.0",
  "axios": "^1.0.0"
}
```
