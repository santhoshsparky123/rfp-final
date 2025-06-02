"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, CheckCircle, AlertCircle, Clock, FileText, HelpCircle, List, Sparkles, Zap, Bot } from "lucide-react"

interface ResponseGenerationProps {
  rfpData: any
  onResponseGenerated: (response: any) => void
}

export default function ResponseGeneration({ rfpData, onResponseGenerated }: ResponseGenerationProps) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [generatedResponse, setGeneratedResponse] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState("")
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [processingStep, setProcessingStep] = useState(0)

  const handleGenerate = async () => {
    if (!rfpData) return

    setGenerating(true)
    setProgress(0)
    setError(null)
    setCurrentItemIndex(0)
    setProcessingStep(0)

    try {
      const totalItems =
        (rfpData.structured_data.sections?.length || 0) +
        (rfpData.structured_data.questions?.length || 0) +
        (rfpData.structured_data.requirements?.length || 0)

      const steps = [
        "Initializing AI agents...",
        "Loading company knowledge base...",
        "Processing RFP sections...",
        "Generating question responses...",
        "Evaluating requirements compliance...",
        "Cross-referencing company capabilities...",
        "Optimizing response quality...",
        "Compiling final responses...",
      ]

      let stepIndex = 0
      let itemsProcessed = 0

      const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex])
          setProcessingStep(stepIndex + 1)

          if (stepIndex >= 2 && stepIndex <= 6) {
            itemsProcessed += Math.floor(Math.random() * 2) + 1
            setCurrentItemIndex(Math.min(itemsProcessed, totalItems))
            setProgress(Math.min((itemsProcessed / totalItems) * 85, 85))
          } else {
            setProgress(((stepIndex + 1) / steps.length) * 100)
          }

          if (stepIndex < 2 || itemsProcessed >= totalItems) {
            stepIndex++
          }
        }
      }, 1800)

      const response = await fetch("http://localhost:8000/api/generate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rfpData),
      })

      clearInterval(progressInterval)
      setProgress(100)
      setCurrentStep("AI processing complete!")

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`)
      }

      const data = await response.json()
      setGeneratedResponse(data)

      setTimeout(() => {
        onResponseGenerated(data)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed")
      setProgress(0)
      setCurrentStep("")
      setProcessingStep(0)
    } finally {
      setGenerating(false)
    }
  }

  if (!rfpData) {
    return (
      <Alert className="rounded-2xl border-amber-200 bg-amber-50 max-w-2xl mx-auto">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <AlertDescription className="text-amber-800 font-medium">
          Please upload an RFP document first to begin response generation.
        </AlertDescription>
      </Alert>
    )
  }

  const totalItems =
    (rfpData.structured_data.sections?.length || 0) +
    (rfpData.structured_data.questions?.length || 0) +
    (rfpData.structured_data.requirements?.length || 0)

  return (
    <div className="space-y-8">
      {/* Professional Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-lg mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Generate AI Responses</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Deploy AI agents to analyze your company documents and generate comprehensive responses for each RFP
          component.
        </p>
      </div>

      <Card className="shadow-xl border-0 overflow-hidden max-w-4xl mx-auto">
        <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500" />
        <CardContent className="p-8 space-y-8">
          {!generatedResponse && !generating && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Sections",
                    count: rfpData.structured_data.sections.length,
                    desc: "to process",
                    icon: "📄",
                    color: "from-blue-500 to-blue-600",
                    bgColor: "from-blue-50 to-blue-100",
                  },
                  {
                    title: "Questions",
                    count: rfpData.structured_data.questions.length,
                    desc: "to answer",
                    icon: "❓",
                    color: "from-green-500 to-green-600",
                    bgColor: "from-green-50 to-green-100",
                  },
                  {
                    title: "Requirements",
                    count: rfpData.structured_data.requirements.length,
                    desc: "to check",
                    icon: "✅",
                    color: "from-purple-500 to-purple-600",
                    bgColor: "from-purple-50 to-purple-100",
                  },
                ].map((item) => (
                  <Card
                    key={item.title}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className={`h-2 bg-gradient-to-r ${item.color}`} />
                    <CardHeader className={`pb-3 bg-gradient-to-br ${item.bgColor}`}>
                      <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 text-center">
                      <div
                        className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-1`}
                      >
                        {item.count}
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.title} {item.desc}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-200">
                  <div className="flex items-center justify-center gap-2 text-purple-700 mb-4">
                    <Sparkles className="w-6 h-6" />
                    <span className="font-semibold text-lg">AI Processing Overview</span>
                  </div>
                  <p className="text-gray-600 text-lg">
                    AI agents will analyze {totalItems} components using your company knowledge base to generate
                    comprehensive, tailored responses
                  </p>
                </div>

                <Button
                  onClick={handleGenerate}
                  className="h-16 px-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-2xl shadow-lg"
                >
                  <Zap className="w-6 h-6 mr-3" />
                  Deploy AI Agents
                </Button>
              </div>
            </div>
          )}

          {generating && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-200">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="p-4 bg-purple-100 rounded-2xl">
                      <Brain className="w-10 h-10 text-purple-600 animate-pulse" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 text-xl">{currentStep}</p>
                      <p className="text-gray-600">Step {processingStep} of 8</p>
                      {currentItemIndex > 0 && (
                        <p className="text-sm text-gray-500">
                          Processing item {currentItemIndex} of {totalItems}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 max-w-md mx-auto">
                    <div className="flex justify-between text-sm font-medium">
                      <span>AI Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-4 bg-gray-200" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  {[
                    { name: "Agent Alpha", icon: "🤖", task: "Section Analysis" },
                    { name: "Agent Beta", icon: "🧠", task: "Question Processing" },
                    { name: "Agent Gamma", icon: "⚡", task: "Requirement Check" },
                  ].map((agent, index) => (
                    <div
                      key={agent.name}
                      className="text-center p-4 bg-white rounded-xl border border-purple-200 shadow-sm"
                    >
                      <div className="text-2xl mb-2">{agent.icon}</div>
                      <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-600">{agent.task}</p>
                      <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-center text-gray-600 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  This may take several minutes as AI agents process each component thoroughly...
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {generatedResponse && (
            <Alert className="rounded-2xl border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 font-medium">
                <strong>AI responses generated successfully!</strong> Review the comprehensive results below.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {generatedResponse && (
        <Card className="shadow-lg border-0 max-w-6xl mx-auto">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Sparkles className="w-5 h-5" />
              Generated Responses
            </CardTitle>
            <CardDescription className="text-green-700">
              Review AI-generated responses for each RFP component
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="sections" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 p-1 rounded-2xl">
                <TabsTrigger
                  value="sections"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Sections ({generatedResponse.sections.length})
                </TabsTrigger>
                <TabsTrigger
                  value="questions"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <HelpCircle className="w-4 h-4" />
                  Questions ({generatedResponse.questions.length})
                </TabsTrigger>
                <TabsTrigger
                  value="requirements"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <List className="w-4 h-4" />
                  Requirements ({generatedResponse.requirements.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sections" className="space-y-4">
                {generatedResponse.sections.map((section: any, index: number) => (
                  <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">📄</span>
                            {section.title}
                          </CardTitle>
                          <CardDescription className="mt-2">{section.content}</CardDescription>
                        </div>
                        <Badge variant="outline" className="rounded-xl">
                          Level {section.level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Bot className="w-4 h-4 text-blue-600" />
                          AI Response:
                        </h4>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-700">{section.answer}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="questions" className="space-y-4">
                {generatedResponse.questions.map((question: any, index: number) => (
                  <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">❓</span>
                            Question {index + 1}
                          </CardTitle>
                          <CardDescription className="mt-2">{question.text}</CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="rounded-xl">
                            {question.type}
                          </Badge>
                          {question.word_limit && (
                            <Badge variant="secondary" className="rounded-xl">
                              Max {question.word_limit} words
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Bot className="w-4 h-4 text-green-600" />
                          AI Response:
                        </h4>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-700">{question.answer}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="requirements" className="space-y-4">
                {generatedResponse.requirements.map((requirement: any, index: number) => (
                  <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">✅</span>
                            Requirement {index + 1}
                          </CardTitle>
                          <CardDescription className="mt-2">{requirement.text}</CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant={requirement.mandatory ? "destructive" : "secondary"} className="rounded-xl">
                            {requirement.mandatory ? "Mandatory" : "Optional"}
                          </Badge>
                          <Badge
                            variant={requirement.satisfied ? "default" : "outline"}
                            className={`rounded-xl ${requirement.satisfied ? "bg-green-500 hover:bg-green-600" : "border-red-300 text-red-600"}`}
                          >
                            {requirement.satisfied ? "✓ Satisfied" : "✗ Not Satisfied"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`p-4 rounded-2xl border ${
                          requirement.satisfied
                            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                            : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
                        }`}
                      >
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Bot className={`w-4 h-4 ${requirement.satisfied ? "text-green-600" : "text-red-600"}`} />
                          Evidence & Analysis:
                        </h4>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-700">
                          {requirement.evidence}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
