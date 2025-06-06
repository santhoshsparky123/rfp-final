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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  User,
  Upload,
  FileText,
  LogOut,
  CheckCircle,
  AlertCircle,
  Download,
  Clock,
  Brain,
  Calendar,
  Activity,
  X,
  File,
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

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [submissions, setSubmissions] = useState<RFPSubmission[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [processingStage, setProcessingStage] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

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
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const fileType = file.type
      const fileName = file.name.toLowerCase()

      if (
        fileType === "application/pdf" ||
        fileName.endsWith(".pdf") ||
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileType === "application/msword" ||
        fileName.endsWith(".docx") ||
        fileName.endsWith(".doc")
      ) {
        setSelectedFile(file)
        setError(null)
      } else {
        setError("Please select a PDF or Word document")
        setSelectedFile(null)
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setError(null)
    // Reset file input
    const fileInput = document.getElementById("rfp-file") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const getFileIcon = (file: File) => {
    const fileName = file.name.toLowerCase()
    const fileType = file.type

    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      return (
        <div className="p-2 bg-red-100 rounded-lg">
          <FileText className="w-4 h-4 text-red-600" />
        </div>
      )
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "application/msword" ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".doc")
    ) {
      return (
        <div className="p-2 bg-blue-100 rounded-lg">
          <File className="w-4 h-4 text-blue-600" />
        </div>
      )
    }

    return (
      <div className="p-2 bg-gray-100 rounded-lg">
        <FileText className="w-4 h-4 text-gray-600" />
      </div>
    )
  }

  const handleSubmitRFP = async () => {
    if (!selectedFile) {
      setError("Please select a file first")
      return
    }

    setUploading(true)
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
          await new Promise((resolve) => setTimeout(resolve, 800))
        }

        // Pause between slides
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("http://localhost:8000/api/upload-rfp/", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to submit RFP")
      }

      const data = await response.json()
      console.log("RFP Submission Response:", data)

      const newSubmission: RFPSubmission = {
        id: data.rfp_id,
        title: selectedFile.name.replace(/\.(pdf|docx?|doc)$/i, "").replace(/-/g, " "),
        submitted_at: new Date().toLocaleString(),
        status: "processing",
        file_name: selectedFile.name,
        response_ready: false,
        rfp_id: data.rfp_id,
      }

      setSubmissions([newSubmission, ...submissions])
      setSuccess("RFP submitted successfully! Processing will begin shortly.")
      setSelectedFile(null)

      // Reset file input
      const fileInput = document.getElementById("rfp-file") as HTMLInputElement
      if (fileInput) fileInput.value = ""

      // Simulate processing completion after some time
      setTimeout(() => {
        setSubmissions((prev) =>
          prev.map((sub) => (sub.id === data.rfp_id ? { ...sub, status: "completed", response_ready: true } : sub)),
        )
      }, 30000) // 30 seconds simulation
    } catch (err) {
      console.error("Submission error:", err)
      setError(err instanceof Error ? err.message : "Failed to submit RFP. Please try again.")
    } finally {
      setUploading(false)
      setProcessingStage(null)
      setCurrentSlide(0)
    }
  }

  const handleDownload = async (submission: RFPSubmission, docType: "docx" | "pdf") => {
    try {
      const response = await fetch(`http://localhost:8000/api/download-document/${submission.rfp_id}/${docType}`, {
        method: "GET",
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-800 via-blue-800 to-cyan-800 bg-clip-text text-transparent">
                User Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Submit RFPs and download generated responses</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4 text-indigo-600" />
                {user.name}
              </div>
              <div className="text-xs text-gray-500">{user.company}</div>
              <Badge className="mt-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200">User</Badge>
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
              title: "Ready to Download",
              value: submissions.filter((s) => s.response_ready).length,
              icon: Download,
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
                  <p className="text-sm text-gray-600">Your submissions</p>
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
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />

          <Tabs defaultValue="submit" className="w-full">
            <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
              <TabsList className="grid w-full grid-cols-2 bg-transparent p-2">
                <TabsTrigger
                  value="submit"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-3 font-medium transition-all duration-200"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Submit New RFP
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-3 font-medium transition-all duration-200"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Submission History
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="submit" className="p-8">
              {/* Processing Slides */}
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

                          {/* Progress Bar */}
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
              {!uploading && (
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-2xl mb-4">
                      <Upload className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Your RFP</h2>
                    <p className="text-gray-600">
                      Upload your RFP document and our AI will generate a comprehensive response for you
                    </p>
                  </div>

                  <Card className="border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors duration-200">
                    <CardContent className="p-8">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label htmlFor="rfp-file" className="text-sm font-medium text-gray-700">
                            Choose File
                          </Label>
                          <div className="mt-2">
                            <Input
                              id="rfp-file"
                              type="file"
                              accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                              onChange={handleFileSelect}
                              className="h-12 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Supported formats: PDF (.pdf) and Word documents (.doc, .docx)
                          </p>
                        </div>

                        {selectedFile && (
                          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getFileIcon(selectedFile)}
                                <div>
                                  <div className="font-medium text-gray-900">{selectedFile.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={handleRemoveFile}
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={handleSubmitRFP}
                          disabled={!selectedFile || uploading}
                          className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl font-semibold shadow-lg"
                        >
                          {uploading ? (
                            <>
                              <Brain className="w-5 h-5 mr-2 animate-spin" />
                              Processing Document...
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 mr-2" />
                              Submit Document for Processing
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      How it works
                    </h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        Upload your document in PDF or Word format
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        Our AI analyzes the requirements and questions
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />A comprehensive response is generated
                        automatically
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        Download your completed proposal when ready
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="p-8">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Submission History</h2>
                    <p className="text-gray-600 mt-1">Track your RFP submissions and download responses</p>
                  </div>
                </div>

                {submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
                    <p className="text-gray-600">Submit your first RFP to get started</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">RFP Title</TableHead>
                          <TableHead className="font-semibold">Submitted</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">File</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission) => (
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
                              <div className="text-sm text-gray-600">{submission.file_name}</div>
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
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
