"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Brain, AlertCircle, FileText, MessageSquare, List, Zap } from "lucide-react"

interface ResponseGenerationProps {
  rfpData: any
  onResponseGenerated: (response: any) => void
}

export default function ResponseGeneration({ rfpData, onResponseGenerated }: ResponseGenerationProps) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!rfpData) {
      setError("No RFP data available. Please upload an RFP first.")
      return
    }

    setGenerating(true)
    setError(null)
    setProgress(0)

    const steps = [
      { step: "Analyzing RFP structure...", duration: 1000 },
      { step: "Processing questions and requirements...", duration: 1500 },
      { step: "Retrieving relevant company information...", duration: 1200 },
      { step: "Generating AI responses...", duration: 2000 },
      { step: "Formatting and structuring content...", duration: 800 },
      { step: "Finalizing response document...", duration: 500 },
    ]

    try {
      // Show progress steps
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i].step)
        setProgress(((i + 1) / steps.length) * 100)
        await new Promise((resolve) => setTimeout(resolve, steps[i].duration))
      }

      // Make actual API call to generate response
      const response = await fetch("http://localhost:8000/api/generate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rfpData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to generate response")
      }

      const generatedResponse = await response.json()
      console.log("Generated Response:", generatedResponse)

      onResponseGenerated(generatedResponse)
    } catch (err) {
      console.error("Generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate response. Please try again.")
    } finally {
      setGenerating(false)
      setProgress(0)
      setCurrentStep("")
    }
  }

  if (!rfpData) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="p-8">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No RFP Data Available</h3>
          <p className="text-gray-600">Please upload an RFP document first to begin response generation.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl mb-4">
          <Brain className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate AI Response</h2>
        <p className="text-gray-600">
          Our AI will analyze your RFP and generate comprehensive responses using your company documents
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 rounded-xl border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* RFP Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Sections
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {rfpData.structured_data?.sections?.length || 0}
            </div>
            <p className="text-sm text-gray-600">Sections to address</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {rfpData.structured_data?.questions?.length || 0}
            </div>
            <p className="text-sm text-gray-600">Questions to answer</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-br from-green-50 to-green-100">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <List className="w-5 h-5 text-green-600" />
              Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {rfpData.structured_data?.requirements?.length || 0}
            </div>
            <p className="text-sm text-gray-600">Requirements to meet</p>
          </CardContent>
        </Card>
      </div>

      {/* Generation Progress */}
      {generating && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
                <div>
                  <h3 className="font-semibold text-blue-900">Generating AI Response</h3>
                  <p className="text-sm text-blue-700">{currentStep}</p>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-sm text-blue-600 text-right">{Math.round(progress)}% complete</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors duration-200">
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl">
              <Zap className="w-10 h-10 text-green-600" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Generate Response</h3>
              <p className="text-gray-600 mb-6">
                Click the button below to start the AI-powered response generation process. This may take several
                minutes.
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="h-12 px-8 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-xl font-semibold shadow-lg"
            >
              {generating ? (
                <>
                  <Brain className="w-5 h-5 mr-2 animate-spin" />
                  Generating Response...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Generate AI Response
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Process Information */}
      <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200">
        <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Generation Process
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Analyzes RFP structure and requirements
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Retrieves relevant company information
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Generates contextual responses
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Ensures compliance with requirements
          </div>
        </div>
      </div>
    </div>
  )
}
