"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import FinalProposal from "@/components/final-proposal"

export default function FinalProposalPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [editedResponse, setEditedResponse] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push("/login")
    }

    // Get edited response from localStorage
    const storedResponse = localStorage.getItem("editedResponse")
    if (storedResponse) {
      setEditedResponse(JSON.parse(storedResponse))
    }
  }, [router])

  const handleProposalGenerated = () => {
    router.push("/employee/dashboard")
  }

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Final Proposal</h1>
          <Button onClick={() => router.push("/employee/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <FinalProposal editedResponse={editedResponse} onProposalGenerated={handleProposalGenerated} />
      </div>
    </div>
  )
}
