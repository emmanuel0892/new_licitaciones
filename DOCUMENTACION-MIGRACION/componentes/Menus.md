# Componente: Menus

## Descripción General
Componente que renderiza el menú de navegación del sidebar según el rol del usuario autenticado. Cada rol tiene su propio conjunto de opciones de menú.

## Ubicación
`src/components/navegation/Menus.jsx`

## Tipo de Componente
**Componente Funcional** con props

## Props

```typescript
interface MenusProps {
    onClose: () => void           // Callback para cerrar sidebar en móvil
    userLogged: string            // Nombre completo del usuario
    userEmail: string             // Email del usuario
    userAvatar: string            // Iniciales del usuario
    cuentaUsuario: string         // Tipo de cuenta/rol
    departamento: string          // Departamento del usuario
}
```

## Estructura de Menús por Rol

### 1. Super Admin
```javascript
const dataSuperAdmin = [
    {
        label: "Novedades",
        icon: IconInfoCircle,
        link: NOVEDADES,
    },
    {
        label: "Bandeja de entrada",
        icon: IconMail,
        link: BANDEJADEENTRADA,
    },
    {
        label: "Licitación",
        icon: IconFilePlus,
        links: [
            { label: "Crear Licitación", link: CREARLICITACION },
            { label: "Mis Licitaciones", link: MISLICITACIONES },
            { label: "Todas Las Licitaciones", link: TODASLICITACIONES },
        ],
    },
    {
        label: "Formato Bases",
        icon: IconFolderOpen,
        link: FORMATOBASES,
    },
    {
        label: "Gestion Novedades",
        icon: IconInfoSquare,
        link: GESTIONNOVEDADES,
    },
    {
        label: "Usuarios-Admin",
        icon: IconUsers,
        link: USUARIOS,
    },
]
```

**Características**:
- Acceso completo a todas las funcionalidades
- Incluye gestión de usuarios
- Gestión de novedades
- Todas las licitaciones del sistema

### 2. Licitador
```javascript
const dataLicitador = [
    {
        label: "Novedades",
        icon: IconInfoCircle,
        link: NOVEDADES,
    },
    {
        label: "Bandeja de entrada",
        icon: IconMail,
        link: BANDEJADEENTRADA,
    },
    {
        label: "Licitación",
        icon: IconFilePlus,
        links: [
            { label: "Crear Licitación", link: CREARLICITACION },
            { label: "Mis Licitaciones", link: MISLICITACIONES },
        ],
    },
    {
        label: "Formato Bases",
        icon: IconFolderOpen,
        link: FORMATOBASES,
    },
]
```

**Características**:
- Puede crear licitaciones
- Ve solo sus licitaciones
- Acceso a bandeja de entrada
- Consulta formatos de bases

### 3. Secretario Jurídico / Presupuesto / Subdireccion Administrativa
```javascript
const dataJuridico = [
    {
        label: "Novedades",
        icon: IconInfoCircle,
        link: NOVEDADES,
    },
    {
        label: "Bandeja de entrada",
        icon: IconMail,
        link: BANDEJADEENTRADA,
    },
    {
        label: "Formato Bases",
        icon: IconFolderOpen,
        link: FORMATOBASES,
    },
]
```

**Características**:
- Enfocado en revisión/aprobación
- Bandeja de entrada filtrada por turno
- Consulta de bases
- No crea licitaciones

### 4. Secretaria Abastecimiento
```javascript
const dataSecretariaAbastecimiento = [
    {
        label: "Novedades",
        icon: IconInfoCircle,
        link: NOVEDADES,
    },
    {
        label: "Requerimiento Abastecimiento",
        icon: IconMail,
        link: REQUERIMIENTOABASTECIMIENTO,
    },
    {
        label: "PAC",
        icon: IconReportMoney,
        link: ADMINPAC,
    },
    {
        label: "Consolidado PAC",
        icon: IconDiscountCheck,
        link: CONSOLIDADOPAC,
    },
]
```

**Características**:
- Gestión de requerimientos
- Administración de PAC
- Vista consolidada
- No accede a licitaciones

## Renderizado del Menú

