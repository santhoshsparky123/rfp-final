// final-proposal.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, AlertCircle } from "lucide-react"

interface FinalProposalProps {
  editedResponse: any
  onProposalGenerated: () => void
}

export default function FinalProposal({ editedResponse, onProposalGenerated }: FinalProposalProps) {
  const [downloadUrls, setDownloadUrls] = useState<{ docx?: string; pdf?: string }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUrls = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`http://localhost:8000/api/final-rfp/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rfp_id: editedResponse.rfp_id }),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.detail || "Failed to fetch proposal download links")
        }
        const data = await response.json()
        setDownloadUrls({ docx: data.docx_url, pdf: data.pdf_url })
      } catch (err: any) {
        setError(err.message || "Failed to fetch proposal download links")
      } finally {
        setLoading(false)
      }
    }
    if (editedResponse && editedResponse.rfp_id) {
      fetchUrls()
    }
  }, [editedResponse])

  const handleDownload = (docType: "docx" | "pdf") => {
    const url = docType === "pdf" ? downloadUrls.pdf : downloadUrls.docx;
    if (!url) {
      setError("Download link not available. Please try again later.");
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = `${editedResponse.rfp_id}_proposal.${docType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="max-w-2xl mx-auto mt-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl mb-4">
          <Download className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Download Final Proposal</h2>
        <p className="text-gray-600">Your completed RFP response documents are ready for download.</p>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-6 rounded-xl border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading download links...</div>
      ) : (
        <div className="flex flex-col gap-6 items-center">
          {downloadUrls.docx && (
            <Button
              onClick={() => handleDownload("docx")}
              className="w-64 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Word (.docx)
            </Button>
          )}
          {downloadUrls.pdf && (
            <Button
              onClick={() => handleDownload("pdf")}
              className="w-64 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF (.pdf)
            </Button>
          )}
          {!downloadUrls.docx && !downloadUrls.pdf && (
            <div className="text-gray-500">No proposal files available for download.</div>
          )}
        </div>
      )}
    </div>
  )
}