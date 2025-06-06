"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Save, CheckCircle, AlertCircle, FileText, MessageSquare, List } from "lucide-react"

interface ProposalEditorProps {
  generatedResponse: any
  onResponseEdited: (editedResponse: any) => void
}

export default function ProposalEditor({ generatedResponse, onResponseEdited }: ProposalEditorProps) {
  const [editedResponse, setEditedResponse] = useState(generatedResponse)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSectionEdit = (sectionId: number, newContent: string) => {
    setEditedResponse({
      ...editedResponse,
      sections: editedResponse.sections.map((section: any) =>
        section.id === sectionId ? { ...section, ai_response: newContent } : section,
      ),
    })
  }

  const handleQuestionEdit = (questionId: number, newAnswer: string) => {
    setEditedResponse({
      ...editedResponse,
      questions: editedResponse.questions.map((question: any) =>
        question.id === questionId ? { ...question, ai_answer: newAnswer } : question,
      ),
    })
  }

  const handleRequirementEdit = (reqId: number, newExplanation: string) => {
    setEditedResponse({
      ...editedResponse,
      requirements: editedResponse.requirements.map((req: any) =>
        req.id === reqId ? { ...req, ai_explanation: newExplanation } : req,
      ),
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Simulate saving
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const finalResponse = {
        ...editedResponse,
        metadata: {
          ...editedResponse.metadata,
          edited_at: new Date().toISOString(),
          status: "reviewed",
        },
      }

      setSuccess("Changes saved successfully!")
      onResponseEdited(finalResponse)
    } catch (err) {
      setError("Failed to save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (!generatedResponse) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="p-8">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Generated Response</h3>
          <p className="text-gray-600">Please generate an AI response first before editing.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl mb-4">
          <Edit className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Edit Response</h2>
        <p className="text-gray-600">Review the AI-generated content and make any necessary edits before finalizing</p>
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

      {/* Response Metadata */}
      <Card className="mb-8 border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Response Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700">RFP Title</div>
              <div className="text-lg font-semibold text-gray-900">{editedResponse.metadata.title}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">AI Confidence</div>
              <Badge className="bg-green-100 text-green-700">
                {Math.round(editedResponse.metadata.ai_confidence * 100)}%
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Generated</div>
              <div className="text-sm text-gray-600">
                {new Date(editedResponse.metadata.generated_at).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Content */}
      <Card className="shadow-xl border-0 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />

        <Tabs defaultValue="sections" className="w-full">
          <div className="border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
            <TabsList className="grid w-full grid-cols-3 bg-transparent p-2">
              <TabsTrigger
                value="sections"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-3 font-medium transition-all duration-200"
              >
                <FileText className="w-4 h-4 mr-2" />
                Sections ({editedResponse.sections.length})
              </TabsTrigger>
              <TabsTrigger
                value="questions"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-3 font-medium transition-all duration-200"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Questions ({editedResponse.questions.length})
              </TabsTrigger>
              <TabsTrigger
                value="requirements"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-3 font-medium transition-all duration-200"
              >
                <List className="w-4 h-4 mr-2" />
                Requirements ({editedResponse.requirements.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="sections" className="mt-0 space-y-6">
              {editedResponse.sections.map((section: any) => (
                <Card key={section.id} className="border border-gray-200">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-lg text-gray-900">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Textarea
                      value={section.ai_response}
                      onChange={(e) => handleSectionEdit(section.id, e.target.value)}
                      className="min-h-32 rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      placeholder="Edit the AI-generated response for this section..."
                    />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="questions" className="mt-0 space-y-6">
              {editedResponse.questions.map((question: any) => (
                <Card key={question.id} className="border border-gray-200">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-lg text-gray-900">{question.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Textarea
                      value={question.ai_answer}
                      onChange={(e) => handleQuestionEdit(question.id, e.target.value)}
                      className="min-h-32 rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      placeholder="Edit the AI-generated answer to this question..."
                    />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="requirements" className="mt-0 space-y-6">
              {editedResponse.requirements.map((req: any) => (
                <Card key={req.id} className="border border-gray-200">
                  <CardHeader className="bg-gray-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-900">{req.requirement}</CardTitle>
                      <Badge
                        className={`${
                          req.compliance_status === "compliant"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {req.compliance_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Textarea
                      value={req.ai_explanation}
                      onChange={(e) => handleRequirementEdit(req.id, e.target.value)}
                      className="min-h-32 rounded-xl border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      placeholder="Edit the AI-generated explanation for this requirement..."
                    />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {/* Save Button */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-12 px-8 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-xl font-semibold shadow-lg"
        >
          {saving ? (
            <>
              <Save className="w-5 h-5 mr-2 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Changes & Continue
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
