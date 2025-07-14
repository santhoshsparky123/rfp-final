"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function HistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [finishedRfps, setFinishedRfps] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
      // Fetch finished RFPs here
    } else {
      router.push("/login")
    }
  }, [router])

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">RFP History</h1>
          <Button onClick={() => router.push("/employee/dashboard")}>Back to Dashboard</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Completed RFPs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Completed Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finishedRfps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                      No completed RFPs yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  finishedRfps.map((rfp) => (
                    <TableRow key={rfp.id}>
                      <TableCell>{rfp.filename}</TableCell>
                      <TableCell>{rfp.completed_date}</TableCell>
                      <TableCell>Completed</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
