import { Alert } from "antd"
import { auth } from "@/lib/auth"
import { PERMISSION_CODES, userHasPermission } from "@/lib/permissions"
import PermissionsManagement from "@/components/permisos/PermissionsManagement"

const PermisosPage = async () => {
  const session = await auth()
  const allowed = session
    ? await userHasPermission(session.user.id, PERMISSION_CODES.ROLES_MANAGE)
    : false

  if (!allowed) {
    return (
      <Alert
        type="error"
        showIcon
        message="No autorizado"
        description="No tienes permisos para realizar esta acción."
      />
    )
  }

  return <PermissionsManagement />
}

export default PermisosPage
