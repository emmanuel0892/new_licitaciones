# Componente: Categoria

## Descripción General
Componente reutilizable para mostrar y gestionar bases de licitación organizadas por categoría (Medicamentos, Insumos, Servicios, Otros Formatos).

## Ubicación
`src/components/ui/FormatoBases/Categoria.jsx`

## Tipo de Componente
**Componente Funcional** (no usa forwardRef)

## Props

```typescript
interface CategoriaProps {
    data: Array<{
        id: number
        titulo: string
        documento: string
        tipo_base: string
        created_at: string
        updated_at: string
    }>
    nombre_categoria: string
}
```

## Estructura del Componente

### Estado y Refs
```javascript
// Notificaciones
const [api, contextHolder] = notification.useNotification()

// Modal de edición
const childRef = useRef(null)

// Usuario actual
const { userLogged } = useAuthContext()
```

## Funcionalidades Principales

### 1. Notificación de Descarga

```javascript
const openNotification = (placement) => {
    api.success({
        message: `Documento descargado con exito`,
        description: "Ya puedes ver el documento",
        placement,
    })
}
```

### 2. Eliminación de Base

```javascript
const deleteBase = async (id) => {
    message.loading("La base se esta eliminando...")
    
    await axiosInstance.post("/api/deleteBase/" + id)
        .then((response) => {
            message.success(`La base se ha eliminado correctamente.`)
            setTimeout(() => {
                location.reload() // Recarga página después de eliminar
            }, 1000)
        })
        .catch((error) => {
            console.log(error)
        })
}
```

## Renderizado

### Estructura HTML
```javascript
return (
    <>
        {contextHolder}
        <ModalCUFormatoBases ref={childRef} />
        
        <div className="categorias">
            <div className="contenedor-text">
                <Text className="titular-categoria">{nombre_categoria}</Text>
            </div>
            
            <div className="table">
                {data.map((item) => (
                    <div className="fila" key={item.id}>
                        <Text style={{ fontSize: "15px" }}>{item.titulo}</Text>
                        
                        <div className="options">
                            {/* Iconos de acción */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </>
)
```

### Acciones por Item

#### 1. Descargar (Todos los usuarios)
```javascript
<a
    href={BASE_URL + item.documento}
    target="blank"
    onClick={() => openNotification("topLeft")}
>
    <IconDownload style={{ color: "blue" }} width={22} />
</a>
```

#### 2. Editar (Solo Super Admin)
```javascript
{userLogged.type_account === "Super Admin" ? (
    <ActionIcon
        onClick={() => childRef.current.childFunction(item.id, "Edit")}
    >
        <IconPencil width={22} style={{ color: "#9EBB3C" }} />
    </ActionIcon>
) : ""}
```

#### 3. Eliminar (Solo Super Admin)
```javascript
{userLogged.type_account === "Super Admin" ? (
    <Popconfirm
        title="¿Estas segur@ que deseas eliminar esta base?"
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ style: { backgroundColor: "red" } }}
        onConfirm={() => deleteBase(item.id, "active")}
    >
        <ActionIcon>
            <IconX style={{ color: "red" }} />
        </ActionIcon>
    </Popconfirm>
) : ""}
```

## Control de Acceso

### Permisos por Acción
- **Descargar**: Todos los usuarios autenticados
- **Editar**: Solo Super Admin
- **Eliminar**: Solo Super Admin

## Estilos CSS

```css
/* ../../styles/styles-formato-bases.css */

.categorias {
    margin-bottom: 30px;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.contenedor-text {
    margin-bottom: 15px;
    border-bottom: 2px solid #9EBB3C;
    padding-bottom: 10px;
}

.titular-categoria {
    font-size: 18px;
    font-weight: 600;
    color: #333;
}

.table {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.fila {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f9f9f9;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
    transition: all 0.2s;
}

.fila:hover {
    background: #f0f0f0;
    border-color: #9EBB3C;
}

.options {
    display: flex;
    gap: 8px;
    align-items: center;
}
```

## Modales Integrados

- **ModalCUFormatoBases**: Para editar la base seleccionada

## API Endpoints

### POST
- `/api/deleteBase/:id`: Elimina base de datos (eliminación física)

## Ejemplo de Uso

```javascript
import Categoria from "./components/ui/FormatoBases/Categoria"

function FormatoBases() {
    const [dataMedicamentos, setDataMedicamentos] = useState([])
    const [dataInsumos, setDataInsumos] = useState([])
    
    return (
        <div>
            <Categoria 
                data={dataMedicamentos} 
                nombre_categoria="Medicamentos" 
            />
            <Categoria 
                data={dataInsumos} 
                nombre_categoria="Insumos" 
            />
        </div>
    )
}
```

