# Modal: ModalCUHistorial

## Descripción General
Modal que muestra el historial completo de una licitación, incluyendo observaciones (devoluciones) y modificaciones (ediciones) realizadas.

## Ubicación
`src/components/ui/modals/ModalCUHistorial.jsx`

## Tipo de Componente
**forwardRef** con **useImperativeHandle**

## Estructura del Componente

### Estado
```javascript
const { userLogged } = useAuthContext()
const [loadingScreenC, setLoadingScreenC] = useState(false)
const [open, setOpen] = useState(false)
const [data, setData] = useState([])
const [dataObservaciones, setDataObservaciones] = useState([])
const [dataEdiciones, setDataEdiciones] = useState([])
const [isEdit, setIsEdit] = useState(false)
const [idLicitacion, setIdLicitacion] = useState("")
const [buttonEstado, setButtonEstado] = useState(false)
```

## Funcionalidades Principales

### 1. Carga de Historial

```javascript
const childFunction = async (id, action) => {
    setOpen(true)
    if (action === "Edit") {
        setLoadingScreenC(true)
        setIsEdit(true)
        await axiosInstance.get("/api/CombinedQuerysObservacionesLicitacion/" + id)
            .then((response) => {
                setDataObservaciones(
                    response.data["Consulta1getObservacionesSegunLicitacion"]["original"]
                )
                setDataEdiciones(
                    response.data["Consulta2getEdicionesSegunLicitacion"]["original"]
                )
                setIdLicitacion(id)
            })
            .finally(() => {
                setLoadingScreenC(false)
            })
    }
}
```

### 2. Tabla de Observaciones (Devoluciones)

```javascript
const linksObservaciones = dataObservaciones.map((item, index) => (
    <tr key={index}>
        <td data-label="Devuelto A:">{item.devuelto_a}</td>
        <td data-label="Desde">{item.desde_a}</td>
        <td data-label="Motivo">{item.motivo_devolución}</td>
        <td data-label="Nombre">{item.name + " " + item.lastname}</td>
        <td data-label="Fecha Devolución">
            {fecha_formateada(item.created_at.substring(0,10))}
            {item.created_at.substring(10,20)}
        </td>
    </tr>
))
```

**Columnas**:
- Devuelto A: Proceso al que se devolvió
- Desde: Proceso desde donde se devolvió
- Motivo: Razón de la devolución
- Nombre: Usuario que devolvió
- Fecha Devolución: Fecha y hora formateada

### 3. Tabla de Modificaciones (Ediciones)

```javascript
const linksEdiciones = dataEdiciones.map((item, index) => (
    <tr key={index}>
        <td className={item.numero_licitacion_antiguo === 'null' ? "dato-vacio" : ""} 
            data-label="Número Licitación">
            {item.numero_licitacion_antiguo !== "null" ? (
                <span>
                    {item.numero_licitacion_antiguo === 'vacio' ? '' : item.numero_licitacion_antiguo}
                    {" "}
                    <svg width={10} fill="none" viewBox="0 0 12 10">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" 
                              strokeWidth="2" d="m7 9 4-4-4-4M1 9l4-4-4-4"/>
                    </svg>
                    {" "}
                    {item.numero_licitacion_nuevo === 'vacio' ? '' : item.numero_licitacion_nuevo}
                </span>
            ) : null}
        </td>
        
        <td className={item.requirente_antiguo === 'null' ? "dato-vacio" : ""} 
            data-label="Requirente:">
            {item.requirente_antiguo !== "null" ? (
                <span>
                    {item.requirente_antiguo} → {item.requirente_nuevo}
                </span>
            ) : null}
        </td>
        
        <td className={item.nombre_licitacion_antiguo === 'null' ? "dato-vacio" : ""} 
            data-label="Nombre Licitacion">
            {item.nombre_licitacion_antiguo !== "null" ? (
                <span>
                    {item.nombre_licitacion_antiguo} → {item.nombre_licitacion_nuevo}
                </span>
            ) : null}
        </td>
        
        <td className={item.vigencia_antiguo === '0000-00-00' ? "dato-vacio" : ""} 
            data-label="Vigencia">
            {item.vigencia_antiguo !== "0000-00-00" ? (
                <span>
                    {fecha_formateada(item.vigencia_antiguo)} → {fecha_formateada(item.vigencia_nuevo)}
                </span>
            ) : null}
        </td>
        
        <td className={item.monto_presupuestado_antiguo === 'null' ? "dato-vacio" : ""} 
            data-label="Monto Presupuestado">
            {item.monto_presupuestado_antiguo !== "null" ? (
                <span>
                    {item.monto_presupuestado_antiguo} → {item.monto_presupuestado_nuevo}
                </span>
            ) : null}
        </td>
        
        <td data-label="Editado por">{item.name} {item.lastname}</td>
        <td data-label="Fecha">
            {fecha_formateada(item.created_at.substring(0,10))}
            {item.created_at.substring(10,20)}
        </td>
    </tr>
))
```

