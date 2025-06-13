"use client"

import { useState, useEffect, useCallback, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Upload,
  Brain,
  Download,
  CheckCircle,
  Edit,
  LogOut,
  Home,
  History,
  User,
  Menu,
  X,
  Zap,
  Activity, // Added for loading indicator
  AlertCircle, // Added for error indicator
} from "lucide-react"
import RFPUpload from "@/components/rfp-upload"
import CompanyDocsUpload from "@/components/company-docs-upload"
import ResponseGeneration from "@/components/response-generation"
import ProposalEditor from "@/components/proposal-editor"
import FinalProposal from "@/components/final-proposal"
import { Alert, AlertDescription } from "@/components/ui/alert" // Added for Alert component
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface EmployeeDashboardProps {
  user: {
    id: string
    email: string
    role: "employee"
    name: string
    company?: string
  }
  onLogout: () => void
  token: string // Assuming token is passed from parent for API calls
}

interface RFPData {
  rfp_id: string
  message: string
  structured_data: {
    metadata: any
    sections: any[]
    questions: any[]
    requirements: any[]
  }
}

interface GeneratedResponse {
  rfp_id: string
  metadata: any
  sections: any[]
  questions: any[]
  requirements: any[]
}

interface CompanyDocsStatus {
  exists: boolean
  count: number
  vector_store_id?: string
  last_updated?: string
}

interface RFP { // Re-defining RFP interface for clarity in employee dashboard
  id: number
  filename: string
  content_type: string
  status: "pending" | "in_progress" | "completed" | "assigned"
  created_at: string
}


