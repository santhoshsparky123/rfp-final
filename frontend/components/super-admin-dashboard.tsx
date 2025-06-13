"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Crown, Users, LogOut, CheckCircle, AlertCircle, Building, Mail, Calendar, Activity } from "lucide-react"

interface SuperAdminDashboardProps {
  user: {
    id: string
    email: string
    role: "super_admin"
    name: string
    company?: string
  }
  onLogout: () => void
}

interface Company {
  id: number
  name: string
  subdomain: string
  subscription_status: string
  subscription_start?: string
  subscription_end?: string
  created_at?: string
  admin?: {
    id: number
    username: string
    email: string
  }
}

export default function SuperAdminDashboard({ user, onLogout }: SuperAdminDashboardProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch("http://localhost:8000/api/all-companies", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to fetch companies")
      }

      const data = await response.json()
      setCompanies(data.companies || [])
    } catch (err) {
      console.error("Error fetching companies:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch companies")
    } finally {
      setLoading(false)
    }
  }

  const totalUsers = companies.reduce((sum, company) => sum + (company.admin ? 1 : 0), 0)
  const activeCompanies = companies.filter((company) => company.subscription_status === "active").length
  const expiredCompanies = companies.filter((company) => company.subscription_status === "expired").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Super Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage companies and oversee the entire system</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Crown className="w-4 h-4 text-purple-600" />
                {user.name}
              </div>
              <div className="text-xs text-gray-500">{user.email}</div>
              <Badge className="mt-1 bg-purple-100 text-purple-700 hover:bg-purple-200">Super Admin</Badge>
            </div>
            <Button variant="outline" onClick={onLogout} className="rounded-xl border-gray-300 hover:bg-gray-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Total Companies",
              value: companies.length,
              icon: Building,
              color: "from-blue-500 to-blue-600",
              bgColor: "from-blue-50 to-blue-100",
            },
            {
              title: "Active Companies",
              value: activeCompanies,
              icon: CheckCircle,
              color: "from-green-500 to-green-600",
              bgColor: "from-green-50 to-green-100",
            },
            {
              title: "Expired Companies",
              value: expiredCompanies,
              icon: AlertCircle,
              color: "from-red-500 to-red-600",
              bgColor: "from-red-50 to-red-100",
            },
            {
              title: "Total Users",
              value: totalUsers,
              icon: Users,
              color: "from-purple-500 to-purple-600",
              bgColor: "from-purple-50 to-purple-100",
            },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.title}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${stat.color}`} />
                <CardHeader className={`pb-3 bg-gradient-to-br ${stat.bgColor}`}>
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div
                    className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}
                  >
                    {stat.value}
                  </div>
                  <p className="text-sm text-gray-600">System wide</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6 rounded-xl border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500" />
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
                  <Building className="w-6 h-6" />
                  Company Management
                </CardTitle>
                <p className="text-purple-700 mt-2">Monitor and manage all companies in the system</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs defaultValue="companies" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-2xl">
                <TabsTrigger
                  value="companies"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Building className="w-4 h-4 mr-2" />
                  Companies ({companies.length})
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  System Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="companies" className="space-y-4">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading companies...</p>
                  </div>
                ) : companies.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Companies Found</h3>
                    <p className="text-gray-600">No companies have been created yet</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Company</TableHead>
                          <TableHead className="font-semibold">Subdomain</TableHead>
                          <TableHead className="font-semibold">Admin</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Subscription</TableHead>
                          <TableHead className="font-semibold">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companies.map((company) => (
                          <TableRow key={company.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <Building className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{company.name}</div>
                                  <div className="text-sm text-gray-500">ID: {company.id}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-blue-600">{company.subdomain}.rfp.com</div>
                            </TableCell>
                            <TableCell>
                              {company.admin ? (
                                <div>
                                  <div className="font-medium text-gray-900">{company.admin.username}</div>
                                  <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {company.admin.email}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">No admin assigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`rounded-xl ${
                                  company.subscription_status === "active"
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : company.subscription_status === "expired"
                                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                }`}
                              >
                                {company.subscription_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {company.subscription_end ? (
                                <div className="text-sm">
                                  <div className="text-gray-900">
                                    Expires: {new Date(company.subscription_end).toLocaleDateString()}
                                  </div>
                                  {company.subscription_start && (
                                    <div className="text-gray-500">
                                      Started: {new Date(company.subscription_start).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">No subscription</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {company.created_at ? (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(company.created_at).toLocaleDateString()}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">Unknown</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">Subscription Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Active</div>
                              <div className="text-xs text-gray-500">Companies with active subscriptions</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {activeCompanies}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Expired</div>
                              <div className="text-xs text-gray-500">Companies with expired subscriptions</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {expiredCompanies}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium">System Status</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Operational</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">Total Users</span>
                          </div>
                          <Badge variant="outline">{totalUsers}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-purple-600" />
                            <span className="font-medium">Total Companies</span>
                          </div>
                          <Badge variant="outline">{companies.length}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
