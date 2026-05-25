import RequirePermissions from "@/components/auth/RequirePermissions"
import { PERMISSION_CODES } from "@/lib/permissions"

const MisLicitacionesLayout = ({ children }) => {
  return (
    <RequirePermissions allOf={[PERMISSION_CODES.SIDEBAR_TENDERS_MINE]}>
      {children}
    </RequirePermissions>
  )
}

export default MisLicitacionesLayout
