import RequirePermissions from "@/components/auth/RequirePermissions"
import { PERMISSION_CODES } from "@/lib/permissions"

const UsuariosLayout = ({ children }) => {
  return (
    <RequirePermissions allOf={[PERMISSION_CODES.SIDEBAR_USERS, PERMISSION_CODES.USERS_MANAGE]}>
      {children}
    </RequirePermissions>
  )
}

export default UsuariosLayout
