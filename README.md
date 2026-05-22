# HRR Licitaciones - Sistema de Gestión

Sistema de Gestión de Licitaciones para el Hospital Regional Rancagua, desarrollado con Next.js 16, Ant Design y Prisma.

## 🛠️ Stack Tecnológico

- **Next.js 16** - App Router
- **React 19** - Framework UI
- **Ant Design 6** - Componentes UI
- **Prisma** - ORM
- **Auth.js (NextAuth v5)** - Autenticación
- **PostgreSQL** - Base de datos
- **Zod** - Validación
- **bcryptjs** - Hash de contraseñas

## 🎨 Color Base

El sistema utiliza el color `#23aeaa` como color primario en toda la interfaz.

## 📦 Instalación

1. **Clonar el repositorio**

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` con:

```env
DATABASE_URL="mysql://usuario:password@localhost:3306/new_licitaciones"
AUTH_SECRET="tu-secret-key-aqui"
```

4. **Configurar base de datos**

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. **Ejecutar en desarrollo**

```bash
npm run dev
```

## 👤 Usuario por Defecto

Después de ejecutar el seed, tendrás acceso con:

- **Email:** admin@hrr.cl
- **Contraseña:** Admin123!

## 📁 Estructura del Proyecto

```
src/
├── actions/          # Server Actions
├── app/              # App Router
│   ├── dashboard/    # Páginas protegidas
│   │   ├── licitaciones/
│   │   ├── usuarios/
│   │   ├── novedades/
│   │   ├── pac/
│   │   └── formato-bases/
│   └── login/        # Página de login
├── components/       # Componentes React
│   ├── layout/       # Layout y Sidebar
│   ├── modals/       # Modales
│   └── providers/    # Providers
└── lib/              # Utilidades
    ├── validations/  # Esquemas Zod
    ├── auth.js       # Configuración Auth.js
    ├── prisma.js     # Cliente Prisma
    ├── helpers.js    # Funciones auxiliares
    └── theme.js      # Tema Ant Design
```

## 👥 Roles del Sistema

- **Super Admin** - Acceso total
- **Licitador** - Crear y gestionar licitaciones
- **Secretaria Abastecimiento** - PAC y Requerimientos
- **Secretario Jurídico** - Revisión legal
- **Presupuesto** - Revisión presupuestaria
- **Subdirección Administrativa** - Aprobaciones

## 📋 Módulos

- **Licitaciones** - Crear, bandeja, workflow, historial
- **Usuarios** - CRUD con validación RUT chileno
- **PAC** - Plan Anual de Compras con carga Excel
- **Novedades** - Gestión de noticias
- **Formato Bases** - Documentos por categoría

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Servidor producción
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Sincronizar esquema
npm run db:migrate   # Migración
npm run db:seed      # Seed inicial
npm run db:studio    # Prisma Studio
```

## 📄 Licencia

Proyecto interno - Hospital Regional Rancagua
