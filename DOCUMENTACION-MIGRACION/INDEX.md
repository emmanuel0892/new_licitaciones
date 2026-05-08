# Índice de Documentación - Sistema HRR Licitaciones

## Propósito de esta Documentación
Documentación técnica detallada de todos los componentes del sistema de gestión de licitaciones del Hospital Regional Rancagua. Esta documentación ha sido creada específicamente para facilitar la migración a otra tecnología, proporcionando:

- Descripción completa del diseño y funcionalidad de cada módulo
- Estructura de datos y API endpoints
- Consideraciones técnicas para la migración
- Dependencias y librerías utilizadas

## Estructura del Proyecto

```
HRR-ADMIN-Front/
├── src/
│   ├── views/private/          # Vistas principales (12 componentes)
│   ├── components/
│   │   ├── ui/modals/          # Modales (12 componentes)
│   │   ├── ui/FormatoBases/    # Componente de categorías (1 componente)
│   │   └── navegation/         # Navegación (4 componentes)
│   ├── helpers/
│   ├── contexts/
│   ├── routes/
│   └── styles/
```

---

## 📁 Views/Private (Vistas Principales)

### 1. [BandejaDeEntrada.md](views-private/BandejaDeEntrada.md)
**Descripción**: Bandeja de entrada principal para gestión de licitaciones
- **Funcionalidades**: Visualización, filtrado, avance, devolución, generación de informes Excel
- **Roles**: Licitador, Secretario Jurídico, Presupuesto, Subdireccion Administrativa, Super Admin
- **API**: `/api/CombinedQuerysUsersLicitacion`, `/api/avanzarLiquidacion`, `/api/getLicitacionSegunFiltro`

### 2. [ConsolidadoPAC.md](views-private/ConsolidadoPAC.md)
**Descripción**: Vista consolidada del Plan Anual de Compras
- **Funcionalidades**: Búsqueda avanzada por columna, filtrado por fecha, expand/collapse, paginación server-side
- **Roles**: Secretaria Abastecimiento, Super Admin
- **API**: `/api/getConsolidado/:date`

### 3. [CrearLicitacion.md](views-private/CrearLicitacion.md)
**Descripción**: Formulario para crear nuevas licitaciones
- **Funcionalidades**: 5 formatos de licitación, timeline visual, validaciones dinámicas, select autocompletable
- **Roles**: Licitador, Super Admin
- **API**: `/api/createLicitacion`, `/api/getRequirentes`

### 4. [FormatoBases.md](views-private/FormatoBases.md)
**Descripción**: Gestión de formatos de bases por categoría
- **Funcionalidades**: 4 categorías (Medicamentos, Insumos, Servicios, Otros), CRUD de bases
- **Roles**: Todos (lectura), Super Admin (escritura)
- **API**: `/api/CombinedQuerysFormatoBases`

### 5. [GestionNovedades.md](views-private/GestionNovedades.md)
**Descripción**: Administración de novedades del sistema
- **Funcionalidades**: Crear, editar, eliminar novedades con imágenes
- **Roles**: Super Admin
- **API**: `/api/getNovedades`, `/api/deleteNovedad/:id`

### 6. [MisLicitaciones.md](views-private/MisLicitaciones.md)
**Descripción**: Licitaciones creadas por el usuario
- **Funcionalidades**: Vista personal, búsqueda, edición, eliminación
- **Roles**: Licitador, Super Admin (solo sus propias licitaciones)
- **API**: `/api/getLicitacionSegunUsuario/:userId`

### 7. [Novedades.md](views-private/Novedades.md)
**Descripción**: Vista pública de novedades
- **Funcionalidades**: Listado de noticias, navegación a detalle
- **Roles**: Todos los usuarios autenticados
- **API**: `/api/getNovedades`

### 8. [PAC.md](views-private/PAC.md)
**Descripción**: Plan Anual de Compras por año
- **Funcionalidades**: Filtrado por año, búsqueda por columna, visualización mensual
- **Roles**: Secretaria Abastecimiento, Super Admin
- **API**: `/api/getPacs/:year`

### 9. [RequerimientoAbastecimiento.md](views-private/RequerimientoAbastecimiento.md)
**Descripción**: Gestión de requerimientos de abastecimiento
- **Funcionalidades**: CRUD de requerimientos, gestión de productos, historial con timeline
- **Roles**: Secretaria Abastecimiento, Super Admin
- **API**: `/api/getRequerimientosAbastecimiento`

