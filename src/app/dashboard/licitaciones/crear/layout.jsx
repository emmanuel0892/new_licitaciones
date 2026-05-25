import RequirePermissions from "@/components/auth/RequirePermissions"
import { PERMISSION_CODES } from "@/lib/permissions"

const CrearLicitacionLayout = ({ children }) => {
  return (
    <RequirePermissions
      allOf={[PERMISSION_CODES.SIDEBAR_TENDERS_CREATE, PERMISSION_CODES.LICITACION_CREATE]}
    >
      {children}
    </RequirePermissions>
  )
}

export default CrearLicitacionLayout
