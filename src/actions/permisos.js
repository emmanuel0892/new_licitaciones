"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { esFormatoLicitacion } from "@/lib/helpers"
import { getUserPermissionContext, PERMISSION_CODES, userHasPermission } from "@/lib/permissions"

const roleAssignmentSchema = z.object({
  userId: z.string().min(1, "El usuario es requerido"),
  roleIds: z.array(z.string().min(1)).min(1, "Debe seleccionar al menos un rol")
})

const permissionAssignmentSchema = z.object({
  roleId: z.string().min(1, "El rol es requerido"),
  permissionIds: z.array(z.coerce.number().int().positive())
})

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
  }
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

const formatWorkflowPermissionName = (permission, processByStep) => {
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
          permissionIds: role.roles_permisos.map((assignment) => assignment.permiso_id)
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

    const catalog = [...BASE_PERMISSIONS, ...workflowPermissions]

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

    revalidatePath("/dashboard/permisos")
    return { success: true }
  } catch (error) {
    console.error("Error en syncPermissionCatalog:", error)
    return { error: "Error al actualizar el catálogo de permisos" }
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

    revalidatePath("/dashboard/permisos")
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
  const uniquePermissionIds = [...new Set(permissionIds)]

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

    revalidatePath("/dashboard/permisos")
    return { success: true }
  } catch (error) {
    console.error("Error en updateRolePermissions:", error)
    return { error: "Error al actualizar permisos" }
  }
}
