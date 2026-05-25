import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import DashboardContent from "@/components/dashboard/DashboardContent"
import { PERMISSION_CODES, userHasPermission } from "@/lib/permissions"

const getStats = async (userId, userType) => {
  const isSuperAdmin = userType === "Super Admin"

  const [totalLicitaciones, pendientes, finalizadas, enProceso] = await Promise.all([
    prisma.licitacion.count(isSuperAdmin ? {} : { where: { usuarioId: userId } }),
    prisma.licitacion.count({
      where: {
        estado: "Pendiente",
        ...(isSuperAdmin ? {} : { usuarioId: userId })
      }
    }),
    prisma.licitacion.count({
      where: {
        estado: "Finalizada",
        ...(isSuperAdmin ? {} : { usuarioId: userId })
      }
    }),
    prisma.licitacion.count({
      where: {
        estado: "Devuelto",
        ...(isSuperAdmin ? {} : { usuarioId: userId })
      }
    })
  ])

  return { totalLicitaciones, pendientes, finalizadas, enProceso }
}

const DashboardPage = async () => {
  const session = await auth()
  const user = session?.user

  let stats = { totalLicitaciones: 0, pendientes: 0, finalizadas: 0, enProceso: 0 }

  try {
    stats = await getStats(user?.id, user?.typeAccount)
  } catch (error) {
    console.log("Error al obtener estadísticas:", error)
  }

  const canCreateLicitacion = await userHasPermission(user?.id, PERMISSION_CODES.LICITACION_CREATE)

  return <DashboardContent user={user} stats={stats} canCreateLicitacion={canCreateLicitacion} />
}

export default DashboardPage
