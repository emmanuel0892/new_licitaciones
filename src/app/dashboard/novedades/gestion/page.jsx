import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserPermissionContext, PERMISSION_CODES } from "@/lib/permissions"
import { getNovedadesGestion } from "@/actions/novedades"
import GestionNovedadesContent from "@/components/novedades/GestionNovedadesContent"

const serializeNovedad = (novedad) => ({
  ...novedad,
  createdAt: novedad.createdAt.toISOString(),
  updatedAt: novedad.updatedAt.toISOString()
})

const GestionNovedadesPage = async () => {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const authorization = await getUserPermissionContext(session.user.id)
  const can = (permissionCode) => {
    return authorization.isSuperAdmin || authorization.permissions.includes(permissionCode)
  }

  if (!can(PERMISSION_CODES.NOVEDADES_VIEW)) {
    redirect("/dashboard")
  }

  const result = await getNovedadesGestion()
  const novedades = result.data?.map(serializeNovedad) ?? []

  return (
    <GestionNovedadesContent
      initialNovedades={novedades}
      initialError={result.error}
      canCreateNovedades={can(PERMISSION_CODES.NOVEDADES_CREATE)}
      canEditNovedades={can(PERMISSION_CODES.NOVEDADES_EDIT)}
      canDeleteNovedades={can(PERMISSION_CODES.NOVEDADES_DELETE)}
    />
  )
}

export default GestionNovedadesPage
