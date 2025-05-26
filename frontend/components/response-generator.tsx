"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Loader2, CheckCircle, Edit, RefreshCw, Database, BookOpen, History, FileDown } from "lucide-react"

// Import necessary libraries for file generation
import jsPDF from "jspdf"
import PizZip from "pizzip"
// Docxtemplater is typically used with a template, creating a DOCX from scratch is more about
// creating the underlying XML structure and zipping it.
// For this example, we will directly construct minimal OOXML.
// import Docxtemplater from 'docxtemplater'; // Not directly used for scratch generation here
import { saveAs } from "file-saver" // For saving the generated Blob

// Mock data for questions from the RFP
const mockQuestions = [
  {
    id: "q-1",
    text: "Describe your experience implementing CRM systems for organizations of similar size.",
    section: "Introduction",
    type: "experience",
    response_format: "paragraph",
    word_limit: 500,
    related_requirements: ["r-3", "r-7"],
  },
  {
    id: "q-2",
    text: "Detail your proposed technical architecture for the CRM implementation.",
    section: "Technical Requirements",
    type: "technical",
    response_format: "diagram_and_text",
    word_limit: null,
    related_requirements: ["r-1", "r-2"],
  },
  {
    id: "q-3",
    text: "What is your approach to data migration from legacy systems?",
    section: "Technical Requirements",
    type: "technical",
    response_format: "paragraph",
    word_limit: 300,
    related_requirements: ["r-4"],
  },
  {
    id: "q-4",
    text: "Provide a detailed project timeline with key milestones.",
    section: "Implementation",
    type: "project_management",
    response_format: "table",
    word_limit: null,
    related_requirements: ["r-5"],
  },
  {
    id: "q-5",
    text: "Describe your support and maintenance services after implementation.",
    section: "Support",
    type: "service",
    response_format: "paragraph",
    word_limit: 250,
    related_requirements: ["r-6"],
  },
]

// Mock data for company documents in the vector database
const mockCompanyDocs = [
  {
    id: "doc-1",
    title: "CRM Implementation Case Study - Fortune 500 Retail",
    type: "case_study",
    relevance: 0.92,
  },
  {
    id: "doc-2",
    title: "Technical Architecture Overview - Cloud CRM Solutions",
    type: "technical",
    relevance: 0.89,
  },
  {
    id: "doc-3",
    title: "Data Migration Methodology",
    type: "methodology",
    relevance: 0.85,
  },
  {
    id: "doc-4",
    title: "Standard Project Timeline for Enterprise Implementations",
    type: "project_management",
    relevance: 0.78,
  },
  {
    id: "doc-5",
    title: "Support and Maintenance Service Level Agreement",
    type: "service",
    relevance: 0.95,
  },
]

// Mock data for past RFP responses
const mockPastRfps = [
  {
    id: "rfp-1",
    title: "Global Financial Services CRM Implementation",
    date: "2024-02-15",
    relevance: 0.88,
  },
  {
    id: "rfp-2",
    title: "Healthcare Provider CRM Solution",
    date: "2023-11-10",
    relevance: 0.72,
  },
  {
    id: "rfp-3",
    title: "Manufacturing Enterprise System Integration",
    date: "2023-08-22",
    relevance: 0.65,
  },
]

type ResponseStatus = "not_started" | "generating" | "completed" | "error"

interface GeneratedResponse {
  questionId: string
  status: ResponseStatus
  progress: number
  content: string
  sources: Array<{
    id: string
    title: string
    type: string
  }>
}

// Unified interface for relevant sources used internally before mapping to GeneratedResponse.sources
interface RelevantSource {
  id: string
  title: string
  type: string // e.g., 'case_study', 'technical', 'past_rfp'
  sourceCategory: string // e.g., 'company_docs', 'past_rfps'
  relevance?: number // Optional, as not all sources might have a direct relevance score
}

interface CostEstimate {
  questionId: string
  estimatedHours: number
  hourlyRate: number
  totalCost: number
}

