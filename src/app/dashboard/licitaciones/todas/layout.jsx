import RequirePermissions from "@/components/auth/RequirePermissions"
import { PERMISSION_CODES } from "@/lib/permissions"

const TodasLicitacionesLayout = ({ children }) => {
  return (
    <RequirePermissions allOf={[PERMISSION_CODES.SIDEBAR_TENDERS_ALL]}>
      {children}
    </RequirePermissions>
  )
}

export default TodasLicitacionesLayout
