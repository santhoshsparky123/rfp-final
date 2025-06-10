"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress" // Import Progress
import { useDropzone } from "react-dropzone" // Import useDropzone
import CreateCompanyForm from "./create-company-form" // Import CreateCompanyForm

import {
  User,
  FileText,
  LogOut,
  CheckCircle,
  AlertCircle,
  Download,
  Clock,
  Brain,
  Calendar,
  Activity,
  File,
  Building,
  Zap,
  Upload,
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

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [submissions, setSubmissions] = useState<RFPSubmission[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0) // From RFPUpload
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [processingStage, setProcessingStage] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)

  const [uploadedFile, setUploadedFile] = useState<File | null>(null) // From RFPUpload
  const [structuredData, setStructuredData] = useState<any>(null) // From RFPUpload

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      setError(null)
      setSuccess(null) // Clear success message on new file drop
      setStructuredData(null) // Clear structured data on new file drop
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

  const processingSlides = [
    {
      title: "Reading Document",
      subtitle: "Analyzing document structure and content",
      icon: "📖",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      steps: [
        "Opening document...",
        "Extracting text content...",
        "Identifying document structure...",
        "Reading page by page...",
      ],
    },
    {
      title: "Processing Content",
      subtitle: "Understanding requirements and questions",
      icon: "🔍",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100",
      steps: [
        "Analyzing document sections...",
        "Identifying questions...",
        "Extracting requirements...",
        "Categorizing content...",
      ],
    },
    {
      title: "AI Analysis",
      subtitle: "Intelligent content structuring",
      icon: "🧠",
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100",
      steps: ["Running AI analysis...", "Structuring data...", "Validating content...", "Finalizing results..."],
    },
    {
      title: "Generating Response",
      subtitle: "Creating comprehensive RFP response",
      icon: "⚡",
      color: "from-orange-500 to-orange-600",
      bgColor: "from-orange-50 to-orange-100",
      steps: ["Generating responses...", "Formatting document...", "Quality check...", "Finalizing proposal..."],
    },
  ]

  const fetchCompanies = useCallback(async () => { // Wrapped in useCallback
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
      if (data.companies && data.companies.length > 0) {
        setSelectedCompanyId(data.companies[0].id) // Select the first company by default
      }
    } catch (err) {
      console.error("Error fetching companies:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch companies")
    } finally {
      setLoading(false)
    }
  }, []) // Empty dependency array means it's created once

  useEffect(() => {
    // Fetch user's companies
    fetchCompanies()

    // Load Razorpay script
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [fetchCompanies]) // Add fetchCompanies to dependency array

  const handleUpload = async () => {
    if (!uploadedFile) {
      setError("Please select a file to upload.")
      return
    }
    if (!selectedCompanyId) {
      setError("Please select a company before uploading.")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError(null)
    setSuccess(null)
    setProcessingStage("reading")
    setCurrentSlide(0)

    try {
      // Simulate processing stages with slides
      for (let slideIndex = 0; slideIndex < processingSlides.length; slideIndex++) {
        setCurrentSlide(slideIndex)

        // Show each step in the current slide
        for (let stepIndex = 0; stepIndex < processingSlides[slideIndex].steps.length; stepIndex++) {
          await new Promise((resolve) => setTimeout(resolve, 500)) // Faster simulation for steps
        }

        // Pause between slides
        await new Promise((resolve) => setTimeout(resolve, 400)) // Faster simulation between slides
      }

      const formData = new FormData()
      formData.append("file", uploadedFile)
      formData.append("userid", user.id)
      formData.append("companyid", selectedCompanyId.toString())

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      // Simulate progress for the actual upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

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
        const errorData = await response.json()
        throw new Error(errorData.detail || `Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("RFP Submission Response:", data)
      setStructuredData(data.structured_data || {}) // Set structured data

      const newSubmission: RFPSubmission = {
        id: data.document_id,
        title: uploadedFile.name.replace(/\.(pdf|docx?|doc)$/i, "").replace(/-/g, " "),
        submitted_at: new Date().toLocaleString(),
        status: "completed",
        file_name: uploadedFile.name,
        response_ready: true,
        rfp_id: data.document_id,
      }

      setSubmissions([newSubmission, ...submissions])
      setSuccess("RFP processed successfully! Your response is ready for download.")

      // Reset file input and uploaded file state
      setUploadedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      console.error("Submission error:", err)
      setError(err instanceof Error ? err.message : "Failed to submit RFP. Please try again.")
      setUploadProgress(0) // Reset progress on error
      setStructuredData(null) // Clear structured data on error
    } finally {
      setUploading(false)
      setProcessingStage(null)
      setCurrentSlide(0)
    }
  }

  const handleDownload = async (submission: RFPSubmission, docType: "docx" | "pdf") => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch(`http://localhost:8000/api/download-document/${submission.rfp_id}/${docType}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to download document")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${submission.title}-response.${docType}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download error:", err)
      setError("Failed to download document. Please try again.")
    }
  }

  const completedSubmissions = submissions.filter((s) => s.status === "completed").length
  const processingSubmissions = submissions.filter((s) => s.status === "processing").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-800 via-blue-800 to-cyan-800 bg-clip-text text-transparent">
                RFP Response Generator
              </h1>
              <p className="text-gray-600 mt-1">Get instant AI-generated responses for your RFPs</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Create Company Button */}
            <CreateCompanyForm userId={user.id} onSuccess={fetchCompanies} />

            <div className="text-right">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4 text-indigo-600" />
                {user.name}
              </div>
              <div className="text-xs text-gray-500">{user.email}</div>
              <Badge className="mt-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200">User</Badge>
            </div>
            <Button variant="outline" onClick={onLogout} className="rounded-xl border-gray-300 hover:bg-gray-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
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

        {/* Main RFP Upload Section */}
        <div className="max-w-4xl mx-auto mb-8">
          {/* Processing Slides (Conditional based on 'uploading' and 'processingStage') */}
          {uploading && processingStage && (
            <div className="mb-8">
              <Card className="border-0 shadow-2xl overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${processingSlides[currentSlide].color}`} />
                <CardContent className={`p-8 bg-gradient-to-br ${processingSlides[currentSlide].bgColor}`}>
                  <div className="text-center">
                    {/* Slide Indicator */}
                    <div className="flex justify-center mb-6">
                      {processingSlides.map((_, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full mx-1 transition-all duration-500 ${
                            index === currentSlide
                              ? `bg-gradient-to-r ${processingSlides[currentSlide].color}`
                              : index < currentSlide
                                ? "bg-green-500"
                                : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Current Slide Content */}
                    <div className="space-y-6">
                      <div className="text-6xl mb-4 animate-bounce">{processingSlides[currentSlide].icon}</div>

                      <div>
                        <h3
                          className={`text-2xl font-bold bg-gradient-to-r ${processingSlides[currentSlide].color} bg-clip-text text-transparent mb-2`}
                        >
                          {processingSlides[currentSlide].title}
                        </h3>
                        <p className="text-gray-600 text-lg">{processingSlides[currentSlide].subtitle}</p>
                      </div>

                      {/* Processing Steps */}
                      <div className="space-y-3">
                        {processingSlides[currentSlide].steps.map((step, stepIndex) => (
                          <div
                            key={stepIndex}
                            className={`flex items-center justify-center space-x-3 p-3 rounded-xl transition-all duration-500 ${
                              stepIndex <= (Date.now() % 4) // Simple animation logic
                                ? "bg-white/80 shadow-sm"
                                : "bg-white/40"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                stepIndex <= (Date.now() % 4)
                                  ? `bg-gradient-to-r ${processingSlides[currentSlide].color}`
                                  : "bg-gray-300"
                              } animate-pulse`}
                            />
                            <span
                              className={`text-sm font-medium ${
                                stepIndex <= (Date.now() % 4) ? "text-gray-900" : "text-gray-500"
                              }`}
                            >
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Progress Bar for overall upload when processing slides are active*/}
                      <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${processingSlides[currentSlide].color} transition-all duration-1000 ease-out`}
                          style={{
                            width: `${((currentSlide + 1) / processingSlides.length) * 100}%`,
                          }}
                        />
                      </div>

                      <p className="text-sm text-gray-600">
                        Step {currentSlide + 1} of {processingSlides.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* RFP Upload Card (Conditional based on not uploading and no structured data yet) */}
          {!uploading && !structuredData && (
            <Card className="shadow-xl border-0 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload RFP Document
                </CardTitle>
                <CardDescription>Upload your RFP document (PDF, DOC, or DOCX) to begin processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!uploadedFile ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    {isDragActive ? (
                      <p className="text-blue-600">Drop the RFP document here...</p>
                    ) : (
                      <div>
                        <p className="text-gray-600 mb-2">Drag & drop your RFP document here, or click to select</p>
                        <p className="text-sm text-gray-500">Supports PDF, DOC, and DOCX files</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
                      >
                        Remove
                      </Button>
                    </div>

                    {/* Company Dropdown */}
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Company
                      </label>
                      <select
                        id="company"
                        className="w-full p-3 border border-gray-300 rounded-xl text-gray-700"
                        value={selectedCompanyId ?? ""}
                        onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                        disabled={companies.length === 0}
                      >
                        <option value="">-- Select a company --</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processing RFP...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}

                    {!structuredData && !uploading && (
                      <Button onClick={handleUpload} className="w-full" disabled={!selectedCompanyId}>
                        Process RFP Document
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* RFP Structure Overview */}
          {structuredData && (
            <Card className="shadow-xl border-0 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
              <CardHeader>
                <CardTitle>RFP Structure Overview</CardTitle>
                <CardDescription>Extracted structure from your RFP document</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    RFP processed successfully! Found {structuredData.sections?.length || 0} sections,{" "}
                    {structuredData.questions?.length || 0} questions, and {structuredData.requirements?.length || 0}{" "}
                    requirements.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Sections</h4>
                    <div className="space-y-1">
                      {structuredData.sections?.slice(0, 3).map((section: any, index: number) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                          {section.title}
                        </div>
                      ))}
                      {structuredData.sections?.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{structuredData.sections.length - 3} more sections
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Questions</h4>
                    <div className="space-y-1">
                      {structuredData.questions?.slice(0, 3).map((question: any, index: number) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                          {question.text?.substring(0, 50)}...
                        </div>
                      ))}
                      {structuredData.questions?.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{structuredData.questions.length - 3} more questions
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Requirements</h4>
                    <div className="space-y-1">
                      {structuredData.requirements?.slice(0, 3).map((req: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant={req.mandatory ? "destructive" : "secondary"} className="text-xs">
                            {req.mandatory ? "Required" : "Optional"}
                          </Badge>
                          <span className="text-sm">{req.text?.substring(0, 30)}...</span>
                        </div>
                      ))}
                      {structuredData.requirements?.length > 3 && (
                        <div className="text-sm text-gray-500">
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
                    className="w-full max-w-sm"
                  >
                    Upload Another RFP
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Total Submissions",
              value: submissions.length,
              icon: FileText,
              color: "from-indigo-500 to-indigo-600",
              bgColor: "from-indigo-50 to-indigo-100",
            },
            {
              title: "Completed",
              value: completedSubmissions,
              icon: CheckCircle,
              color: "from-green-500 to-green-600",
              bgColor: "from-green-50 to-green-100",
            },
            {
              title: "Processing",
              value: processingSubmissions,
              icon: Clock,
              color: "from-blue-500 to-blue-600",
              bgColor: "from-blue-50 to-blue-100",
            },
            {
              title: "Companies",
              value: companies.length,
              icon: Building,
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
                  <p className="text-sm text-gray-600">Your account</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Submission History */}
        {submissions.length > 0 && (
          <Card className="shadow-xl border-0 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" />
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Activity className="w-6 h-6 text-green-600" />
                Recent Submissions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">RFP Title</TableHead>
                      <TableHead className="font-semibold">Submitted</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.slice(0, 5).map((submission) => (
                      <TableRow key={submission.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <FileText className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{submission.title}</div>
                              <div className="text-sm text-gray-500">{submission.file_name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            {submission.submitted_at}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={submission.status === "completed" ? "default" : "outline"}
                            className={`rounded-xl ${
                              submission.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : submission.status === "processing"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {submission.status === "processing" && <Clock className="w-3 h-3 mr-1" />}
                            {submission.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {submission.status === "failed" && <AlertCircle className="w-3 h-3 mr-1" />}
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {submission.response_ready ? (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleDownload(submission, "docx")}
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Word
                              </Button>
                              <Button
                                onClick={() => handleDownload(submission, "pdf")}
                                size="sm"
                                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-lg"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                PDF
                              </Button>
                            </div>
                          ) : submission.status === "processing" ? (
                            <Badge variant="outline" className="rounded-lg">
                              <Clock className="w-3 h-3 mr-1" />
                              Processing...
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-lg text-red-600">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}