**Columnas de Ediciones**:
- Número Licitación: Antiguo → Nuevo
- Requirente: Antiguo → Nuevo
- Nombre Licitación: Antiguo → Nuevo
- Vigencia: Antiguo → Nuevo
- Monto Presupuestado: Antiguo → Nuevo
- Editado por: Usuario
- Fecha: Fecha y hora

### 4. Indicadores Visuales

```javascript
// Clase CSS para datos vacíos
className={item.numero_licitacion_antiguo === 'null' ? "dato-vacio" : ""}

// Icono de flecha para cambios
<svg width={10} fill="none" viewBox="0 0 12 10">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" 
          strokeWidth="2" d="m7 9 4-4-4-4M1 9l4-4-4-4"/>
</svg>

// Mostrar solo si hubo cambio
{item.requirente_antiguo !== "null" ? <span>...</span> : null}
```

### 5. Alerta de Información

```javascript
<Alert
    className="alert"
    variant="light"
    color="orange"
    title="Ordenadas desde la más reciente"
    icon={<IconInfoCircle />}
/>
```

## Layout del Modal

```javascript
<div style={{ display: "flex", marginBottom: "16px" }}>
    <Alert .../>
</div>

<div>
    <Text style={{ fontWeight: "500", marginBottom: "10px", fontSize: "16px" }}>
        Observaciones:
    </Text>
    <table className="table" style={{ marginBottom: "30px" }}>
        <thead style={{ background: "red" }}>
            <tr style={{ background: "red" }}>
                {/* Columnas */}
            </tr>
        </thead>
        <tbody>{linksObservaciones}</tbody>
    </table>
</div>

<div>
    <Text style={{ fontWeight: "500", marginBottom: "10px", fontSize: "16px" }}>
        Modificaciones:
    </Text>
    
    <Text style={{ marginBlock: "10px" }}>
        (Dato Antiguo) → (Dato Nuevo)
    </Text>
    
    <table className="table" style={{ marginBottom: "30px" }}>
        <thead>
            <tr>{/* Columnas */}</tr>
        </thead>
        <tbody>{linksEdiciones}</tbody>
    </table>
</div>
```

## Estilos CSS

- `../../styles/styles-observaciones.css`

## API Endpoints

### GET
- `/api/CombinedQuerysObservacionesLicitacion/:id`: Retorna observaciones y ediciones

Respuesta:
```javascript
{
    "Consulta1getObservacionesSegunLicitacion": {
        "original": [...]
    },
    "Consulta2getEdicionesSegunLicitacion": {
        "original": [...]
    }
}
```

## Estructura de Datos

### Observación
```javascript
{
    devuelto_a: string,  // Nombre del proceso destino
    desde_a: string,     // Nombre del proceso origen
    motivo_devolución: string,
    name: string,
    lastname: string,
    created_at: string   // YYYY-MM-DD HH:MM:SS
}
```

### Edición
```javascript
{
    numero_licitacion_antiguo: string | 'null' | 'vacio',
    numero_licitacion_nuevo: string | 'vacio',
    requirente_antiguo: string | 'null',
    requirente_nuevo: string,
    nombre_licitacion_antiguo: string | 'null',
    nombre_licitacion_nuevo: string,
    vigencia_antiguo: string | '0000-00-00',
    vigencia_nuevo: string,
    monto_presupuestado_antiguo: string | 'null',
    monto_presupuestado_nuevo: string,
    name: string,
    lastname: string,
    created_at: string
}
```

## Footer del Modal

```javascript
footer={[
    <Button key="back" onClick={() => setOpen(false)}>
        Cerrar
    </Button>,
]}
```

## Valores Especiales

- **'null'**: Campo no tenía valor o no cambió
- **'vacio'**: Campo fue vaciado intencionalmente
- **'0000-00-00'**: Fecha sin valor

## Consideraciones para Migración

1. **Timeline Visual**: Usar componente de timeline más moderno
2. **Diff Viewer**: Librería especializada para mostrar cambios
3. **Filtros**: Por fecha, usuario, tipo de cambio
4. **Exportación**: PDF/Excel del historial
5. **Búsqueda**: Buscar en historial
6. **Agrupación**: Por día, semana, usuario
7. **Colores**: Destacar cambios importantes
8. **Tooltips**: Más info al hover
9. **Comparación**: Vista lado a lado
10. **Restaurar**: Función para revertir cambios

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
