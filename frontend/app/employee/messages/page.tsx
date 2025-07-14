"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import RFPMessagePage from "@/components/rfp-messages-page"

export default function MessagesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [selectedRfpId, setSelectedRfpId] = useState<number>(0)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push("/login")
    }

    // Get selected RFP ID from URL params or localStorage
    const rfpId = localStorage.getItem("selectedRfpId")
    if (rfpId) {
      setSelectedRfpId(Number.parseInt(rfpId))
    }
  }, [router])

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Messages</h1>
          <Button onClick={() => router.push("/employee/dashboard")}>Back to Dashboard</Button>
        </div>

        <RFPMessagePage
          user={{
            id: user.id,
            role: user.role,
            token: localStorage.getItem("token") || "",
          }}
          rfpId={selectedRfpId}
          isAdmin={user.role === "admin"}
        />
      </div>
    </div>
  )
}
