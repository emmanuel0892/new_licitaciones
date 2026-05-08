import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Sidebar from "@/components/layout/Sidebar"

export default async function DashboardLayout({ children }) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return <Sidebar>{children}</Sidebar>
}
