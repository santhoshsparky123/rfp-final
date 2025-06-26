// final-proposal.tsx
"use client"

import { useState, useEffect } from "react"
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
  const [downloadUrls, setDownloadUrls] = useState<{ docx?: string; pdf?: string }>({})

  // Poll for download links every 6 seconds if not available
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (generated && (!downloadUrls.docx || !downloadUrls.pdf)) {
      interval = setInterval(async () => {
        try {
          const response = await fetch("http://localhost:8000/api/final-rfp/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rfp_id: editedResponse.rfp_id }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.docx_url && data.pdf_url) {
              setDownloadUrls({ docx: data.docx_url, pdf: data.pdf_url });
              clearInterval(interval);
            }
          }
        } catch (e) {
          // Ignore polling errors
        }
      }, 6000);
    }
    return () => interval && clearInterval(interval);
  }, [generated, downloadUrls, editedResponse.rfp_id]);

  const handleGenerateFinal = async () => {
    setGenerating(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("http://localhost:8000/api/final-rfp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedResponse),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to generate final proposal")
      }

      const data = await response.json()
      setDownloadUrls({ docx: data.docx_url, pdf: data.pdf_url })
      setGenerated(true)
      setSuccess("Final proposal generated successfully!")
      onProposalGenerated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate final proposal. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = (docType: "docx" | "pdf") => {
    const url = docType === "pdf" ? downloadUrls.pdf : downloadUrls.docx;
    if (!url) {
      setError("Download link not available. Please generate the proposal first.");
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = `${editedResponse.rfp_id}_proposal.${docType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // The handlePreview and Share buttons are removed as per the request.
  // const handlePreview = () => {
  //   // Open preview in new tab
  //   window.open(`http://localhost:8000/api/download-document/${editedResponse.rfp_id}/pdf`, "_blank")
  // }

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
              <div className="text-2xl font-bold text-blue-600">{editedResponse.sections?.length || 0}</div>
              <div className="text-sm text-blue-700">Sections</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{editedResponse.questions?.length || 0}</div>
              <div className="text-sm text-purple-700">Questions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{editedResponse.requirements?.length || 0}</div>
              <div className="text-sm text-green-700">Requirements</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-2xl font-bold text-orange-600">{editedResponse.rfp_id}</div>
              <div className="text-sm text-orange-700">RFP ID</div>
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
                  Your edited response is ready. Click below to generate the final Word and PDF proposal documents.
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
            <div className="space-y-3">
              {downloadUrls.docx && (
                <div className="p-4 bg-white rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <div className="font-semibold text-gray-900">{editedResponse.rfp_id}_proposal.docx</div>
                        <div className="text-sm text-gray-600">Microsoft Word Document</div>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">Word</Badge>
                  </div>
                </div>
              )}

              {downloadUrls.pdf && (
                <div className="p-4 bg-white rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-purple-600" />
                      <div>
                        <div className="font-semibold text-gray-900">{editedResponse.rfp_id}_proposal.pdf</div>
                        <div className="text-sm text-gray-600">PDF Document</div>
                      </div>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">PDF</Badge>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleDownload("docx")}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Word
              </Button>
              <Button
                onClick={() => handleDownload("pdf")}
                className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>

            {/* Removed Preview PDF and Share buttons as per the request */}
            {/* <div className="flex gap-3">
              <Button onClick={handlePreview} variant="outline" className="flex-1 rounded-xl">
                <Eye className="w-4 h-4 mr-2" />
                Preview PDF
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div> */}
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
            Available in both Word and PDF formats
          </div>
        </div>
      </div>
    </div>
  )
}