export default function EmployeeDashboard({ user, onLogout, token }: EmployeeDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [rfpData, setRFPData] = useState<RFPData | null>(null)
  const [companyDocsStatus, setCompanyDocsStatus] = useState<CompanyDocsStatus>({ exists: true, count: 5 })
  const [generatedResponse, setGeneratedResponse] = useState<GeneratedResponse | null>(null)
  const [editedResponse, setEditedResponse] = useState<GeneratedResponse | null>(null)
  const [finalProposalGenerated, setFinalProposalGenerated] = useState(false)
  const [assignedRfps, setAssignedRfps] = useState<RFP[]>([]) // New state for assigned RFPs

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "upload", label: "Upload RFP", icon: Upload },
    { id: "docs", label: "Company Docs", icon: FileText },
    { id: "generate", label: "Generate Response", icon: Brain },
    { id: "edit", label: "Review & Edit", icon: Edit },
    { id: "final", label: "Final Proposal", icon: Download },
    { id: "my-rfps", label: "My RFPs", icon: FileText }, // New item for assigned RFPs
    { id: "history", label: "History", icon: History },
    // Removed "Settings"
  ]

  const handleRFPUpload = (data: RFPData) => {
    setRFPData(data)
    setActiveSection("generate")
  }

  const handleCompanyDocsUpload = (status: CompanyDocsStatus) => {
    setCompanyDocsStatus(status)
  }

  const handleResponseGenerated = (response: GeneratedResponse) => {
    setGeneratedResponse(response)
    setActiveSection("edit")
  }

  const handleResponseEdited = (editedResponse: GeneratedResponse) => {
    setEditedResponse(editedResponse)
    setActiveSection("final")
  }

  const handleFinalProposal = () => {
    setFinalProposalGenerated(true)
  }

  useEffect(() => {
    fetchAssignedRfps()
  }, [user.id, token]) // Fetch assigned RFPs when user ID or token changes

  // Function to fetch assigned RFPs for the employee
  const fetchAssignedRfps = async () => {
    setLoading(true)
    setError(null)
    try {
      // Assuming a new API endpoint for fetching RFPs assigned to a specific employee
      const response = await fetch(`http://localhost:8000/api/employee/get_assigned_rfps/${user.id}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const rawData = await response.json()

      // Accepts either {rfps: [...]} or just an array
      let fetchedRfps: any[] = [];
      if (Array.isArray(rawData)) {
        fetchedRfps = rawData;
      } else if (Array.isArray(rawData.rfps)) {
        fetchedRfps = rawData.rfps;
      } else {
        throw new Error("Backend response is not an array or does not contain an 'rfps' array.");
      }
      setAssignedRfps(
        fetchedRfps.map((rfp: any) => ({
          id: rfp.id,
          filename: rfp.filename,
          content_type: rfp.content_type,
          status: rfp.status,
          created_at: rfp.created_at ? new Date(rfp.created_at).toLocaleDateString() : "N/A",
        })),
      )
    } catch (err: any) {
      console.error("Error fetching assigned RFPs:", err)
      setError(`Failed to fetch assigned RFPs: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // useEffect(() => {
  //   if (activeSection === "my-rfps") {
  //     fetchAssignedRfps()
  //   }
  // }, [activeSection])

  const handleDownloadRFP = async (rfpId: number, filename: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`http://localhost:8000/api/download_rfp/${rfpId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(`RFP ${filename} downloaded successfully!`);
    } catch (err: any) {
      setError(`Failed to download RFP: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // New function to handle marking an RFP as completed
  const handleMarkAsCompleted = async (rfpId: number) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`http://localhost:8000/api/rfp/${rfpId}/complete`, {
        method: "PUT", // Or PATCH, depending on your backend
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "completed" }), // Send the new status
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      // Update the status of the specific RFP in the local state
      setAssignedRfps(prevRfps =>
        prevRfps.map(rfp =>
          rfp.id === rfpId ? { ...rfp, status: "completed" } : rfp
        )
      )

      setSuccess(`RFP marked as completed successfully!`);
    } catch (err: any) {
      setError(`Failed to mark RFP as completed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
                  <p className="text-gray-600 mt-1">Ready to process some RFPs today?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Upload RFP</h3>
                    <p className="text-sm text-gray-600 mb-4">Start by uploading your RFP document</p>
                    <Button onClick={() => setActiveSection("upload")} className="w-full bg-blue-600 hover:bg-blue-700">
                      Get Started
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <Brain className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">AI Processing</h3>
                    <p className="text-sm text-gray-600 mb-4">Let AI generate comprehensive responses</p>
                    <Button
                      onClick={() => setActiveSection("generate")}
                      disabled={!rfpData}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Generate
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <Edit className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Review & Edit</h3>
                    <p className="text-sm text-gray-600 mb-4">Fine-tune the generated responses</p>
                    <Button
                      onClick={() => setActiveSection("edit")}
                      disabled={!generatedResponse}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      Review
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Progress Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Current Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { step: "Upload RFP", completed: !!rfpData, icon: Upload },
                    { step: "Generate Response", completed: !!generatedResponse, icon: Brain },
                    { step: "Review & Edit", completed: !!editedResponse, icon: Edit },
                    { step: "Final Proposal", completed: finalProposalGenerated, icon: Download },
                  ].map((item, index) => {
                    const Icon = item.icon
                    return (
                      <div key={item.step} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                        <div className={`p-2 rounded-lg ${item.completed ? "bg-green-100" : "bg-gray-200"}`}>
                          <Icon className={`w-5 h-5 ${item.completed ? "text-green-600" : "text-gray-400"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.step}</div>
                        </div>
                        {item.completed && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: "RFPs Processed", value: "12", icon: FileText, color: "blue" },
                { title: "Responses Generated", value: "8", icon: Brain, color: "green" },
                { title: "Reviews Completed", value: "6", icon: Edit, color: "orange" },
                { title: "Final Proposals", value: "5", icon: Download, color: "purple" },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.title} className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <Icon className={`w-8 h-8 text-${stat.color}-600`} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )

      case "upload":
        return <RFPUpload onUploadSuccess={handleRFPUpload} />

      case "docs":
        return <CompanyDocsUpload onUploadSuccess={handleCompanyDocsUpload} existingDocsStatus={companyDocsStatus} />

      case "generate":
        return <ResponseGeneration rfpData={rfpData} onResponseGenerated={handleResponseGenerated} />

      case "edit":
        return <ProposalEditor generatedResponse={generatedResponse} onResponseEdited={handleResponseEdited} />

      case "final":
        return <FinalProposal editedResponse={editedResponse} onProposalGenerated={handleFinalProposal} />

      case "my-rfps": // New case for displaying assigned RFPs
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">My Assigned RFPs</h2>
              <p className="text-gray-600">View and download RFPs assigned to you.</p>
            </div>

            {loading && (
              <Alert className="mb-4 bg-blue-100 border-blue-200 text-blue-700 rounded-xl">
                <Activity className="h-4 w-4" />
                <AlertDescription>Loading assigned RFPs...</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="mb-4 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4 bg-green-100 border-green-200 text-green-700 rounded-xl">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Card className="border-0 shadow-lg">
              <CardContent className="p-0"> {/* Removed padding for full-width table */}
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Filename</TableHead>
                      <TableHead>Status</TableHead>
                      {/* <TableHead>Assigned By</TableHead> */}
                      <TableHead>Assigned Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedRfps.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No RFPs assigned to you.
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignedRfps.map((rfp) => (
                        <TableRow key={rfp.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{rfp.filename}</TableCell>
                          <TableCell>
                            <Badge
                              variant={rfp.status === "completed" ? "default" : "outline"}
                              className={`rounded-xl ${
                                rfp.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : rfp.status === "in_progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : rfp.status === "assigned"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-green-100 text-green-700"
                              }`}
                            >
                              {rfp.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          {/*<TableCell className="text-gray-700">{rfp.uploaded_by_name}</TableCell> {/* Assuming assigned_by_name means the uploader */}
                          <TableCell className="text-gray-500">{rfp.created_at}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-purple-600 border-purple-600 hover:bg-purple-50 rounded-lg mr-2" // Added margin-right
                              onClick={() => handleDownloadRFP(rfp.id, rfp.filename)}
                            >
                              <Download className="h-4 w-4 mr-1" /> Download
                            </Button>
                            <Button
                              variant="default" // You can choose a different variant
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                              onClick={() => handleMarkAsCompleted(rfp.id)}
                              disabled={rfp.status === "completed"} // Disable if already completed
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> {rfp.status === "completed" ? "Completed" : "Mark as Completed"}
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
        )

      case "history":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">RFP History</h2>
              <p className="text-gray-600">View your past RFP processing activities</p>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No History Yet</h3>
                <p className="text-gray-600">Your RFP processing history will appear here</p>
              </CardContent>
            </Card>
          </div>
        )

      // Removed "settings" case

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">RFP Pro</h1>
              <p className="text-xs text-gray-500">Employee Portal</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              const isDisabled =
                (item.id === "generate" && !rfpData) ||
                (item.id === "edit" && !generatedResponse) ||
                (item.id === "final" && !editedResponse)

              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && setActiveSection(item.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : isDisabled
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />}
                </button>
              )
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.company}</p>
            </div>
            <Badge className="bg-green-100 text-green-700 text-xs">Employee</Badge>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className="w-full rounded-xl border-gray-300 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 capitalize">
                  {activeSection === "dashboard" ? "Dashboard" : activeSection.replace("-", " ")}
                </h1>
                <p className="text-sm text-gray-500">
                  {activeSection === "dashboard" && "Overview of your RFP processing workflow"}
                  {activeSection === "upload" && "Upload and process new RFP documents"}
                  {activeSection === "docs" && "Manage company documentation"}
                  {activeSection === "generate" && "Generate AI-powered responses"}
                  {activeSection === "edit" && "Review and edit generated responses"}
                  {activeSection === "final" && "Finalize and download proposals"}
                  {activeSection === "my-rfps" && "View RFPs assigned to you"}
                  {activeSection === "history" && "View past RFP processing activities"}
                  {activeSection === "settings" && "Manage your account settings"}
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="hidden md:flex items-center gap-2">
              {[
                { step: "Upload", completed: !!rfpData, icon: Upload },
                { step: "Generate", completed: !!generatedResponse, icon: Brain },
                { step: "Edit", completed: !!editedResponse, icon: Edit },
                { step: "Final", completed: finalProposalGenerated, icon: Download },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={item.step} className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${item.completed ? "bg-green-100" : "bg-gray-100"}`}>
                      <Icon className={`w-4 h-4 ${item.completed ? "text-green-600" : "text-gray-400"}`} />
                    </div>
                    {index < 3 && <div className={`w-8 h-0.5 ${item.completed ? "bg-green-300" : "bg-gray-200"}`} />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">{renderContent()}</div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}