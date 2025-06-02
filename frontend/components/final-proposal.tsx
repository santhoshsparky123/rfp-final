"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, AlertCircle, CheckCircle, Clock, Sparkles, FileDown, Trophy } from "lucide-react"

interface FinalProposalProps {
  editedResponse: any
  onProposalGenerated: () => void
}

export default function FinalProposal({ editedResponse, onProposalGenerated }: FinalProposalProps) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [proposalGenerated, setProposalGenerated] = useState(false)
  const [filePaths, setFilePaths] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState("")
  const [processingStep, setProcessingStep] = useState(0)

  const handleGenerateProposal = async () => {
    if (!editedResponse) return

    setGenerating(true)
    setProgress(0)
    setError(null)
    setProcessingStep(0)

    try {
      const steps = [
        "Compiling edited responses...",
        "Creating document structure...",
        "Formatting content...",
        "Generating Word document...",
        "Converting to PDF...",
        "Adding professional styling...",
        "Finalizing documents...",
      ]

      let stepIndex = 0
      const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex])
          setProcessingStep(stepIndex + 1)
          setProgress(((stepIndex + 1) / steps.length) * 100)
          stepIndex++
        }
      }, 1000)

      const response = await fetch("http://localhost:8000/api/final-rfp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedResponse),
      })

      clearInterval(progressInterval)
      setProgress(100)
      setCurrentStep("Documents ready!")

      if (!response.ok) {
        throw new Error(`Proposal generation failed: ${response.statusText}`)
      }

      const data = await response.json()
      setFilePaths(data)
      setProposalGenerated(true)

      setTimeout(() => {
        onProposalGenerated()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Proposal generation failed")
      setProgress(0)
      setCurrentStep("")
      setProcessingStep(0)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async (docType: string) => {
    if (!editedResponse?.rfp_id) return

    try {
      const response = await fetch(`http://localhost:8000/api/download-document/${editedResponse.rfp_id}/${docType}`)

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `${editedResponse.rfp_id}_proposal.${docType}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed")
    }
  }

  if (!editedResponse) {
    return (
      <Alert className="rounded-2xl border-amber-200 bg-amber-50 max-w-2xl mx-auto">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <AlertDescription className="text-amber-800 font-medium">
          Please complete the review and edit step first to create the final proposal.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      {/* Professional Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-lg mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Generate Final Proposal</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Compile your reviewed and edited responses into professional proposal documents ready for submission.
        </p>
      </div>

      <Card className="shadow-xl border-0 overflow-hidden max-w-4xl mx-auto">
        <div className="h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" />
        <CardContent className="p-8 space-y-8">
          {!proposalGenerated && !generating && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Sections",
                    count: editedResponse.sections.length,
                    desc: "completed",
                    icon: "📄",
                    color: "from-blue-500 to-blue-600",
                    bgColor: "from-blue-50 to-blue-100",
                  },
                  {
                    title: "Questions",
                    count: editedResponse.questions.length,
                    desc: "answered",
                    icon: "✅",
                    color: "from-green-500 to-green-600",
                    bgColor: "from-green-50 to-green-100",
                  },
                  {
                    title: "Requirements",
                    count: editedResponse.requirements.length,
                    desc: "addressed",
                    icon: "🎯",
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
                      <p className="text-sm text-gray-600">
                        {item.title} {item.desc}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200">
                  <div className="flex items-center justify-center gap-2 text-green-700 mb-4">
                    <Sparkles className="w-6 h-6" />
                    <span className="font-semibold text-lg">Ready for Final Compilation</span>
                  </div>
                  <p className="text-gray-600 text-lg">
                    Your reviewed and edited proposal document will include all customized responses in professional
                    format
                  </p>
                </div>

                <Button
                  onClick={handleGenerateProposal}
                  className="h-16 px-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-2xl shadow-lg"
                >
                  <Trophy className="w-6 h-6 mr-3" />
                  Generate Final Proposal Document
                </Button>
              </div>
            </div>
          )}

          {generating && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="p-4 bg-green-100 rounded-2xl">
                      <FileText className="w-10 h-10 text-green-600 animate-pulse" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 text-xl">{currentStep}</p>
                      <p className="text-gray-600">Step {processingStep} of 7</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-w-md mx-auto">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Document Generation</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-4 bg-gray-200" />
                  </div>
                </div>

                <p className="text-center text-gray-600 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Creating professional Word and PDF documents from your edited responses...
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

          {proposalGenerated && (
            <Alert className="rounded-2xl border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 font-medium">
                <strong>Final proposal documents generated successfully!</strong> Download them below.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {proposalGenerated && (
        <Card className="shadow-lg border-0 max-w-4xl mx-auto">
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
                      <FileDown className="w-5 h-5 mr-2" />
                      Download {doc.type.toUpperCase()}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal Summary */}
      <Card className="shadow-lg border-0 max-w-4xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Sparkles className="w-5 h-5" />
            Proposal Summary
          </CardTitle>
          <CardDescription className="text-purple-700">Overview of your completed proposal performance</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <span className="font-semibold text-gray-900">RFP ID:</span>
              <Badge variant="outline" className="font-mono text-sm px-3 py-1 rounded-xl">
                {editedResponse.rfp_id}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">📊 Response Statistics</h4>
                <div className="space-y-3">
                  {[
                    { label: "Sections", value: editedResponse.sections.length },
                    { label: "Questions", value: editedResponse.questions.length },
                    { label: "Requirements", value: editedResponse.requirements.length },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700">{stat.label}:</span>
                      <span className="font-bold text-blue-600">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">🎯 Processing Status</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <Badge className="bg-green-500 hover:bg-green-600 text-white">Complete</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">Quality:</span>
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Professional</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">Ready for:</span>
                    <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Submission</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
