"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Crown, Users, LogOut, CheckCircle, AlertCircle, Building, Mail, Calendar, Activity } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface User {
  id: string
  email: string
  role: "super_admin"
  name: string
  company?: string
}

interface SuperAdminDashboardProps {
  user: User
  onLogout: () => void
  token: string
}

interface Company {
  id: number
  name: string
  subdomain: string
  subscription_status: string
  subscription_start?: string
  subscription_end?: string
  created_at?: string
  username?: string
  userid?: number
}

export default function SuperAdminDashboard({ user, onLogout, token }: SuperAdminDashboardProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalUsers, setTotalUsers] = useState<number>(0)

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("http://localhost:8000/api/all-companies", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication failed. Please log in again.")
          }
          const errorData = await response.json()
          throw new Error(errorData.detail || "Failed to fetch companies.")
        }

        const data = await response.json()
        setCompanies(data.companies || [])
        setTotalUsers(50)
      } catch (err: any) {
        console.error("Failed to fetch companies:", err)
        setError(err.message || "Failed to load company data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchCompanies()
    } else {
      setLoading(false)
      setError("Authentication token not found. Please log in.")
    }
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg-start to-dark-bg-end text-foreground dark:from-dark-bg-start dark:to-dark-bg-end">
      <div className="max-w-7xl mx-auto p-8">
        <header className="flex justify-between items-center mb-10 pb-5 border-b border-border">
          <div className="flex items-center space-x-4">
            <Crown className="w-10 h-10 text-yellow-400" />
            <h1 className="text-5xl font-extrabold text-foreground tracking-tight">Super Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={onLogout}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition duration-300 flex items-center space-x-2 dark:bg-red-700 dark:hover:bg-red-800"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {error && (
          <Alert
            variant="destructive"
            className="mb-6 rounded-xl border-destructive bg-destructive text-destructive-foreground dark:border-destructive dark:bg-destructive"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-card border border-border text-foreground rounded-xl shadow-lg dark:bg-card dark:border-border">
          <CardContent className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 bg-muted mb-6 rounded-lg p-1 dark:bg-muted">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md dark:data-[state=active]:bg-background"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="companies"
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md dark:data-[state=active]:bg-background"
                >
                  Companies
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="bg-muted/50 border border-border text-foreground rounded-xl shadow-md dark:bg-muted dark:border-border">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-foreground">System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-800/50 rounded-xl dark:bg-green-900/50">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="font-medium">System Status</span>
                          </div>
                          <Badge className="bg-green-600 text-white dark:bg-green-700">Operational</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-800/50 rounded-xl dark:bg-blue-900/50">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            <span className="font-medium">Total Users</span>
                          </div>
                          <Badge variant="outline" className="bg-blue-600 text-white dark:bg-blue-700">
                            {totalUsers}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-800/50 rounded-xl dark:bg-purple-900/50">
                          <div className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-purple-400" />
                            <span className="font-medium">Total Companies</span>
                          </div>
                          <Badge variant="outline" className="bg-purple-600 text-white dark:bg-purple-700">
                            {companies.length}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="companies" className="mt-4">
                <Card className="bg-muted/50 border border-border text-foreground rounded-xl shadow-md dark:bg-muted dark:border-border">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-foreground">Managed Companies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center p-8">
                        <Activity className="h-8 w-8 animate-spin text-blue-400" />
                        <p className="ml-4 text-lg">Loading companies...</p>
                      </div>
                    ) : companies.length === 0 ? (
                      <Alert className="rounded-xl border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <AlertDescription>No companies registered yet.</AlertDescription>
                      </Alert>
                    ) : (
                      <Table className="min-w-full divide-y divide-border dark:divide-border">
                        <TableHeader>
                          <TableRow className="bg-muted dark:bg-muted">
                            <TableHead className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider rounded-tl-lg">
                              Company Name
                            </TableHead>
                            <TableHead className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Subdomain
                            </TableHead>
                            <TableHead className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Subscription Status
                            </TableHead>
                            <TableHead className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Admin/User
                            </TableHead>
                            <TableHead className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider rounded-tr-lg">
                              Created At
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border dark:divide-border">
                          {companies.map((company) => (
                            <TableRow
                              key={company.id}
                              className="hover:bg-muted/20 transition-colors duration-200 dark:hover:bg-muted/50"
                            >
                              <TableCell className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                                {company.name}
                              </TableCell>
                              <TableCell className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                                {company.subdomain}
                              </TableCell>
                              <TableCell className="py-3 px-4 whitespace-nowrap">
                                <Badge
                                  className={`
                                ${company.subscription_status.toLowerCase() === "active" ? "bg-green-500 hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-800" : ""}
                                ${company.subscription_status.toLowerCase() === "trial" ? "bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-700 dark:hover:bg-yellow-800" : ""}
                                ${company.subscription_status.toLowerCase() === "inactive" ? "bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800" : ""}
                                text-white
                              `}
                                >
                                  {company.subscription_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 px-4 whitespace-nowrap text-muted-foreground flex items-center gap-2">
                                {company.username || "N/A"}
                                {company.username && <Mail className="w-4 h-4 text-blue-400" />}
                              </TableCell>
                              <TableCell className="py-3 px-4 whitespace-nowrap text-muted-foreground flex items-center gap-2">
                                {company.created_at ? new Date(company.created_at).toLocaleDateString() : "N/A"}
                                {company.created_at && <Calendar className="w-4 h-4 text-purple-400" />}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
