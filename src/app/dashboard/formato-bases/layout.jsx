import RequirePermissions from "@/components/auth/RequirePermissions"
import { PERMISSION_CODES } from "@/lib/permissions"

const FormatoBasesLayout = ({ children }) => {
  return (
    <RequirePermissions allOf={[PERMISSION_CODES.SIDEBAR_BASE_FORMATS]}>
      {children}
    </RequirePermissions>
  )
}

export default FormatoBasesLayout
