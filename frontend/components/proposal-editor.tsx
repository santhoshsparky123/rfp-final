"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  Edit,
  Save,
  FileText,
  HelpCircle,
  List,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Check,
  X,
} from "lucide-react"

interface ProposalEditorProps {
  generatedResponse: any
  onResponseEdited: (editedResponse: any) => void
}

export default function ProposalEditor({ generatedResponse, onResponseEdited }: ProposalEditorProps) {
  const [editedResponse, setEditedResponse] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("sections")
  const [editingItem, setEditingItem] = useState<{ type: string; index: number } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (generatedResponse) {
      setEditedResponse(JSON.parse(JSON.stringify(generatedResponse)))
    }
  }, [generatedResponse])

  if (!generatedResponse || !editedResponse) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md rounded-2xl border-amber-200 bg-amber-50 shadow-lg">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800 font-medium">
            Please generate responses first to review and edit the proposal.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleEdit = (type: string, index: number, field: string, value: string) => {
    const newResponse = { ...editedResponse }
    newResponse[type][index][field] = value
    setEditedResponse(newResponse)
    setHasChanges(true)
  }

  const handleContinue = () => {
    onResponseEdited(hasChanges ? editedResponse : generatedResponse)
  }

  const handleRegenerate = async (type: string, index: number) => {
    try {
      const response = await fetch("http://localhost:8000/api/regenerate-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rfp_id: generatedResponse.rfp_id,
          type,
          index,
          item: editedResponse[type][index],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newResponse = { ...editedResponse }
        newResponse[type][index] = data.regenerated_item
        setEditedResponse(newResponse)
        setHasChanges(true)
      }
    } catch (error) {
      console.error("Error regenerating item:", error)
    }
  }

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="space-y-8">
      {/* Elegant Header */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl bg-white border border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />

        <div className="relative p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-lg">
                <Edit className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Review & Refine</h1>
                <p className="text-gray-600 text-lg">
                  AI-generated responses are ready for your review. Make any necessary refinements.
                </p>
              </div>
            </div>
            <Button
              onClick={handleContinue}
              className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white rounded-xl px-8 py-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
            >
              <ArrowRight className="w-5 h-5 mr-3" />
              Continue to Final Proposal
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">AI Processing Complete</span>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Modified Content</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-200">
              <Zap className="w-5 h-5" />
              <span className="font-medium">Ready for Export</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Sections",
            count: editedResponse.sections.length,
            icon: FileText,
            color: "blue",
            description: "Content sections processed",
          },
          {
            title: "Questions",
            count: editedResponse.questions.length,
            icon: HelpCircle,
            color: "purple",
            description: "Questions answered",
          },
          {
            title: "Requirements",
            count: editedResponse.requirements.length,
            icon: List,
            color: "pink",
            description: "Requirements evaluated",
          },
        ].map((stat) => {
          const Icon = stat.icon
          const colorClasses = {
            blue: "from-blue-500 to-blue-600 bg-blue-50 border-blue-200 text-blue-700",
            purple: "from-purple-500 to-purple-600 bg-purple-50 border-purple-200 text-purple-700",
            pink: "from-pink-500 to-pink-600 bg-pink-50 border-pink-200 text-pink-700",
          }[stat.color]

          return (
            <Card
              key={stat.title}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className={`h-1 bg-gradient-to-r ${colorClasses.split(" ")[0]} ${colorClasses.split(" ")[1]}`} />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl ${colorClasses.split(" ")[2]} ${colorClasses.split(" ")[3]} group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div
                    className={`text-3xl font-bold bg-gradient-to-r ${colorClasses.split(" ")[0]} ${colorClasses.split(" ")[1]} bg-clip-text text-transparent`}
                  >
                    {stat.count}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{stat.title}</h3>
                  <p className="text-sm text-gray-600">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Elegant Content Editor */}
      <Card className="border-0 shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200 p-8">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl text-gray-900">
                <Sparkles className="w-6 h-6 text-blue-600" />
                Generated Content
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2 text-base">
                All content is production-ready. Click any section to customize or enhance as needed.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 bg-gray-50/50">
              <TabsList className="flex w-full bg-transparent p-0">
                <TabsTrigger
                  value="sections"
                  className="flex-1 flex items-center justify-center gap-3 py-5 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 font-medium transition-all duration-200 rounded-none"
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div>Sections</div>
                    <div className="text-xs text-gray-500">{editedResponse.sections.length} items</div>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="questions"
                  className="flex-1 flex items-center justify-center gap-3 py-5 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-purple-600 font-medium transition-all duration-200 rounded-none"
                >
                  <HelpCircle className="w-5 h-5" />
                  <div className="text-left">
                    <div>Questions</div>
                    <div className="text-xs text-gray-500">{editedResponse.questions.length} items</div>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="requirements"
                  className="flex-1 flex items-center justify-center gap-3 py-5 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-pink-600 font-medium transition-all duration-200 rounded-none"
                >
                  <List className="w-5 h-5" />
                  <div className="text-left">
                    <div>Requirements</div>
                    <div className="text-xs text-gray-500">{editedResponse.requirements.length} items</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-8">
              <TabsContent value="sections" className="mt-0 space-y-6">
                {editedResponse.sections.map((section: any, index: number) => {
                  const itemId = `section-${index}`
                  const isExpanded = expandedItems.has(itemId)
                  const isEditing = editingItem?.type === "sections" && editingItem?.index === index

                  return (
                    <Card
                      key={index}
                      className={`border border-gray-200 hover:border-blue-300 transition-all duration-200 overflow-hidden group ${
                        isExpanded ? "shadow-lg" : "shadow-md"
                      }`}
                    >
                      <CardHeader
                        className={`pb-4 ${
                          isExpanded ? "bg-gradient-to-r from-blue-50 to-blue-100/50" : "bg-white hover:bg-blue-50/30"
                        } transition-colors duration-200`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg font-semibold text-gray-900">{section.title}</CardTitle>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  Level {section.level}
                                </Badge>
                              </div>
                            </div>
                            <CardDescription className="text-gray-600 leading-relaxed line-clamp-2">
                              {section.content}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerate("sections", index)}
                              className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(itemId)}
                              className="rounded-lg"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0 pb-6 px-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold text-gray-700">AI Generated Response</Label>
                              {!isEditing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingItem({ type: "sections", index })}
                                  className="rounded-lg text-xs"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="space-y-4">
                                <Textarea
                                  value={section.answer}
                                  onChange={(e) => handleEdit("sections", index, "answer", e.target.value)}
                                  className="min-h-40 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  placeholder="Edit the AI response..."
                                />
                                <div className="flex gap-3">
                                  <Button
                                    size="sm"
                                    onClick={() => setEditingItem(null)}
                                    className="rounded-lg bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingItem(null)}
                                    className="rounded-lg"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-inner">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{section.answer}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </TabsContent>

              <TabsContent value="questions" className="mt-0 space-y-6">
                {editedResponse.questions.map((question: any, index: number) => {
                  const itemId = `question-${index}`
                  const isExpanded = expandedItems.has(itemId)
                  const isEditing = editingItem?.type === "questions" && editingItem?.index === index

                  return (
                    <Card
                      key={index}
                      className={`border border-gray-200 hover:border-purple-300 transition-all duration-200 overflow-hidden group ${
                        isExpanded ? "shadow-lg" : "shadow-md"
                      }`}
                    >
                      <CardHeader
                        className={`pb-4 ${
                          isExpanded
                            ? "bg-gradient-to-r from-purple-50 to-purple-100/50"
                            : "bg-white hover:bg-purple-50/30"
                        } transition-colors duration-200`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <HelpCircle className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                  Question {index + 1}
                                </CardTitle>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {question.type}
                                  </Badge>
                                  {question.word_limit && (
                                    <Badge variant="secondary" className="text-xs">
                                      Max {question.word_limit} words
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <CardDescription className="text-gray-600 leading-relaxed line-clamp-2">
                              {question.text}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerate("questions", index)}
                              className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(itemId)}
                              className="rounded-lg"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0 pb-6 px-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold text-gray-700">AI Generated Response</Label>
                              {!isEditing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingItem({ type: "questions", index })}
                                  className="rounded-lg text-xs"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="space-y-4">
                                <Textarea
                                  value={question.answer}
                                  onChange={(e) => handleEdit("questions", index, "answer", e.target.value)}
                                  className="min-h-40 rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                  placeholder="Edit the AI response..."
                                />
                                <div className="flex gap-3">
                                  <Button
                                    size="sm"
                                    onClick={() => setEditingItem(null)}
                                    className="rounded-lg bg-purple-600 hover:bg-purple-700"
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingItem(null)}
                                    className="rounded-lg"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-inner">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{question.answer}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </TabsContent>

              <TabsContent value="requirements" className="mt-0 space-y-6">
                {editedResponse.requirements.map((requirement: any, index: number) => {
                  const itemId = `requirement-${index}`
                  const isExpanded = expandedItems.has(itemId)
                  const isEditing = editingItem?.type === "requirements" && editingItem?.index === index

                  return (
                    <Card
                      key={index}
                      className={`border border-gray-200 hover:border-pink-300 transition-all duration-200 overflow-hidden group ${
                        isExpanded ? "shadow-lg" : "shadow-md"
                      }`}
                    >
                      <CardHeader
                        className={`pb-4 ${
                          isExpanded ? "bg-gradient-to-r from-pink-50 to-pink-100/50" : "bg-white hover:bg-pink-50/30"
                        } transition-colors duration-200`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-pink-100 rounded-lg">
                                <List className="w-5 h-5 text-pink-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                  Requirement {index + 1}
                                </CardTitle>
                                <div className="flex gap-2 mt-1">
                                  <Badge
                                    variant={requirement.mandatory ? "destructive" : "secondary"}
                                    className="text-xs"
                                  >
                                    {requirement.mandatory ? "Mandatory" : "Optional"}
                                  </Badge>
                                  <Badge
                                    variant={requirement.satisfied ? "default" : "outline"}
                                    className={`text-xs flex items-center gap-1 ${
                                      requirement.satisfied
                                        ? "bg-green-500 hover:bg-green-600 text-white"
                                        : "border-red-300 text-red-600"
                                    }`}
                                  >
                                    {requirement.satisfied ? (
                                      <>
                                        <Check className="w-3 h-3" /> Satisfied
                                      </>
                                    ) : (
                                      <>
                                        <X className="w-3 h-3" /> Not Satisfied
                                      </>
                                    )}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <CardDescription className="text-gray-600 leading-relaxed line-clamp-2">
                              {requirement.text}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerate("requirements", index)}
                              className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(itemId)}
                              className="rounded-lg"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0 pb-6 px-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold text-gray-700">Evidence & Analysis</Label>
                              {!isEditing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingItem({ type: "requirements", index })}
                                  className="rounded-lg text-xs"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="space-y-4">
                                <Textarea
                                  value={requirement.evidence}
                                  onChange={(e) => handleEdit("requirements", index, "evidence", e.target.value)}
                                  className="min-h-40 rounded-xl border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                                  placeholder="Edit the evidence and analysis..."
                                />
                                <div className="flex gap-3">
                                  <Button
                                    size="sm"
                                    onClick={() => setEditingItem(null)}
                                    className="rounded-lg bg-pink-600 hover:bg-pink-700"
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingItem(null)}
                                    className="rounded-lg"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`bg-white border rounded-xl p-6 shadow-inner ${
                                  requirement.satisfied ? "border-green-200" : "border-red-200"
                                }`}
                              >
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {requirement.evidence}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Elegant Action Bar */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl bg-white border border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />

        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-lg">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Ready for Final Proposal</h3>
                <p className="text-gray-600">
                  {hasChanges
                    ? "Your customizations have been applied. Ready to generate the final proposal document."
                    : "All AI-generated content is production-ready. Proceed to generate the final proposal document."}
                </p>
              </div>
            </div>
            <Button
              onClick={handleContinue}
              className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white rounded-xl px-8 py-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
            >
              <ArrowRight className="w-5 h-5 mr-3" />
              Generate Final Proposal
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
