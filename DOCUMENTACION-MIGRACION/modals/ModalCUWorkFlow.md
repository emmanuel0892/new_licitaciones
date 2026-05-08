# Modal: ModalCUWorkFlow

## Descripción General
Modal para visualizar el workflow completo de una licitación con stepper visual, timeline de procesos y métricas de tiempo.

## Ubicación
`src/components/ui/modals/ModalCUWorkFlow.jsx`

## Tipo de Componente
**forwardRef** con **useImperativeHandle**

## Estructura del Componente

### Estado
```javascript
const [loadingScreenC, setLoadingScreenC] = useState(true)
const [open, setOpen] = useState(false)

// Datos de la licitación
const [licitacion, setLicitacion] = useState("")
const [nombreLicitacion, setNombreLicitacion] = useState("")
const [vigencia, setVigencia] = useState(null)
const [formato, setFormato] = useState("")
const [idProcesoActual, setIdProcesoActual] = useState("")

// Datos del workflow
const [dataLicitacion, setDataLicitacion] = useState([])
const [dataProcesos, setDataProcesos] = useState([])
const [dataProcesosDias, setDataProcesosDias] = useState([])
const [diasTotalesLicitacion, setDiasTotalesLicitacion] = useState([])

const [isEdit, setIsEdit] = useState(false)
const [idLicitacion, setIdLicitacion] = useState("")
const [buttonEstado, setButtonEstado] = useState(false)

// Stepper
const [active, setActive] = useState(1)
```

## Funcionalidades Principales

### 1. Carga de Datos del Workflow

```javascript
const childFunction = async (id, action) => {
    setOpen(true)
    setLoadingScreenC(true)
    
    if (action === "Edit") {
        setLoadingScreenC(true)
        setIsEdit(true)
        
        await axiosInstance.get("/api/CombinedQuerysWorkFlow/" + id)
            .then((response) => {
                setDataLicitacion(
                    response.data["Consulta1getLicitacionId"]["original"]["0"]
                )
                setDataProcesos(
                    response.data["Consulta2getProcesosSegunFormato"]["original"]
                )
                setDataProcesosDias(
                    response.data["Consulta3getProcesosDiasLicitacion"]["original"]
                )
                setDiasTotalesLicitacion(
                    response.data["Consulta4getDiasTotalesProcesoLicitacion"]["original"]["total_dias_habiles"]
                )
                
                setLicitacion(
                    response.data["Consulta1getLicitacionId"]["original"]["0"].numero_licitacion
                )
                setNombreLicitacion(
                    response.data["Consulta1getLicitacionId"]["original"]["0"].nombre_licitacion
                )
                setIdProcesoActual(
                    response.data["Consulta1getLicitacionId"]["original"]["0"].fk_proceso_actual_id
                )
                setFormato(
                    response.data["Consulta1getLicitacionId"]["original"]["0"].titulo
                )
                setVigencia(
                    response.data["Consulta1getLicitacionId"]["original"]["0"].vigencia
                )
                setIdLicitacion(id)
            })
            .finally(() => {
                setLoadingScreenC(false)
            })
    }
}
```

### 2. Cálculo de Progreso del Stepper

```javascript
let contador = 0 // Inicializa el contador en 0

const links = dataProcesos
    .filter((item) =>
        item.titulo_proceso !== "No iniciado" &&
        item.titulo_proceso !== "Publicada"
    )
    .map((item, index) => {
        if (item.id < idProcesoActual) {
            contador++ // Aumenta el contador si el proceso ya pasó
        }
        return (
            <Stepper.Step key={index} label={item.titulo_proceso}></Stepper.Step>
        )
    })
```

### 3. Tabla de Días por Proceso

