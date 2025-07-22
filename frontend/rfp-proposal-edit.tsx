"use client"

import { Label } from "@/components/ui/label"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle" // Import ThemeToggle

interface RFPProposalEditProps {
  rfpId: number
  token: string
  pdfUrl: string
  filename: string
  onFinal: (result: string) => void
  generatedResponse?: any
}

function splitSections(text: string): { title: string; content: string }[] {
  const sectionRegex = /(^#+ .+|^\d+\..+|^\*\*.+\*\*.*$)/gm
  const matches = [...text.matchAll(sectionRegex)]
  if (!matches.length) return [{ title: "Full Text", content: text }]
  const sections = []
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index!
    const end = matches[i + 1]?.index ?? text.length
    const title = matches[i][0]
      .replace(/^#+\s*/, "")
      .replace(/^\*\*|\*\*$/g, "")
      .trim()
    const content = text.slice(start, end).trim()
    sections.push({ title, content })
  }
  return sections
}

const RFPProposalEdit: React.FC<RFPProposalEditProps> = ({
  rfpId,
  token,
  pdfUrl,
  filename,
  onFinal,
  generatedResponse,
}) => {
  const [mode, setMode] = useState<"generated" | "extracted" | null>(null)
  const [sections, setSections] = useState<{ title: string; content: string }[]>([])
  const [originalSections, setOriginalSections] = useState<{ title: string; content: string }[]>([])
  const [sectionEdits, setSectionEdits] = useState<string[]>([])
  const [llmLoading, setLlmLoading] = useState(false)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [llmResult, setLlmResult] = useState<string | null>(null)
  const [finalLoading, setFinalLoading] = useState(false)
  const [finalError, setFinalError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState<string>("")
  const [downloadUrls, setDownloadUrls] = useState<{ pdf?: string; docx?: string }>({})
  const { theme } = useTheme()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        if (generatedResponse) {
          const split = splitSections(generatedResponse)
          setSections(split)
          setOriginalSections(split)
          setSectionEdits(split.map((s) => s.content))
          setMode("generated")
          setLoading(false)
          return
        }
        const genRes = await fetch(`http://localhost:8000/api/employee/rfps/${rfpId}/response`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (genRes.ok) {
          const data = await genRes.json()
          if (data.response) {
            const split = splitSections(data.response)
            setSections(split)
            setOriginalSections(split)
            setSectionEdits(split.map((s) => s.content))
            setMode("generated")
            setLoading(false)
            return
          }
        }
        const extRes = await fetch(`http://localhost:8000/api/employee/rfps/${rfpId}/extract-file-text`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!extRes.ok) {
          const data = await extRes.json().catch(() => ({}))
          throw new Error(data.detail || "Failed to extract file text")
        }
        const data = await extRes.json()
        const split = splitSections(data.text || "")
        setSections(split)
        setOriginalSections(split)
        setSectionEdits(split.map((s) => s.content))
        setMode("extracted")
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [rfpId, token, generatedResponse])

  const handleSectionEdit = (idx: number, value: string) => {
    setSectionEdits((edits) => edits.map((e, i) => (i === idx ? value : e)))
  }

  const handleSave = () => {
    setSections(sections.map((s, i) => ({ ...s, content: sectionEdits[i] })))
    setLlmResult(null)
  }

  const handleLLM = async () => {
    setLlmLoading(true)
    setLlmError(null)
    setLlmResult(null)

    try {
      const combined = sections.map((s, i) => sectionEdits[i]).join("\n\n")
      const promptToSend = customPrompt || "Refine and improve the following text for clarity and conciseness."

      const formData = new FormData()

      formData.append("text", combined)
      formData.append("changes", promptToSend)
      console.log(formData.get("text"))
      const res = await fetch(`http://localhost:8000/api/employee/final_rfp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || "Failed to get LLM response")
      }

      const data = await res.json()
      console.log("LLM response:", data)
      const llmText = (data && (data.prompt || data.result)) || JSON.stringify(data) || "No response"
      setLlmResult(llmText)
      if (llmText && llmText !== "No response") {
        const split = splitSections(llmText)
        setSections(split)
        setSectionEdits(split.map((s) => s.content))
      }
    } catch (err: any) {
      setLlmError(err.message)
    } finally {
      setLlmLoading(false)
    }
  }

  const handleFinalProcess = async () => {
    setFinalLoading(true)
    setFinalError(null)
    try {
      const proposal = llmResult || sections.map((s, i) => sectionEdits[i]).join("\n\n")
      const formData = new FormData()

      formData.append("text", proposal)
      formData.append("rfp_id", rfpId.toString())

      const res = await fetch(`http://localhost:8000/api/employee/ok`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || "Failed to generate final proposal")
      }
      const data = await res.json()
      setDownloadUrls({ pdf: data.pdf_url, docx: data.docx_url })
      onFinal({ ...data, rfp_id: rfpId })
    } catch (err: any) {
      setFinalError(err.message)
    } finally {
      setFinalLoading(false)
    }
  }

  const handleViewPDF = () => {
    if (downloadUrls.pdf) {
      window.open(downloadUrls.pdf, "_blank")
    }
  }

  const handleDownloadDocx = () => {
    if (downloadUrls.docx) {
      const link = document.createElement("a")
      link.href = downloadUrls.docx
      link.download = `${rfpId}_proposal.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) return <div className="text-foreground">Loading...</div>
  if (error)
    return (
      <Alert
        variant="destructive"
        className="bg-destructive text-destructive-foreground dark:bg-destructive dark:border-destructive"
      >
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )

  return (
    <div className="space-y-6 bg-background text-foreground p-6 rounded-lg shadow-md dark:bg-card dark:text-foreground">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
          {mode === "generated" ? "Edit Generated Response" : "Edit Extracted RFP Text"}
        </h2>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PDF Preview Section */}
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Original RFP Preview
          </h3>
          <div className="flex-1 border rounded-lg overflow-hidden shadow-sm border-border">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="RFP PDF Preview"
                width="100%"
                height="100%"
                style={{ border: "none", minHeight: "400px" }}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
                No PDF preview available.
              </div>
            )}
          </div>
        </div>

        {/* Response Editing Section */}
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Response Data
          </h3>
          <textarea
            className="w-full flex-1 border rounded-lg p-3 text-sm bg-input border-border text-foreground resize-y min-h-[400px] shadow-sm focus:ring-2 focus:ring-ring focus:border-primary transition-all"
            value={sectionEdits.join("\n\n")}
            onChange={(e) => setSectionEdits([e.target.value])}
            placeholder="Your response content goes here..."
          />
        </div>
      </div>

      {/* LLM Prompt and Action Buttons */}
      <div className="mt-6 p-4 border rounded-lg bg-muted/50 border-border shadow-sm">
        <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-3">
          Refine with AI
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt-box" className="block text-sm font-medium text-muted-foreground mb-1">
              Custom AI Prompt
            </Label>
            <Input
              id="prompt-box"
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., 'Make it more concise and professional' or 'Expand on the technical details'"
              className="w-full bg-input border-border text-foreground focus:ring-ring"
              disabled={llmLoading}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleLLM}
              disabled={llmLoading || !customPrompt}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {llmLoading ? "Applying AI..." : "Apply AI Refinement"}
            </Button>
            <Button
              onClick={handleFinalProcess}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg dark:bg-green-700 dark:hover:bg-green-800"
            >
              {finalLoading ? "Finalizing..." : "Finalize Proposal"}
            </Button>
          </div>
        </div>
      </div>

      {/* Error/Result Alerts */}
      {llmError && (
        <Alert
          variant="destructive"
          className="mt-4 bg-destructive text-destructive-foreground dark:bg-destructive dark:border-destructive"
        >
          <AlertDescription>{llmError}</AlertDescription>
        </Alert>
      )}
      {finalError && (
        <Alert
          variant="destructive"
          className="mt-4 bg-destructive text-destructive-foreground dark:bg-destructive dark:border-destructive"
        >
          <AlertDescription>{finalError}</AlertDescription>
        </Alert>
      )}

      {/* Download Buttons after finalization */}
      {downloadUrls.pdf || downloadUrls.docx ? (
        <div className="flex flex-col sm:flex-row gap-4 mt-6 p-4 border rounded-lg bg-accent/50 border-border shadow-sm">
          <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary">
            Download Final Proposal:
          </h3>
          {downloadUrls.pdf && (
            <Button
              onClick={handleViewPDF}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              View PDF
            </Button>
          )}
          {downloadUrls.docx && (
            <Button
              onClick={handleDownloadDocx}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg dark:bg-purple-700 dark:hover:bg-purple-800"
            >
              Download Word
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default RFPProposalEdit
