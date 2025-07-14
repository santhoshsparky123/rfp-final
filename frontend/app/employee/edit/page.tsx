"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import RFPProposalEdit from "@/components/rfp-proposal-edit"

export default function EditResponsePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const [rfpId, setRfpId] = useState<number | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const authToken = localStorage.getItem("token")

    if (userData) {
      setUser(JSON.parse(userData))
      setToken(authToken)
    } else {
      router.push("/login")
    }

    // Get current RFP ID from localStorage
    const currentRfpId = localStorage.getItem("currentRfpId")
    if (currentRfpId) {
      setRfpId(Number.parseInt(currentRfpId))
    }
  }, [router])

  const handleFinal = () => {
    router.push("/final-proposal")
  }

  if (!user || !rfpId) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <RFPProposalEdit
        rfpId={rfpId}
        token={token || ""}
        pdfUrl=""
        onFinal={handleFinal}
        filename={`RFP_${rfpId}.pdf`}
      />
    </div>
  )
}
