"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FileText, Upload, CheckCircle, AlertCircle, Building, Calendar, Trash2 } from "lucide-react"

interface CompanyDocsUploadProps {
  onUploadSuccess: (status: any) => void
  existingDocsStatus: {
    exists: boolean
    count: number
    vector_store_id?: string
    last_updated?: string
  }
}

export default function CompanyDocsUpload({ onUploadSuccess, existingDocsStatus }: CompanyDocsUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      // Validate file types
      const validFiles = Array.from(files).filter((file) => {
        return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      })

      if (validFiles.length !== files.length) {
        setError("Please select only PDF files")
        return
      }

      setSelectedFiles(files)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError("Please select files first")
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Simulate file upload and processing
      await new Promise((resolve) => setTimeout(resolve, 4000))

      const newStatus = {
        exists: true,
        count: existingDocsStatus.count + selectedFiles.length,
        vector_store_id: existingDocsStatus.vector_store_id || `vs_${Date.now()}`,
        last_updated: new Date().toISOString(),
      }

      setSuccess(`Successfully uploaded ${selectedFiles.length} documents!`)
      onUploadSuccess(newStatus)

      // Reset file input
      const fileInput = document.getElementById("company-files") as HTMLInputElement
      if (fileInput) fileInput.value = ""
      setSelectedFiles(null)
    } catch (err) {
      setError("Failed to upload documents. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleClearDocs = async () => {
    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Simulate clearing documents
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const clearedStatus = {
        exists: false,
        count: 0,
        vector_store_id: undefined,
        last_updated: undefined,
      }

      setSuccess("All company documents have been cleared.")
      onUploadSuccess(clearedStatus)
    } catch (err) {
      setError("Failed to clear documents. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl mb-4">
          <Building className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Documents</h2>
        <p className="text-gray-600">
          Upload your company documents to help AI generate more accurate and personalized responses
        </p>
      </div>

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

      {/* Existing Documents Status */}
      {existingDocsStatus.exists && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Company Documents Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">Documents Count:</span>
                <Badge className="bg-green-100 text-green-700">{existingDocsStatus.count} files</Badge>
              </div>
              {existingDocsStatus.last_updated && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">Last Updated:</span>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Calendar className="w-3 h-3" />
                    {new Date(existingDocsStatus.last_updated).toLocaleDateString()}
                  </div>
                </div>
              )}
              <div className="pt-2">
                <Button
                  onClick={handleClearDocs}
                  disabled={uploading}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Documents
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload New Documents */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors duration-200">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-files" className="text-sm font-medium text-gray-700">
                {existingDocsStatus.exists ? "Add More Documents (PDF only)" : "Upload Company Documents (PDF only)"}
              </Label>
              <Input
                id="company-files"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
                className="h-12 rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500">
                You can select multiple PDF files. These documents will be used to generate personalized responses.
              </p>
            </div>

            {selectedFiles && selectedFiles.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="space-y-2">
                  <div className="font-medium text-gray-900 mb-2">Selected Files ({selectedFiles.length}):</div>
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span className="flex-1">{file.name}</span>
                      <span className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFiles || selectedFiles.length === 0 || uploading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-semibold shadow-lg"
            >
              {uploading ? (
                <>
                  <Upload className="w-5 h-5 mr-2 animate-spin" />
                  {existingDocsStatus.exists ? "Adding Documents..." : "Uploading Documents..."}
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  {existingDocsStatus.exists ? "Add Documents" : "Upload Documents"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 p-6 bg-purple-50 rounded-xl border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
          <Building className="w-5 h-5" />
          Document Types to Include
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-purple-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            Company profiles and capabilities
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            Past project case studies
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            Technical specifications
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            Service offerings and pricing
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            Certifications and compliance
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            Team qualifications
          </div>
        </div>
      </div>
    </div>
  )
}
