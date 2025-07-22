"use client"

import { useRouter } from "next/navigation"
import Login from "@/components/login"

export default function RegisterPage() {
  const router = useRouter()

  const handleLogin = (user: {
    id: string
    email: string
    role: "super_admin" | "admin" | "employee" | "user"
    name: string
    company?: string
  }) => {
    localStorage.setItem("user", JSON.stringify(user))
    router.push("/user/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Login onLogin={handleLogin} />
    </div>
  )
}
