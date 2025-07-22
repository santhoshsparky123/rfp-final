"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminDashboard from "@/components/admin-dashboard"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string>("")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const authToken = localStorage.getItem("token")

    if (userData && authToken) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === "admin") {
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
    router.push("/login")
  }

  if (!user) return <div>Loading...</div>

  return <AdminDashboard user={user} onLogout={handleLogout} token={token} />
}