export function ResponseGenerator() {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(mockQuestions.map((q) => q.id))
  const [generatedResponses, setGeneratedResponses] = useState<GeneratedResponse[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [useCompanyDocs, setUseCompanyDocs] = useState(true)
  const [usePastRfps, setUsePastRfps] = useState(true)
  const [downloadFormat, setDownloadFormat] = useState("docx")
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadComplete, setDownloadComplete] = useState(false)
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([])

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    )
  }

  const calculateCostEstimates = () => {
    // Calculate cost estimates based on question complexity and type
    const estimates = selectedQuestions
      .map((questionId) => {
        const question = mockQuestions.find((q) => q.id === questionId)
        if (!question) return null

        // Base hours depends on question type and complexity
        let baseHours = 0
        switch (question.type) {
          case "technical":
            baseHours = 4 // Technical questions require more time
            break
          case "project_management":
            baseHours = 3 // Project management questions are moderately complex
            break
          case "experience":
            baseHours = 2 // Experience questions are relatively straightforward
            break
          default:
            baseHours = 2 // Default for other question types
        }

        // Adjust for word limit if present
        const wordLimitFactor = question.word_limit ? question.word_limit / 200 : 1
        const estimatedHours = baseHours * wordLimitFactor

        // Standard hourly rate
        const hourlyRate = 150

        return {
          questionId,
          estimatedHours: Math.round(estimatedHours * 10) / 10, // Round to 1 decimal place
          hourlyRate,
          totalCost: Math.round(estimatedHours * hourlyRate),
        }
      })
      .filter(Boolean) as CostEstimate[]

    setCostEstimates(estimates)
  }

  const generateResponses = async () => {
    if (selectedQuestions.length === 0) return

    setIsGenerating(true)
    calculateCostEstimates() // Add this line to calculate cost estimates
    setGeneratedResponses([])

    // Initialize responses with "generating" status
    const initialResponses = selectedQuestions.map((qId) => ({
      questionId: qId,
      status: "generating" as ResponseStatus,
      progress: 0,
      content: "",
      sources: [],
    }))

    setGeneratedResponses(initialResponses)

    // Simulate generating responses one by one
    for (const questionId of selectedQuestions) {
      // Find the question
      const question = mockQuestions.find((q) => q.id === questionId)
      if (!question) continue

      // Update progress for this question
      setGeneratedResponses((prev) => prev.map((r) => (r.questionId === questionId ? { ...r, progress: 10 } : r)))

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      let relevantSources: RelevantSource[] = []

      // Simulate retrieving relevant company docs
      if (useCompanyDocs) {
        const companyDocs = mockCompanyDocs.filter((doc) => doc.type === question.type)
        relevantSources = [
          ...relevantSources,
          ...companyDocs.map((doc) => ({
            id: doc.id,
            title: doc.title,
            type: doc.type,
            sourceCategory: "company_docs",
            relevance: doc.relevance,
          })),
        ]
      }

      // Update progress
      setGeneratedResponses((prev) => prev.map((r) => (r.questionId === questionId ? { ...r, progress: 30 } : r)))

      // Simulate retrieving past RFP responses
      if (usePastRfps) {
        const pastRfps = mockPastRfps.slice(0, 2) // Take first 2 for simulation
        relevantSources = [
          ...relevantSources,
          ...pastRfps.map((rfp) => ({
            id: rfp.id,
            title: rfp.title,
            type: "past_rfp",
            sourceCategory: "past_rfps",
            relevance: rfp.relevance,
          })),
        ]
      }

      // Update progress
      setGeneratedResponses((prev) => prev.map((r) => (r.questionId === questionId ? { ...r, progress: 60 } : r)))

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Generate mock response content based on question type
      let responseContent = ""
      switch (question.type) {
        case "experience":
          responseContent = `Our company has extensive experience implementing CRM systems for organizations of similar size to yours. Over the past decade, we have successfully completed more than 50 enterprise CRM implementations across various industries including retail, finance, healthcare, and manufacturing.

In particular, our recent implementation for a Fortune 500 retail company with operations in 20 countries demonstrates our capability to handle complex, large-scale deployments. This project involved migrating from a legacy system to our cloud-based solution, integrating with multiple existing systems, and training over 2,000 users.

Key achievements from this implementation included:
- 35% improvement in customer service response times
- 28% increase in sales team productivity
- 99.9% system uptime since deployment
- Successful migration of over 10 million customer records

Our team of certified professionals includes experts in both technical implementation and change management, ensuring a smooth transition for your organization.`
          break
        case "technical":
          responseContent = `Our proposed technical architecture for your CRM implementation is designed to be robust, scalable, and secure while integrating seamlessly with your existing systems.

Core Architecture Components:
1. Cloud Infrastructure: We utilize AWS for hosting, providing high availability across multiple availability zones with automatic failover capabilities.

2. Application Layer: Our CRM solution is built on a microservices architecture, allowing for independent scaling of different components based on demand.

3. Integration Layer: A dedicated API gateway manages all integrations with your existing ERP and other systems using both REST APIs and event-driven architecture.

4. Data Layer: A combination of relational databases for transactional data and NoSQL databases for unstructured data, with a unified data model.

5. Security Layer: Comprehensive security measures including encryption at rest and in transit, role-based access control, and regular security audits.

The architecture supports horizontal scaling to accommodate your projected growth over the next 5 years and includes built-in monitoring and alerting systems to ensure optimal performance.`
          break
        case "project_management":
          responseContent = `Project Timeline for CRM Implementation

Phase 1: Discovery and Planning (Weeks 1-4)
- Week 1: Project kickoff and requirements gathering
- Week 2: System architecture design
- Week 3: Data migration planning
- Week 4: Project plan finalization and approval

Phase 2: Base Configuration (Weeks 5-8)
- Week 5-6: Core system configuration
- Week 7-8: User role and permission setup

Phase 3: Customization and Integration (Weeks 9-16)
- Week 9-12: Custom development work
- Week 13-16: Integration with existing systems
- Week 17-20: Test migration runs
- Week 21-24: Data validation and cleanup
- Week 25-26: System testing
- Week 27-28: User acceptance testing
- Week 29-30: User training
- Week 31: Final preparations
- Week 32: Go-live

Post-Implementation Support (Weeks 33-36)
- Week 33-36: Hypercare support

Key milestones will be tracked through our project management system with weekly status reports provided to your team.`
          break
        default:
          responseContent = `Our approach to ${question.text.toLowerCase()} is comprehensive and tailored to your specific needs. Based on our experience with similar implementations, we recommend a phased approach that minimizes disruption to your operations while ensuring a smooth transition.

We begin by conducting a thorough assessment of your current systems and processes, identifying potential challenges and opportunities for improvement. Our team then develops a detailed plan that addresses your specific requirements and aligns with industry best practices.

Implementation is carried out by our team of certified professionals with extensive experience in similar projects. Throughout the process, we maintain clear communication channels and provide regular updates on progress and any issues that arise.

Following implementation, we offer comprehensive support services to ensure your continued success, including regular maintenance, performance optimization, and user training as needed.`
      }

      // Update with completed response
      setGeneratedResponses((prev) =>
        prev.map((r) =>
          r.questionId === questionId
            ? {
                ...r,
                status: "completed",
                progress: 100,
                content: responseContent,
                sources: relevantSources.slice(0, 3).map((s) => ({
                  id: s.id,
                  title: s.title,
                  type: s.type,
                })),
              }
            : r,
        ),
      )

      // Small delay between questions
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    setIsGenerating(false)
  }

  // Helper function to escape XML special characters
  const escapeXml = (text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&#x3C;") // Use &#x3C; for <
      .replace(/>/g, "&#x33E;") // Use &#x3E; for >
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    setDownloadProgress(0)
    setDownloadComplete(false)

    // Simulate preparation progress
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + 5
      })
    }, 100)

    // Simulate a brief delay for "preparation"
    await new Promise((resolve) => setTimeout(resolve, 1000))

    clearInterval(interval)
    setDownloadProgress(100) // Set to 100% before the actual download starts

    const fileName = `RFP_Response.${downloadFormat}`

    if (downloadFormat === "json") {
      const fileContent = JSON.stringify(
        {
          responses: generatedResponses.map((response) => {
            const question = mockQuestions.find((q) => q.id === response.questionId)
            return {
              question: question ? question.text : "Unknown Question",
              response: response.content,
              sources: response.sources.map((s) => s.title),
            }
          }),
          costEstimates: costEstimates,
          totalCost: costEstimates.reduce((sum, item) => sum + item.totalCost, 0),
        },
        null,
        2,
      )
      const blob = new Blob([fileContent], { type: "application/json" })
      saveAs(blob, fileName) // Using file-saver
    } else if (downloadFormat === "pdf") {
      const doc = new jsPDF()
      let y = 10
      const pageHeight = doc.internal.pageSize.height
      const margin = 10
      const lineHeight = 7 // Estimated line height for text

      doc.setFontSize(18)
      doc.text("RFP Response Document", margin, y)
      y += 10 // Space after title

      generatedResponses.forEach((response, index) => {
        const question = mockQuestions.find((q) => q.id === response.questionId)
        if (question && response.status === "completed") {
          // Check if new page is needed
          // Estimate space needed for current question + response + sources
          const estimatedHeight =
            2 * lineHeight + // Question and some spacing
            doc.splitTextToSize(response.content, doc.internal.pageSize.width - 2 * margin).length * lineHeight + // Response lines
            response.sources.length * lineHeight +
            15 // Sources and spacing

          if (y + estimatedHeight > pageHeight - margin) {
            doc.addPage()
            y = margin
          }

          doc.setFontSize(12)
          doc.setFont(undefined, "bold")
          doc.text(`Question ${index + 1}: ${question.text}`, margin, y)
          y += lineHeight

          doc.setFont(undefined, "normal")
          const splitText = doc.splitTextToSize(response.content, doc.internal.pageSize.width - 2 * margin)
          doc.text(splitText, margin, y)
          y += splitText.length * lineHeight

          if (response.sources.length > 0) {
            y += 5 // Small gap before sources
            doc.setFontSize(10)
            doc.setFont(undefined, "bold")
            doc.text("Sources Used:", margin, y)
            y += lineHeight
            doc.setFont(undefined, "normal")
            response.sources.forEach((source) => {
              if (y + lineHeight > pageHeight - margin) {
                // Check for new page for each source line
                doc.addPage()
                y = margin
              }
              doc.text(`- ${source.title} (${source.type === "past_rfp" ? "Past RFP" : "Company Document"})`, margin, y)
              y += lineHeight
            })
          }
          y += 10 // Space between responses
        }
      })
      // Add cost estimates section
      if (costEstimates.length > 0) {
        // Check if new page is needed
        if (y + 50 > pageHeight - margin) {
          doc.addPage()
          y = margin
        }

        y += 10 // Space before cost section
        doc.setFontSize(14)
        doc.setFont(undefined, "bold")
        doc.text("Cost Estimation", margin, y)
        y += lineHeight * 1.5

        doc.setFontSize(10)
        // Table headers
        doc.setFont(undefined, "bold")
        doc.text("Question", margin, y)
        doc.text("Est. Hours", margin + 100, y)
        doc.text("Rate", margin + 140, y)
        doc.text("Cost", margin + 170, y)
        y += lineHeight

        // Table rows
        doc.setFont(undefined, "normal")
        costEstimates.forEach((estimate) => {
          if (y + lineHeight > pageHeight - margin) {
            doc.addPage()
            y = margin
          }

          const question = mockQuestions.find((q) => q.id === estimate.questionId)
          const questionText = question ? question.text.substring(0, 40) + "..." : "Unknown Question"

          doc.text(questionText, margin, y)
          doc.text(estimate.estimatedHours.toString(), margin + 100, y)
          doc.text("$" + estimate.hourlyRate.toString(), margin + 140, y)
          doc.text("$" + estimate.totalCost.toString(), margin + 170, y)
          y += lineHeight
        })

        // Total
        y += lineHeight / 2
        doc.setFont(undefined, "bold")
        doc.text("Total Estimated Cost:", margin + 100, y)
        doc.text("$" + costEstimates.reduce((sum, item) => sum + item.totalCost, 0).toString(), margin + 170, y)
      }
      doc.save(fileName)
    } else if (downloadFormat === "docx") {
      // Construct a very basic OOXML (Open Office XML) structure for a .docx file.
      // A .docx file is essentially a ZIP archive containing XML files.
      // This is a minimal set of XML parts to create a valid, readable .docx.
      // For complex formatting, you would typically use a pre-defined .docx template
      // with docxtemplater or a backend service.

      const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>RFP Response Document</w:t></w:r></w:p>
        <w:p><w:r><w:t></w:t></w:r></w:p>
        ${generatedResponses
          .map((response, index) => {
            const question = mockQuestions.find((q) => q.id === response.questionId)
            if (!question || response.status !== "completed") return ""

            let paragraphXml = `<w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>Question ${index + 1}: ${escapeXml(question.text)}</w:t></w:r></w:p>`
            // Replace newlines with <w:br/> for proper line breaks in Word
            paragraphXml += `<w:p><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(response.content).replace(/\n/g, "<w:br/>")}</w:t></w:r></w:p>`

            if (response.sources.length > 0) {
              paragraphXml += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Sources Used:</w:t></w:r></w:p>`
              response.sources.forEach((source) => {
                paragraphXml += `<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>- ${escapeXml(source.title)} (${source.type === "past_rfp" ? "Past RFP" : "Company Document"})</w:t></w:r></w:p>`
              })
            }
            paragraphXml += `<w:p><w:r><w:t></w:t></w:r></w:p>` // Empty paragraph for spacing
            return paragraphXml
          })
          .join("")}
          // Add cost estimates section if available
${
  costEstimates.length > 0
    ? `
<w:p><w:r><w:t></w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Cost Estimation</w:t></w:r></w:p>
<w:tbl>
  <w:tblPr>
    <w:tblStyle w:val="TableGrid"/>
    <w:tblW w:w="5000" w:type="pct"/>
  </w:tblPr>
  <w:tblGrid>
    <w:gridCol w:w="2500"/>
    <w:gridCol w:w="800"/>
    <w:gridCol w:w="800"/>
    <w:gridCol w:w="900"/>
  </w:tblGrid>
  <w:tr>
    <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Question</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Est. Hours</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Rate</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Cost</w:t></w:r></w:p></w:tc>
  </w:tr>
  ${costEstimates
    .map((estimate) => {
      const question = mockQuestions.find((q) => q.id === estimate.questionId)
      const questionText = question ? escapeXml(question.text.substring(0, 40) + "...") : "Unknown Question"
      return `
    <w:tr>
      <w:tc><w:p><w:r><w:t>${questionText}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>${estimate.estimatedHours}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>$${estimate.hourlyRate}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>$${estimate.totalCost}</w:t></w:r></w:p></w:tc>
    </w:tr>
    `
    })
    .join("")}
  <w:tr>
    <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Total:</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>$${costEstimates.reduce((sum, item) => sum + item.totalCost, 0)}</w:t></w:r></w:p></w:tc>
  </w:tr>
</w:tbl>`
    : ""
}
</w:body>
</w:document>`

      // Create a new PizZip instance
      const zip = new PizZip()

      // Add the main document XML file
      zip.file("word/document.xml", docxContent)

      // Add minimal required files for a valid DOCX structure
      // _rels/.rels: Defines relationships within the package
      zip.file(
        "_rels/.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
      )

      // [Content_Types].xml: Describes the MIME types of the parts within the package
      zip.file(
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
      )

      // word/_rels/document.xml.rels: Relationships specific to document.xml (empty in this simple case)
      zip.file(
        "word/_rels/document.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`,
      )

      const out = zip.generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
      })

      saveAs(out, fileName)
    }

    setDownloadComplete(true)
    setTimeout(() => {
      setIsDownloading(false)
      setDownloadComplete(false)
      setDownloadProgress(0)
    }, 2000)
  }

  const regenerateResponse = async (questionId: string) => {
    // Find the response to regenerate
    const responseIndex = generatedResponses.findIndex((r) => r.questionId === questionId)
    if (responseIndex === -1) return

    // Update status to generating
    setGeneratedResponses((prev) =>
      prev.map((r, i) => (i === responseIndex ? { ...r, status: "generating", progress: 0 } : r)),
    )

    // Simulate progress updates
    for (let progress = 0; progress <= 100; progress += 20) {
      setGeneratedResponses((prev) => prev.map((r, i) => (i === responseIndex ? { ...r, progress } : r)))
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    // Update with new content (in a real app, this would be different content)
    const question = mockQuestions.find((q) => q.id === questionId)
    setGeneratedResponses((prev) =>
      prev.map((r, i) =>
        i === responseIndex
          ? {
              ...r,
              status: "completed",
              progress: 100,
              content: `[Regenerated on ${new Date().toLocaleString()}] ${r.content}`, // Added timestamp for visual confirmation of regeneration
              sources: r.sources,
            }
          : r,
      ),
    )
  }

  const editResponse = (questionId: string, newContent: string) => {
    setGeneratedResponses((prev) => prev.map((r) => (r.questionId === questionId ? { ...r, content: newContent } : r)))
  }

  // Count completed responses
  const completedCount = generatedResponses.filter((r) => r.status === "completed").length
  const totalSelected = selectedQuestions.length

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate RFP Responses</CardTitle>
          <CardDescription>
            Generate AI-powered responses to RFP questions using your company's knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <h3 className="text-base font-medium">Select Questions to Answer</h3>
                <p className="text-sm text-gray-500">Choose which RFP questions you want to generate responses for</p>
              </div>

              <div className="space-y-2">
                {mockQuestions.map((question) => (
                  <div key={question.id} className="flex items-start space-x-2 p-3 border rounded-md">
                    <input
                      type="checkbox"
                      id={question.id}
                      checked={selectedQuestions.includes(question.id)}
                      onChange={() => toggleQuestionSelection(question.id)}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <label htmlFor={question.id} className="text-sm font-medium cursor-pointer">
                        {question.text}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {question.section}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {question.type}
                        </Badge>
                        {question.word_limit && (
                          <Badge variant="outline" className="text-xs">
                            {question.word_limit} words
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-base font-medium mb-3">Knowledge Sources</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="company-docs" checked={useCompanyDocs} onCheckedChange={setUseCompanyDocs} />
                  <Label htmlFor="company-docs" className="flex items-center">
                    <Database className="h-4 w-4 mr-2 text-purple-600" />
                    Use Company Documents
                  </Label>
                  <span className="text-xs text-gray-500 ml-2">
                    ({mockCompanyDocs.length} documents in vector database)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="past-rfps" checked={usePastRfps} onCheckedChange={setUsePastRfps} />
                  <Label htmlFor="past-rfps" className="flex items-center">
                    <History className="h-4 w-4 mr-2 text-purple-600" />
                    Use Past RFP Responses
                  </Label>
                  <span className="text-xs text-gray-500 ml-2">({mockPastRfps.length} past responses available)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            {selectedQuestions.length} of {mockQuestions.length} questions selected
          </div>
          <Button onClick={generateResponses} disabled={selectedQuestions.length === 0 || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Responses"
            )}
          </Button>
        </CardFooter>
      </Card>

      {generatedResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Responses</CardTitle>
            <CardDescription>
              {completedCount === totalSelected
                ? "All responses have been generated"
                : `Generating responses (${completedCount}/${totalSelected})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {generatedResponses.map((response) => {
                const question = mockQuestions.find((q) => q.id === response.questionId)
                if (!question) return null

                return (
                  <div key={response.questionId} className="border rounded-md p-4">
                    <div className="mb-4">
                      <h3 className="text-base font-medium">{question.text}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {question.section}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {question.type}
                        </Badge>
                      </div>
                    </div>

                    {response.status === "generating" ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Generating response...</span>
                          <span>{response.progress}%</span>
                        </div>
                        <Progress value={response.progress} className="h-2" />
                      </div>
                    ) : response.status === "completed" ? (
                      <div className="space-y-4">
                        <Textarea
                          value={response.content}
                          onChange={(e) => editResponse(response.questionId, e.target.value)}
                          className="min-h-[200px] font-normal"
                        />

                        {response.sources.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Sources Used</h4>
                            <div className="flex flex-wrap gap-2">
                              {response.sources.map((source) => (
                                <div
                                  key={source.id}
                                  className="flex items-center text-xs bg-gray-100 rounded-full px-3 py-1"
                                >
                                  {source.type === "past_rfp" ? (
                                    <BookOpen className="h-3 w-3 mr-1 text-purple-600" />
                                  ) : (
                                    <Database className="h-3 w-3 mr-1 text-purple-600" />
                                  )}
                                  {source.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => regenerateResponse(response.questionId)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </Button>
                          {/* The "Edit" button currently just allows text area editing */}
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-red-500">Error generating response</div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="format">Download Format:</Label>
                  <Select value={downloadFormat} onValueChange={setDownloadFormat}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="docx">Word (.docx)</SelectItem>
                      <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {isDownloading && (
              <div className="w-full space-y-2">
                <Progress value={downloadProgress} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Preparing document...</span>
                  <span>{downloadProgress}%</span>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      )}

      {costEstimates.length > 0 && completedCount === totalSelected && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Estimation</CardTitle>
            <CardDescription>Estimated costs for generating these responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Question</th>
                      <th className="text-right p-3 text-sm font-medium">Est. Hours</th>
                      <th className="text-right p-3 text-sm font-medium">Rate</th>
                      <th className="text-right p-3 text-sm font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costEstimates.map((estimate) => {
                      const question = mockQuestions.find((q) => q.id === estimate.questionId)
                      return (
                        <tr key={estimate.questionId} className="border-t">
                          <td className="p-3 text-sm">{question?.text.substring(0, 50)}...</td>
                          <td className="p-3 text-sm text-right">{estimate.estimatedHours}</td>
                          <td className="p-3 text-sm text-right">${estimate.hourlyRate}</td>
                          <td className="p-3 text-sm text-right font-medium">${estimate.totalCost}</td>
                        </tr>
                      )
                    })}
                    <tr className="border-t bg-muted">
                      <td colSpan={3} className="p-3 text-sm font-medium text-right">
                        Total Estimated Cost:
                      </td>
                      <td className="p-3 text-sm font-bold text-right">
                        ${costEstimates.reduce((sum, item) => sum + item.totalCost, 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Note: Cost estimates are based on question complexity, word count requirements, and standard hourly
                  rates. Actual costs may vary based on specific requirements and revisions.
                </p>
              </div>
              <div className="flex justify-center">
              <Button
                onClick={handleDownload}
                disabled={isDownloading || downloadComplete || completedCount === 0 || completedCount !== totalSelected}
                className="min-w-[150px]"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : downloadComplete ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Downloaded
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Download Responses
                  </>
                )}
              </Button>
            </div>

            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Company Documents</CardTitle>
          <CardDescription>Documents in your vector database that can be used for responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Tabs defaultValue="company_docs">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="company_docs">Company Documents</TabsTrigger>
                <TabsTrigger value="past_rfps">Past RFP Responses</TabsTrigger>
              </TabsList>

              <TabsContent value="company_docs" className="mt-4">
                <div className="space-y-2">
                  {mockCompanyDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium">{doc.title}</p>
                          <p className="text-xs text-gray-500">Type: {doc.type}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {Math.round(doc.relevance * 100)}% relevant
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="past_rfps" className="mt-4">
                <div className="space-y-2">
                  {mockPastRfps.map((rfp) => (
                    <div key={rfp.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium">{rfp.title}</p>
                          <p className="text-xs text-gray-500">Date: {rfp.date}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {Math.round(rfp.relevance * 100)}% relevant
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
