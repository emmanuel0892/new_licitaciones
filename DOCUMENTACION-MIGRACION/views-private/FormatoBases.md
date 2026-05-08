# Módulo: FormatoBases (Formato Bases)

## Descripción General
Módulo para visualizar y gestionar formatos de bases de licitación organizados por categorías. Permite agregar, editar y eliminar bases según categoría (Medicamentos, Insumos, Servicios, Otros Formatos).

## Ubicación
`src/views/private/FormatoBases.jsx`

## Tecnologías y Librerías Utilizadas

### Dependencias Principales
- **React** (v18+): Hooks (useEffect, useState, useRef)
- **React Router**: useNavigate
- **Mantine UI**: ActionIcon, ScrollArea, Box, Badge, Title, Text, createStyles, rem
- **Ant Design**: Popconfirm, Space, message, Table, Button, Input
- **Tabler Icons**: IconTrash, IconPencil
- **Axios**: axiosInstance

### Estilos
- CSS externo: `../../styles/styles-formato-bases.css`

## Estructura del Componente

### Estado del Componente

```javascript
// Loading
const [loadingScreenC, setLoadingScreenC] = useState(false)

// Datos por categoría
const [dataMedicamentos, setDataMedicamentos] = useState([])
const [dataInsumos, setDataInsumos] = useState([])
const [dataServicios, setDataServicios] = useState([])
const [dataOtrosFormatos, setDataOtrosFormatos] = useState([])

// Referencia a modal
const childRef = useRef(null)

// Filtro (definido pero no implementado en UI)
const [numeroLicitacion, setNumeroLicitacion] = useState("")
```

## Categorías de Bases

### 1. Medicamentos
Formatos de bases para licitaciones de medicamentos

### 2. Insumos
Formatos de bases para licitaciones de insumos médicos

### 3. Servicios
Formatos de bases para licitaciones de servicios

### 4. Otros Formatos
Formatos de bases para otros tipos de licitaciones

## Funcionalidades Principales

### 1. Carga de Datos

```javascript
const getBases = async () => {
    setLoadingScreenC(true)
    setNumeroLicitacion("")
    
    await axiosInstance.get("/api/CombinedQuerysFormatoBases")
        .then((response) => {
            setDataMedicamentos(response.data["Consulta1getBasesMedicamentos"]["original"])
            setDataInsumos(response.data["Consulta2getBasesInsumos"]["original"])
            setDataServicios(response.data["Consulta3getBasesServicios"]["original"])
            setDataOtrosFormatos(response.data["Consulta4getBasesOtrosFormatos"]["original"])
        })
        .catch((error) => {
            console.log(error)
        })
        .finally(() => {
            setLoadingScreenC(false)
        })
}
```

**Características**:
- Una sola llamada API que retorna 4 consultas combinadas
- Separación automática por tipo de base
- Limpieza de filtros al recargar

### 2. Componente Categoria

El módulo utiliza el componente reutilizable `Categoria` para renderizar cada categoría:

```javascript
<Categoria
    data={dataMedicamentos}
    nombre_categoria={"Medicamentos"}
/>
<Categoria 
    data={dataInsumos} 
    nombre_categoria={"Insumos"} 
/>
<Categoria 
    data={dataServicios} 
    nombre_categoria={"Servicios"} 
/>
<Categoria
    data={dataOtrosFormatos}
    nombre_categoria={"Otros Formatos"}
/>
```

## Control de Acceso

```javascript
{userLogged ? userLogged.type_account === "Super Admin" ? (
    <Button
        type="primary"
        onClick={() => childRef.current.childFunction(null, "Save")}
    >
        Agregar Base
    </Button>
) : "" : ''}
```

**Permisos**:
- **Todos los usuarios autenticados**: Pueden ver las bases
- **Solo Super Admin**: Puede agregar nuevas bases

## Modales Integrados

- **ModalCUFormatoBases**: Modal para crear/editar formatos de bases

## Layout del Componente