## Flujo de Interacción

### Descargar Documento
1. Usuario click en ícono download
2. Se abre documento en nueva pestaña
3. Se muestra notificación de éxito
4. Documento se descarga/visualiza según navegador

### Editar Base
1. Super Admin click en ícono editar
2. Se abre ModalCUFormatoBases con datos cargados
3. Usuario modifica y guarda
4. Modal se cierra
5. Se recarga la vista

### Eliminar Base
1. Super Admin click en ícono eliminar (X rojo)
2. Aparece Popconfirm de confirmación
3. Si confirma, se elimina
4. Mensaje de éxito
5. Página se recarga después de 1 segundo

## Características de Diseño

### Responsive
El componente se adapta a diferentes tamaños de pantalla mediante CSS flexible.

### Hover States
- Fila completa cambia de color al hover
- Borde cambia a color del tema (#9EBB3C)

### Iconografía
- **IconDownload** (azul): Descarga
- **IconPencil** (verde #9EBB3C): Editar
- **IconX** (rojo): Eliminar

## Consideraciones para Migración

1. **Confirmación Mejorada**: Modal más descriptivo que Popconfirm
2. **Soft Delete**: Implementar eliminación lógica en lugar de física
3. **Drag & Drop**: Reordenar bases por prioridad
4. **Búsqueda**: Filtrar bases dentro de categoría
5. **Vista Previa**: Preview de PDF sin descargar
6. **Historial**: Ver versiones anteriores
7. **Metadatos**: Mostrar fecha de creación, autor
8. **Tags**: Agregar etiquetas a las bases
9. **Favoritos**: Marcar bases más usadas
10. **Estadísticas**: Contador de descargas
11. **Compartir**: Generar link compartible
12. **Comentarios**: Permitir notas sobre bases

## Mejoras Sugeridas

### 1. Información Adicional
```javascript
<div className="fila">
    <div className="info-principal">
        <Text style={{ fontSize: "15px", fontWeight: "600" }}>
            {item.titulo}
        </Text>
        <Text style={{ fontSize: "12px", color: "#666" }}>
            Actualizado: {fecha_formateada(item.updated_at)}
        </Text>
    </div>
    <div className="options">
        {/* Acciones */}
    </div>
</div>
```

### 2. Estados Vacíos
```javascript
{data.length === 0 ? (
    <Empty 
        description={`No hay bases de ${nombre_categoria}`}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
) : (
    data.map((item) => (/* Renderizado normal */))
)}
```

### 3. Contador de Items
```javascript
<div className="contenedor-text">
    <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Text className="titular-categoria">{nombre_categoria}</Text>
        <Badge count={data.length} style={{ backgroundColor: "#9EBB3C" }} />
    </div>
</div>
```

### 4. Tooltips
```javascript
<Tooltip title="Descargar documento">
    <a href={BASE_URL + item.documento} target="blank">
        <IconDownload style={{ color: "blue" }} width={22} />
    </a>
</Tooltip>
```

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

## Relación con Otros Módulos

- **FormatoBases**: Vista padre que usa este componente
- **ModalCUFormatoBases**: Modal para CRUD de bases
- **BASE_URL**: Constante para construir rutas de documentos

## Patrón de Diseño

Este componente sigue el patrón de **Componente de Presentación Reutilizable**:
- Recibe datos por props
- No maneja estado global
- Renderiza de forma consistente
- Puede ser usado múltiples veces en la misma vista
- Delega acciones complejas a modales

## Testing Sugerido

```javascript
describe('Categoria', () => {
    it('renderiza el título de la categoría', () => {
        render(<Categoria data={[]} nombre_categoria="Test" />)
        expect(screen.getByText('Test')).toBeInTheDocument()
    })
    
    it('muestra todas las bases', () => {
        const mockData = [
            { id: 1, titulo: "Base 1", documento: "/doc1.pdf" },
            { id: 2, titulo: "Base 2", documento: "/doc2.pdf" }
        ]
        render(<Categoria data={mockData} nombre_categoria="Test" />)
        expect(screen.getByText('Base 1')).toBeInTheDocument()
        expect(screen.getByText('Base 2')).toBeInTheDocument()
    })
    
    it('solo Super Admin ve botones de edición', () => {
        const mockUser = { type_account: 'Licitador' }
        render(<Categoria data={mockData} nombre_categoria="Test" />)
        expect(screen.queryByTitle('Editar')).not.toBeInTheDocument()
    })
})
```
