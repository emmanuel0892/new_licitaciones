# Módulo: TodasLicitaciones (Todas las Licitaciones)

## Descripción General
Vista administrativa para que Super Admin visualice y gestione todas las licitaciones del sistema.

## Ubicación
`src/views/private/TodasLicitaciones.jsx`

## Estructura del Componente

### Estado
```javascript
const [loadingScreenC, setLoadingScreenC] = useState(false)
const [data, setData] = useState([])
const [dataLicitaciones, setDataLicitaciones] = useState([])
const [dataUsers, setDataUsers] = useState([])
const [numeroLicitacion, setNumeroLicitacion] = useState("")
const [usuarioSelected, setUsuarioSelected] = useState(undefined)
const childRef = useRef(null)
```

### Columnas de la Tabla

Similares a MisLicitaciones:
1. Número Licitación
2. Formato de licitación
3. Nombre de Licitación
4. Creador
5. Requirente
6. Monto
7. Vigencia
8. Fecha de Creación
9. Proceso Actual
10. Acciones (Editar, Eliminar)

## Funcionalidades Principales

### 1. Carga de Todas las Licitaciones

```javascript
const getLicitacionUsers = async () => {
    setLoadingScreenC(true)
    setNumeroLicitacion("")
    setUsuarioSelected(undefined)
    
    await axiosInstance.get("/api/CombinedQuerysUsersLicitacion")
        .then((response) => {
            setDataLicitaciones(response.data["Consulta1getLicitacion"]["original"])
            setDataUsers(response.data["Consulta2getUsers"]["original"])
        })
        .catch((error) => {
            console.log(error)
        })
        .finally(() => {
            setLoadingScreenC(false)
        })
}
```

### 2. Búsqueda con Múltiples Filtros

```javascript
async function buscarLicitacionNumLicitacion() {
    if (numeroLicitacion === "" && usuarioSelected === undefined) {
        return message.error("Debe ingresar algun filtro")
    }
    
    const formData = new FormData()
    formData.append("numero_licitacion", numeroLicitacion)
    
    if (usuarioSelected !== undefined) {
        formData.append("id_usuario", usuarioSelected)
    }
    
    setLoadingScreenC(true)
    await axiosInstance.post("/api/getLicitacionSegunFiltro", formData)
        .then((response) => {
            setDataLicitaciones(response.data)
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
            getLicitacionUsers()
        })
        .catch((error) => {
            console.log(error)
        })
}
```

## Filtros

```javascript
// Select de usuarios
const dataArray = dataUsers.map((item) => ({
    value: `${item.id}`,
    label: `${item.name} ${item.lastname}`,
}))

<Input
    value={numeroLicitacion}
    onChange={(event) => setNumeroLicitacion(event.target.value)}
    placeholder="Buscar por Número de Licitación o MEMO"
/>

<Select
    placeholder="Seleccione usuario"
    value={usuarioSelected}
    onChange={(value) => setUsuarioSelected(value)}
    style={{ width: "100%" }}
    options={dataArray}
/>
```

## Control de Acceso

```javascript
if(userLogged){
    if(userLogged.type_account === 'Super Admin'){
        // Acceso permitido
    } else {
        window.location.href = "/"
    }
}
```

**Roles con Acceso**:
- Solo Super Admin

## Modales Integrados

- **ModalCULicitacion**: Editar licitaciones

## API Endpoints

### GET
- `/api/CombinedQuerysUsersLicitacion`: Todas las licitaciones y usuarios

### POST
- `/api/getLicitacionSegunFiltro`: Filtrado de licitaciones

### PUT
- `/api/deleteLicitacion/:id`: Eliminación

## Diferencias con MisLicitaciones

1. **Alcance**: Todas vs solo del usuario
2. **Filtros**: Incluye filtro por creador
3. **Acceso**: Solo Super Admin vs Licitador/Super Admin
4. **Endpoint**: CombinedQueries vs getLicitacionSegunUsuario

## Consideraciones para Migración

1. **Paginación**: Implementar para grandes volúmenes
2. **Filtros Avanzados**: Más opciones (estado, fecha, formato)
3. **Exportación**: Excel/PDF de todas las licitaciones
4. **Estadísticas**: Dashboard con métricas generales
5. **Búsqueda Full-Text**: Buscar en todos los campos
6. **Acciones en Lote**: Eliminar/modificar múltiples
7. **Vista Previa**: Quick view sin abrir modal
8. **Ordenamiento**: Por múltiples columnas
9. **Favoritos**: Marcar licitaciones importantes
10. **Notas**: Agregar notas administrativas

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
