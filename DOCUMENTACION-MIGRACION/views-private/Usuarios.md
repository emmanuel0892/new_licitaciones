# Módulo: Usuarios

## Descripción General
Módulo de administración de usuarios del sistema. Permite crear, editar, activar y desactivar cuentas de usuario.

## Ubicación
`src/views/private/Usuarios.jsx`

## Tecnologías y Librerías Utilizadas

### Dependencias Principales
- **React** (v18+): Hooks (useEffect, useState, useRef)
- **React Router**: useNavigate
- **Mantine UI**: ActionIcon, ScrollArea, Box, Badge, Title, rem, createStyles
- **Ant Design**: Popconfirm, Space, message, Table, Button
- **Tabler Icons**: IconX, IconPencil, IconCheck
- **Axios**: axiosInstance

## Estructura del Componente

### Estado
```javascript
const [loadingScreenC, setLoadingScreenC] = useState(false)
const [data, setData] = useState([])
const childRef = useRef(null) // ModalCUUsuarios
```

### Columnas de la Tabla

1. **Nombre**
2. **Apellido**
3. **Rut**
4. **Correo**
5. **Departamento**
6. **Tipo de Cuenta**: Rol del usuario
7. **Creación**: Fecha formateada
8. **Activo**: Badge visual (Activo/No Activo)
9. **Acciones**: Editar, Activar/Desactivar

## Funcionalidades Principales

### 1. Carga de Usuarios

```javascript
const getUsersCec = async () => {
    setLoadingScreenC(true)
    await axiosInstance.get("/api/getUsers")
        .then((response) => {
            setData(response.data)
        })
        .catch((error) => {
            navigate(ERROR404)
        })
        .finally(() => {
            setLoadingScreenC(false)
        })
}
```

### 2. Cambio de Estado de Usuario

```javascript
const changeStatusAccountUser = async (id) => {
    message.loading("El usuario está cambiando de estado...")
    await axiosInstance.put("/api/changeStatusUser/" + id)
        .then((response) => {
            message.success(`El estado de usuario se ha cambiado correctamente.`)
            getUsersCec()
        })
        .catch((error) => {
            message.error(`El estado de usuario no se ha podido cambiar.`)
        })
}
```

### 3. Badge de Estado

```javascript
{
    title: "Activo",
    dataIndex: "active",
    key: "active",
    render: (text) => {
        if (text === "active") {
            return (
                <Badge
                    variant="gradient"
                    gradient={{ from: "teal", to: "lime", deg: 105 }}
                >
                    Activo
                </Badge>
            )
        } else {
            return (
                <Badge variant="gradient" gradient={{ from: "orange", to: "red" }}>
                    No Activo
                </Badge>
            )
        }
    },
}
```

### 4. Acciones Condicionales

```javascript
{
    title: "Acciones",
    dataIndex: "id",
    key: "id",
    render: (id, record) => (
        <Space size="middle">
            <ActionIcon onClick={() => childRef.current.childFunction(id, "Edit")}>
                <IconPencil style={{ color: COLORS.Primary }} />
            </ActionIcon>
            
            {record.active !== "active" ? (
                <Popconfirm
                    title="¿Estas segur@ que deseas activar este usuario?"
                    okText="Activar"
                    cancelText="Cancelar"
                    okButtonProps={{ style: { backgroundColor: "green" } }}
                    onConfirm={() => changeStatusAccountUser(id, "active")}
                >
                    <ActionIcon>
                        <IconCheck style={{ color: "red" }} />
                    </ActionIcon>
                </Popconfirm>
            ) : (
                <Popconfirm
                    title="¿Estas segur@ que deseas deshabilitar este usuario?"
                    okText="Deshabilitar"
                    cancelText="Cancelar"
                    okButtonProps={{ style: { backgroundColor: "red" } }}
                    onConfirm={() => changeStatusAccountUser(id, "desactive")}
                >
                    <ActionIcon>
                        <IconX style={{ color: "red" }} />
                    </ActionIcon>
                </Popconfirm>
            )}
        </Space>
    ),
}
```

## Control de Acceso

```javascript
if (userLogged) {
    if (userLogged.type_account === "Super Admin") {
        // Acceso permitido
    } else {
        window.location.href = "/"
    }
}
```

**Roles con Acceso**:
- Solo Super Admin

## Modales Integrados

- **ModalCUUsuarios**: Crear/Editar usuarios con validaciones

## Tipos de Cuenta

Según el código del sistema:
- **Secretaria Abastecimiento**
- **Licitador**
- **Secretario Juridico**
- **Presupuesto**
- **Subdireccion Administrativa**
- **Super Admin**

## Departamentos

- RR.HH
- Contabilidad
- Abastecimiento
- Juridico

## Layout del Componente

```javascript
<div className={classes.wrapper}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Title style={{marginBottom:'30px'}}>Usuarios</Title>
        <Button
            type="primary"
            onClick={() => childRef.current.childFunction(null, "Save")}
        >
            Agregar usuario
        </Button>
    </div>
    
    <ModalCUUsuarios ref={childRef} reloadTable={getUsersCec} />
    
    <ScrollArea>
        <Box>
            <Table dataSource={data} columns={columns} scroll={{ x: 400 }} />
        </Box>
    </ScrollArea>
</div>
```

## API Endpoints

### GET
- `/api/getUsers`: Lista todos los usuarios

### PUT
- `/api/changeStatusUser/:id`: Activa/Desactiva usuario

## Seguridad

### Cambio de Estado
- No elimina físicamente al usuario
- Toggle entre estados 'active' y 'desactive'
- Los usuarios desactivados no pueden iniciar sesión

### Edición
- El RUT y email no son editables (campos disabled en modal)
- Solo nombre, apellido, tipo de cuenta y departamento son editables

## Consideraciones para Migración

1. **Búsqueda**: Implementar filtro por nombre, rol, departamento
2. **Ordenamiento**: Por columnas
3. **Paginación**: Para muchos usuarios
4. **Filtros Avanzados**: Estado, rol, departamento
5. **Exportación**: Lista de usuarios a Excel
6. **Auditoría**: Log de cambios de usuarios
7. **Permisos Granulares**: Sistema de permisos más detallado
8. **Cambio de Contraseña**: Funcionalidad de reset
9. **Últimos Accesos**: Mostrar última sesión
10. **Sesiones Activas**: Ver sesiones abiertas
11. **2FA**: Autenticación de dos factores
12. **Notificaciones**: Avisar al usuario de cambios

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "antd": "^5.0.0",
  "@tabler/icons-react": "^2.0.0",
  "axios": "^1.0.0",
  "react-router-dom": "^6.0.0"
}
```

## Estructura de Datos

### Usuario
```javascript
{
    id: number,
    name: string,
    lastname: string,
    rut: string,
    email: string,
    departamento: string,
    type_account: string,
    active: "active" | "desactive",
    created_at: string,
    updated_at: string
}
```
