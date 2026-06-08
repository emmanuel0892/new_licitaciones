"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CONVENIO_MARCO_PROCESOS, esFormatoLicitacion, getVisualStepConvenioMarco } from "@/lib/helpers"
import { getUserPermissionContext, PERMISSION_CODES, userHasPermission } from "@/lib/permissions"

const roleAssignmentSchema = z.object({
  userId: z.string().min(1, "El usuario es requerido"),
  roleIds: z.array(z.string().min(1)).min(1, "Debe seleccionar al menos un rol")
})

const permissionAssignmentSchema = z.object({
  roleId: z.string().min(1, "El rol es requerido"),
  permissionIds: z.array(z.coerce.number().int().positive())
})

const roleIdSchema = z.string().min(1, "El rol es requerido")

const BASE_PERMISSIONS = [
  {
    codigo: "licitacion.crear",
    nombre: "Crear licitación",
    descripcion: "Permite crear un nuevo proceso de licitación",
    categoria: "Licitaciones"
  },
  {
    codigo: "licitacion.ver_flujo",
    nombre: "Ver flujo de trabajo",
    descripcion: "Permite consultar el flujo de trabajo de una licitación",
    categoria: "Licitaciones"
  },
  {
    codigo: "licitacion.ver_historial",
    nombre: "Ver historial",
    descripcion: "Permite consultar el historial de una licitación",
    categoria: "Licitaciones"
  },
  {
    codigo: "licitacion.ver_documentos",
    nombre: "Ver documentos",
    descripcion: "Permite consultar documentos de una licitación",
    categoria: "Documentos"
  },
  {
    codigo: "licitacion.subir_documento",
    nombre: "Subir documento",
    descripcion: "Permite cargar documentos en una licitación",
    categoria: "Documentos"
  },
  {
    codigo: "mercado_publico.ver",
    nombre: "Ver datos de Mercado Publico",
    descripcion: "Permite consultar en linea datos asociados a una licitacion",
    categoria: "Mercado Publico"
  },
  {
    codigo: "mercado_publico.editar_codigo",
    nombre: "Editar codigo Mercado Publico",
    descripcion: "Permite guardar el codigo Mercado Publico en el primer paso",
    categoria: "Mercado Publico"
  },
  {
    codigo: "mercado_publico.sincronizar",
    nombre: "Consultar Mercado Publico",
    descripcion: "Permite consultar datos externos sin persistirlos",
    categoria: "Mercado Publico"
  },
  {
    codigo: "usuarios.gestionar",
    nombre: "Gestionar usuarios",
    descripcion: "Permite administrar usuarios",
    categoria: "Usuarios"
  },
  {
    codigo: "roles.gestionar",
    nombre: "Gestionar roles y permisos",
    descripcion: "Permite asignar roles y permisos",
    categoria: "Administración"
  },
  {
    codigo: "novedades.ver",
    nombre: "Ver novedades",
    descripcion: "Permite visualizar el módulo de gestión de novedades",
    categoria: "Gestión Novedades"
  },
  {
    codigo: "novedades.crear",
    nombre: "Crear novedades",
    descripcion: "Permite crear nuevas novedades",
    categoria: "Gestión Novedades"
  },
  {
    codigo: "novedades.editar",
    nombre: "Editar novedades",
    descripcion: "Permite editar novedades existentes",
    categoria: "Gestión Novedades"
  },
  {
    codigo: "novedades.eliminar",
    nombre: "Eliminar novedades",
    descripcion: "Permite eliminar novedades existentes",
    categoria: "Gestión Novedades"
  },
  {
    codigo: "firma.jefatura_unidad",
    nombre: "Firmar como Jefatura de Unidad",
    descripcion: "Permite aplicar firma como Jefatura de Unidad en pasos del workflow",
    categoria: "Firmas"
  },
  {
    codigo: "firma.jefatura_dpto",
    nombre: "Firmar como Jefatura de Dpto",
    descripcion: "Permite aplicar firma como Jefatura de Dpto en pasos del workflow",
    categoria: "Firmas"
  },
  {
    codigo: "firma.jefatura_unidad_legal",
    nombre: "Firmar como Jefatura Unidad Administrativo Legal",
    descripcion: "Permite aplicar firma como Jefatura Unidad Administrativo Legal en pasos del workflow",
    categoria: "Firmas"
  },
  {
    codigo: "firma.subdirector_administrativo",
    nombre: "Firmar como Subdirector Administrativo",
    descripcion: "Permite aplicar firma como Subdirector Administrativo en pasos del workflow",
    categoria: "Firmas"
  },
  {
    codigo: "firma.director",
    nombre: "Firmar como Director",
    descripcion: "Permite aplicar firma como Director en pasos del workflow",
    categoria: "Firmas"
  },
  {
    codigo: "firma.oficina_partes",
    nombre: "Firmar como Oficina de Partes",
    descripcion: "Permite aplicar firma como Oficina de Partes en pasos del workflow",
    categoria: "Firmas"
  },
  {
    codigo: "sidebar.inicio",
    nombre: "Ver menú Inicio",
    descripcion: "Permite visualizar el menú Inicio en el sidebar",
    categoria: "Sidebar"
  },
  {
    codigo: "sidebar.novedades",
    nombre: "Ver menú Novedades",
    descripcion: "Permite visualizar el menú Novedades en el sidebar",
    categoria: "Sidebar"
  },
  {
    codigo: "sidebar.licitaciones",
    nombre: "Ver menú Licitaciones",
    descripcion: "Permite visualizar el grupo Licitaciones en el sidebar",
    categoria: "Sidebar"
  },
  {
    codigo: "sidebar.licitaciones.crear",
    nombre: "Ver menú Crear Nuevo Proceso",
    descripcion: "Permite visualizar Crear Nuevo Proceso dentro de Licitaciones",
    categoria: "Sidebar"
  },
  {
    codigo: "sidebar.licitaciones.mis_licitaciones",
    nombre: "Ver menú Mis Licitaciones",
    descripcion: "Permite visualizar Mis Licitaciones dentro de Licitaciones",
    categoria: "Sidebar"
  },
  {
    codigo: "sidebar.licitaciones.todas",
    nombre: "Ver menú Todas las Licitaciones",
    descripcion: "Permite visualizar Todas las Licitaciones dentro de Licitaciones",
    categoria: "Sidebar"
  },
  {
    codigo: "sidebar.bandeja",
    nombre: "Ver menú Bandeja de Entrada",
    descripcion: "Permite visualizar Bandeja de Entrada en el sidebar",
    categoria: "Sidebar"
  },
  {
    codigo: "sidebar.seguimiento_consumo",
    nombre: "Ver menú Seguimiento Consumo",
    descripcion: "Permite visualizar Seguimiento Consumo en el sidebar",
    categoria: "Sidebar"
  },
  {
    codigo: "sidebar.formato_bases",
    nombre: "Ver menú Formato Bases",
    descripcion: "Permite visualizar Formato Bases en el sidebar",
    categoria: "Sidebar"
  },
  {
    codigo: "sidebar.usuarios",
    nombre: "Ver menú Usuarios",
    descripcion: "Permite visualizar Usuarios en el sidebar",
    categoria: "Sidebar"
  },
  {
    codigo: "sidebar.gestion_novedades",
    nombre: "Ver menú Gestión Novedades",
    descripcion: "Permite visualizar Gestión Novedades en el sidebar",
    categoria: "Sidebar"
  },
  {
    codigo: "sidebar.gestion_permisos",
    nombre: "Ver menú Gestión de Permisos",
    descripcion: "Permite visualizar Gestión de Permisos en el sidebar",
    categoria: "Sidebar"
  }
]

