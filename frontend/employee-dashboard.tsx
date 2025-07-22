"use client"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
  Activity,
  AlertCircle,
  Mail,
} from "lucide-react"
import RFPUpload from "@/components/rfp-upload"
import ResponseGeneration from "@/components/response-generation"
import RFPProposalEdit from "@/components/rfp-proposal-edit"
import FinalProposal from "@/components/final-proposal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import RFPMessagePage from "@/components/rfp-messages-page"
import { ThemeToggle } from "@/components/theme-toggle"

interface EmployeeDashboardProps {
  user: {
    id: string
    email: string
    role: "employee"
    name: string
    company: string
  }
  onLogout: () => void
  token: string | null
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

interface RFP {
  id: number
  filename: string
  content_type: string
  status: "pending" | "in_progress" | "finished" | "assigned" | "pending_review"
  created_at: string
  file_url: string
  docx_url?: string
  pdf_url?: string
}

export default function EmployeeDashboard({ user, onLogout, token }: EmployeeDashboardProps) {
  console.log("EmployeeDashboard received token:", token)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [rfpData, setRFPData] = useState<RFPData | null>(null)
  const [companyDocsStatus, setCompanyDocsStatus] = useState<CompanyDocsStatus>({ exists: true, count: 5 })
  const [generatedResponse, setGeneratedResponse] = useState<GeneratedResponse | null>(null)
  const [editedResponse, setEditedResponse] = useState<GeneratedResponse | null>(null)
  const [finalProposalGenerated, setFinalProposalGenerated] = useState(false)
  const [assignedRfps, setAssignedRfps] = useState<RFP[]>([])
  const [finishedRfps, setfinishedRfps] = useState<{ id: number; filename: string }[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pendingRfpId, setPendingRfpId] = useState<number | null>(null)
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null)
  const [selectedFileUrlForPreview, setSelectedFileUrlForPreview] = useState<string | null>(null)
  const [selectedRfpId, setSelectedRfpId] = useState<number | null>(null)
  const [editRfpId, setEditRfpId] = useState<number | null>(null)
  const [editModeFromGenerated, setEditModeFromGenerated] = useState<boolean>(false)
  const [companyName, setCompanyName] = useState<string>(user.company || "")

