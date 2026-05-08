# Módulo: GestionNovedades (Gestión de Novedades)

## Descripción General
Módulo administrativo para crear, editar y eliminar novedades del sistema. Solo accesible para Super Administradores.

## Ubicación
`src/views/private/GestionNovedades.jsx`

## Tecnologías y Librerías Utilizadas

### Dependencias Principales
- **React** (v18+): Hooks (useEffect, useState, useRef)
- **React Router**: useNavigate
- **Mantine UI**: ActionIcon, ScrollArea, Box, Badge, Title, createStyles, rem
- **Ant Design**: Popconfirm, Space, message, Table, Button, Image
- **Tabler Icons**: IconTrash, IconPencil
- **Axios**: axiosInstance

## Estructura del Componente

### Estado del Componente

```javascript
const [loadingScreenC, setLoadingScreenC] = useState(false)
const [data, setData] = useState([])
const childRef = useRef(null) // Referencia a ModalCUNovedad
```

### Columnas de la Tabla

1. **Titular**: Título de la novedad
2. **Descripción**: Primeros 50 caracteres + "..."
3. **Imagen**: Preview de imagen 120x120px o "Sin foto"
4. **Acciones**: Editar y Eliminar

## Funcionalidades Principales

### 1. Carga de Novedades

```javascript
const getNovedades = async () => {
    setLoadingScreenC(true)
    await axiosInstance.get("/api/getNovedades")
        .then((response) => {
            setData(response.data.reverse()) // Más recientes primero
        })
        .catch((error) => {
            navigate(ERROR404)
        })
        .finally(() => {
            setLoadingScreenC(false)
        })
}
```

### 2. Eliminación de Novedades

```javascript
const deleteNovedad = async (id) => {
    message.loading("La novedad se esta eliminando...")
    await axiosInstance.post("/api/deleteNovedad/" + id)
        .then((response) => {
            message.success(`La novedad se ha eliminado correctamente.`)
            getNovedades()
        })
        .catch((error) => {
            console.log(error)
        })
}
```

**Características**:
- Confirmación mediante Popconfirm
- Mensajes de feedback
- Recarga automática de datos

### 3. Renderizado de Imagen

```javascript
{
    title: "Imagen",
    dataIndex: "file_foto",
    key: "file_foto",
    render: (text) =>
        text === "null" ? (
            <p>Sin foto</p>
        ) : (
            <Image
                width={120}
                height={120}
                style={{ objectFit: "cover" }}
                src={BASE_URL + text}
            />
        ),
}
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

- **ModalCUNovedad**: Crear/Editar novedades

## API Endpoints

### GET
- `/api/getNovedades`: Obtiene todas las novedades

### POST
- `/api/deleteNovedad/:id`: Elimina una novedad

## Estructura de Datos

```javascript
{
    id: number,
    titular: string,
    descripcion: string,
    file_foto: string | "null", // Ruta al archivo
    created_at: string,
    updated_at: string
}
```

## Consideraciones para Migración

1. **Imágenes**: Implementar lazy loading y optimización
2. **Preview**: Modal de vista previa de imagen
3. **Paginación**: Para grandes cantidades de novedades
4. **Búsqueda**: Filtro por titular o descripción
5. **Ordenamiento**: Por fecha, título, etc.
6. **Estados vacíos**: Mensaje cuando no hay novedades
7. **Upload**: Drag & drop para imágenes
8. **Validación**: Tamaño y formato de imágenes
9. **Soft Delete**: Considerar eliminación lógica
10. **Historial**: Auditoría de cambios

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