```javascript
const linksProcesosDias = dataProcesosDias
    .filter((item) =>
        item.titulo_proceso !== "No iniciado" &&
        item.titulo_proceso !== "Publicada"
    )
    .map((item, index) => {
        return (
            <tr key={index}>
                <td data-label="Dias sugeridos:">{item.dias_sugeridos}</td>
                <td data-label="Proceso">{item.titulo_proceso}</td>
                <td
                    className={item.fecha_recepcion === null ? "dato-vacio" : ""}
                    data-label="Fecha de recepción"
                >
                    {item.fecha_recepcion === null
                        ? ""
                        : fecha_formateada(item.fecha_recepcion)}
                </td>
                <td
                    className={item.fecha_emision === null ? "dato-vacio" : ""}
                    data-label="Fecha de Emisión"
                >
                    {item.fecha_emision === "0000-00-00"
                        ? "Pendiente"
                        : item.fecha_emision === null
                        ? ""
                        : fecha_formateada(item.fecha_emision)}
                </td>
                <td
                    className={
                        item.fecha_emision === "0000-00-00" || item.fecha_emision === null
                            ? "dato-vacio"
                            : ""
                    }
                    data-label="Dias demorados"
                >
                    {item.fecha_emision === "0000-00-00" || item.fecha_emision === null
                        ? ""
                        : item.dias_habiles}
                </td>
                <td
                    className={item.name === null ? "dato-vacio" : ""}
                    data-label="Aprobado por"
                >
                    {item.name === null ? "" : item.name + ' ' + item.lastname}
                </td>
            </tr>
        )
    })
```

## Layout del Modal

### Contenedor Principal
```javascript
<div className="pantalla-completa">
    <div className="izquierda">
        {/* Datos de la licitación */}
        {/* Stepper vertical */}
    </div>
    
    <div className="derecha">
        {/* Tabla de días en procesos */}
        {/* Tabla de totales */}
    </div>
</div>
```

### Panel Izquierdo: Información y Stepper

```javascript
<div className="izquierda">
    <div className="datos-licitacion" style={{ marginBottom: "30px" }}>
        <Text style={{ fontWeight: "500", marginBottom: "8px" }}>
            <span style={{
                background: "rgb(158, 187, 60)",
                color: "white",
                padding: "1px 10px 1px 10px",
                marginRight: "3px",
                borderRadius: "10px",
            }}>
                Licitacion:
            </span>
            <span style={{ fontWeight: "400" }}>{licitacion}</span>
        </Text>
        
        <Text>
            <span>Nombre:</span> {nombreLicitacion}
        </Text>
        
        <Text>
            <span>Fecha de creación:</span>
            {vigencia === "0000-00-00" ? "Sin Vigencia" : fecha_formateada(vigencia)}
        </Text>
        
        <Text>
            <span>Formato:</span> {formato}
        </Text>
    </div>
    
    <div className="time-line">
        <Stepper
            iconSize={32}
            active={contador}
            color="rgb(158, 187, 60)"
            onStepClick={setActive}
            allowNextStepsSelect={false}
        >
            {links}
        </Stepper>
    </div>
</div>
```

### Panel Derecho: Métricas de Tiempo

```javascript
<div className="derecha">
    <Text style={{ fontWeight: "500", marginBottom: "15px", fontSize: "16px" }}>
        Dias en procesos:
    </Text>
    
    <table className="table" style={{ marginBottom: "30px" }}>
        <thead>
            <tr>
                <th scope="col">Dias sugeridos</th>
                <th scope="col">Proceso</th>
                <th scope="col">Fecha de recepción</th>
                <th scope="col">Fecha de emisión</th>
                <th scope="col">Dias demorados</th>
                <th scope="col">Aprobado por</th>
            </tr>
        </thead>
        <tbody>{linksProcesosDias}</tbody>
    </table>
    
    <Text style={{ fontWeight: "500", marginBottom: "15px", fontSize: "16px" }}>
        Total tiempo transcurrido:
    </Text>
    
    <table className="table">
        <thead>
            <tr>
                <th scope="col">Total Dias</th>
                <th scope="col">Total en Meses</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td data-label="Total Dias:">{diasTotalesLicitacion}</td>
                <td data-label="Total en Meses:">
                    {Math.floor(diasTotalesLicitacion / 30)}
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

## Características del Stepper

### Configuración
```javascript
<Stepper
    iconSize={32}
    active={contador}              // Paso actual (calculado)
    color="rgb(158, 187, 60)"     // Verde corporativo
    onStepClick={setActive}
    allowNextStepsSelect={false}  // No permite saltar pasos futuros
