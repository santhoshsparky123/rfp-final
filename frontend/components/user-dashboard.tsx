"use client"

import { CardDescription } from "@/components/ui/card"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Brain, Download, CheckCircle, Clock, User, LogOut, Trophy, AlertCircle } from "lucide-react"
import RFPUpload from "@/components/rfp-upload"

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

interface RFPData {
  rfp_id: string
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

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [currentStep, setCurrentStep] = useState<"upload" | "generating" | "completed">("upload")
  const [rfpData, setRFPData] = useState<RFPData | null>(null)
  const [generatedResponse, setGeneratedResponse] = useState<GeneratedResponse | null>(null)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState("")
  const [currentItemIndex, setCurrentItemIndex] = useState(0)

  const handleRFPUpload = (data: RFPData) => {
    setRFPData(data)
    setCurrentStep("generating")
    // Auto-start generation for users
    setTimeout(() => {
      handleGenerateResponse(data)
    }, 1000)
  }

  const handleGenerateResponse = async (data: RFPData) => {
    setGenerating(true)
    setProgress(0)
    setError(null)
    setCurrentItemIndex(0)

    try {
      const totalItems =
        (data.structured_data.sections?.length || 0) +
        (data.structured_data.questions?.length || 0) +
        (data.structured_data.requirements?.length || 0)

      const steps = [
        "Initializing AI agents...",
        "Loading company knowledge base...",
        "Processing RFP sections...",
        "Generating question responses...",
        "Evaluating requirements compliance...",
        "Cross-referencing capabilities...",
        "Optimizing response quality...",
        "Compiling final responses...",
        "Creating proposal document...",
        "Finalizing deliverables...",
      ]

      let stepIndex = 0
      let itemsProcessed = 0

      const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setProcessingStep(steps[stepIndex])

          if (stepIndex >= 2 && stepIndex <= 6) {
            // Simulate processing individual items
            itemsProcessed += Math.floor(Math.random() * 2) + 1
            setCurrentItemIndex(Math.min(itemsProcessed, totalItems))
            setProgress(Math.min((itemsProcessed / totalItems) * 80, 80))
          } else {
            setProgress(((stepIndex + 1) / steps.length) * 100)
          }

          if (stepIndex < 2 || itemsProcessed >= totalItems) {
            stepIndex++
          }
        }
      }, 1800)

      // Simulate API calls
      const response = await fetch("http://localhost:8000/api/generate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`)
      }

      const responseData = await response.json()

      // Generate final proposal automatically
      const proposalResponse = await fetch("http://localhost:8000/api/final-rfp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(responseData),
      })

      clearInterval(progressInterval)
      setProgress(100)
      setProcessingStep("Complete!")

      if (proposalResponse.ok) {
        setGeneratedResponse(responseData)
        setCurrentStep("completed")
      } else {
        throw new Error("Failed to generate final proposal")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed")
      setProgress(0)
      setProcessingStep("")
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async (docType: string) => {
    if (!generatedResponse?.rfp_id) return

    try {
      const response = await fetch(`http://localhost:8000/api/download-document/${generatedResponse.rfp_id}/${docType}`)

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `${generatedResponse.rfp_id}_proposal.${docType}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed")
    }
  }

  const handleStartOver = () => {
    setCurrentStep("upload")
    setRFPData(null)
    setGeneratedResponse(null)
    setGenerating(false)
    setProgress(0)
    setError(null)
    setProcessingStep("")
    setCurrentItemIndex(0)
  }

  const satisfiedRequirements = generatedResponse?.requirements.filter((r: any) => r.satisfied).length || 0
  const totalRequirements = generatedResponse?.requirements.length || 0
  const complianceRate = totalRequirements > 0 ? Math.round((satisfiedRequirements / totalRequirements) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              RFP Response Generator
            </h1>
            <p className="text-gray-600 mt-1">Submit your RFP and get AI-generated proposals instantly</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4" />
                {user.name}
              </div>
              <div className="text-xs text-gray-500">{user.company}</div>
              <Badge variant="outline" className="mt-1 text-xs">
                User Account
              </Badge>
            </div>
            <Button variant="outline" onClick={onLogout} className="rounded-xl border-gray-300 hover:bg-gray-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-center items-center space-x-8">
            {[
              { id: "upload", title: "Upload RFP", icon: Upload, completed: !!rfpData },
              { id: "generating", title: "AI Processing", icon: Brain, completed: currentStep === "completed" },
              { id: "completed", title: "Download Proposal", icon: Download, completed: currentStep === "completed" },
            ].map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = step.completed

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-500 ${
                        isCompleted
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white shadow-lg shadow-green-200"
                          : isActive
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-500 text-white shadow-lg shadow-blue-200"
                            : "bg-white border-gray-300 text-gray-400 hover:border-gray-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-8 h-8" /> : <Icon className="w-8 h-8" />}
                      {isActive && !isCompleted && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 animate-pulse" />
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p
                        className={`text-sm font-semibold transition-colors duration-300 ${
                          isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </p>
                      <div
                        className={`mt-1 h-1 w-16 rounded-full transition-all duration-500 ${
                          isCompleted ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-gray-200"
                        }`}
                      />
                    </div>
                  </div>
                  {index < 2 && (
                    <div className="flex items-center mx-6">
                      <div
                        className={`h-0.5 w-20 transition-all duration-500 ${
                          isCompleted ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            {/* Upload Step */}
            {currentStep === "upload" && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your RFP Document</h2>
                  <p className="text-gray-600">
                    Upload your RFP document and our AI will automatically generate a comprehensive proposal
                  </p>
                </div>
                <RFPUpload onUploadSuccess={handleRFPUpload} />
              </div>
            )}

            {/* Generating Step */}
            {currentStep === "generating" && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">AI is Processing Your RFP</h2>
                  <p className="text-gray-600">
                    Our AI agents are analyzing your RFP and generating a comprehensive proposal
                  </p>
                </div>

                {rfpData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                      {
                        title: "Sections",
                        count: rfpData.structured_data.sections.length,
                        icon: "📄",
                        color: "from-blue-500 to-blue-600",
                        bgColor: "from-blue-50 to-blue-100",
                      },
                      {
                        title: "Questions",
                        count: rfpData.structured_data.questions.length,
                        icon: "❓",
                        color: "from-green-500 to-green-600",
                        bgColor: "from-green-50 to-green-100",
                      },
                      {
                        title: "Requirements",
                        count: rfpData.structured_data.requirements.length,
                        icon: "✅",
                        color: "from-purple-500 to-purple-600",
                        bgColor: "from-purple-50 to-purple-100",
                      },
                    ].map((item) => (
                      <Card
                        key={item.title}
                        className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                      >
                        <div className={`h-2 bg-gradient-to-r ${item.color}`} />
                        <CardHeader className={`pb-3 bg-gradient-to-br ${item.bgColor}`}>
                          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <span className="text-lg">{item.icon}</span>
                            {item.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 text-center">
                          <div
                            className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-1`}
                          >
                            {item.count}
                          </div>
                          <p className="text-sm text-gray-600">Found in RFP</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {generating && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-200">
                    <div className="space-y-6">
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="p-3 bg-purple-100 rounded-2xl">
                            <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900 text-lg">{processingStep}</p>
                            {currentItemIndex > 0 && (
                              <p className="text-sm text-gray-500">
                                Processing item {currentItemIndex} of{" "}
                                {rfpData
                                  ? (rfpData.structured_data.sections?.length || 0) +
                                    (rfpData.structured_data.questions?.length || 0) +
                                    (rfpData.structured_data.requirements?.length || 0)
                                  : 0}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 max-w-md mx-auto">
                          <div className="flex justify-between text-sm font-medium">
                            <span>AI Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-3 bg-gray-200" />
                        </div>
                      </div>

                      <p className="text-center text-gray-600 flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        This may take several minutes as AI agents process each component thoroughly...
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Completed Step */}
            {currentStep === "completed" && generatedResponse && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-4">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Proposal is Ready!</h2>
                  <p className="text-gray-600">
                    AI has successfully generated a comprehensive proposal based on your RFP
                  </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    {
                      title: "Sections",
                      count: generatedResponse.sections.length,
                      icon: "📄",
                      color: "from-blue-500 to-blue-600",
                      bgColor: "from-blue-50 to-blue-100",
                    },
                    {
                      title: "Questions",
                      count: generatedResponse.questions.length,
                      icon: "❓",
                      color: "from-green-500 to-green-600",
                      bgColor: "from-green-50 to-green-100",
                    },
                    {
                      title: "Requirements",
                      count: generatedResponse.requirements.length,
                      icon: "✅",
                      color: "from-purple-500 to-purple-600",
                      bgColor: "from-purple-50 to-purple-100",
                    },
                    {
                      title: "Compliance",
                      count: `${complianceRate}%`,
                      icon: complianceRate >= 80 ? "🎯" : complianceRate >= 60 ? "⚠️" : "❌",
                      color:
                        complianceRate >= 80
                          ? "from-green-500 to-green-600"
                          : complianceRate >= 60
                            ? "from-yellow-500 to-yellow-600"
                            : "from-red-500 to-red-600",
                      bgColor:
                        complianceRate >= 80
                          ? "from-green-50 to-green-100"
                          : complianceRate >= 60
                            ? "from-yellow-50 to-yellow-100"
                            : "from-red-50 to-red-100",
                    },
                  ].map((item) => (
                    <Card
                      key={item.title}
                      className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                      <div className={`h-2 bg-gradient-to-r ${item.color}`} />
                      <CardHeader className={`pb-3 bg-gradient-to-br ${item.bgColor}`}>
                        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <span className="text-lg">{item.icon}</span>
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 text-center">
                        <div
                          className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-1`}
                        >
                          {item.count}
                        </div>
                        <p className="text-sm text-gray-600">Completed</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Download Section */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Download className="w-5 h-5" />
                      Download Your Proposal
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Your proposal is ready for download in multiple formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        {
                          type: "docx",
                          title: "Word Document",
                          description: "Editable DOCX format for further customization",
                          icon: "📝",
                          color: "from-blue-500 to-blue-600",
                          bgColor: "from-blue-50 to-blue-100",
                        },
                        {
                          type: "pdf",
                          title: "PDF Document",
                          description: "Professional PDF format for submission",
                          icon: "📄",
                          color: "from-red-500 to-red-600",
                          bgColor: "from-red-50 to-red-100",
                        },
                      ].map((doc) => (
                        <Card
                          key={doc.type}
                          className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          <div className={`h-2 bg-gradient-to-r ${doc.color}`} />
                          <CardContent className="p-6 text-center">
                            <div
                              className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${doc.bgColor} flex items-center justify-center mb-4`}
                            >
                              <span className="text-3xl">{doc.icon}</span>
                            </div>
                            <h3 className="font-semibold mb-2 text-lg text-gray-900">{doc.title}</h3>
                            <p className="text-sm text-gray-600 mb-6">{doc.description}</p>
                            <Button
                              onClick={() => handleDownload(doc.type)}
                              className={`w-full h-12 bg-gradient-to-r ${doc.color} hover:opacity-90 rounded-xl shadow-md`}
                            >
                              <Download className="w-5 h-5 mr-2" />
                              Download {doc.type.toUpperCase()}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Start Over Button */}
                <div className="text-center">
                  <Button
                    onClick={handleStartOver}
                    variant="outline"
                    className="h-12 px-8 rounded-xl border-gray-300 hover:bg-gray-50"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Process Another RFP
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