### 10. [TodasLicitaciones.md](views-private/TodasLicitaciones.md)
**Descripción**: Vista global de todas las licitaciones
- **Funcionalidades**: Administración completa, filtros múltiples
- **Roles**: Super Admin
- **API**: `/api/CombinedQuerysUsersLicitacion`

### 11. [Usuarios.md](views-private/Usuarios.md)
**Descripción**: Administración de usuarios del sistema
- **Funcionalidades**: CRUD de usuarios, activar/desactivar cuentas
- **Roles**: Super Admin
- **API**: `/api/getUsers`, `/api/changeStatusUser/:id`

### 12. [VerNovedad.md](views-private/VerNovedad.md)
**Descripción**: Vista detallada de una novedad
- **Funcionalidades**: Visualización completa con imagen
- **Roles**: Todos los usuarios autenticados
- **API**: `/api/getNovedadesId/:id`

---

## 🔲 Modals (Modales)

### 1. [ModalCUFormatoBases.md](modals/ModalCUFormatoBases.md)
**Descripción**: Crear/Editar formatos de bases
- **Campos**: Título, Categoría, Documento (PDF/Word)
- **Validaciones**: Formato de archivo, campos requeridos

### 2. [ModalCUHistorial.md](modals/ModalCUHistorial.md)
**Descripción**: Historial de observaciones y modificaciones
- **Funcionalidades**: Timeline de cambios, comparación antes/después
- **Datos**: Devoluciones y ediciones con usuario y fecha

### 3. ModalCULicitacion.md *(Por documentar)*
**Descripción**: Editar licitación existente

### 4. ModalCULicitacionDevolver.md *(Por documentar)*
**Descripción**: Devolver licitación a proceso anterior

### 5. ModalCULicitacionDocumento.md *(Por documentar)*
**Descripción**: Subir documentos a licitación

### 6. ModalCUNovedad.md *(Por documentar)*
**Descripción**: Crear/Editar novedades

### 7. ModalCURequerimientoAbastecimiento.md *(Por documentar)*
**Descripción**: Formulario completo de requerimiento

### 8. ModalCUUsuarios.md *(Por documentar)*
**Descripción**: Crear/Editar usuarios con validación RUT

### 9. ModalCUVerDocumentos.md *(Por documentar)*
**Descripción**: Ver documentos adjuntos

### 10. ModalCUWorkFlow.md *(Por documentar)*
**Descripción**: Visualización de workflow

### 11. ModalCUWorkFlowSA.md *(Por documentar)*
**Descripción**: Workflow extendido para Super Admin

### 12. ModalCargarPAC.md *(Por documentar)*
**Descripción**: Carga masiva de PAC desde Excel

---

## 🧩 Componentes Adicionales

### FormatoBases
- **Categoria.jsx** *(Por documentar)*: Componente reutilizable para categorías de bases

### Navegación
- **Menus.jsx** *(Por documentar)*: Menús por rol
- **NavbarLinksGroup.jsx** *(Por documentar)*: Grupo de links del navbar
- **Sidebar.jsx** *(Por documentar)*: Sidebar principal con AppShell
- **UserButton.jsx** *(Por documentar)*: Botón de usuario con logout

---

## 📊 Tecnologías Principales

### Frontend Framework
- **React 18+**: Hooks, Context API
- **React Router v6**: Navegación

### UI Libraries
- **Mantine Core v5**: Componentes de interfaz
- **Ant Design v5**: Tablas, formularios, modales
- **Tabler Icons**: Iconografía

### Utilerías
- **Axios**: Cliente HTTP
- **Day.js**: Manejo de fechas
- **date-fns**: Formateo de fechas
- **XLSX**: Exportación Excel
- **Lottie**: Animaciones
- **rutlib**: Validación RUT chileno
- **react-highlight-words**: Resaltado de búsquedas

---

## 🔐 Roles y Permisos

### Super Admin
- Acceso total al sistema
- Gestión de usuarios
- Todas las licitaciones
- Gestión de novedades
- Configuración de bases

### Licitador
- Crear licitaciones
- Gestionar sus licitaciones
- Bandeja de entrada (filtrada por turno)

### Secretaria Abastecimiento
- Requerimientos de abastecimiento
- PAC y Consolidado PAC
- Gestión de inventarios

### Secretario Jurídico
- Revisión legal de licitaciones
- Bandeja de entrada (solo turno jurídico)

### Presupuesto
- Revisión presupuestaria
- Bandeja de entrada (solo turno presupuesto)

