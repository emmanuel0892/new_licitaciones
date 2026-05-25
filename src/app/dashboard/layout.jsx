import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getUserPermissionContext } from "@/lib/permissions"

import Sidebar from "@/components/layout/Sidebar"



export default async function DashboardLayout({ children }) {

  const session = await auth()



  if (!session) {

    redirect("/login")

  }



  const authorization = await getUserPermissionContext(session.user.id)

  return (
    <Sidebar
      permissions={authorization.permissions}
      isSuperAdmin={authorization.isSuperAdmin}
    >
      {children}
    </Sidebar>
  )

}
