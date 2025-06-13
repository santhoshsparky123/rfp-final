"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle, Brain, X, File } from "lucide-react"

interface RFPUploadProps {
  onUploadSuccess: (data: any) => void
}

export default function RFPUpload({ onUploadSuccess }: RFPUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
          <FileText className="w-5 h-5 text-red-600" />
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
          <File className="w-5 h-5 text-blue-600" />
        </div>
      )
    }

    return (
      <div className="p-2 bg-gray-100 rounded-lg">
        <FileText className="w-5 h-5 text-gray-600" />
      </div>
    )
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first")
      return
    }

    setUploading(true)
    setError(null)
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
        throw new Error(errorData.detail || "Failed to upload RFP")
      }

      const data = await response.json()
      console.log("RFP Upload Response:", data)

      onUploadSuccess(data)
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to process RFP. Please try again.")
    } finally {
      setUploading(false)
      setProcessingStage(null)
      setCurrentSlide(0)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl mb-4">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload RFP Document</h2>
        <p className="text-gray-600">Upload your RFP document to begin the AI-powered response generation process</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 rounded-xl border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

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

      {/* Upload Form - Hidden during processing */}
      {!uploading && (
        <>
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-200">
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
                      className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: PDF (.pdf) and Word documents (.doc, .docx)
                  </p>
                </div>

                {selectedFile && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getFileIcon(selectedFile)}
                        <div>
                          <div className="font-medium text-gray-900">{selectedFile.name}</div>
                          <div className="text-sm text-gray-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
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
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl font-semibold shadow-lg"
                >
                  {uploading ? (
                    <>
                      <Brain className="w-5 h-5 mr-2 animate-spin" />
                      Processing Document...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Upload & Process Document
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              What happens next?
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                AI analyzes your document structure and content
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                Extracts questions, requirements, and key sections
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                Prepares data for intelligent response generation
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
