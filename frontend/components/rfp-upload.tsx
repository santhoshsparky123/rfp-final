"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, AlertCircle, CheckCircle, Brain, Sparkles, Zap, Clock } from "lucide-react"

interface RFPUploadProps {
  onUploadSuccess: (data: any) => void
}

export default function RFPUpload({ onUploadSuccess }: RFPUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [structuredData, setStructuredData] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState("")
  const [processingStep, setProcessingStep] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      setError(null)
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

  const handleUpload = async () => {
    if (!uploadedFile) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)
    setProcessingStep(0)

    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const steps = [
        "Uploading RFP document...",
        "Extracting text content...",
        "Analyzing document structure...",
        "Identifying sections and headers...",
        "Extracting questions and requirements...",
        "Categorizing content types...",
        "Finalizing document analysis...",
      ]

      let stepIndex = 0
      const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex])
          setProcessingStep(stepIndex + 1)
          setUploadProgress(((stepIndex + 1) / steps.length) * 100)
          stepIndex++
        }
      }, 800)

      const response = await fetch("http://localhost:8000/api/upload-rfp/", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      setCurrentStep("Analysis complete!")

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      setStructuredData(data.structured_data)

      setTimeout(() => {
        onUploadSuccess(data)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploadProgress(0)
      setCurrentStep("")
      setProcessingStep(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Professional Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg mb-4">
          <Upload className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Upload RFP Document</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your RFP document to begin AI-powered analysis and processing. Our system will extract all relevant
          information automatically.
        </p>
      </div>

      <Card className="shadow-xl border-0 overflow-hidden max-w-4xl mx-auto">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />
        <CardContent className="p-8 space-y-8">
          {!uploadedFile ? (
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-blue-400 bg-blue-50 scale-105 shadow-lg"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-6">
                <div
                  className={`mx-auto w-24 h-24 rounded-full bg-gradient-to-br ${isDragActive ? "from-blue-500 to-indigo-500" : "from-gray-400 to-gray-500"} flex items-center justify-center transition-all duration-300`}
                >
                  <FileText className="w-12 h-12 text-white" />
                </div>
                {isDragActive ? (
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold text-blue-600">Drop your RFP document here!</p>
                    <div className="flex justify-center">
                      <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-2xl font-semibold text-gray-700">Drag & drop your RFP document here</p>
                    <p className="text-gray-500 text-lg">or click to browse files</p>
                    <div className="flex justify-center gap-3 mt-6">
                      {["PDF", "DOC", "DOCX"].map((format) => (
                        <Badge key={format} variant="outline" className="px-4 py-2 text-sm font-medium">
                          {format}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-gray-400 mt-4">Maximum file size: 50MB</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-2xl">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{uploadedFile.name}</p>
                    <p className="text-gray-600">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadedFile(null)
                    setStructuredData(null)
                    setError(null)
                  }}
                  className="rounded-xl"
                >
                  Remove
                </Button>
              </div>

              {uploading && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{currentStep}</p>
                        <p className="text-sm text-gray-600">Step {processingStep} of 7</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span>AI Analysis Progress</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-3 bg-gray-200" />
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Our AI is extracting sections, questions, and requirements from your document
                    </p>
                  </div>
                </div>
              )}

              {!structuredData && !uploading && (
                <Button
                  onClick={handleUpload}
                  className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl shadow-lg"
                >
                  <Zap className="w-6 h-6 mr-3" />
                  Analyze RFP with AI
                </Button>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {structuredData && (
            <Alert className="rounded-2xl border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 font-medium">
                <strong>RFP analysis complete!</strong> Found {structuredData.sections?.length || 0} sections,{" "}
                {structuredData.questions?.length || 0} questions, and {structuredData.requirements?.length || 0}{" "}
                requirements.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {structuredData && (
        <Card className="shadow-lg border-0 max-w-4xl mx-auto">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Sparkles className="w-5 h-5" />
              AI Analysis Results
            </CardTitle>
            <CardDescription className="text-purple-700">
              Extracted structure and components from your RFP document
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Sections",
                  data: structuredData.sections,
                  icon: "📄",
                  color: "from-blue-500 to-blue-600",
                  bgColor: "from-blue-50 to-blue-100",
                },
                {
                  title: "Questions",
                  data: structuredData.questions,
                  icon: "❓",
                  color: "from-green-500 to-green-600",
                  bgColor: "from-green-50 to-green-100",
                },
                {
                  title: "Requirements",
                  data: structuredData.requirements,
                  icon: "✅",
                  color: "from-purple-500 to-purple-600",
                  bgColor: "from-purple-50 to-purple-100",
                },
              ].map((category) => (
                <div key={category.title} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{category.title}</h4>
                      <Badge variant="outline" className="mt-1">
                        {category.data?.length || 0} found
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {category.data?.slice(0, 3).map((item: any, index: number) => (
                      <div
                        key={index}
                        className={`text-sm p-3 rounded-xl border bg-gradient-to-br ${category.bgColor} hover:shadow-sm transition-all duration-200`}
                      >
                        {item.title || item.text?.substring(0, 80) || "Item"}
                        {(item.title || item.text)?.length > 80 && "..."}
                      </div>
                    ))}
                    {category.data?.length > 3 && (
                      <div className="text-sm text-gray-500 text-center py-2 font-medium">
                        +{category.data.length - 3} more {category.title.toLowerCase()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