>
    {links}
</Stepper>
```

### Lógica de Progreso
- **contador**: Se calcula contando procesos completados
- **active**: Muestra visualmente hasta dónde llegó
- **Filtros**: Excluye "No iniciado" y "Publicada"

## Métricas Calculadas

### 1. Días en Cada Proceso
- **Días sugeridos**: Tiempo estimado
- **Días demorados**: Tiempo real (días hábiles)
- **Diferencia**: Permite identificar retrasos

### 2. Total Tiempo Transcurrido
- **Total Días**: Suma de días hábiles
- **Total Meses**: Días / 30 (redondeado hacia abajo)

## Indicadores Visuales

### Estados de Celdas
```javascript
className={item.fecha_recepcion === null ? "dato-vacio" : ""}
```

- **dato-vacio**: Gris claro para datos sin valor
- **Normal**: Para datos completos

### Estados de Proceso
- **Pendiente**: Cuando `fecha_emision === "0000-00-00"`
- **Vacío**: Cuando no ha iniciado (null)
- **Completado**: Con fecha y días calculados

## Estilos CSS

```css
/* ../../styles/styles-workflow.css */

.pantalla-completa {
    display: flex;
    gap: 20px;
}

.izquierda {
    width: 40%;
    border-right: 1px solid #e0e0e0;
    padding-right: 20px;
}

.derecha {
    width: 60%;
    padding-left: 20px;
}

.datos-licitacion {
    background: #f9f9f9;
    padding: 16px;
    border-radius: 8px;
}

.table {
    width: 100%;
    border-collapse: collapse;
}

.dato-vacio {
    background-color: #f5f5f5;
    color: #999;
}
```

## API Endpoints

### GET
- `/api/CombinedQuerysWorkFlow/:id`: Retorna 4 consultas:
  1. Datos de la licitación
  2. Procesos según formato
  3. Días en cada proceso
  4. Total días hábiles

## Estructura de Respuesta API

```javascript
{
    "Consulta1getLicitacionId": {
        "original": [{
            numero_licitacion: string,
            nombre_licitacion: string,
            fk_proceso_actual_id: number,
            titulo: string,
            vigencia: string
        }]
    },
    "Consulta2getProcesosSegunFormato": {
        "original": [{
            id: number,
            titulo_proceso: string
        }]
    },
    "Consulta3getProcesosDiasLicitacion": {
        "original": [{
            dias_sugeridos: number,
            titulo_proceso: string,
            fecha_recepcion: string,
            fecha_emision: string,
            dias_habiles: number,
            name: string,
            lastname: string
        }]
    },
    "Consulta4getDiasTotalesProcesoLicitacion": {
        "original": {
            total_dias_habiles: number
        }
    }
}
```

## Consideraciones para Migración

1. **Timeline Moderna**: Usar librería de timeline más avanzada
2. **Gráficos**: Agregar visualización gráfica (Gantt, barras)
3. **Exportación**: PDF del workflow
4. **Comparativas**: Comparar con otros workflows
5. **Alertas**: Indicadores de retrasos
6. **SLA**: Service Level Agreements por proceso
7. **Hitos**: Marcar eventos importantes
8. **Edición**: Permitir ajustar fechas (con permisos)
9. **Comentarios**: Por proceso
10. **Notificaciones**: Avisos de cambios de estado

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "antd": "^5.0.0",
  "axios": "^1.0.0"
}
```
