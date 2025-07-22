"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import CompanyDocsUpload from "@/components/company-docs-upload"

export default function CompanyDocsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [docsStatus, setDocsStatus] = useState({
    exists: false,
    count: 0,
  })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push("/login")
    }
  }, [router])

  const handleUploadSuccess = (status: any) => {
    setDocsStatus(status)
  }

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Company Documents</h1>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <CompanyDocsUpload onUploadSuccess={handleUploadSuccess} existingDocsStatus={docsStatus} />
      </div>
    </div>
  )
}
