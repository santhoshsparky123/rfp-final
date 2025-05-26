"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { FileText, Download, Edit, CheckCircle, Clock, Loader2 } from "lucide-react"

type ProcessStep = {
  id: string
  title: string
  description: string
  status: "pending" | "processing" | "completed" | "error"
}

export function ProcessingSteps() {
  const [activeTab, setActiveTab] = useState("progress")
  const [steps, setSteps] = useState<ProcessStep[]>([
    {
      id: "extraction",
      title: "Document Extraction",
      description: "Extracting text from PDF and Word documents",
      status: "completed",
    },
    {
      id: "structuring",
      title: "Data Structuring",
      description: "Using Gemini LLM to structure and label extracted data",
      status: "processing",
    },
    {
      id: "rag",
      title: "RAG Processing",
      description: "Fetching similar data from company documents",
      status: "pending",
    },
    {
      id: "generation",
      title: "Response Generation",
      description: "Generating final responses according to the RFPs",
      status: "pending",
    },
    {
      id: "editing",
      title: "Editorial Review",
      description: "AI-assisted grammar correction and text refinement",
      status: "pending",
    },
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case "pending":
        return <Clock className="h-5 w-5 text-gray-400" />
      case "error":
        return <Clock className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardContent className="p-6">
        <Tabs defaultValue="progress" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress">Processing Progress</TabsTrigger>
            <TabsTrigger value="data">Structured Data</TabsTrigger>
            <TabsTrigger value="download">Final Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="mt-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Processing Status</h3>
              <div className="space-y-4">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">{getStatusIcon(step.status)}</div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">{step.title}</h4>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Structured JSON Data</h3>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Data
                </Button>
              </div>

              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs text-gray-700">
                  {JSON.stringify(
                    {
                      rfp_id: "RFP-2023-001",
                      client: "Acme Corporation",
                      project_title: "Enterprise Software Implementation",
                      requirements: [
                        {
                          id: "REQ-001",
                          category: "Technical",
                          description: "The system must support single sign-on authentication",
                        },
                        {
                          id: "REQ-002",
                          category: "Performance",
                          description: "The system must support at least 1000 concurrent users",
                        },
                        {
                          id: "REQ-003",
                          category: "Security",
                          description: "All data must be encrypted at rest and in transit",
                        },
                      ],
                      timeline: {
                        submission_deadline: "2023-06-30",
                        expected_start_date: "2023-08-15",
                        project_duration: "12 months",
                      },
                      budget: {
                        range: "$500,000 - $750,000",
                        payment_terms: "Milestone-based",
                      },
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="download" className="mt-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Download Final Documents</h3>
              <p className="text-sm text-gray-500">
                Your RFP response documents are ready for download in multiple formats.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card>
                  <CardContent className="p-6 flex items-center">
                    <div className="bg-blue-50 p-3 rounded-full mr-4">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">RFP Response</h4>
                      <p className="text-xs text-gray-500">PDF Format</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-center">
                    <div className="bg-blue-50 p-3 rounded-full mr-4">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">RFP Response</h4>
                      <p className="text-xs text-gray-500">Word Format</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
