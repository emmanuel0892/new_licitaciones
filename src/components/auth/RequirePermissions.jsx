import { Alert } from "antd"
import { auth } from "@/lib/auth"
import { getUserPermissionContext } from "@/lib/permissions"

export const UnauthorizedAccess = () => {
  return (
    <Alert
      type="error"
      showIcon
      message="No autorizado"
      description="No tienes permisos para acceder a esta sección."
    />
  )
}

const RequirePermissions = async ({ children, allOf = [], anyOf = [] }) => {
  const session = await auth()

  if (!session?.user?.id) {
    return <UnauthorizedAccess />
  }

  const authorization = await getUserPermissionContext(session.user.id)

  if (authorization.isSuperAdmin) {
    return children
  }

  const canAccessAll = allOf.every((permissionCode) => authorization.permissions.includes(permissionCode))
  const canAccessAny = anyOf.length === 0 ||
    anyOf.some((permissionCode) => authorization.permissions.includes(permissionCode))

  if (!canAccessAll || !canAccessAny) {
    return <UnauthorizedAccess />
  }

  return children
}

export default RequirePermissions