```javascript
export default function Menus(props) {
    const { classes } = useStyles()
    
    // Renderizar links según rol
    const linksSuperAdmin = dataSuperAdmin.map((item) => (
        <LinksGroup {...item} key={item.label} onClose={props.onClose} />
    ))
    
    const linksJuridico = dataJuridico.map((item) => (
        <LinksGroup {...item} key={item.label} onClose={props.onClose} />
    ))
    
    const linksLicitador = dataLicitador.map((item) => (
        <LinksGroup {...item} key={item.label} onClose={props.onClose} />
    ))
    
    const linksSecretariaAbastecimiento = dataSecretariaAbastecimiento.map((item) => (
        <LinksGroup {...item} key={item.label} onClose={props.onClose} />
    ))
    
    return (
        <Navbar width={{ sm: 300 }} p="md" className={classes.navbar}>
            <Navbar.Section grow className={classes.links} component={ScrollArea}>
                <div className={classes.linksInner}>
                    {props.cuentaUsuario === "Super Admin"
                        ? linksSuperAdmin
                        : props.cuentaUsuario === "Secretario Juridico" || 
                          props.cuentaUsuario === "Presupuesto" || 
                          props.cuentaUsuario === "Subdireccion Administrativa"
                        ? linksJuridico
                        : props.cuentaUsuario === "Licitador"
                        ? linksLicitador
                        : props.cuentaUsuario === "Secretaria Abastecimiento"
                        ? linksSecretariaAbastecimiento
                        : ""}
                </div>
            </Navbar.Section>
            
            <Navbar.Section className={classes.footer}>
                <UserButton 
                    image={props.userAvatar} 
                    departamento={props.departamento}
                    name={props.userLogged} 
                    tipo_cuenta={props.cuentaUsuario} 
                />
            </Navbar.Section>
        </Navbar>
    )
}
```

## Estilos

```javascript
const useStyles = createStyles((theme) => ({
    navbar: {
        backgroundColor: theme.colorScheme === "dark" 
            ? theme.colors.dark[6] 
            : theme.white,
        paddingBottom: 0,
    },
    
    links: {
        marginLeft: `calc(${theme.spacing.md} * -1)`,
        marginRight: `calc(${theme.spacing.md} * -1)`,
    },
    
    linksInner: {
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.xl,
    },
    
    footer: {
        marginLeft: `calc(${theme.spacing.md} * -1)`,
        marginRight: `calc(${theme.spacing.md} * -1)`,
        borderTop: `${rem(1)} solid ${
            theme.colorScheme === "dark" 
                ? theme.colors.dark[4] 
                : theme.colors.gray[3]
        }`,
    },
}))
```

## Iconografía

| Icono | Uso |
|-------|-----|
| IconInfoCircle | Novedades |
| IconMail | Bandeja de entrada / Requerimientos |
| IconFilePlus | Licitación |
| IconFolderOpen | Formato Bases |
| IconInfoSquare | Gestión Novedades |
| IconUsers | Usuarios Admin |
| IconReportMoney | PAC |
| IconDiscountCheck | Consolidado PAC |

## Rutas Importadas

```javascript
import {
    USUARIOS,
    CREARLICITACION,
    MISLICITACIONES,
    BANDEJADEENTRADA,
    FORMATOBASES,
    TODASLICITACIONES,
    NOVEDADES,
    GESTIONNOVEDADES,
    REQUERIMIENTOABASTECIMIENTO,
    ADMINPAC,
    CONSOLIDADOPAC,
} from "../../routes/Paths"
```

## Componentes Utilizados

- **LinksGroup**: Componente que renderiza cada item del menú
- **UserButton**: Botón de usuario en el footer
- **Navbar**: Componente de Mantine
- **ScrollArea**: Para scroll del contenido

## Lógica de Selección de Menú

```javascript
// Precedencia:
1. Super Admin → linksSuperAdmin
2. Secretario Juridico, Presupuesto, Subdireccion Administrativa → linksJuridico
3. Licitador → linksLicitador
4. Secretaria Abastecimiento → linksSecretariaAbastecimiento
5. Otros → "" (vacío)
```

## Consideraciones para Migración

1. **Configuración Dinámica**: Cargar menús desde configuración/API
2. **Permisos Granulares**: Sistema de permisos más detallado
3. **Iconos Personalizables**: Permitir configurar iconos por rol
4. **Menús Contextuales**: Menús que cambian según contexto
5. **Favoritos**: Permitir marcar accesos frecuentes
6. **Búsqueda**: Búsqueda de opciones de menú
7. **Atajos de Teclado**: Shortcuts para navegación rápida
8. **Notificaciones**: Badges con contadores
9. **Orden Personalizable**: Permitir reordenar opciones
10. **Multi-nivel**: Soporte para más niveles de anidación

## Dependencias Críticas

```json
{
  "@mantine/core": "^5.0.0",
  "@tabler/icons-react": "^2.0.0",
  "react": "^18.0.0"
}
```

## Uso

```javascript
// En Sidebar.jsx
<Menus
    onClose={() => setOpened((o) => !o)}
    userLogged={nombreUsuario}
    userEmail={nombreCorreo}
    userAvatar={nombreAvatar}
    cuentaUsuario={cuentaUsuario}
    departamento={departamentoUsuario}
/>
```

## Testing Sugerido

```javascript
describe('Menus', () => {
    it('muestra menú de Super Admin', () => {
        render(<Menus cuentaUsuario="Super Admin" />)
        expect(screen.getByText('Usuarios-Admin')).toBeInTheDocument()
    })
    
    it('muestra menú de Licitador sin admin', () => {
        render(<Menus cuentaUsuario="Licitador" />)
        expect(screen.queryByText('Usuarios-Admin')).not.toBeInTheDocument()
        expect(screen.getByText('Crear Licitación')).toBeInTheDocument()
    })
})
```