  const router = useRouter()

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "generate", label: "Generate Response", icon: Brain },
    { id: "edit", label: "Review & Edit", icon: Edit },
    { id: "my-rfps", label: "My RFPs", icon: FileText },
    { id: "history", label: "History", icon: History },
    { id: "messages", label: "Messages", icon: Mail },
  ]

  const handleRFPUpload = (data: RFPData) => {
    setRFPData(data)
    setActiveSection("generate")
    setSelectedFilename(null)
    setSelectedFileUrlForPreview(null)
  }

  const handleCompanyDocsUpload = (status: CompanyDocsStatus) => {
    setCompanyDocsStatus(status)
  }

  const handleResponseGenerated = async (response: any) => {
    try {
      const res = await fetch("http://localhost:8000/api/going_to_edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      })
      if (!res.ok) throw new Error("Failed to generate proposal draft")
      const data = await res.json()
      setGeneratedResponse(data.prompt)
      setEditRfpId(response.rfp_id)
      setEditModeFromGenerated(true)
      setActiveSection("edit")
    } catch (err) {
      setError("Failed to generate proposal draft")
    }
  }

  const handleResponseEdited = (editedResponse: GeneratedResponse) => {
    setEditedResponse(editedResponse)
    setActiveSection("final")
  }

  const handleFinalProposal = () => {
    setFinalProposalGenerated(true)
  }

  useEffect(() => {
    if (token) {
      fetchAssignedRfps()
      fetchFinishedRfps()
    } else {
      setError("Authentication token is missing. Please log in to view assigned RFPs.")
      setAssignedRfps([])
      setfinishedRfps([])
    }
  }, [user.id, token])

  useEffect(() => {
    if (activeSection === "history" && token) {
      fetchFinishedRfps()
    }
  }, [activeSection, token])
  useEffect(() => {
    async function fetchCompanyName() {
      if (user.id && token) {
        try {
          const res = await fetch(`http://localhost:8000/api/employee/company_name/${user.id}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
          if (!res.ok) return
          const data = await res.json()
          if (data && data.company_name) setCompanyName(data.company_name)
        } catch (e) {
          // fallback: do nothing
        }
      }
    }
    fetchCompanyName()
  }, [user.id, token])

  const fetchAssignedRfps = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!token) {
        throw new Error("Authentication token is missing. Cannot fetch assigned RFPs.")
      }

      const response = await fetch(`http://localhost:8000/api/employee/get_assigned_rfps/${user.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const rawData = await response.json()

      let fetchedRfps: any[] = []
      if (Array.isArray(rawData)) {
        fetchedRfps = rawData
      } else if (Array.isArray(rawData.rfps)) {
        fetchedRfps = rawData.rfps
      } else {
        throw new Error("Backend response is not an array or does not contain an 'rfps' array.")
      }
      setAssignedRfps(
        fetchedRfps.map((rfp: any) => ({
          id: rfp.id,
          filename: rfp.filename,
          content_type: rfp.content_type,
          status: rfp.status,
          created_at: rfp.created_at ? new Date(rfp.created_at).toLocaleDateString() : "N/A",
          file_url: rfp.file_url,
          docx_url: rfp.docx_url,
          pdf_url: rfp.pdf_url,
        })),
      )
    } catch (err: any) {
      console.error("Error fetching assigned RFPs:", err)
      setError(`Failed to fetch assigned RFPs: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchFinishedRfps = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!token) {
        throw new Error("Authentication token is missing. Cannot fetch finished RFPs.")
      }
      const response = await fetch(`http://localhost:8000/api/employee/completed_rfps/${user.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }
      const rawData = await response.json()
      let fetchedRfps: any[] = []
      if (Array.isArray(rawData)) {
        fetchedRfps = rawData
      } else if (Array.isArray(rawData.rfps)) {
        fetchedRfps = rawData.rfps
      } else {
        throw new Error("Backend response is not an array or does not contain an 'rfps' array.")
      }
      setfinishedRfps(
        fetchedRfps
          .filter((rfp: any) => rfp && typeof rfp.filename === "string" && rfp.filename.trim() !== "")
          .map((rfp: any, idx: number) => ({
            id: idx,
            filename: rfp.filename,
          })),
      )
    } catch (err: any) {
      console.error("Error fetching finished RFPs:", err)
      setError(`Failed to fetch finished RFPs: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadFile = async (url: string | undefined, filename: string) => {
    if (!url) {
      setError(`No download URL available for ${filename}.`)
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download ${filename}: ${response.statusText}`)
      }
      const blob = await response.blob()
      const link = document.createElement("a")
      link.href = window.URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(link.href)
      setSuccess(`${filename} downloaded successfully!`)
    } catch (err: any) {
      setError(`Error downloading ${filename}: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsfinished = async (rfpId: number) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!token) {
        throw new Error("Authentication token is missing. Cannot mark RFP as finished.")
      }
      const response = await fetch(`http://localhost:8000/api/rfp/${rfpId}/complete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "pending_review" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      setAssignedRfps((prevRfps) =>
        prevRfps.map((rfp) => (rfp.id === rfpId ? { ...rfp, status: "pending_review" } : rfp)),
      )

      setSuccess(`RFP marked as finished and sent for admin review!`)
    } catch (err: any) {
      setError(`Failed to mark RFP as finished: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleViewOriginalRFP = async (rfpId: number, fileUrl: string, filename?: string) => {
    try {
      if (!token) {
        throw new Error("Authentication token is missing. Cannot set current RFP.")
      }
      await fetch(`http://localhost:8000/api/set_current_rfp/${user.id}?rfp_id=${rfpId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      setPdfUrl(fileUrl)
      setPendingRfpId(rfpId)
      setSelectedFilename(filename || null)
      setSelectedFileUrlForPreview(fileUrl || null)
      setPdfModalOpen(true)
    } catch (err) {
      alert("Failed to set current RFP. Please try again.")
    }
  }

  const renderContent = () => {
    const myRfps = assignedRfps.filter((rfp) => rfp.status === "assigned")
    const finishedRfps = assignedRfps.filter((rfp) => rfp.status === "finished")

    return (
      <div className="space-y-8">
        {!token && (
          <Alert variant="destructive" className="mb-4 rounded-xl bg-destructive text-destructive-foreground">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Authentication token is missing. Please ensure you are logged in correctly. Functionality requiring
              authentication might not work.
            </AlertDescription>
          </Alert>
        )}

        {(() => {
          switch (activeSection) {
            case "dashboard":
              return (
                <>
                  <div className="bg-gradient-to-r from-light-bg-start to-light-bg-mid rounded-2xl p-8 border border-light-card-border dark:from-dark-bg-start dark:to-dark-bg-mid dark:border-dark-card-border">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg dark:from-blue-700 dark:to-indigo-800">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                          Welcome back, {user.name}!
                        </h1>
                        <p className="text-light-text-secondary mt-1 dark:text-dark-text-secondary">
                          Ready to process some RFPs today?
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-card text-foreground dark:bg-card dark:text-foreground">
                        <CardContent className="p-6 text-center">
                          <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4 dark:text-blue-400" />
                          <h3 className="font-semibold text-light-text-primary mb-2 dark:text-dark-text-primary">
                            Upload RFP
                          </h3>
                          <p className="text-sm text-light-text-secondary mb-4 dark:text-dark-text-secondary">
                            Start by uploading your RFP document
                          </p>
                          <Button
                            onClick={() => setActiveSection("my-rfps")}
                            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                          >
                            View My RFPs
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-card text-foreground dark:bg-card dark:text-foreground">
                        <CardContent className="p-6 text-center">
                          <Brain className="w-12 h-12 text-green-600 mx-auto mb-4 dark:text-green-400" />
                          <h3 className="font-semibold text-light-text-primary mb-2 dark:text-dark-text-primary">
                            AI Processing
                          </h3>
                          <p className="text-sm text-light-text-secondary mb-4 dark:text-dark-text-secondary">
                            Let AI generate comprehensive responses
                          </p>
                          <Button
                            onClick={() => setActiveSection("generate")}
                            disabled={!rfpData}
                            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                          >
                            Generate
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-card text-foreground dark:bg-card dark:text-foreground">
                        <CardContent className="p-6 text-center">
                          <Edit className="w-12 h-12 text-orange-600 mx-auto mb-4 dark:text-orange-400" />
                          <h3 className="font-semibold text-light-text-primary mb-2 dark:text-dark-text-primary">
                            Review & Edit
                          </h3>
                          <p className="text-sm text-light-text-secondary mb-4 dark:text-dark-text-secondary">
                            Fine-tune the generated responses
                          </p>
                          <Button
                            onClick={() => setActiveSection("edit")}
                            disabled={!generatedResponse}
                            className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800"
                          >
                            Review
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { title: "RFPs Processed", value: "12", icon: FileText, color: "blue" },
                      { title: "Responses Generated", value: "8", icon: Brain, color: "green" },
                      { title: "Reviews finished", value: "6", icon: Edit, color: "orange" },
                      { title: "Final Proposals", value: "5", icon: Download, color: "purple" },
                    ].map((stat) => {
                      const Icon = stat.icon
                      return (
                        <Card
                          key={stat.title}
                          className="border-0 shadow-md bg-card text-foreground dark:bg-card dark:text-foreground"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                                  {stat.title}
                                </p>
                                <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                                  {stat.value}
                                </p>
                              </div>
                              <Icon className={`w-8 h-8 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </>
              )

            case "upload":
              return (
                <RFPUpload
                  onUploadSuccess={handleRFPUpload}
                  userContext={{
                    userId: Number.parseInt(user.id, 10),
                    companyId: 1,
                    employeeId: Number.parseInt(user.id, 10),
                    authToken: token || undefined,
                    filename: selectedFilename || undefined,
                  }}
                />
              )

            case "generate":
              return <ResponseGeneration rfpData={rfpData} onResponseGenerated={handleResponseGenerated} />

            case "edit":
              return (
                editRfpId !== null && (
                  <RFPProposalEdit
                    rfpId={editRfpId}
                    token={token || ""}
                    pdfUrl={selectedFileUrlForPreview || ""}
                    onFinal={handleFinalProposal}
                    filename={selectedFilename || `RFP_${editRfpId}.pdf`}
                    generatedResponse={editModeFromGenerated ? generatedResponse : undefined}
                  />
                )
              )

            case "final":
              return <FinalProposal editedResponse={editedResponse} onProposalGenerated={handleFinalProposal} />

            case "my-rfps":
              return (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-light-text-primary mb-2 dark:text-dark-text-primary">
                      My Assigned RFPs
                    </h2>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary">
                      View and download RFPs assigned to you.
                    </p>
                  </div>

                  {loading && (
                    <Alert className="mb-4 bg-blue-100 border-blue-200 text-blue-700 rounded-xl dark:bg-blue-900 dark:border-blue-800 dark:text-blue-200">
                      <Activity className="h-4 w-4" />
                      <AlertDescription>Loading assigned RFPs...</AlertDescription>
                    </Alert>
                  )}
                  {error && (
                    <Alert variant="destructive" className="mb-4 rounded-xl bg-destructive text-destructive-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="mb-4 bg-green-100 border-green-200 text-green-700 rounded-xl dark:bg-green-900 dark:border-green-800 dark:text-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Card className="border-0 shadow-lg bg-card text-foreground dark:bg-card dark:text-foreground">
                    <CardContent className="p-0">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow className="bg-muted/50 dark:bg-muted">
                            <TableHead className="text-muted-foreground">Filename</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                            <TableHead className="text-muted-foreground">Assigned Date</TableHead>
                            <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {myRfps.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                No RFPs assigned to you.
                              </TableCell>
                            </TableRow>
                          ) : (
                            myRfps.map((rfp) => (
                              <TableRow key={rfp.id} className="hover:bg-muted/20 dark:hover:bg-muted/50">
                                <TableCell className="font-medium text-foreground">{rfp.filename}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={rfp.status === "finished" ? "default" : "outline"}
                                    className={`rounded-xl ${
                                      rfp.status === "pending"
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                                        : rfp.status === "in_progress"
                                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                                          : rfp.status === "assigned"
                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                                            : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                                    }`}
                                  >
                                    {rfp.status.replace(/_/g, " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{rfp.created_at}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-purple-600 border-purple-600 hover:bg-purple-50 rounded-lg mr-2 bg-transparent dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-900"
                                    onClick={() => handleViewOriginalRFP(rfp.id, rfp.file_url, rfp.filename)}
                                  >
                                    <Download className="h-4 w-4 mr-1" /> View Original
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg mr-2 dark:bg-blue-700 dark:hover:bg-blue-800"
                                    onClick={() => {
                                      setSelectedFilename(rfp.filename)
                                      setActiveSection("upload")
                                    }}
                                  >
                                    <Upload className="h-4 w-4 mr-1" /> Process
                                  </Button>
                                  {rfp.docx_url && rfp.status === "finished" && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg mr-2 dark:bg-indigo-700 dark:hover:bg-indigo-800"
                                      onClick={() =>
                                        handleDownloadFile(rfp.docx_url, `${rfp.filename.split(".")[0]}_proposal.docx`)
                                      }
                                    >
                                      <Download className="h-4 w-4 mr-1" /> Download Word
                                    </Button>
                                  )}
                                  {rfp.pdf_url && rfp.status === "finished" && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg mr-2 dark:bg-red-700 dark:hover:bg-red-800"
                                      onClick={() =>
                                        handleDownloadFile(rfp.pdf_url, `${rfp.filename.split(".")[0]}_proposal.pdf`)
                                      }
                                    >
                                      <Download className="h-4 w-4 mr-1" /> Download PDF
                                    </Button>
                                  )}

                                  <Dialog>
                                    <DialogContent className="sm:max-w-md rounded-2xl bg-card text-foreground dark:bg-card dark:text-foreground">
                                      <DialogHeader>
                                        <DialogTitle className="text-foreground">Send Message to Admin</DialogTitle>
                                        <DialogDescription className="text-muted-foreground">
                                          Enter a message for this RFP. It will be stored in the RFP's message history.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <form
                                        onSubmit={async (e) => {
                                          e.preventDefault()
                                          const form = e.target as HTMLFormElement
                                          const messageInput = form.elements.namedItem("message") as HTMLInputElement
                                          const message = messageInput.value
                                          setLoading(true)
                                          setError(null)
                                          setSuccess(null)
                                          try {
                                            const response = await fetch(
                                              `http://localhost:8000/api/employee/rfps/${rfp.id}/message`,
                                              {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type": "application/json",
                                                  Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({ message }),
                                              },
                                            )
                                            if (!response.ok) {
                                              const errorData = await response.json()
                                              throw new Error(
                                                errorData.detail || `HTTP error! status: ${response.status}`,
                                              )
                                            }
                                            setSuccess("Message sent and stored successfully!")
                                          } catch (err: any) {
                                            setError(`Failed to send message: ${err.message}`)
                                          } finally {
                                            setLoading(false)
                                          }
                                        }}
                                        className="space-y-4"
                                      >
                                        <Label htmlFor="message" className="text-muted-foreground">
                                          Message
                                        </Label>
                                        <Input
                                          id="message"
                                          name="message"
                                          required
                                          className="rounded-xl border border-border px-3 py-2 w-full bg-input text-foreground"
                                        />
                                        <DialogFooter>
                                          <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl dark:bg-blue-700 dark:hover:bg-blue-800"
                                          >
                                            Send
                                          </Button>
                                        </DialogFooter>
                                      </form>
                                    </DialogContent>
                                  </Dialog>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 border-blue-600 hover:bg-blue-50 rounded-lg bg-transparent dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900"
                                    onClick={() => {
                                      setSelectedRfpId(rfp.id)
                                      setActiveSection("messages")
                                    }}
                                  >
                                    <Mail className="h-4 w-4 mr-1" /> Messages
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 rounded-lg mr-2 bg-transparent dark:text-yellow-400 dark:border-yellow-400 dark:hover:bg-yellow-900"
                                    onClick={() => {
                                      setEditRfpId(rfp.id)
                                      setEditedResponse(null)
                                      setEditModeFromGenerated(false)
                                      setActiveSection("edit")
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-1" /> Edit
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
                    <h2 className="text-2xl font-bold text-light-text-primary mb-2 dark:text-dark-text-primary">
                      RFP History
                    </h2>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary">
                      View your past RFP processing activities
                    </p>
                  </div>

                  <Card className="border-0 shadow-lg bg-card text-foreground dark:bg-card dark:text-foreground">
                    <CardContent className="p-0">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow className="bg-muted/50 dark:bg-muted">
                            <TableHead className="text-muted-foreground">Filename</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {finishedRfps.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={1} className="text-center py-4 text-muted-foreground">
                                No finished RFPs yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            finishedRfps.map((rfp) => (
                              <TableRow key={rfp.id} className="hover:bg-muted/20 dark:hover:bg-muted/50">
                                <TableCell className="font-medium text-foreground">{rfp.filename}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )

            case "messages":
              return (
                <RFPMessagePage
                  user={{ id: user.id, role: user.role, token: token || "" }}
                  rfpId={selectedRfpId || assignedRfps[0]?.id || 0}
                  isAdmin={user.role === "employee"}
                />
              )

            default:
              return null
          }
        })()}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-bg-start flex dark:bg-dark-bg-start">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-xl transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 dark:bg-card dark:shadow-none dark:border-r dark:border-border`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl dark:from-blue-700 dark:to-indigo-800">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{companyName || "Company"}</h1>
              <p className="text-xs text-muted-foreground">Employee Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:bg-muted/50"
          >
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
                (item.id === "final" && !editedResponse) ||
                !token

              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && setActiveSection(item.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800"
                      : isDisabled
                        ? "text-muted-foreground cursor-not-allowed"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full dark:bg-blue-400" />}
                </button>
              )
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-muted/50 rounded-lg dark:bg-muted">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.company}</p>
            </div>
            <Badge className="bg-green-100 text-green-700 text-xs dark:bg-green-900 dark:text-green-200">
              Employee
            </Badge>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className="w-full rounded-xl border-border hover:bg-muted/50 text-foreground bg-transparent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Top Bar */}
        <div className="bg-background shadow-sm border-b border-border px-6 py-4 dark:bg-card dark:border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-muted-foreground hover:bg-muted/50"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground capitalize">
                  {activeSection === "dashboard" ? "Dashboard" : activeSection.replace("-", " ")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activeSection === "dashboard" && "Overview of your RFP processing workflow"}
                  {activeSection === "generate" && "Generate AI-powered responses"}
                  {activeSection === "edit" && "Review and edit generated responses"}
                  {activeSection === "final" && "Finalize and download proposals"}
                  {activeSection === "my-rfps" && "View RFPs assigned to you"}
                  {activeSection === "history" && "View past RFP processing activities"}
                  {activeSection === "messages" && "View messages from Company Admin"}
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="hidden md:flex items-center gap-2">
              {[
                { step: "Upload", finished: !!rfpData, icon: Upload },
                { step: "Generate", finished: !!generatedResponse, icon: Brain },
                { step: "Edit", finished: !!editedResponse, icon: Edit },
                { step: "Final", finished: finalProposalGenerated, icon: Download },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={item.step} className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${item.finished ? "bg-green-100 dark:bg-green-900" : "bg-muted/50 dark:bg-muted"}`}
                    >
                      <Icon
                        className={`w-4 h-4 ${item.finished ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                      />
                    </div>
                    {index < 3 && (
                      <div
                        className={`w-8 h-0.5 ${item.finished ? "bg-green-300 dark:bg-green-600" : "bg-border dark:bg-border"}`}
                      />
                    )}
                  </div>
                )
              })}
              <ThemeToggle />
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

      {/* PDF Modal (for original RFP preview) */}
      {pdfModalOpen && pdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-card rounded-lg shadow-lg max-w-3xl w-full p-6 relative text-foreground">
            <button
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
              onClick={() => setPdfModalOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-foreground">Original RFP Document Preview</h2>
            <div className="mb-4" style={{ height: "60vh" }}>
              <iframe src={pdfUrl} title="RFP PDF Preview" width="100%" height="100%" style={{ border: "none" }} />
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg dark:bg-blue-700 dark:hover:bg-blue-800"
              onClick={() => {
                setPdfModalOpen(false)
                setActiveSection("upload")
              }}
            >
              Process / Upload Response
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