const TRATO_DIRECTO_PERMISSIONS = [
  {
    codigo: "trato_directo.ver_flujo",
    nombre: "Ver flujo Trato Directo",
    descripcion: "Permite visualizar el flujo de trabajo de Trato Directo",
    categoria: "Trato Directo"
  },
  {
    codigo: "trato_directo.ver_historial",
    nombre: "Ver historial Trato Directo",
    descripcion: "Permite visualizar el historial de Trato Directo",
    categoria: "Trato Directo"
  },
  {
    codigo: "trato_directo.subir_documento",
    nombre: "Subir documentos Trato Directo",
    descripcion: "Permite subir documentos en procesos de Trato Directo",
    categoria: "Trato Directo"
  },
  {
    codigo: "trato_directo.ver_documentos",
    nombre: "Ver documentos Trato Directo",
    descripcion: "Permite ver documentos asociados a Trato Directo",
    categoria: "Trato Directo"
  },
  {
    codigo: "trato_directo.editar_codigo_mercado_publico",
    nombre: "Editar código Mercado Público en Trato Directo",
    descripcion: "Permite editar el N° Licitación/MEMO por código Mercado Público en el paso correspondiente de Trato Directo",
    categoria: "Trato Directo"
  },
  ...[
    "Confección Bases Técnicas",
    "Firmas Jefatura de Unidad y Jefatura de Dpto.",
    "Unidad Administrativa Legal",
    "Firmas Subdirector Administrativo y Director",
    "Fecha y Enumeración de Oficina de Partes",
    "Presupuesto",
    "Firmas Jefatura de Unidad y Jefatura de Dpto.",
    "Confección de Contrato"
  ].flatMap((stepName, index) => {
    const numeroPaso = index + 1

    return [
      {
        codigo: `workflow.trato_directo.avanzar.${numeroPaso}`,
        nombre: `Avanzar paso ${numeroPaso} - ${stepName}`,
        descripcion: `Permite avanzar el paso ${numeroPaso} del flujo Trato Directo`,
        categoria: "Trato Directo"
      },
      {
        codigo: `workflow.trato_directo.devolver.${numeroPaso}`,
        nombre: `Devolver paso ${numeroPaso} - ${stepName}`,
        descripcion: `Permite devolver desde el paso ${numeroPaso} del flujo Trato Directo`,
        categoria: "Trato Directo"
      }
    ]
  })
]

