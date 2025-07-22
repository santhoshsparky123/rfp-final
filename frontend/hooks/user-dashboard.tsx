"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { useDropzone } from "react-dropzone"
import CreateCompanyForm from "./create-company-form"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"

import { ThemeToggle } from "@/components/theme-toggle"

import {
  User,
  FileText,
  LogOut,
  CheckCircle,
  AlertCircle,
  Clock,
  Building,
  Zap,
  Upload,
  LayoutDashboard,
  PlusCircle,
  Eye,
  FileDown,
  Reply,
} from "lucide-react"

interface UserDashboardProps {
  user: {
    id: string
    email: string
    role: "user"
    name: string
    company?: string
  }
  onLogout: () => void
}

interface RFPSubmission {
  id: string
  title: string
  submitted_at: string
  status: "processing" | "completed" | "failed"
  file_name: string
  response_ready: boolean
  rfp_id?: string
}

interface Company {
  id: number
  name: string
  subdomain: string
  subscription_status: string
  subscription_end?: string
}

interface CompanyResponse {
  id: string
  title: string
  company_name: string
  docx_url: string
  pdf_url: string
  created_at: string
  status: string
}

type ActiveSection = "upload" | "create-company" | "company-responses"

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyResponses, setCompanyResponses] = useState<CompanyResponse[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [responsesLoading, setResponsesLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [structuredData, setStructuredData] = useState<any>(null)
  const [activeSection, setActiveSection] = useState<ActiveSection>("upload")

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      setError(null)
      setSuccess(null)
      setStructuredData(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
    maxFiles: 1,
  })

  const fetchCompanies = useCallback(async () => {
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
        throw new Error("Failed to fetch companies")
      }

      const data = await response.json()
      setCompanies(data.companies || [])
    } catch (err) {
      console.error("Error fetching companies:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch companies")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCompanyResponses = useCallback(async () => {
    setResponsesLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch(`http://localhost:8000/api/user/${user.id}/company-responses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch company responses")
      }

      const data = await response.json()
      setCompanyResponses(data.responses || [])
    } catch (err) {
      console.error("Error fetching company responses:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch company responses")
    } finally {
      setResponsesLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  useEffect(() => {
    if (activeSection === "company-responses") {
      fetchCompanyResponses()
    }
  }, [activeSection, fetchCompanyResponses])

  const handleCheckboxChange = (companyId: number, isChecked: boolean) => {
    setSelectedCompanyIds((prev) => (isChecked ? [...prev, companyId] : prev.filter((id) => id !== companyId)))
  }

  const handleUpload = async () => {
    if (!uploadedFile) {
      setError("Please select a file to upload.")
      return
    }
    if (selectedCompanyIds.length === 0) {
      setError("Please select at least one company before uploading.")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError(null)
    setSuccess(null)

    try {
      let allUploadsSuccessful = true
      let firstStructuredData: any = null

      for (const companyId of selectedCompanyIds) {
        const formData = new FormData()
        formData.append("file", uploadedFile)
        formData.append("userid", user.id)
        formData.append("companyid", companyId.toString())

        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("Authentication token not found")
        }

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90))
        }, 200)

        try {
          const response = await fetch("http://localhost:8000/api/user/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          })

          clearInterval(progressInterval)
          setUploadProgress(100)

          if (!response.ok) {
            allUploadsSuccessful = false
            const errorData = await response.json()
            throw new Error(`Upload to company ${companyId} failed: ${errorData.detail || response.statusText}`)
          }

          const data = await response.json()
          if (!firstStructuredData) {
            firstStructuredData = data.structured_data || {}
          }
        } catch (err) {
          allUploadsSuccessful = false
          console.error(`Submission error for company ${companyId}:`, err)
          setError(
            err instanceof Error ? err.message : `Failed to submit RFP for company ${companyId}. Please try again.`,
          )
        }
      }

      setStructuredData(firstStructuredData)

      if (allUploadsSuccessful) {
        setSuccess("RFP processed successfully for all selected companies! Your responses are ready for download.")
      } else {
        setSuccess("RFP processing completed, but some uploads may have failed. Check error messages above.")
      }

      setUploadedFile(null)
      setSelectedCompanyIds([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      console.error("Overall submission error:", err)
      setError(err instanceof Error ? err.message : "Failed to submit RFP. Please try again.")
      setUploadProgress(0)
      setStructuredData(null)
    } finally {
      setUploading(false)
    }
  }

  const handleViewPDF = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank")
  }

  const handleDownloadDoc = async (rfpId: string, title: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/download-docx/${rfpId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch document from server.")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${title}-response.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download error:", err)
      setError("Failed to download document. Please try again.")
    }
  }

  const AppSidebar = () => (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="p-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-800 to-blue-800 bg-clip-text text-transparent">
            RFP AI
          </h2>
        </div>
        <div className="px-2 pb-4 border-b border-border">
          <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" /> {user.name}
          </div>
          <div className="text-xs text-muted-foreground mb-2">{user.email}</div>
          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200">
            User Role
          </Badge>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection("upload")}
                  isActive={activeSection === "upload"}
                  className="w-full justify-start"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Document</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection("create-company")}
                  isActive={activeSection === "create-company"}
                  className="w-full justify-start"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Company</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection("company-responses")}
                  isActive={activeSection === "company-responses"}
                  className="w-full justify-start"
                >
                  <Reply className="w-4 h-4" />
                  <span>Response from Company</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:text-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-light-bg-start via-light-bg-mid to-light-bg-end flex w-full text-foreground dark:from-dark-bg-start dark:via-dark-bg-mid dark:to-dark-bg-end dark:text-foreground">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <SidebarTrigger />
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-lg dark:from-indigo-700 dark:to-blue-800">
                  <LayoutDashboard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-800 via-blue-800 to-cyan-800 bg-clip-text text-transparent dark:from-indigo-400 dark:via-blue-400 dark:to-cyan-400">
                    Dashboard Overview
                  </h1>
                  <p className="text-muted-foreground mt-1">Manage your RFPs and companies</p>
                </div>
              </div>
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <Alert
                variant="destructive"
                className="mb-6 rounded-xl border-destructive bg-destructive text-destructive-foreground dark:border-destructive dark:bg-destructive"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 rounded-xl border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
              </Alert>
            )}

            {/* Content based on active section */}
            {activeSection === "upload" && (
              <div className="max-w-4xl mx-auto">
                {!uploading && !structuredData && (
                  <Card className="shadow-xl border-0 overflow-hidden bg-card text-foreground dark:bg-card dark:text-foreground">
                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Upload className="w-5 h-5" />
                        Upload RFP Document
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Upload your RFP document (PDF, DOC, or DOCX) to begin processing
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!uploadedFile ? (
                        <div
                          {...getRootProps()}
                          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            isDragActive
                              ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900"
                              : "border-border hover:border-gray-400 dark:border-border dark:hover:border-gray-500"
                          }`}
                        >
                          <input {...getInputProps()} />
                          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          {isDragActive ? (
                            <p className="text-blue-600 dark:text-blue-400">Drop the RFP document here...</p>
                          ) : (
                            <div>
                              <p className="text-muted-foreground mb-2">
                                Drag & drop your RFP document here, or click to select
                              </p>
                              <p className="text-sm text-muted-foreground">Supports PDF, DOC, and DOCX files</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg border-border dark:bg-muted/50 dark:border-border">
                            <div className="flex items-center gap-3">
                              <FileText className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                              <div>
                                <p className="font-medium text-foreground">{uploadedFile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setUploadedFile(null)
                                setStructuredData(null)
                                setError(null)
                                setSuccess(null)
                              }}
                              className="border-border text-foreground hover:bg-muted/50"
                            >
                              Remove
                            </Button>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                              Select Companies to associate with this RFP
                            </label>
                            {companies.length === 0 ? (
                              <p className="text-muted-foreground text-sm">
                                No companies found. Please create a company first.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2">
                                {companies.map((company) => (
                                  <div
                                    key={company.id}
                                    className="flex items-center space-x-2 p-2 border rounded-md border-border dark:bg-muted/50 dark:border-border"
                                  >
                                    <Checkbox
                                      id={`company-${company.id}`}
                                      checked={selectedCompanyIds.includes(company.id)}
                                      onCheckedChange={(checked) =>
                                        handleCheckboxChange(company.id, checked as boolean)
                                      }
                                    />
                                    <label
                                      htmlFor={`company-${company.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
                                    >
                                      {company.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {uploading && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Processing RFP...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <Progress value={uploadProgress} className="dark:bg-muted [&>*]:bg-blue-500" />
                            </div>
                          )}

                          {!structuredData && !uploading && (
                            <Button
                              onClick={handleUpload}
                              className="w-full dark:bg-blue-700 dark:hover:bg-blue-800"
                              disabled={selectedCompanyIds.length === 0}
                            >
                              Process RFP Document(s)
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {structuredData && (
                  <Card className="shadow-xl border-0 overflow-hidden bg-card text-foreground dark:bg-card dark:text-foreground">
                    <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
                    <CardHeader>
                      <CardTitle className="text-foreground">RFP Structure Overview</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Extracted structure from your RFP document
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert className="mb-4 bg-green-100 border-green-200 dark:bg-green-900 dark:border-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          RFP processed successfully!
                        </AlertDescription>
                      </Alert>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-muted-foreground"></h4>
                          <div className="space-y-1">
                            {structuredData.sections?.slice(0, 3).map((section: any, index: number) => (
                              <div
                                key={index}
                                className="text-sm p-2 bg-muted/50 rounded dark:bg-muted dark:text-foreground"
                              >
                                {section.title}
                              </div>
                            ))}
                            {structuredData.sections?.length > 3 && (
                              <div className="text-sm text-muted-foreground">
                                +{structuredData.sections.length - 3} more sections
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-muted-foreground"></h4>
                          <div className="space-y-1">
                            {structuredData.questions?.slice(0, 3).map((question: any, index: number) => (
                              <div
                                key={index}
                                className="text-sm p-2 bg-muted/50 rounded dark:bg-muted dark:text-foreground"
                              >
                                {question.text?.substring(0, 50)}...
                              </div>
                            ))}
                            {structuredData.questions?.length > 3 && (
                              <div className="text-sm text-muted-foreground">
                                +{structuredData.questions.length - 3} more questions
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-muted-foreground"></h4>
                          <div className="space-y-1">
                            {structuredData.requirements?.slice(0, 3).map((req: any, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <Badge
                                  variant={req.mandatory ? "destructive" : "secondary"}
                                  className="text-xs dark:bg-red-900 dark:text-red-200"
                                >
                                  {req.mandatory ? "Required" : "Optional"}
                                </Badge>
                                <span className="text-sm text-foreground">{req.text?.substring(0, 30)}...</span>
                              </div>
                            ))}
                            {structuredData.requirements?.length > 3 && (
                              <div className="text-sm text-muted-foreground">
                                +{structuredData.requirements.length - 3} more requirements
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 text-center">
                        <Button
                          onClick={() => {
                            setUploadedFile(null)
                            setStructuredData(null)
                            setError(null)
                            setSuccess(null)
                          }}
                          className="w-full max-w-sm dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                          Upload Another RFP
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeSection === "create-company" && (
              <div className="max-w-xl mx-auto">
                <Card className="shadow-xl border-0 overflow-hidden bg-card text-foreground dark:bg-card dark:text-foreground">
                  <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-lime-500" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Building className="w-5 h-5" />
                      Create New Company
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Add a new company to your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CreateCompanyForm userId={user.id} onSuccess={fetchCompanies} />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "company-responses" && (
              <div className="max-w-6xl mx-auto">
                <Card className="shadow-xl border-0 overflow-hidden bg-card text-foreground dark:bg-card dark:text-foreground">
                  <div className="h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" />
                  <CardHeader className="bg-muted/50 dark:bg-muted">
                    <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                      <Reply className="w-6 h-6 text-green-600 dark:text-green-400" />
                      Response from Company
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      View and download company responses to your RFPs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {responsesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                        <span className="ml-2 text-muted-foreground">Loading responses...</span>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-border overflow-hidden dark:border-border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50 dark:bg-muted">
                              <TableHead className="font-semibold text-muted-foreground">RFP Title</TableHead>
                              <TableHead className="font-semibold text-muted-foreground">Company</TableHead>
                              <TableHead className="font-semibold text-muted-foreground">Date</TableHead>
                              <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                              <TableHead className="font-semibold text-muted-foreground">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-border dark:divide-border">
                            {companyResponses.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                  No company responses found. Upload RFPs and wait for companies to respond!
                                </TableCell>
                              </TableRow>
                            ) : (
                              companyResponses.map((response) => (
                                <TableRow
                                  key={response.id}
                                  className={`hover:bg-muted/20 dark:hover:bg-muted/50 ${
                                    response.status === "finished"
                                      ? "bg-green-50/50 dark:bg-green-950/50"
                                      : "bg-red-50/50 dark:bg-red-950/50"
                                  }`}
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-900">
                                        <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                      </div>
                                      <div>
                                        <div className="font-medium text-foreground">{response.title}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Building className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium text-foreground">{response.company_name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Clock className="w-3 h-3" />
                                      {new Date(response.created_at).toLocaleDateString()}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={response.status === "finished" ? "default" : "outline"}
                                      className={`rounded-xl ${
                                        response.status === "finished"
                                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                                          : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                                      }`}
                                    >
                                      {response.status === "finished" && <CheckCircle className="w-3 h-3 mr-1" />}
                                      {response.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      {response.pdf_url && (
                                        <Button
                                          onClick={() => handleViewPDF(response.pdf_url)}
                                          size="sm"
                                          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-lg dark:from-red-700 dark:to-pink-700 dark:hover:from-red-800 dark:hover:to-pink-800"
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          View PDF
                                        </Button>
                                      )}
                                      {response.docx_url && (
                                        <Button
                                          onClick={() => handleDownloadDoc(response.id, response.title)}
                                          size="sm"
                                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-800"
                                        >
                                          <FileDown className="w-4 h-4 mr-1" />
                                          Download DOC
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
