import { auth } from "@/lib/auth"
import { PERMISSION_CODES, userHasPermission } from "@/lib/permissions"
import { UnauthorizedAccess } from "@/components/auth/RequirePermissions"
import { getIndicadoresGestion } from "@/actions/analytics"
import IndicadoresContent from "@/components/dashboard/IndicadoresContent"

const DashboardPage = async () => {
  const session = await auth()
  const user = session?.user

  const canViewDashboard = await userHasPermission(user?.id, PERMISSION_CODES.SIDEBAR_HOME)

  if (!canViewDashboard) {
    return <UnauthorizedAccess />
  }

  const result = await getIndicadoresGestion()

  if (result.error) {
    return <IndicadoresContent data={null} error={result.error} />
  }

  return <IndicadoresContent data={result.data} />
}

export default DashboardPage
