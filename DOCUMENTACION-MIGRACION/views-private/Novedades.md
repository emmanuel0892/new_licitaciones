# Módulo: Novedades

## Descripción General
Vista pública de novedades para todos los usuarios. Muestra un listado de noticias y comunicados del hospital.

## Ubicación
`src/views/private/Novedades.jsx`

## Estructura del Componente

### Estado
```javascript
const [loadingScreenC, setLoadingScreenC] = useState(false)
const [data, setData] = useState(false)
const [isModalOpen, setIsModalOpen] = useState(false)
```

## Funcionalidades Principales

### 1. Carga de Novedades

```javascript
const getNovedades = async () => {
    setLoadingScreenC(true)
    try {
        const response = await axiosInstance.get("/api/getNovedades")
        setData(response.data)
    } catch (error) {
        console.log(error)
    } finally {
        setLoadingScreenC(false)
    }
}
```

### 2. Renderizado de Tarjetas

```javascript
const links = data ? data.map((item, index) => {
    const fechaObj = new Date(item.created_at)
    const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", 
                   "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
    const tresLetrasMes = meses[fechaObj.getMonth()]
    
    return (
        <div className="contenedor-novedad-fila">
            <div className={classes.fila_fecha + ' fila-fecha'}>
                <Text style={{ fontWeight: "600" }}>
                    {item.created_at.substring(8, 10)}
                </Text>
                <Text>{tresLetrasMes}</Text>
                <Text>{item.created_at.substring(0, 4)}</Text>
            </div>
            <div className={classes.fila_detalle + ' fila-detalle'}>
                <Text style={{fontWeight: 500}}>{item.titular}</Text>
                <Text style={{ color: "#6B7280" }}>
                    {item.descripcion.length < 40
                        ? item.descripcion
                        : item.descripcion.substring(0, 150) + "..."}
                </Text>
            </div>
            <div className={classes.fila_button + ' contenedor-button'}>
                <Link to={GOTONOVEDADES + item.id}>
                    <a className={classes.button_vermas}>Ver más</a>
                </Link>
            </div>
        </div>
    )
}) : null
```

## Diseño Visual

### Estructura de Tarjeta
- **Fecha**: Columna izquierda con día, mes, año
- **Detalle**: Columna central con título y descripción truncada
- **Acción**: Botón "Ver más" a la derecha

### Estilos

```javascript
const useStyles = createStyles((theme) => ({
    fila_fecha: {
        paddingRight: "20px",
        borderRight: "1.5px solid #ced4da",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "rgb(158, 187, 60)",
        fontSize: "16px",
    },
    fila_detalle: {
        paddingRight: "20px",
        width: "65%",
        paddingLeft: "20px",
    },
    fila_button: {
        width: "35%",
        paddingRight: "20px",
        paddingLeft: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    button_vermas: {
        border: "1px solid #d9d9d9",
        color: "black",
        textDecoration: "none",
        padding: "6px 14px 6px 14px",
        borderRadius: "8px",
    },
}))
```

## Navegación

Al hacer clic en "Ver más", redirige a:
```javascript
GOTONOVEDADES + item.id
// Ejemplo: /novedad/123
```

## Procesamiento de Fecha

```javascript
// Extrae día
item.created_at.substring(8, 10)

// Extrae mes (convertido a texto)
const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", 
               "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
const tresLetrasMes = meses[fechaObj.getMonth()]

// Extrae año
item.created_at.substring(0, 4)
```

## API Endpoints

### GET
- `/api/getNovedades`: Lista todas las novedades públicas

## Consideraciones para Migración

1. **Fecha**: Usar librería de fechas (date-fns, dayjs)
2. **Truncado**: Componente reutilizable para texto
3. **Cards**: Diseño con componentes modernos
4. **Paginación**: Para muchas novedades
5. **Categorías**: Filtrar por tipo de novedad
6. **Búsqueda**: Buscar por título o contenido
7. **Imágenes**: Mostrar preview en tarjeta
8. **Responsive**: Grid adaptativo
9. **Animaciones**: Transiciones suaves
10. **Marcadores**: Indicar novedades no leídas

## Estilos CSS

- `../../styles/styles-novedades.css`

## Relación con Otros Módulos

- **VerNovedad**: Vista detallada de una novedad
- **GestionNovedades**: Administración (Super Admin)

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "react-router-dom": "^6.0.0",
  "axios": "^1.0.0"
}
```
