"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Database,
  RefreshCw,
  Clock,
  Sparkles,
  Shield,
  ArrowRight,
} from "lucide-react"

interface CompanyDocsStatus {
  exists: boolean
  count: number
  vector_store_id?: string
  last_updated?: string
}

interface CompanyDocsUploadProps {
  onUploadSuccess: (status: CompanyDocsStatus) => void
  existingDocsStatus: CompanyDocsStatus
}

export default function CompanyDocsUpload({ onUploadSuccess, existingDocsStatus }: CompanyDocsUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null)
  const [useExistingDocs, setUseExistingDocs] = useState(existingDocsStatus.exists)
  const [currentStep, setCurrentStep] = useState("")
  const [processingStep, setProcessingStep] = useState(0)
  const [showUploadOption, setShowUploadOption] = useState(false)

  useEffect(() => {
    if (existingDocsStatus.exists && useExistingDocs && !showUploadOption) {
      // Auto-proceed if using existing documents
      setTimeout(() => {
        onUploadSuccess(existingDocsStatus)
      }, 1500)
    }
  }, [useExistingDocs, existingDocsStatus, onUploadSuccess, showUploadOption])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles((prev) => [...prev, ...acceptedFiles])
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
    },
    multiple: true,
  })

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)
    setProcessingStep(0)

    try {
      const formData = new FormData()
      uploadedFiles.forEach((file) => {
        formData.append("files", file)
      })

      // Enhanced progress simulation with detailed steps
      const steps = [
        "Uploading documents...",
        "Extracting text content...",
        "Processing document structure...",
        "Creating embeddings...",
        "Building vector database...",
        "Optimizing search index...",
        "Finalizing knowledge base...",
      ]

      let stepIndex = 0
      const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex])
          setProcessingStep(stepIndex + 1)
          setUploadProgress(((stepIndex + 1) / steps.length) * 100)
          stepIndex++
        }
      }, 1200)

      const response = await fetch("http://localhost:8000/api/upload-company-docs", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      setCurrentStep("Knowledge base updated!")

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      setVectorStoreId(data.vector_store_id)

      const newStatus: CompanyDocsStatus = {
        exists: true,
        count: existingDocsStatus.count + uploadedFiles.length,
        vector_store_id: data.vector_store_id,
        last_updated: new Date().toISOString(),
      }

      setTimeout(() => {
        onUploadSuccess(newStatus)
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

  const handleUseExisting = () => {
    onUploadSuccess(existingDocsStatus)
  }

  const handleUpdateDocs = () => {
    setShowUploadOption(true)
    setUseExistingDocs(false)
  }

  return (
    <div className="space-y-8">
      {/* Existing Documents Status */}
      {existingDocsStatus.exists && (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-green-800">
              <div className="p-2 bg-green-100 rounded-xl">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              Company Knowledge Base Ready
            </CardTitle>
            <CardDescription className="text-green-700 text-base">
              Your company knowledge base contains {existingDocsStatus.count} processed documents and is ready to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-green-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-900">Knowledge Base Status</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Documents:</span>
                      <Badge variant="outline" className="bg-green-50 border-green-200">
                        {existingDocsStatus.count} files
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vector Store ID:</span>
                      <span className="font-mono text-xs text-gray-500">
                        {existingDocsStatus.vector_store_id?.substring(0, 12)}...
                      </span>
                    </div>
                    {existingDocsStatus.last_updated && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(existingDocsStatus.last_updated).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Available Actions</span>
                  </div>
                  <div className="space-y-2">
                    {!showUploadOption ? (
                      <>
                        <Button
                          onClick={handleUseExisting}
                          className="w-full bg-green-600 hover:bg-green-700 rounded-xl"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Continue with Existing Documents
                        </Button>
                        <Button
                          onClick={handleUpdateDocs}
                          variant="outline"
                          className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Update Knowledge Base
                        </Button>
                      </>
                    ) : (
                      <Alert className="border-blue-200 bg-blue-50">
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          Upload new documents to enhance your existing knowledge base.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload New Documents */}
      {(!existingDocsStatus.exists || showUploadOption) && (
        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />
          <CardHeader className="bg-gradient-to-br from-slate-50 to-blue-50 pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <Upload className="w-7 h-7 text-blue-600" />
              </div>
              {existingDocsStatus.exists ? "Update Knowledge Base" : "Create Knowledge Base"}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              {existingDocsStatus.exists
                ? "Upload additional documents to enhance your knowledge base"
                : "Upload your company documents to create an AI-powered knowledge base"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Enhanced Drop Zone */}
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-blue-400 bg-blue-50 scale-105 shadow-lg"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-6">
                <div
                  className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${isDragActive ? "from-blue-500 to-indigo-500" : "from-gray-400 to-gray-500"} flex items-center justify-center transition-all duration-300`}
                >
                  <Upload className="w-10 h-10 text-white" />
                </div>
                {isDragActive ? (
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-blue-600">Drop your documents here!</p>
                    <div className="flex justify-center">
                      <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xl font-semibold text-gray-700">Drag & drop company documents here</p>
                    <p className="text-gray-500">or click to browse files</p>
                    <div className="flex justify-center gap-3 mt-6">
                      {["PDF", "DOC", "DOCX", "TXT"].map((format) => (
                        <Badge key={format} variant="outline" className="px-3 py-1 text-sm font-medium">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">Selected Documents</h4>
                  <Badge variant="secondary" className="px-3 py-1">
                    {uploadedFiles.length} files
                  </Badge>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Processing Status */}
                {uploading && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{currentStep}</p>
                          <p className="text-sm text-gray-600">Step {processingStep} of 7</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Processing documents...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-3 bg-gray-200" />
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {existingDocsStatus.exists
                          ? "Updating AI-powered knowledge base with new documents"
                          : "Creating AI-powered knowledge base from your documents"}
                      </p>
                    </div>
                  </div>
                )}

                {!vectorStoreId && !uploading && (
                  <Button
                    onClick={handleUpload}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl shadow-lg"
                  >
                    <Upload className="w-6 h-6 mr-3" />
                    {existingDocsStatus.exists ? "Update Knowledge Base" : "Process Documents & Create Knowledge Base"}
                  </Button>
                )}
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {/* Success State */}
            {vectorStoreId && (
              <Alert className="rounded-2xl border-green-200 bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800 font-medium">
                  <strong>Knowledge base {existingDocsStatus.exists ? "updated" : "created"} successfully!</strong> Your
                  documents are now ready for AI processing.
                  <br />
                  <span className="text-sm text-green-700 mt-1 block">Vector Store ID: {vectorStoreId}</span>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Types Guide */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Sparkles className="w-5 h-5" />
            Recommended Document Types
          </CardTitle>
          <CardDescription className="text-purple-700">
            Upload these types of documents for optimal AI response quality
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Company Profile", icon: "🏢", desc: "About us, mission, values" },
              { name: "Service Catalog", icon: "📋", desc: "Products and services offered" },
              { name: "Case Studies", icon: "📊", desc: "Success stories and examples" },
              { name: "Pricing Sheets", icon: "💰", desc: "Cost structures and pricing" },
            ].map((item, index) => (
              <div
                key={item.name}
                className="text-center p-4 rounded-2xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="font-medium text-gray-900 mb-1">{item.name}</p>
                <p className="text-xs text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