### Subdireccion Administrativa
- Aprobaciones administrativas
- Bandeja de entrada (solo su turno)

---

## 🛣️ Flujos de Licitación

### Formato 1: Adquisición (11 pasos)
1. Confección de Bases
2. Requerimiento referente técnico
3. Jurídico
4. Firmas Directivos y Partes
5. Publicación
6. Evaluación Técnica
7. Preadjudicación y Comisión
8. Presupuesto
9. Jurídico
10. Firmas Directivos y Partes
11. Publicar

### Formato 2: Contraloría (13 pasos)
Similar a Adquisición pero incluye paso de Contraloría

### Formato 3: Contrato (8 pasos)
Proceso simplificado para contratos

### Formato 4: Suministro (11 pasos)
Similar a Adquisición

### Formato 5: Otros Trámites (4 pasos)
Proceso simplificado sin monto ni vigencia

---

## 📡 Patrones de API

### Endpoints Combinados
```javascript
/api/CombinedQuerys[Nombre]
// Retorna múltiples consultas en una sola petición
```

### Estructura de Respuesta
```javascript
{
    "Consulta1[Descripcion]": { "original": [...] },
    "Consulta2[Descripcion]": { "original": [...] }
}
```

### Paginación
```javascript
// Query params
{
    current: number,
    pageSize: number,
    ...filtros
}

// Response
{
    data: [...],
    total: number
}
```

---

## 🎨 Patrones de Diseño UI

### Wrapper con Barra Lateral
```javascript
const useStyles = createStyles((theme) => ({
    wrapper: {
        "&::before": {
            content: '""',
            position: "absolute",
            width: rem(6),
            backgroundImage: theme.fn.linearGradient(0, 
                theme.colors.cyan[6], 
                theme.colors.lime[6]
            ),
        },
    },
}))
```

### Loading States
- Skeleton loaders de Ant Design
- LoadingScreen component
- Animaciones Lottie para procesos largos

### Notificaciones
- message de Ant Design
- notification de Ant Design
- Alertas de Mantine

---

## 🔧 Consideraciones Generales para Migración

### Estado Global
- Actualmente usa Context API (authContext)
- Considerar Redux, Zustand o React Query

### Formularios
- Validaciones manuales
- Considerar React Hook Form + Zod

### Tablas
- Ant Design Table con mucha lógica custom
- Considerar TanStack Table (React Table v8)

### Estilos
- Mix de Mantine y Ant Design
- Migrar a sistema unificado (TailwindCSS + shadcn/ui)

### Fechas
- Mix de Day.js y date-fns
- Estandarizar en una librería

### Iconos
- Tabler Icons
- Considerar Lucide React

### Archivos
- Upload manual con FormData
- Considerar react-dropzone

### TypeScript
- Proyecto actual en JavaScript
- Migrar a TypeScript para type safety

---

## 📝 Notas de Implementación

### Patrones Comunes

#### forwardRef + useImperativeHandle
Todos los modales usan este patrón:
```javascript
const Modal = forwardRef((props, ref) => {
    const childFunction = async (id, action) => { ... }
    
    useImperativeHandle(ref, () => ({
        childFunction,
    }))
})
```

#### Formato de Fechas
```javascript
fecha_formateada(fecha) // Convierte YYYY-MM-DD a DD-MM-YYYY
```

#### Loading Screens
```javascript
const [loadingScreenC, setLoadingScreenC] = useState(false)
// Envuelve operaciones asíncronas
```

#### Limpieza de Estado
```javascript
function cleanInputs() {
    // Resetea todos los campos del formulario
}
```

---

## 🚀 Próximos Pasos

1. **Completar Documentación Faltante**:
   - 10 modales restantes
   - 5 componentes de navegación/FormatoBases

2. **Análisis de Dependencias**:
   - Auditoría de versiones
   - Identificación de vulnerabilidades

3. **Plan de Migración**:
   - Priorización de módulos
   - Estrategia de migración gradual vs completa

4. **Pruebas**:
   - Identificar áreas sin cobertura
   - Plan de testing para nueva tecnología

---

## 📞 Información del Proyecto

**Proyecto**: Sistema de Gestión de Licitaciones HRR
**Cliente**: Hospital Regional Rancagua
**Tecnología Actual**: React 18 + Mantine + Ant Design
**Última Actualización**: 2024

---

*Esta documentación está en proceso. Se irán completando los componentes faltantes de manera sistemática.*
