# Modal: ModalCUWorkFlowSA (WorkFlow Super Admin)

## Descripción General
Versión extendida del workflow exclusiva para Super Administradores, con estilo visual diferenciado y consultas específicas.

## Ubicación
`src/components/ui/modals/ModalCUWorkFlowSA.jsx`

## Tipo de Componente
**forwardRef** con **useImperativeHandle**

## Diferencias con ModalCUWorkFlow

### 1. API Endpoint Diferente
```javascript
await axiosInstance.get("/api/CombinedQuerysWorkFlowWS/" + id)
```
vs
```javascript
await axiosInstance.get("/api/CombinedQuerysWorkFlow/" + id)
```

### 2. Color del Tema
```javascript
// ModalCUWorkFlowSA
color: "#922b3e" // Vino/Burgundy

// ModalCUWorkFlow
color: "rgb(158, 187, 60)" // Verde
```

### 3. Estilos CSS Específicos
```css
/* ../../styles/styles-workflow-sa.css */
```

### 4. Clases de Tabla
```javascript
// ModalCUWorkFlowSA
<table className="table_ws">

// ModalCUWorkFlow
<table className="table">
```

## Estructura del Componente

Idéntica a ModalCUWorkFlow, con las diferencias mencionadas:

```javascript
const [loadingScreenC, setLoadingScreenC] = useState(true)
const [open, setOpen] = useState(false)
const [licitacion, setLicitacion] = useState("")
const [nombreLicitacion, setNombreLicitacion] = useState("")
const [vigencia, setVigencia] = useState(null)
const [formato, setFormato] = useState("")
const [idProcesoActual, setIdProcesoActual] = useState("")
const [dataLicitacion, setDataLicitacion] = useState([])
const [dataProcesos, setDataProcesos] = useState([])
const [dataProcesosDias, setDataProcesosDias] = useState([])
const [diasTotalesLicitacion, setDiasTotalesLicitacion] = useState([])
const [isEdit, setIsEdit] = useState(false)
const [idLicitacion, setIdLicitacion] = useState("")
const [buttonEstado, setButtonEstado] = useState(false)
const [active, setActive] = useState(1)
```

## Funcionalidades Principales

### Carga de Datos
```javascript
const childFunction = async (id, action) => {
    setOpen(true)
    setLoadingScreenC(true)
    
    if (action === "Edit") {
        setLoadingScreenC(true)
        setIsEdit(true)
        
        await axiosInstance.get("/api/CombinedQuerysWorkFlowWS/" + id)
            .then((response) => {
                setDataLicitacion(response.data["Consulta1getLicitacionId"]["original"]["0"])
                setDataProcesos(response.data["Consulta2getProcesosSegunFormato"]["original"])
                setDataProcesosDias(response.data["Consulta3getProcesosDiasLicitacionWS"]["original"])
                setDiasTotalesLicitacion(
                    response.data["Consulta4getDiasTotalesProcesoLicitacionWS"]["original"]["total_dias_habiles"]
                )
                // ... resto igual a ModalCUWorkFlow
            })
            .finally(() => {
                setLoadingScreenC(false)
            })
    }
}
```

## Consultas Específicas WS

### Consulta 3
```javascript
response.data["Consulta3getProcesosDiasLicitacionWS"]["original"]
```
En lugar de:
```javascript
response.data["Consulta3getProcesosDiasLicitacion"]["original"]
```

### Consulta 4
```javascript
response.data["Consulta4getDiasTotalesProcesoLicitacionWS"]["original"]
```
En lugar de:
```javascript
response.data["Consulta4getDiasTotalesProcesoLicitacion"]["original"]
```

## Estilo Visual Distintivo

### Badges de Información
```javascript
<span style={{
    background: "#922b3e",      // Color vino/burgundy
    color: "white",
    padding: "1px 10px 2px 10px",
    marginRight: "3px",
    borderRadius: "10px",
}}>
    Licitacion:
</span>
```

### Stepper
```javascript
<Stepper
    iconSize={32}
    active={contador}
    color="#922b3e"              // Color distintivo
    onStepClick={setActive}
    allowNextStepsSelect={false}
>
    {links}
</Stepper>
```

