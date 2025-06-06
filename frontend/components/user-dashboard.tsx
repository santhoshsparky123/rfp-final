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
  download_url?: string
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [submissions, setSubmissions] = useState<RFPSubmission[]>([
    {
      id: "1",
      title: "Cloud Infrastructure RFP",
      submitted_at: "2024-01-20 14:30",
      status: "completed",
      file_name: "cloud-infrastructure-rfp.pdf",
      response_ready: true,
      download_url: "/downloads/cloud-infrastructure-response.pdf",
    },
    {
      id: "2",
      title: "Software Development Services",
      submitted_at: "2024-01-20 13:15",
      status: "processing",
      file_name: "software-dev-rfp.pdf",
      response_ready: false,
    },
    {
      id: "3",
      title: "Data Analytics Platform",
      submitted_at: "2024-01-19 16:45",
      status: "completed",
      file_name: "data-analytics-rfp.pdf",
      response_ready: true,
      download_url: "/downloads/data-analytics-response.pdf",
    },
  ])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        setSelectedFile(file)
        setError(null)
      } else {
        setError("Please select a PDF file")
        setSelectedFile(null)
      }
    }
  }

  const handleSubmitRFP = async () => {
    if (!selectedFile) {
      setError("Please select a file first")
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Simulate file upload and processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const newSubmission: RFPSubmission = {
        id: Date.now().toString(),
        title: selectedFile.name.replace(".pdf", "").replace(/-/g, " "),
        submitted_at: new Date().toLocaleString(),
        status: "processing",
        file_name: selectedFile.name,
        response_ready: false,
      }

      setSubmissions([newSubmission, ...submissions])
      setSuccess("RFP submitted successfully! Processing will begin shortly.")
      setSelectedFile(null)

      // Reset file input
      const fileInput = document.getElementById("rfp-file") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (err) {
      setError("Failed to submit RFP. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = (submission: RFPSubmission) => {
    // Simulate download
    const link = document.createElement("a")
    link.href = submission.download_url || "#"
    link.download = `${submission.title}-response.pdf`
    link.click()
  }

  const completedSubmissions = submissions.filter((s) => s.status === "completed").length
  const processingSubmissions = submissions.filter((s) => s.status === "processing").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-600 to-amber-700 rounded-2xl shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-800 via-amber-800 to-yellow-800 bg-clip-text text-transparent">
                User Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Submit RFPs and download generated responses</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4 text-orange-600" />
                {user.name}
              </div>
              <div className="text-xs text-gray-500">{user.company}</div>
              <Badge className="mt-1 bg-orange-100 text-orange-700 hover:bg-orange-200">User</Badge>
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
              color: "from-orange-500 to-orange-600",
              bgColor: "from-orange-50 to-orange-100",
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
          <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />

          <Tabs defaultValue="submit" className="w-full">
            <div className="border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
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
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-100 to-amber-100 rounded-2xl mb-4">
                    <Upload className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Your RFP</h2>
                  <p className="text-gray-600">
                    Upload your RFP document and our AI will generate a comprehensive response for you
                  </p>
                </div>

                <Card className="border-2 border-dashed border-gray-300 hover:border-orange-400 transition-colors duration-200">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="rfp-file" className="text-sm font-medium text-gray-700">
                          Select RFP Document (PDF only)
                        </Label>
                        <Input
                          id="rfp-file"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="h-12 rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>

                      {selectedFile && (
                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-orange-600" />
                            <div>
                              <div className="font-medium text-gray-900">{selectedFile.name}</div>
                              <div className="text-sm text-gray-600">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleSubmitRFP}
                        disabled={!selectedFile || uploading}
                        className="w-full h-12 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-xl font-semibold shadow-lg"
                      >
                        {uploading ? (
                          <>
                            <Brain className="w-5 h-5 mr-2 animate-spin" />
                            Processing RFP...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 mr-2" />
                            Submit RFP for Processing
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
                      Upload your RFP document in PDF format
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
            </TabsContent>

            <TabsContent value="history" className="p-8">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Submission History</h2>
                    <p className="text-gray-600 mt-1">Track your RFP submissions and download responses</p>
                  </div>
                </div>

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
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <FileText className="w-4 h-4 text-orange-600" />
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
                              <Button
                                onClick={() => handleDownload(submission)}
                                size="sm"
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
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
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
