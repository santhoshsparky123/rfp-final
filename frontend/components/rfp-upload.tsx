"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle, Brain } from "lucide-react"

interface RFPUploadProps {
  onUploadSuccess: (data: any) => void
}

export default function RFPUpload({ onUploadSuccess }: RFPUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first")
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Simulate file upload and processing
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock structured data response
      const mockData = {
        rfp_id: `rfp_${Date.now()}`,
        structured_data: {
          metadata: {
            title: selectedFile.name.replace(".pdf", ""),
            pages: Math.floor(Math.random() * 50) + 10,
            submission_deadline: "2024-02-15",
          },
          sections: [
            { id: 1, title: "Executive Summary", content: "Overview of the project requirements..." },
            { id: 2, title: "Technical Requirements", content: "Detailed technical specifications..." },
            { id: 3, title: "Project Timeline", content: "Expected delivery milestones..." },
          ],
          questions: [
            { id: 1, question: "What is your company's experience with similar projects?" },
            { id: 2, question: "How do you ensure data security and compliance?" },
            { id: 3, question: "What is your proposed timeline for implementation?" },
          ],
          requirements: [
            { id: 1, requirement: "Must support 10,000+ concurrent users" },
            { id: 2, requirement: "24/7 technical support required" },
            { id: 3, requirement: "Cloud-based deployment preferred" },
          ],
        },
      }

      onUploadSuccess(mockData)
    } catch (err) {
      setError("Failed to process RFP. Please try again.")
    } finally {
      setUploading(false)
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

      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-200">
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
                className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {selectedFile && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">{selectedFile.name}</div>
                    <div className="text-sm text-gray-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
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
                  Processing RFP...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload & Process RFP
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
            AI analyzes your RFP document structure and content
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
    </div>
  )
}