## Layout Idéntico

Mantiene la misma estructura de dos columnas:
- **Izquierda**: Datos + Stepper
- **Derecha**: Tablas de métricas

## API Endpoints

### GET
- `/api/CombinedQuerysWorkFlowWS/:id`: Versión WS (WorkSpace/Super Admin)

**Respuesta esperada**:
```javascript
{
    "Consulta1getLicitacionId": { "original": [...] },
    "Consulta2getProcesosSegunFormato": { "original": [...] },
    "Consulta3getProcesosDiasLicitacionWS": { "original": [...] },
    "Consulta4getDiasTotalesProcesoLicitacionWS": { "original": {...} }
}
```

## Posibles Diferencias en Datos

Las consultas "WS" podrían incluir:
- Información adicional de auditoría
- Datos sensibles solo para Super Admin
- Métricas extendidas
- Información de usuarios completa
- Datos históricos más detallados

## Uso desde Componente Padre

```javascript
const childRefWorkFlowSA = useRef(null)

// Solo visible para Super Admin
{userLogged.type_account === "Super Admin" && (
    <ActionIcon onClick={() => childRefWorkFlowSA.current.childFunction(id, "Edit")}>
        <IconTableOptions style={{ color: "#922b3e" }} />
    </ActionIcon>
)}

<ModalCUWorkFlowSA ref={childRefWorkFlowSA} />
```

## Control de Acceso

Este modal solo debería ser accesible para usuarios con rol "Super Admin".

## Estilos CSS

```css
/* styles-workflow-sa.css */

.table_ws {
    /* Estilos específicos para tabla SA */
}

.table_ws thead {
    background-color: #922b3e;
    color: white;
}

.table_ws tbody tr:hover {
    background-color: #f8e8eb;
}
```

## Diferencias Visuales Clave

| Aspecto | ModalCUWorkFlow | ModalCUWorkFlowSA |
|---------|----------------|-------------------|
| Color Principal | Verde (#9EBB3C) | Vino (#922b3e) |
| Tabla CSS Class | `table` | `table_ws` |
| Endpoint | `WorkFlow` | `WorkFlowWS` |
| Acceso | Todos | Super Admin |
| Consulta 3 | `getProcesosDiasLicitacion` | `getProcesosDiasLicitacionWS` |
| Consulta 4 | `getDiasTotalesProcesoLicitacion` | `getDiasTotalesProcesoLicitacionWS` |

## Consideraciones para Migración

1. **Unificación**: Evaluar si realmente necesitan dos modales separados
2. **Permisos**: Implementar sistema de permisos más granular
3. **Vistas Condicionales**: Un solo modal con vistas condicionales según rol
4. **Temas**: Sistema de temas dinámico por rol
5. **Datos Adicionales**: Documentar qué datos extra incluye versión WS
6. **Configuración**: Permitir configurar colores por rol
7. **Auditoría**: Información de auditoría extendida
8. **Exportación**: Reportes más detallados para Super Admin
9. **Análisis**: Gráficos y estadísticas adicionales
10. **Comparativas**: Comparar workflows entre licitaciones

## Posibles Datos Exclusivos WS

Especulaciones basadas en el patrón:
- Información de usuarios más detallada
- Tiempo exacto con horas/minutos (no solo días)
- Costos asociados a demoras
- Alertas de SLA
- Notas privadas de administración
- Flags de prioridad
- Historial de cambios de responsable
- Métricas de eficiencia por usuario

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "antd": "^5.0.0",
  "axios": "^1.0.0"
}
```

## Recomendación para Migración

**Unificar en un solo componente**:
```javascript
<ModalCUWorkFlow 
    variant={userLogged.type_account === "Super Admin" ? "extended" : "normal"}
    colorTheme={userLogged.type_account === "Super Admin" ? "#922b3e" : "#9EBB3C"}
/>
```

Beneficios:
- Menos código duplicado
- Más fácil de mantener
- Lógica condicional clara
- Un solo punto de cambio