const CONVENIO_MARCO_PERMISSIONS = [
  {
    codigo: "convenio_marco.ver_flujo",
    nombre: "Ver flujo Convenio Marco / Gran Compra",
    descripcion: "Permite visualizar el flujo de trabajo de Convenio Marco / Gran Compra",
    categoria: "Convenio Marco / Gran Compra"
  },
  {
    codigo: "convenio_marco.ver_historial",
    nombre: "Ver historial Convenio Marco / Gran Compra",
    descripcion: "Permite visualizar el historial de Convenio Marco / Gran Compra",
    categoria: "Convenio Marco / Gran Compra"
  },
  {
    codigo: "convenio_marco.subir_documento",
    nombre: "Subir documentos Convenio Marco / Gran Compra",
    descripcion: "Permite subir documentos en procesos de Convenio Marco / Gran Compra",
    categoria: "Convenio Marco / Gran Compra"
  },
  {
    codigo: "convenio_marco.ver_documentos",
    nombre: "Ver documentos Convenio Marco / Gran Compra",
    descripcion: "Permite ver documentos asociados a Convenio Marco / Gran Compra",
    categoria: "Convenio Marco / Gran Compra"
  },
  {
    codigo: "convenio_marco.editar_codigo_mercado_publico",
    nombre: "Editar codigo Mercado Publico en Convenio Marco / Gran Compra",
    descripcion: "Permite editar el codigo Mercado Publico en el paso correspondiente de Convenio Marco / Gran Compra",
    categoria: "Convenio Marco / Gran Compra"
  },
  ...CONVENIO_MARCO_PROCESOS.flatMap((step) => {
    const numeroPaso = step.numeroPaso
    const numeroVisual = getVisualStepConvenioMarco(numeroPaso, Number.MAX_SAFE_INTEGER).visual

    return [
      {
        codigo: `workflow.convenio_marco.avanzar.${numeroPaso}`,
        nombre: `Avanzar paso ${numeroVisual} - ${step.tituloProceso}`,
        descripcion: `Permite avanzar el paso interno ${numeroPaso} del flujo Convenio Marco / Gran Compra`,
        categoria: "Convenio Marco / Gran Compra"
      },
      {
        codigo: `workflow.convenio_marco.devolver.${numeroPaso}`,
        nombre: `Devolver paso ${numeroVisual} - ${step.tituloProceso}`,
        descripcion: `Permite devolver desde el paso interno ${numeroPaso} del flujo Convenio Marco / Gran Compra`,
        categoria: "Convenio Marco / Gran Compra"
      }
    ]
  })
]

const getAuthorizedSession = async () => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const allowed = await userHasPermission(session.user.id, PERMISSION_CODES.ROLES_MANAGE)

  if (!allowed) {
    return { error: "No tienes permisos para realizar esta acción." }
  }

  return { session }
}

const revalidatePermissionConsumers = () => {
  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard/licitaciones")
  revalidatePath("/dashboard/licitaciones/bandeja")
  revalidatePath("/dashboard/novedades/gestion")
}

