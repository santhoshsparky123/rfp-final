"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import EmployeeDashboard from "@/components/employee-dashboard"

export default function EmployeeDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const authToken = localStorage.getItem("token")

    if (userData) {
      setUser(JSON.parse(userData))
      setToken(authToken)
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

  return <EmployeeDashboard user={user} onLogout={handleLogout} token={token} />
}
