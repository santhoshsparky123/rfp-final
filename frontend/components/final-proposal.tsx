"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, CheckCircle, AlertCircle, Eye, Share } from "lucide-react"

interface FinalProposalProps {
  editedResponse: any
  onProposalGenerated: () => void
}

export default function FinalProposal({ editedResponse, onProposalGenerated }: FinalProposalProps) {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleGenerateFinal = async () => {
    setGenerating(true)
    setError(null)
    setSuccess(null)

    try {
      // Simulate final proposal generation
      await new Promise((resolve) => setTimeout(resolve, 3000))

      setGenerated(true)
      setSuccess("Final proposal generated successfully!")
      onProposalGenerated()
    } catch (err) {
      setError("Failed to generate final proposal. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    // Simulate download
    const link = document.createElement("a")
    link.href = "#"
    link.download = `${editedResponse.metadata.title}-final-proposal.pdf`
    link.click()
  }

  const handlePreview = () => {
    // Simulate preview
    window.open("#", "_blank")
  }

  if (!editedResponse) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="p-8">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Edited Response</h3>
          <p className="text-gray-600">Please complete the review and editing process first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl mb-4">
          <Download className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Proposal</h2>
        <p className="text-gray-600">Generate and download your completed RFP response document</p>
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

      {/* Proposal Summary */}
      <Card className="mb-8 border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Proposal Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{editedResponse.sections.length}</div>
              <div className="text-sm text-blue-700">Sections</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{editedResponse.questions.length}</div>
              <div className="text-sm text-purple-700">Questions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{editedResponse.requirements.length}</div>
              <div className="text-sm text-green-700">Requirements</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(editedResponse.metadata.ai_confidence * 100)}%
              </div>
              <div className="text-sm text-orange-700">Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Status */}
      {!generated ? (
        <Card className="border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors duration-200">
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl">
                <FileText className="w-10 h-10 text-green-600" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Generate Final Proposal</h3>
                <p className="text-gray-600 mb-6">
                  Your edited response is ready. Click below to generate the final PDF proposal document.
                </p>
              </div>

              <Button
                onClick={handleGenerateFinal}
                disabled={generating}
                className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-semibold shadow-lg"
              >
                {generating ? (
                  <>
                    <FileText className="w-5 h-5 mr-2 animate-spin" />
                    Generating Final Proposal...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Generate Final Proposal
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Final Proposal Ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {editedResponse.metadata.title}-final-proposal.pdf
                    </div>
                    <div className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700">Ready</Badge>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleDownload}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={handlePreview} variant="outline" className="rounded-xl">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" className="rounded-xl">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Information */}
      <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200">
        <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          What's Included in Your Final Proposal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Professional cover page and executive summary
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Detailed responses to all RFP sections
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Comprehensive answers to all questions
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Compliance matrix for all requirements
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Professional formatting and layout
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Company information and credentials
          </div>
        </div>
      </div>
    </div>
  )
}