const formatWorkflowPermissionName = (permission, processByStep) => {
  const convenioMarcoMatch = permission.codigo.match(/^workflow\.convenio_marco\.(avanzar|devolver)\.(\d+)$/)

  if (convenioMarcoMatch) {
    const actionLabel = convenioMarcoMatch[1] === "avanzar" ? "Avanzar" : "Devolver"
    const numeroPaso = Number(convenioMarcoMatch[2])
    const processName = CONVENIO_MARCO_PROCESOS.find((process) => process.numeroPaso === numeroPaso)?.tituloProceso
    const numeroVisual = getVisualStepConvenioMarco(numeroPaso, Number.MAX_SAFE_INTEGER).visual

    return processName
      ? `${actionLabel} paso ${numeroVisual} - ${processName}`
      : `${actionLabel} paso ${numeroVisual}`
  }

  const match = permission.codigo.match(/^workflow\.(avanzar|devolver)\.(\d+)$/)

  if (!match) return permission.nombre

  const actionLabel = match[1] === "avanzar" ? "Avanzar" : "Devolver"
  const numeroPaso = Number(match[2])
  const processName = processByStep.get(numeroPaso)

  return processName
    ? `${actionLabel} paso ${numeroPaso} - ${processName}`
    : `${actionLabel} paso ${numeroPaso}`
}

export const getCurrentAuthorization = async () => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const context = await getUserPermissionContext(session.user.id)

  return {
    data: {
      isSuperAdmin: context.isSuperAdmin,
      permissions: context.permissions
    }
  }
}

export const getPermissionManagementData = async () => {
  const authorization = await getAuthorizedSession()

  if (authorization.error) {
    return authorization
  }

  try {
    const [users, roles, permissions, processes] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          lastname: true,
          email: true,
          user_roles: {
            select: {
              role_id: true,
              roles: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: [{ name: "asc" }, { lastname: "asc" }]
      }),
      prisma.roles.findMany({
        select: {
          id: true,
          name: true,
          roles_permisos: {
            select: {
              permiso_id: true
            }
          }
        },
        orderBy: { name: "asc" }
      }),
      prisma.permisos.findMany({
        orderBy: [{ categoria: "asc" }, { nombre: "asc" }]
      }),
      prisma.procesoLicitacion.findMany({
        select: {
          numeroPaso: true,
          tituloProceso: true,
          formatoLiquidacion: {
            select: {
              titulo: true
            }
          }
        },
        orderBy: { numeroPaso: "asc" }
      })
    ])

    const processByStep = new Map()

    processes.forEach((process) => {
      if (
        esFormatoLicitacion(process.formatoLiquidacion.titulo) &&
        !processByStep.has(process.numeroPaso)
      ) {
        processByStep.set(process.numeroPaso, process.tituloProceso)
      }
    })

    return {
      data: {
        users: users.map((user) => ({
          id: user.id,
          name: user.name,
          lastname: user.lastname,
          email: user.email,
          roleIds: user.user_roles.map((userRole) => userRole.role_id),
          roleNames: user.user_roles.map((userRole) => userRole.roles.name)
        })),
        roles: roles.map((role) => ({
          id: role.id,
          name: role.name,
          permissionIds: role.roles_permisos.map((assignment) => Number(assignment.permiso_id))
        })),
        permissions: permissions.map((permission) => ({
          id: permission.id,
          codigo: permission.codigo,
          nombre: formatWorkflowPermissionName(permission, processByStep),
          descripcion: permission.descripcion,
          categoria: permission.categoria
        }))
      }
    }
  } catch (error) {
    console.error("Error en getPermissionManagementData:", error)
    return { error: "Error al obtener roles y permisos" }
  }
}

export const syncPermissionCatalog = async () => {
  const authorization = await getAuthorizedSession()

  if (authorization.error) {
    return authorization
  }

  try {
    const processes = await prisma.procesoLicitacion.findMany({
      select: {
        numeroPaso: true,
        tituloProceso: true,
        formatoLiquidacion: {
          select: {
            titulo: true
          }
        }
      },
      orderBy: { numeroPaso: "asc" }
    })

    const processesByStep = new Map()

    processes.forEach((process) => {
      if (
        esFormatoLicitacion(process.formatoLiquidacion.titulo) &&
        !processesByStep.has(process.numeroPaso)
      ) {
        processesByStep.set(process.numeroPaso, process.tituloProceso)
      }
    })

    const workflowPermissions = [...processesByStep.entries()].flatMap(([numeroPaso, tituloProceso]) => [
      {
        codigo: `workflow.avanzar.${numeroPaso}`,
        nombre: `Avanzar paso ${numeroPaso} - ${tituloProceso}`,
        descripcion: `Permite avanzar desde el paso interno ${numeroPaso}`,
        categoria: "Workflow - Avanzar"
      },
      {
        codigo: `workflow.devolver.${numeroPaso}`,
        nombre: `Devolver paso ${numeroPaso} - ${tituloProceso}`,
        descripcion: `Permite devolver desde el paso interno ${numeroPaso}`,
        categoria: "Workflow - Devolver"
      }
    ])

    const catalog = [...BASE_PERMISSIONS, ...TRATO_DIRECTO_PERMISSIONS, ...CONVENIO_MARCO_PERMISSIONS, ...workflowPermissions]

    await prisma.$transaction(
      catalog.map((permission) =>
        prisma.permisos.upsert({
          where: { codigo: permission.codigo },
          update: {
            nombre: permission.nombre,
            descripcion: permission.descripcion,
            categoria: permission.categoria
          },
          create: permission
        })
      )
    )

    const superAdminRole = await prisma.roles.findUnique({
      where: { name: "superadmin" },
      select: { id: true }
    })

    if (superAdminRole) {
      const sidebarPermissions = await prisma.permisos.findMany({
        where: {
          codigo: {
            startsWith: "sidebar."
          }
        },
        select: { id: true }
      })

      await prisma.roles_permisos.createMany({
        data: sidebarPermissions.map((permission) => ({
          role_id: superAdminRole.id,
          permiso_id: permission.id
        })),
        skipDuplicates: true
      })
    }

    revalidatePermissionConsumers()
    return { success: true }
  } catch (error) {
    console.error("Error en syncPermissionCatalog:", error)
    return { error: "Error al actualizar el catálogo de permisos" }
  }
}

