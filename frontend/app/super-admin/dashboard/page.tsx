"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SuperAdminDashboard from "@/components/super-admin-dashboard"

export default function SuperAdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string>("")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const authToken = localStorage.getItem("token")

    if (userData && authToken) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === "super_admin") {
        setUser(parsedUser)
        setToken(authToken)
      } else {
        router.push("/login")
      }
    } else {
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/")
  }

  if (!user) return <div>Loading...</div>

  return <SuperAdminDashboard user={user} onLogout={handleLogout} token={token} />
}
