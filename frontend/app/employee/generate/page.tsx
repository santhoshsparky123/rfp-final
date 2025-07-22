"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ResponseGeneration from "@/components/response-generation"

export default function GenerateResponsePage() {
  const router = useRouter()
  const [rfpData, setRfpData] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
    }

    // Get RFP data from localStorage or state management
    const storedRfpData = localStorage.getItem("currentRfpData")
    if (storedRfpData) {
      setRfpData(JSON.parse(storedRfpData))
    }
  }, [router])

  const handleResponseGenerated = (response: any) => {
    localStorage.setItem("generatedResponse", JSON.stringify(response))
    router.push("/employee/edit")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <ResponseGeneration rfpData={rfpData} onResponseGenerated={handleResponseGenerated} />
    </div>
  )
}