export const getRolePermissions = async (roleId) => {
  const authorization = await getAuthorizedSession()

  if (authorization.error) {
    return authorization
  }

  const validatedRoleId = roleIdSchema.safeParse(roleId)

  if (!validatedRoleId.success) {
    return { error: validatedRoleId.error.issues[0]?.message || "Rol inválido" }
  }

  try {
    const role = await prisma.roles.findUnique({
      where: { id: validatedRoleId.data },
      select: { id: true }
    })

    if (!role) {
      return { error: "Rol no encontrado" }
    }

    const rolePermissions = await prisma.roles_permisos.findMany({
      where: {
        role_id: validatedRoleId.data
      },
      select: {
        permiso_id: true
      }
    })

    return {
      data: rolePermissions.map((rolePermission) => Number(rolePermission.permiso_id))
    }
  } catch (error) {
    console.error("Error en getRolePermissions:", error)
    return { error: "Error al obtener permisos del rol" }
  }
}

export const updateUserRoles = async (data) => {
  const authorization = await getAuthorizedSession()

  if (authorization.error) {
    return authorization
  }

  const validatedFields = roleAssignmentSchema.safeParse(data)

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { userId, roleIds } = validatedFields.data
  const uniqueRoleIds = [...new Set(roleIds)]

  try {
    const validRoles = await prisma.roles.count({
      where: {
        id: {
          in: uniqueRoleIds
        }
      }
    })

    if (validRoles !== uniqueRoleIds.length) {
      return { error: "Se seleccionaron roles inválidos" }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user_roles.deleteMany({
        where: { user_id: userId }
      })

      await tx.user_roles.createMany({
        data: uniqueRoleIds.map((roleId) => ({
          user_id: userId,
          role_id: roleId
        })),
        skipDuplicates: true
      })
    })

    revalidatePermissionConsumers()
    return { success: true }
  } catch (error) {
    console.error("Error en updateUserRoles:", error)
    return { error: "Error al actualizar roles" }
  }
}

export const updateRolePermissions = async (data) => {
  const authorization = await getAuthorizedSession()

  if (authorization.error) {
    return authorization
  }

  const validatedFields = permissionAssignmentSchema.safeParse(data)

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { roleId, permissionIds } = validatedFields.data
  const uniquePermissionIds = [...new Set(permissionIds.map(Number))]

  try {
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
      select: { id: true }
    })

    if (!role) {
      return { error: "Rol no encontrado" }
    }

    const validPermissions = await prisma.permisos.count({
      where: {
        id: {
          in: uniquePermissionIds
        }
      }
    })

    if (validPermissions !== uniquePermissionIds.length) {
      return { error: "Se seleccionaron permisos inválidos" }
    }

    await prisma.$transaction(async (tx) => {
      await tx.roles_permisos.deleteMany({
        where: { role_id: roleId }
      })

      if (uniquePermissionIds.length > 0) {
        await tx.roles_permisos.createMany({
          data: uniquePermissionIds.map((permissionId) => ({
            role_id: roleId,
            permiso_id: permissionId
          })),
          skipDuplicates: true
        })
      }
    })

    revalidatePermissionConsumers()
    return { success: true }
  } catch (error) {
    console.error("Error en updateRolePermissions:", error)
    return { error: "Error al actualizar permisos" }
  }
}
