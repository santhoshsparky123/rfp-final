"use client"

import { useRouter } from "next/navigation"
import Login from "@/components/login"
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter()

  // Remove the useEffect that manipulates the dark class

  const handleLogin = (user: {
    id: string
    email: string
    role: "super_admin" | "admin" | "employee" | "user"
    name: string
    company?: string
  }) => {
    localStorage.setItem("user", JSON.stringify(user))

    if (user.role === "super_admin") {
      router.push("/super-admin/dashboard")
    } else if (user.role === "admin") {
      router.push("/admin/dashboard")
    } else if (user.role === "employee") {
      router.push("/employee/dashboard")
    } else {
      router.push("/user/dashboard")
    }
  }

  return <Login onLogin={handleLogin} />
}
