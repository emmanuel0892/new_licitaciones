# Módulo: MisLicitaciones (Mis Licitaciones)

## Descripción General
Módulo para que licitadores y super administradores visualicen y gestionen sus propias licitaciones creadas.

## Ubicación
`src/views/private/MisLicitaciones.jsx`

## Estructura del Componente

### Estado
```javascript
const [loadingScreenC, setLoadingScreenC] = useState(false)
const [data, setData] = useState([])
const [numeroLicitacion, setNumeroLicitacion] = useState("")
const childRef = useRef(null)
```

### Columnas de la Tabla

1. **Número Licitación**: Con validación "Sin número de licitación"
2. **Formato de licitación**: Título del formato
3. **Nombre de Licitación**
4. **Creador**: Nombre completo
5. **Requirente**
6. **Monto**: Con validación "Sin Monto"
7. **Vigencia**: Formateada o "Sin Vigencia"
8. **Fecha de Creación**: Formateada
9. **Proceso Actual**
10. **Acciones**: Editar y Eliminar

## Funcionalidades Principales

### 1. Carga de Licitaciones del Usuario

```javascript
const getLicitiones = async () => {
    setLoadingScreenC(true)
    setNumeroLicitacion("")
    
    await axiosInstance.get("/api/getLicitacionSegunUsuario/" + userLogged.id)
        .then((response) => {
            setData(response.data)
        })
        .finally(() => {
            setLoadingScreenC(false)
        })
}
```

### 2. Búsqueda por Número

```javascript
async function buscarLicitacionNumLicitacion() {
    if (numeroLicitacion === null || numeroLicitacion === "") {
        message.error(`Debe ingresar un Número de Licitación`)
    } else {
        getLicitionesSegunNumLicitacion(numeroLicitacion)
    }
}

const getLicitionesSegunNumLicitacion = async (numeroLicitacion) => {
    setLoadingScreenC(true)
    await axiosInstance.get(
        "/api/getLicitacionSegunNumLicitacionAndUsuario/" +
        numeroLicitacion + "/" + userLogged.id
    )
        .then((response) => {
            setData(response.data)
        })
        .finally(() => {
            setLoadingScreenC(false)
        })
}
```

### 3. Eliminación de Licitaciones

```javascript
const deleteLicitacion = async (id) => {
    message.loading("La licitación se esta eliminando...")
    await axiosInstance.put("/api/deleteLicitacion/" + id)
        .then((response) => {
            message.success(`La licitación se ha eliminado correctamente.`)
            getLicitiones()
        })
        .catch((error) => {
            console.log(error)
        })
}
```

## Control de Acceso

```javascript
if(userLogged){
    if(userLogged.type_account === 'Licitador' || 
       userLogged.type_account === 'Super Admin'){
        // Acceso permitido
    } else {
        window.location.href = "/"
    }
}
```

**Roles con Acceso**:
- Licitador (solo sus licitaciones)
- Super Admin (solo sus licitaciones)

## Filtros

- **N° de Licitación | MEMO**: Búsqueda por texto
- **Botones**: Buscar | Mostrar Todo

## API Endpoints

### GET
- `/api/getLicitacionSegunUsuario/:userId`: Licitaciones del usuario
- `/api/getLicitacionSegunNumLicitacionAndUsuario/:numero/:userId`: Búsqueda específica

### PUT
- `/api/deleteLicitacion/:id`: Eliminación lógica

## Consideraciones para Migración

1. **Filtros**: Agregar más opciones (estado, fecha, formato)
2. **Ordenamiento**: Por fecha, estado, número
3. **Exportación**: PDF o Excel de licitaciones propias
4. **Vista Rápida**: Preview sin entrar al detalle
5. **Estadísticas**: Resumen de licitaciones por estado
6. **Búsqueda Avanzada**: Por múltiples criterios
7. **Duplicar**: Función para clonar licitación

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
