"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Upload, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function UploadForm() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
      validateFiles(selectedFiles)
    }
  }

  const validateFiles = (selectedFiles: File[]) => {
    setError(null)

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    const invalidFiles = selectedFiles.filter((file) => !validTypes.includes(file.type))

    if (invalidFiles.length > 0) {
      setError("Invalid file type(s). Only PDF, Word documents, and Excel files are supported.")
      setFiles([])
      return
    }

    const maxSize = 10 * 1024 * 1024
    const oversizedFiles = selectedFiles.filter((file) => file.size > maxSize)

    if (oversizedFiles.length > 0) {
      setError("File(s) too large. Maximum size is 10MB per file.")
      setFiles([])
      return
    }

    setFiles(selectedFiles)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFiles(Array.from(e.dataTransfer.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
    setError(null)
    setSuccess(false)
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    files.forEach((file) => {
      formData.append("files", file)
    })

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + 5
      })
    }, 300)

    try {
      // FormData is already created and files are appended above
      const response = await fetch("http://localhost:8000/api/upload-rfp", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
        throw new Error(errorData.message || `Upload failed with status: ${response.status}`)
      }

      const result = await response.json()
      console.log("Upload successful:", result)

      clearInterval(interval)
      setUploadProgress(100)
      setSuccess(true)
      setUploading(false)

      // Store the result in sessionStorage and redirect
      sessionStorage.setItem("rfpData", JSON.stringify(result))
      setTimeout(() => {
        router.push("/results")
      }, 1500)
    } catch (err: any) {
      clearInterval(interval)
      setUploading(false)
      setError(err.message || "An unexpected error occurred during upload. Please try again.")
      setUploadProgress(0)
      setSuccess(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload RFP Document</CardTitle>
        <CardDescription>Upload your RFP document to extract structured data and generate responses</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Upload Successful</h3>
            <p className="text-sm text-gray-500 mt-2 mb-4">Your document has been processed successfully.</p>
            <Progress value={100} className="w-full h-2" />
            <p className="text-xs text-gray-500 mt-2">Redirecting to results page...</p>
          </div>
        ) : (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                dragOver ? "border-purple-400 bg-purple-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-purple-100 p-3">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-base font-medium">Drag and drop your file here</h3>
                  <p className="text-sm text-gray-500">or click to browse</p>
                  <p className="text-xs text-gray-400">Supports PDF, Word documents, and Excel files (max 10MB)</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileChange}
                  disabled={uploading}
                  multiple
                />
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-medium">Selected Files</h4>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 truncate max-w-[200px] sm:max-w-sm">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)} disabled={uploading}>
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {uploading && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing document...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleUpload} disabled={files.length === 0 || uploading || success}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Upload and Process"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}