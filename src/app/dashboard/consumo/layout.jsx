import RequirePermissions from "@/components/auth/RequirePermissions"
import { PERMISSION_CODES } from "@/lib/permissions"

const ConsumoLayout = ({ children }) => {
  return (
    <RequirePermissions allOf={[PERMISSION_CODES.SIDEBAR_CONSUMPTION]}>
      {children}
    </RequirePermissions>
  )
}

export default ConsumoLayout
