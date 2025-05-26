"use client"

import type React from "react"

import { useState } from "react"
import { UploadIcon, FileText, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"

export function Upload() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          setUploadComplete(true)
          return 100
        }
        return prev + 10
      })
    }, 500)

    // In a real application, you would upload the files to your backend here
    // const formData = new FormData()
    // files.forEach(file => {
    //   formData.append('files', file)
    // })
    // await fetch('/api/upload', { method: 'POST', body: formData })
  }

  const resetUpload = () => {
    setFiles([])
    setUploadProgress(0)
    setUploadComplete(false)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-6">
        {!uploadComplete ? (
          <>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <UploadIcon className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Upload your RFP files</h3>
              <p className="text-sm text-gray-500 mt-1">Drag and drop your files here or click to browse</p>
              <p className="text-xs text-gray-400 mt-2">Supports PDF and Word documents</p>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Selected Files</h4>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                      </div>
                      <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-gray-500">
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>

                {uploading ? (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-gray-500 text-center">{uploadProgress}% uploaded</p>
                  </div>
                ) : (
                  <Button onClick={handleUpload} className="w-full">
                    Process Files
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Upload Complete</h3>
            <p className="text-sm text-gray-500 mt-1 text-center">
              Your files have been uploaded and are now being processed.
            </p>
            <Button onClick={resetUpload} variant="outline" className="mt-4">
              Upload More Files
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
