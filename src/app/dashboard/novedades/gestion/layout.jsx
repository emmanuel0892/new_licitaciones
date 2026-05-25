import RequirePermissions from "@/components/auth/RequirePermissions"
import { PERMISSION_CODES } from "@/lib/permissions"

const GestionNovedadesLayout = ({ children }) => {
  return (
    <RequirePermissions allOf={[PERMISSION_CODES.SIDEBAR_NEWS_MANAGEMENT]}>
      {children}
    </RequirePermissions>
  )
}

export default GestionNovedadesLayout
