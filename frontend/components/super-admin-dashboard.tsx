"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Crown,
  UserPlus,
  Users,
  Shield,
  LogOut,
  Trash2,
  CheckCircle,
  AlertCircle,
  Building,
  Mail,
  Calendar,
} from "lucide-react"

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

interface Admin {
  id: string
  name: string
  email: string
  company: string
  created_at: string
  status: "active" | "inactive"
  workers_count: number
  last_login?: string
}

export default function SuperAdminDashboard({ user, onLogout }: SuperAdminDashboardProps) {
  const [admins, setAdmins] = useState<Admin[]>([
    {
      id: "1",
      name: "John Admin",
      email: "john@techcorp.com",
      company: "TechCorp Solutions",
      created_at: "2024-01-15",
      status: "active",
      workers_count: 5,
      last_login: "2024-01-20",
    },
    {
      id: "2",
      name: "Sarah Manager",
      email: "sarah@innovate.com",
      company: "Innovate Inc",
      created_at: "2024-01-10",
      status: "active",
      workers_count: 3,
      last_login: "2024-01-19",
    },
  ])

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    company: "",
    password: "",
  })

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const admin: Admin = {
        id: Date.now().toString(),
        name: newAdmin.name,
        email: newAdmin.email,
        company: newAdmin.company,
        created_at: new Date().toISOString().split("T")[0],
        status: "active",
        workers_count: 0,
      }

      setAdmins([...admins, admin])
      setSuccess("Admin created successfully!")
      setNewAdmin({ name: "", email: "", company: "", password: "" })
      setShowCreateDialog(false)
    } catch (err) {
      setError("Failed to create admin. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = (adminId: string) => {
    setAdmins(
      admins.map((admin) =>
        admin.id === adminId ? { ...admin, status: admin.status === "active" ? "inactive" : "active" } : admin,
      ),
    )
  }

  const handleDeleteAdmin = (adminId: string) => {
    setAdmins(admins.filter((admin) => admin.id !== adminId))
  }

  const totalWorkers = admins.reduce((sum, admin) => sum + admin.workers_count, 0)
  const activeAdmins = admins.filter((admin) => admin.status === "active").length

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
              <p className="text-gray-600 mt-1">Manage administrators and oversee the entire system</p>
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
              title: "Total Admins",
              value: admins.length,
              icon: Shield,
              color: "from-blue-500 to-blue-600",
              bgColor: "from-blue-50 to-blue-100",
            },
            {
              title: "Active Admins",
              value: activeAdmins,
              icon: CheckCircle,
              color: "from-green-500 to-green-600",
              bgColor: "from-green-50 to-green-100",
            },
            {
              title: "Total Workers",
              value: totalWorkers,
              icon: Users,
              color: "from-purple-500 to-purple-600",
              bgColor: "from-purple-50 to-purple-100",
            },
            {
              title: "Companies",
              value: new Set(admins.map((a) => a.company)).size,
              icon: Building,
              color: "from-orange-500 to-orange-600",
              bgColor: "from-orange-50 to-orange-100",
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

        {success && (
          <Alert className="mb-6 rounded-xl border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500" />
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
                  <Shield className="w-6 h-6" />
                  Administrator Management
                </CardTitle>
                <p className="text-purple-700 mt-2">Create and manage system administrators</p>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl shadow-lg">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-purple-600" />
                      Create New Administrator
                    </DialogTitle>
                    <DialogDescription>
                      Create a new administrator account with company management privileges.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        placeholder="Enter full name"
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        placeholder="Enter email address"
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        value={newAdmin.company}
                        onChange={(e) => setNewAdmin({ ...newAdmin, company: e.target.value })}
                        placeholder="Enter company name"
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Initial Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        placeholder="Enter initial password"
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
                      >
                        {loading ? "Creating..." : "Create Admin"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs defaultValue="admins" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-2xl">
                <TabsTrigger
                  value="admins"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Administrators ({admins.length})
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  System Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="admins" className="space-y-4">
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Administrator</TableHead>
                        <TableHead className="font-semibold">Company</TableHead>
                        <TableHead className="font-semibold">Workers</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Last Login</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Shield className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{admin.name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {admin.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{admin.company}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-xl">
                              {admin.workers_count} workers
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={admin.status === "active" ? "default" : "secondary"}
                              className={`rounded-xl ${
                                admin.status === "active"
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {admin.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {admin.last_login ? (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="w-3 h-3" />
                                {admin.last_login}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(admin.id)}
                                className="rounded-lg"
                              >
                                {admin.status === "active" ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAdmin(admin.id)}
                                className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">Admin Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {admins.slice(0, 3).map((admin) => (
                          <div key={admin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Shield className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{admin.name}</div>
                                <div className="text-xs text-gray-500">{admin.company}</div>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {admin.workers_count} workers
                            </Badge>
                          </div>
                        ))}
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
                            <span className="font-medium">Active Users</span>
                          </div>
                          <Badge variant="outline">{activeAdmins + totalWorkers}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-purple-600" />
                            <span className="font-medium">Companies</span>
                          </div>
                          <Badge variant="outline">{new Set(admins.map((a) => a.company)).size}</Badge>
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
