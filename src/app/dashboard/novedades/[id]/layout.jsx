import RequirePermissions from "@/components/auth/RequirePermissions"
import { PERMISSION_CODES } from "@/lib/permissions"

const VerNovedadLayout = ({ children }) => {
  return (
    <RequirePermissions allOf={[PERMISSION_CODES.SIDEBAR_NEWS]}>
      {children}
    </RequirePermissions>
  )
}

export default VerNovedadLayout
