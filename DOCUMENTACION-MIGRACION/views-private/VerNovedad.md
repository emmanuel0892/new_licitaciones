# Módulo: VerNovedad (Ver Novedad)

## Descripción General
Vista detallada de una novedad específica. Muestra el título, descripción completa e imagen asociada.

## Ubicación
`src/views/private/VerNovedad.jsx`

## Tecnologías y Librerías Utilizadas

### Dependencias Principales
- **React** (v18+): Hooks (useEffect, useState, useRef)
- **React Router**: useParams para obtener ID de la URL
- **Mantine UI**: createStyles, Text, Title, Image, rem
- **Axios**: axiosInstance

## Estructura del Componente

### Estado
```javascript
const [data, setData] = useState([])
const { id } = useParams() // ID que viene por URL
const [loadingScreenC, setLoadingScreenC] = useState(false)
```

## Funcionalidades Principales

### 1. Obtención de Parámetros de Ruta

```javascript
const { id } = useParams() // ID de la novedad desde la URL
// Ejemplo: /novedad/123 -> id = "123"
```

### 2. Carga de Novedad Específica

```javascript
const getNormas = async () => {
    setLoadingScreenC(true)
    await axiosInstance.get("/api/getNovedadesId/" + id)
        .then((response) => {
            setData(response.data)
        })
        .catch((error) => {})
        .finally(() => {
            setLoadingScreenC(false)
        })
}
```

### 3. Renderizado de Contenido

```javascript
<div className={classes.wrapper}>
    <div className={classes.body} style={{ width: "100%" }}>
        <Title className={classes.title} style={{ marginBottom: "30px" }}>
            Novedad - {data.titular}
        </Title>
        
        <Text
            fz="lg"
            align="justify"
            c="dimmed"
            style={{ fontSize: "16px", marginBottom: "5px" }}
        >
            {data.descripcion}
        </Text>
        
        <div style={{
            display: "flex",
            width: "100%",
            justifyContent: "center",
            marginTop: "15px",
        }}>
            {data.file_foto === "null" ? "" : (
                <img
                    style={{
                        display: "flex",
                        height: "260px",
                        objectFit: "cover",
                        justifyContent: "center",
                        marginBottom: "20px",
                    }}
                    src={BASE_URL + data.file_foto}
                    radius="md"
                />
            )}
        </div>
    </div>
</div>
```

## Estilos Personalizados

```javascript
const useStyles = createStyles((theme) => ({
    wrapper: {
        display: "flex",
        alignItems: "center",
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
    
    body: {
        paddingRight: `calc(${theme.spacing.xl} * 4)`,
        
        [theme.fn.smallerThan("sm")]: {
            paddingRight: 0,
            marginTop: theme.spacing.xl,
        },
    },
    
    title: {
        color: theme.colorScheme === "dark" ? theme.white : theme.black,
        fontFamily: `Greycliff CF, ${theme.fontFamily}`,
        lineHeight: 1,
        marginBottom: theme.spacing.md,
    },
}))
```

## Características de Diseño

### Imagen
- **Altura Fija**: 260px
- **Object Fit**: cover (mantiene proporciones)
- **Condición**: Solo se muestra si `file_foto !== "null"`
- **Centrado**: Flex con justify-content center

### Texto
- **Descripción**: Alineada justify, color dimmed, tamaño 16px
- **Título**: Incluye prefijo "Novedad -" + titular

## API Endpoints

### GET
- `/api/getNovedadesId/:id`: Obtiene novedad específica por ID

## Navegación

Usuario llega desde:
```javascript
// Desde módulo Novedades
<Link to={GOTONOVEDADES + item.id}>
    Ver más
</Link>
```

## Loading State

```javascript
if (loadingScreenC) {
    return <LoadingScreen />
}
```

## Manejo de Errores

```javascript
.catch((error) => {})
// No redirige a error 404, simplemente no muestra datos
```

## Estructura de Datos

### Novedad
```javascript
{
    id: number,
    titular: string,
    descripcion: string, // Texto completo
    file_foto: string | "null",
    created_at: string,
    updated_at: string
}
```

## Consideraciones para Migración

1. **Imagen Optimizada**: Lazy loading, blur placeholder
2. **SEO**: Meta tags dinámicos por novedad
3. **Compartir**: Botones de redes sociales
4. **Navegación**: Anterior/Siguiente novedad
5. **Relacionadas**: Sugerencias de novedades similares
6. **Comentarios**: Sistema de comentarios/reacciones
7. **Imprimir**: Función de impresión/PDF
8. **Accesibilidad**: Alt text para imágenes
9. **Fecha**: Mostrar fecha de publicación
10. **Autor**: Mostrar quién publicó
11. **Vistas**: Contador de visualizaciones
12. **Markdown**: Soporte para formato rico en descripción

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "react-router-dom": "^6.0.0",
  "axios": "^1.0.0"
}
```

## Relación con Otros Módulos

- **Novedades**: Lista que linkea a este detalle
- **GestionNovedades**: Administración de contenido
- **BASE_URL**: Constante para rutas de imágenes