```javascript
<div className={classes.wrapper} style={{ display: "block" }}>
    <div style={{
        marginBottom: "25px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    }}>
        <Title>Formato Bases</Title>
        {/* Botón Agregar Base (solo Super Admin) */}
    </div>
    
    <ModalCUFormatoBases ref={childRef} reloadTable={getBases} />
    
    <div className="pantalla-flex">
        {/* 4 componentes Categoria */}
    </div>
</div>
```

## Estilos Personalizados

```javascript
const useStyles = createStyles((theme) => ({
    wrapper: {
        display: "flex",
        borderRadius: theme.radius.md,
        backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.white,
        border: `${rem(1)} solid ${theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[3]}`,
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
        padding: theme.spacing.xl,
        paddingLeft: `calc(${theme.spacing.xl} * 2)`,
        
        "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: rem(6),
            backgroundImage: theme.fn.linearGradient(0, theme.colors.cyan[6], theme.colors.lime[6]),
        },
    },
}))
```

## API Endpoints

### GET
- `/api/CombinedQuerysFormatoBases`: Retorna todas las bases organizadas por categoría
  - Respuesta:
    ```javascript
    {
        "Consulta1getBasesMedicamentos": { "original": [...] },
        "Consulta2getBasesInsumos": { "original": [...] },
        "Consulta3getBasesServicios": { "original": [...] },
        "Consulta4getBasesOtrosFormatos": { "original": [...] }
    }
    ```

## Estructura de Datos

### Item de Base
```javascript
{
    id: number,
    titulo: string,
    tipo_base: "Medicamentos" | "Insumos" | "Servicios" | "Otros Formatos",
    documento: string, // Ruta al archivo
    created_at: string,
    updated_at: string
}
```

## Componente Categoria (Detalle)

Ver documentación separada en: `FormatoBases/Categoria.md`

**Funcionalidades del componente hijo**:
- Descarga de documentos
- Edición (Solo Super Admin)
- Eliminación con confirmación (Solo Super Admin)
- Notificaciones de descarga

## Consideraciones para Migración

1. **Organización por Categorías**: Mantener estructura visual clara
2. **Componente Reutilizable**: El patrón de `Categoria` es bueno, mantenerlo
3. **Consultas Combinadas**: Considerar si es mejor separar o mantener combinado
4. **Permisos**: Centralizar lógica de autorización
5. **Grid/Flex Layout**: Implementar con CSS Grid o Flexbox moderno
6. **Loading States**: Skeleton loaders por categoría
7. **Descarga de Archivos**: Implementar preview antes de descargar
8. **Búsqueda**: Implementar filtro por nombre/categoría
9. **Drag & Drop**: Considerar para reorganizar categorías
10. **Responsive**: Asegurar diseño móvil adecuado

## Mejoras Sugeridas

### 1. Filtro de Búsqueda
```javascript
// El estado está definido pero no se usa en la UI
const [numeroLicitacion, setNumeroLicitacion] = useState("")

// Implementar:
<Input
    placeholder="Buscar base..."
    value={numeroLicitacion}
    onChange={(e) => setNumeroLicitacion(e.target.value)}
/>
```

### 2. Estados Vacíos
```javascript
{dataMedicamentos.length === 0 && (
    <Empty description="No hay bases de medicamentos" />
)}
```

### 3. Contadores
```javascript
<Title>Medicamentos ({dataMedicamentos.length})</Title>
```

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

## Flujo de Trabajo

1. Usuario accede al módulo
2. Sistema carga todas las bases en una sola llamada API
3. Datos se distribuyen en 4 estados según categoría
4. Cada categoría se renderiza con componente `Categoria`
5. Super Admin puede agregar nuevas bases mediante modal
6. Al guardar/editar, se recarga toda la información

## Relación con Otros Módulos

- **ModalCUFormatoBases**: Gestión CRUD de bases
- **Categoria**: Visualización y acciones por categoría
- **BandejaDeEntrada**: Las bases se usan en las licitaciones
- **CrearLicitacion**: Selección de formato al crear licitación
