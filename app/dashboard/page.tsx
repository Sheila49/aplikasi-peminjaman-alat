import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const store = await cookies()
  const token = store.get("auth_token")?.value
  const role = store.get("role")?.value

  if (!token) {
    redirect("/login")
  }

  if (!role) {
    redirect("/login")
  }

  redirect(`/dashboard/${role}`)
}