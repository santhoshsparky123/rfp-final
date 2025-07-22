"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import RFPUpload from "@/components/rfp-upload"

export default function EmployeeUploadPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const authToken = localStorage.getItem("token")

    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === "employee") {
        setUser(parsedUser)
        setToken(authToken)
      } else {
        router.push("/login")
      }
    } else {
      router.push("/login")
    }
  }, [router])

  const handleUploadSuccess = (data: any) => {
    localStorage.setItem("currentRfpData", JSON.stringify(data))
    router.push("/employee/generate")
  }

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Upload RFP Document</h1>
          <Button onClick={() => router.push("/employee/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <RFPUpload
          onUploadSuccess={handleUploadSuccess}
          userContext={{
            userId: Number.parseInt(user.id, 10),
            companyId: 1,
            employeeId: Number.parseInt(user.id, 10),
            authToken: token,
            filename: localStorage.getItem("selectedFilename") || undefined,
          }}
        />
      </div>
    </div>
  )
}
