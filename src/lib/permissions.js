import prisma from "@/lib/prisma"

export const PERMISSION_CODES = {
  LICITACION_CREATE: "licitacion.crear",
  LICITACION_VIEW_WORKFLOW: "licitacion.ver_flujo",
  LICITACION_VIEW_HISTORY: "licitacion.ver_historial",
  LICITACION_VIEW_DOCUMENTS: "licitacion.ver_documentos",
  LICITACION_UPLOAD_DOCUMENT: "licitacion.subir_documento",
  MERCADO_PUBLICO_VIEW: "mercado_publico.ver",
  MERCADO_PUBLICO_EDIT_CODE: "mercado_publico.editar_codigo",
  MERCADO_PUBLICO_SYNC: "mercado_publico.sincronizar",
  USERS_MANAGE: "usuarios.gestionar",
  ROLES_MANAGE: "roles.gestionar",
  NOVEDADES_VIEW: "novedades.ver",
  NOVEDADES_CREATE: "novedades.crear",
  NOVEDADES_EDIT: "novedades.editar",
  NOVEDADES_DELETE: "novedades.eliminar",
  SIGN_UNIT_HEAD: "firma.jefatura_unidad",
  SIGN_DEPARTMENT_HEAD: "firma.jefatura_dpto",
  SIGN_LEGAL_UNIT_HEAD: "firma.jefatura_unidad_legal",
  SIGN_ADMINISTRATIVE_SUBDIRECTOR: "firma.subdirector_administrativo",
  SIGN_DIRECTOR: "firma.director",
  SIGN_RECORDS_OFFICE: "firma.oficina_partes",
  SIDEBAR_HOME: "sidebar.inicio",
  SIDEBAR_NEWS: "sidebar.novedades",
  SIDEBAR_TENDERS: "sidebar.licitaciones",
  SIDEBAR_TENDERS_CREATE: "sidebar.licitaciones.crear",
  SIDEBAR_TENDERS_MINE: "sidebar.licitaciones.mis_licitaciones",
  SIDEBAR_TENDERS_ALL: "sidebar.licitaciones.todas",
  SIDEBAR_INBOX: "sidebar.bandeja",
  SIDEBAR_CONSUMPTION: "sidebar.seguimiento_consumo",
  SIDEBAR_BASE_FORMATS: "sidebar.formato_bases",
  SIDEBAR_USERS: "sidebar.usuarios",
  SIDEBAR_NEWS_MANAGEMENT: "sidebar.gestion_novedades",
  SIDEBAR_PERMISSIONS_MANAGEMENT: "sidebar.gestion_permisos"
}

export const isSuperAdmin = (user) => {
  const typeAccount = user?.type_account ?? user?.typeAccount ?? ""

  const roleNames = user?.user_roles
    ?.map((userRole) => userRole?.roles?.name)
    .filter(Boolean) ?? []
  const legacyRoleIds = user?.user_roles
    ?.map((userRole) => userRole?.role_id)
    .filter(Boolean) ?? []

  return (
    typeAccount === "Super Admin" ||
    typeAccount === "superadmin" ||
    roleNames.includes("superadmin") ||
    roleNames.includes("Super Admin") ||
    legacyRoleIds.includes("superadmin")
  )
}

const getUserWithRoles = async (userId) => {
  if (!userId) return null

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      user_roles: {
        include: {
          roles: true
        }
      }
    }
  })
}

const getPermissionCodesByRoleIds = async (roleIds) => {
  if (roleIds.length === 0) return []

  const assignments = await prisma.roles_permisos.findMany({
    where: {
      role_id: {
        in: roleIds
      }
    },
    select: {
      permisos: {
        select: {
          codigo: true
        }
      }
    }
  })

  return [...new Set(assignments.map((assignment) => assignment.permisos.codigo))]
}

export const getUserPermissionContext = async (userId) => {
  const user = await getUserWithRoles(userId)

  if (!user) {
    return {
      user: null,
      isSuperAdmin: false,
      permissions: []
    }
  }

  const superAdmin = isSuperAdmin(user)

  if (superAdmin) {
    return {
      user,
      isSuperAdmin: true,
      permissions: []
    }
  }

  const roleIds = user.user_roles.map((userRole) => userRole.role_id)
  const permissions = await getPermissionCodesByRoleIds(roleIds)

  return {
    user,
    isSuperAdmin: false,
    permissions
  }
}

export const getUserPermissions = async (userId) => {
  const context = await getUserPermissionContext(userId)
  return context.permissions
}

export const userHasPermission = async (userId, permissionCode) => {
  if (!userId || !permissionCode) return false

  const context = await getUserPermissionContext(userId)

  if (context.isSuperAdmin) return true

  return context.permissions.includes(permissionCode)
}

export const canUserPerform = async (userId, permissionCode) => {
  return userHasPermission(userId, permissionCode)
}

export const getWorkflowPermissionCode = (action, numeroPaso) => {
  return `workflow.${action}.${Number(numeroPaso)}`
}
