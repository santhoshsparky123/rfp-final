"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Edit, Mail } from "lucide-react"

export default function MyRFPsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [rfps, setRfps] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
      // Fetch user's RFPs here
    } else {
      router.push("/login")
    }
  }, [router])

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My RFPs</h1>
          <Button onClick={() => router.push("/employee/dashboard")}>Back to Dashboard</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned RFPs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No RFPs assigned to you.
                    </TableCell>
                  </TableRow>
                ) : (
                  rfps.map((rfp) => (
                    <TableRow key={rfp.id}>
                      <TableCell>{rfp.filename}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rfp.status}</Badge>
                      </TableCell>
                      <TableCell>{rfp.created_at}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="mr-2 bg-transparent">
                          <Download className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button size="sm" variant="outline" className="mr-2 bg-transparent">
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="h-4 w-4 mr-1" /> Messages
                        </Button>
                      </TableCell>
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
