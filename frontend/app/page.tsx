"use client"

import { CardTitle } from "@/components/ui/card"

import { CardHeader } from "@/components/ui/card"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { FileText, Upload, Brain, Download, CheckCircle, Edit, LogOut, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Login from "@/components/login"
import SuperAdminDashboard from "@/components/super-admin-dashboard"
import AdminDashboard from "@/components/admin-dashboard"
import UserDashboard from "@/components/user-dashboard"
import RFPUpload from "@/components/rfp-upload"
import CompanyDocsUpload from "@/components/company-docs-upload"
import ResponseGeneration from "@/components/response-generation"
import ProposalEditor from "@/components/proposal-editor"
import FinalProposal from "@/components/final-proposal"

interface RFPData {
  rfp_id: string
  message: string
  structured_data: {
    metadata: any
    sections: any[]
    questions: any[]
    requirements: any[]
  }
}

interface GeneratedResponse {
  rfp_id: string
  metadata: any
  sections: any[]
  questions: any[]
  requirements: any[]
}

interface CompanyDocsStatus {
  exists: boolean
  count: number
  vector_store_id?: string
  last_updated?: string
}

interface UserType {
  id: string
  email: string
  role: "super_admin" | "admin" | "worker" | "user"
  name: string
  company?: string
}

export default function RFPProcessingApp() {
  const [user, setUser] = useState<UserType | null>(null)
  const [activeTab, setActiveTab] = useState("upload-rfp")
  const [rfpData, setRFPData] = useState<RFPData | null>(null)
  const [companyDocsStatus, setCompanyDocsStatus] = useState<CompanyDocsStatus>({ exists: false, count: 0 })
  const [generatedResponse, setGeneratedResponse] = useState<GeneratedResponse | null>(null)
  const [editedResponse, setEditedResponse] = useState<GeneratedResponse | null>(null)
  const [finalProposalGenerated, setFinalProposalGenerated] = useState(false)

  const steps =
    user?.role === "worker"
      ? [
          { id: "upload-rfp", title: "Upload RFP", icon: Upload, completed: !!rfpData },
          { id: "generate", title: "Generate Response", icon: Brain, completed: !!generatedResponse },
          { id: "edit", title: "Review & Edit", icon: Edit, completed: !!editedResponse },
          { id: "final", title: "Final Proposal", icon: Download, completed: finalProposalGenerated },
        ]
      : [
          { id: "upload-rfp", title: "Upload RFP", icon: Upload, completed: !!rfpData },
          { id: "upload-docs", title: "Company Docs", icon: FileText, completed: companyDocsStatus.exists },
          { id: "generate", title: "Generate Response", icon: Brain, completed: !!generatedResponse },
          { id: "edit", title: "Review & Edit", icon: Edit, completed: !!editedResponse },
          { id: "final", title: "Final Proposal", icon: Download, completed: finalProposalGenerated },
        ]

  const handleLogin = (userData: UserType) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
    // Reset all state
    setActiveTab("upload-rfp")
    setRFPData(null)
    setCompanyDocsStatus({ exists: false, count: 0 })
    setGeneratedResponse(null)
    setEditedResponse(null)
    setFinalProposalGenerated(false)
  }

  const handleRFPUpload = (data: RFPData) => {
    setRFPData(data)
    if (user?.role === "worker") {
      // For workers, automatically fetch company docs and proceed to generate
      fetchCompanyDocsForWorker()
      setActiveTab("generate")
    } else {
      // For users, check existing docs as before
      checkExistingCompanyDocs()
      setActiveTab("upload-docs")
    }
  }

  const fetchCompanyDocsForWorker = async () => {
    try {
      // Workers have access to pre-uploaded company docs
      setCompanyDocsStatus({
        exists: true,
        count: 5, // Assume some docs exist
        vector_store_id: "worker_default",
        last_updated: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error fetching company docs:", error)
      setCompanyDocsStatus({
        exists: true,
        count: 0,
        vector_store_id: "default",
        last_updated: new Date().toISOString(),
      })
    }
  }

  const checkExistingCompanyDocs = async () => {
    try {
      // For users, we'll assume no existing docs initially
      setCompanyDocsStatus({ exists: false, count: 0 })
    } catch (error) {
      console.error("Error checking company docs:", error)
    }
  }

  const handleCompanyDocsUpload = (status: CompanyDocsStatus) => {
    setCompanyDocsStatus(status)
    setActiveTab("generate")
  }

  const handleResponseGenerated = (response: GeneratedResponse) => {
    setGeneratedResponse(response)
    setActiveTab("edit")
  }

  const handleResponseEdited = (editedResponse: GeneratedResponse) => {
    setEditedResponse(editedResponse)
    setActiveTab("final")
  }

  const handleFinalProposal = () => {
    setFinalProposalGenerated(true)
  }

  // Show login if no user
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  // Show super admin dashboard for super admin role
  if (user.role === "super_admin") {
    return <SuperAdminDashboard user={user} onLogout={handleLogout} />
  }

  // Show admin dashboard for admin role
  if (user.role === "admin") {
    return <AdminDashboard user={user} onLogout={handleLogout} />
  }

  // Show user dashboard for user role
  if (user.role === "user") {
    return <UserDashboard user={user} onLogout={handleLogout} />
  }

  // Show full worker dashboard for worker role
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      {/* Professional Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RFP Response Generator</h1>
                <p className="text-sm text-gray-600">AI-powered proposal generation platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Building2 className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.company}</div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Worker</Badge>
              </div>
              <Button variant="outline" onClick={handleLogout} className="rounded-xl border-gray-300 hover:bg-gray-50">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-center items-center space-x-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = activeTab === step.id
              const isCompleted = step.completed

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-500 ${
                        isCompleted
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-200"
                          : isActive
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-500 text-white shadow-lg shadow-blue-200"
                            : "bg-white border-gray-300 text-gray-400 hover:border-gray-400 shadow-sm"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-8 h-8" /> : <Icon className="w-8 h-8" />}
                      {isActive && !isCompleted && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-20 animate-pulse" />
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <p
                        className={`text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${
                          isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </p>
                      <div className="mt-2 flex justify-center">
                        <div
                          className={`h-1 rounded-full transition-all duration-500 ${
                            isCompleted ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-gray-200"
                          }`}
                          style={{ width: `${step.title.length * 8 + 20}px` }}
                        />
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex items-center mx-6">
                      <div
                        className={`h-0.5 w-24 transition-all duration-500 ${
                          isCompleted ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Floating Tab Indicators */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="inline-flex bg-white rounded-2xl shadow-lg border border-gray-200 p-1">
              {steps.map((step) => {
                const Icon = step.icon
                const isActive = activeTab === step.id
                const isCompleted = step.completed
                const isDisabled =
                  (step.id === "upload-docs" && !rfpData) ||
                  (step.id === "generate" && (user?.role === "worker" ? !rfpData : !companyDocsStatus.exists)) ||
                  (step.id === "edit" && !generatedResponse) ||
                  (step.id === "final" && !editedResponse)

                return (
                  <button
                    key={step.id}
                    onClick={() => !isDisabled && setActiveTab(step.id)}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-500 text-white shadow-md"
                        : isCompleted
                          ? "text-green-600 hover:bg-green-50"
                          : isDisabled
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm whitespace-nowrap">
                      {step.id === "upload-rfp" && "Upload"}
                      {step.id === "upload-docs" && "Company Docs"}
                      {step.id === "generate" && "Generate"}
                      {step.id === "edit" && "Review & Edit"}
                      {step.id === "final" && "Final Proposal"}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Single Main Content Card */}
        <Card className="shadow-xl border-0 overflow-hidden bg-white rounded-3xl">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="p-8">
              <TabsContent value="upload-rfp" className="mt-0">
                <RFPUpload onUploadSuccess={handleRFPUpload} />
              </TabsContent>

              {user?.role !== "worker" && (
                <TabsContent value="upload-docs" className="mt-0">
                  <CompanyDocsUpload onUploadSuccess={handleCompanyDocsUpload} existingDocsStatus={companyDocsStatus} />
                </TabsContent>
              )}

              <TabsContent value="generate" className="mt-0">
                <ResponseGeneration rfpData={rfpData} onResponseGenerated={handleResponseGenerated} />
              </TabsContent>

              <TabsContent value="edit" className="mt-0">
                <ProposalEditor generatedResponse={generatedResponse} onResponseEdited={handleResponseEdited} />
              </TabsContent>

              <TabsContent value="final" className="mt-0">
                <FinalProposal editedResponse={editedResponse} onProposalGenerated={handleFinalProposal} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Enhanced Summary Cards */}
        {rfpData && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Sections",
                value: rfpData.structured_data.sections.length,
                desc: "RFP sections identified",
                icon: "📄",
                color: "from-blue-500 to-blue-600",
                bgColor: "from-blue-50 to-blue-100",
              },
              {
                title: "Questions",
                value: rfpData.structured_data.questions.length,
                desc: "Questions to answer",
                icon: "❓",
                color: "from-purple-500 to-purple-600",
                bgColor: "from-purple-50 to-purple-100",
              },
              {
                title: "Requirements",
                value: rfpData.structured_data.requirements.length,
                desc: "Requirements to address",
                icon: "✅",
                color: "from-green-500 to-green-600",
                bgColor: "from-green-50 to-green-100",
              },
            ].map((item, index) => (
              <Card
                key={item.title}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className={`h-1 bg-gradient-to-r ${item.color}`} />
                <CardHeader className={`pb-3 bg-gradient-to-br ${item.bgColor}`}>
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div
                    className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-1`}
                  >
                    {item.value}
                  </div>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
