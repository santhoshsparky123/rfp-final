"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react" // Added useCallback
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
  Shield,
  UserPlus,
  Users,
  LogOut,
  Trash2,
  CheckCircle,
  AlertCircle,
  Mail,
  Calendar,
  FileText,
  Brain,
  Download,
  Eye,
  Activity,
  RollerCoaster,
} from "lucide-react"

interface AdminDashboardProps {
  user: {
    id: string
    email: string
    role: "admin"
    name: string
    company?: string // Assuming company is a string name
    company_id?: number // Added company_id
  }
  onLogout: () => void
  token: string // Added token prop for authorization
}

interface Worker {
  id: string
  name: string
  email: string
  created_at: string
  status: "active" | "inactive" // This might need to align with your backend's `is_active` boolean
  last_login?: string
  rfps_processed: number
  current_projects: number
  role: "employee" // Added role to align with backend
}

interface WorkerActivity {
  id: string
  worker_id: string
  worker_name: string
  action: string
  rfp_title: string
  timestamp: string
  status: "completed" | "in_progress" | "failed"
}

export default function AdminDashboard({ user, onLogout, token }: AdminDashboardProps) {
  const [workers, setWorkers] = useState<Worker[]>([]) // Initialize as empty
  const [activities, setActivities] = useState<WorkerActivity[]>([]) // Initialize as empty, will need backend for this

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [newWorker, setNewWorker] = useState({
    name: "",
    email: "",
    password: "",
  })

  // Function to fetch workers
  const fetchWorkers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/employees", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // Filter employees by company_id if present in user object
      const filteredWorkers = user.company_id
        ? data.filter((worker: any) => worker.company_id === user.company_id)
        : data;

      // Map backend data to frontend Worker interface
      setWorkers(
        filteredWorkers.map((worker: any) => ({
          id: worker.id.toString(),
          name: worker.name,
          email: worker.email,
          created_at: new Date(worker.created_at).toISOString().split("T")[0],
          status: worker.is_active ? "active" : "inactive", // Assuming backend has is_active
          last_login: worker.last_login ? new Date(worker.last_login).toISOString().split("T")[0] : undefined,
          rfps_processed: worker.rfps_processed || 0, // Assuming these fields exist or default to 0
          current_projects: worker.current_projects || 0, // Assuming these fields exist or default to 0
          role: worker.role
        })),
      )
    } catch (err: any) {
      setError(`Failed to fetch workers: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [token, user.company_id]) // Added user.company_id to dependencies

  useEffect(() => {
    if (token) {
      fetchWorkers()
      // You would also fetch activities here if you had a backend endpoint for them
      // For now, activities remain hardcoded or empty
    }
  }, [token, fetchWorkers])

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Debug: log payload
      const companyIdResponse = await fetch("http://localhost:8000/api/company_id/"+user.id)
      const companyId = await companyIdResponse.json()
      console.log("[CreateWorker] Fetched company_id:", companyId)
      const payload = {
        username: newWorker.name,
        email: newWorker.email,
        password: newWorker.password,
        company_id: companyId.company_id, // Pass company_id from logged-in admin
        role: "employee", // Corrected to lowercase 'role'
      };
      console.log("[CreateWorker] Payload:", payload);
      const response = await fetch("http://localhost:8000/api/admin/create-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error("[CreateWorker] Backend error:", errorData);
          errorMsg = errorData.detail || JSON.stringify(errorData) || errorMsg;
        } catch (e) {
          // If not JSON, just use text
          try {
            const text = await response.text();
            errorMsg = text || errorMsg;
          } catch {}
        }
        throw new Error(errorMsg);
      }

      const data = await response.json()
      setSuccess("Worker created successfully!")
      setNewWorker({ name: "", email: "", password: "" })
      setShowCreateDialog(false)
      fetchWorkers() // Refresh the list of workers
    } catch (err: any) {
      setError(`Failed to create worker: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (workerId: string, currentStatus: "active" | "inactive") => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Assuming you will add an endpoint like PUT /api/admin/employees/{employee_id}/status
      const response = await fetch(`/api/admin/employees/${workerId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_active: currentStatus === "inactive", // Toggle status
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      setSuccess("Worker status updated successfully!")
      fetchWorkers() // Refresh the list of workers
    } catch (err: any) {
      setError(`Failed to update worker status: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }


  const handleDeleteWorker = async (workerId: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin/remove-employee/${workerId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      setSuccess("Worker removed successfully!")
      fetchWorkers() // Refresh the list of workers
    } catch (err: any) {
      setError(`Failed to remove worker: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const totalRFPs = workers.reduce((sum, worker) => sum + worker.rfps_processed, 0)
  const activeWorkers = workers.filter((worker) => worker.status === "active").length
  const currentProjects = workers.reduce((sum, worker) => sum + worker.current_projects, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage workers and monitor RFP processing activities</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Shield className="w-4 h-4 text-blue-600" />
                {user.name}
              </div>
              <div className="text-xs text-gray-500">{user.company}</div>
              <Badge className="mt-1 bg-blue-100 text-blue-700 hover:bg-blue-200">Admin</Badge>
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
              title: "Total Workers",
              value: workers.length,
              icon: Users,
              color: "from-blue-500 to-blue-600",
              bgColor: "from-blue-50 to-blue-100",
            },
            {
              title: "Active Workers",
              value: activeWorkers,
              icon: CheckCircle,
              color: "from-green-500 to-green-600",
              bgColor: "from-green-50 to-green-100",
            },
            {
              title: "RFPs Processed",
              value: totalRFPs,
              icon: FileText,
              color: "from-purple-500 to-purple-600",
              bgColor: "from-purple-50 to-purple-100",
            },
            {
              title: "Active Projects",
              value: currentProjects,
              icon: Activity,
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
                  <p className="text-sm text-gray-600">Company wide</p>
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
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl text-blue-800">
                  <Users className="w-6 h-6" />
                  Worker Management
                </CardTitle>
                <p className="text-blue-700 mt-2">Manage your team and monitor their RFP processing activities</p>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add Worker
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                      Add New Worker
                    </DialogTitle>
                    <DialogDescription>Create a new worker account with RFP processing capabilities.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateWorker} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newWorker.name}
                        onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
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
                        value={newWorker.email}
                        onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                        placeholder="Enter email address"
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Initial Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newWorker.password}
                        onChange={(e) => setNewWorker({ ...newWorker, password: e.target.value })}
                        placeholder="Enter initial password"
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                      >
                        {loading ? "Creating..." : "Add Worker"}
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
            <Tabs defaultValue="workers" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-2xl">
                <TabsTrigger
                  value="workers"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Workers ({workers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Recent Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="workers" className="space-y-4">
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Worker</TableHead>
                        <TableHead className="font-semibold">RFPs Processed</TableHead>
                        <TableHead className="font-semibold">Current Projects</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Last Login</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workers.map((worker) => (
                        <TableRow key={worker.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{worker.name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {worker.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{worker.rfps_processed}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-xl">
                              {worker.current_projects} active
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={worker.status === "active" ? "default" : "secondary"}
                              className={`rounded-xl ${
                                worker.status === "active"
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {worker.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {worker.last_login ? (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="w-3 h-3" />
                                {worker.last_login}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="rounded-lg">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(worker.id, worker.status)}
                                className="rounded-lg"
                              >
                                {worker.status === "active" ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteWorker(worker.id)}
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

              <TabsContent value="activity" className="space-y-4">
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <Card key={activity.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-2 rounded-lg ${
                                activity.status === "completed"
                                  ? "bg-green-100"
                                  : activity.status === "in_progress"
                                    ? "bg-blue-100"
                                    : "bg-red-100"
                              }`}
                            >
                              {activity.action.includes("Generated") ? (
                                <Brain className="w-4 h-4 text-green-600" />
                              ) : activity.action.includes("Downloaded") ? (
                                <Download className="w-4 h-4 text-blue-600" />
                              ) : (
                                <FileText className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{activity.worker_name}</div>
                              <div className="text-sm text-gray-600">{activity.action}</div>
                              <div className="text-sm font-medium text-blue-600">{activity.rfp_title}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={activity.status === "completed" ? "default" : "outline"}
                              className={`rounded-xl mb-2 ${
                                activity.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : activity.status === "in_progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {activity.status.replace("_", " ")}
                            </Badge>
                            <div className="text-xs text-gray-500">{activity.timestamp}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}