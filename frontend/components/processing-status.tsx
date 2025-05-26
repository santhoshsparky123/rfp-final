"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react"

type ProcessingStep = {
  id: string
  name: string
  description: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
}

export function ProcessingStatus() {
  const router = useRouter()
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: "document_loading",
      name: "Document Loading",
      description: "Loading and preparing your document for processing",
      status: "processing",
      progress: 0,
    },
    {
      id: "extract_sections",
      name: "Section Extraction",
      description: "Identifying document sections and structure",
      status: "pending",
      progress: 0,
    },
    {
      id: "extract_questions",
      name: "Question Extraction",
      description: "Identifying questions that require responses",
      status: "pending",
      progress: 0,
    },
    {
      id: "extract_requirements",
      name: "Requirement Extraction",
      description: "Identifying and categorizing requirements",
      status: "pending",
      progress: 0,
    },
    {
      id: "extract_metadata",
      name: "Metadata Extraction",
      description: "Extracting document metadata and context",
      status: "pending",
      progress: 0,
    },
    {
      id: "link_items",
      name: "Relationship Mapping",
      description: "Linking related questions and requirements",
      status: "pending",
      progress: 0,
    },
  ])

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const [processingComplete, setProcessingComplete] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate the processing steps
    const simulateProcessing = async () => {
      // Process each step sequentially
      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i)

        // Update current step to processing
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "processing" as const } : step)))

        // Simulate progress for current step
        for (let progress = 0; progress <= 100; progress += 5) {
          // Update progress for current step
          setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, progress } : step)))

          // Update overall progress
          const stepsCompleted = i
          const currentStepContribution = progress / 100
          const newOverallProgress = ((stepsCompleted + currentStepContribution) / steps.length) * 100
          setOverallProgress(newOverallProgress)

          // Wait a bit before next progress update
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Mark current step as completed
        setSteps((prev) => prev.map((step, idx) => (idx === i ? { ...step, status: "completed" as const } : step)))

        // Wait a bit before starting next step
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // All steps completed
      setProcessingComplete(true)
      setOverallProgress(100)

      // Wait a bit and then redirect to results
      setTimeout(() => {
        router.push("/results")
      }, 2000)
    }

    // Start the simulation
    simulateProcessing().catch((error) => {
      console.error("Processing error:", error)
      setProcessingError("An error occurred during processing. Please try again.")
    })
  }, [router, steps.length])

  const currentStep = steps[currentStepIndex]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          {processingComplete ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Processing Complete
            </>
          ) : processingError ? (
            <>
              <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
              Processing Error
            </>
          ) : (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-purple-600" />
              Processing Document
            </>
          )}
        </CardTitle>
        <CardDescription>
          {processingComplete
            ? "Your document has been successfully processed"
            : processingError
              ? processingError
              : "Extracting structured data from your RFP document"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {step.status === "completed" ? (
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  ) : step.status === "processing" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-purple-600" />
                  ) : step.status === "error" ? (
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                  ) : (
                    <div className="mr-2 h-4 w-4 rounded-full border border-gray-300" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      step.status === "completed"
                        ? "text-green-700"
                        : step.status === "processing"
                          ? "text-purple-700"
                          : step.status === "error"
                            ? "text-red-700"
                            : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {step.status !== "pending" && <span className="text-xs text-gray-500">{step.progress}%</span>}
              </div>
              {step.status === "processing" && <Progress value={step.progress} className="h-1" />}
              {step.status === "processing" && <p className="text-xs text-gray-500 pl-6">{step.description}</p>}
            </div>
          ))}
        </div>
      </CardContent>
      {processingComplete && (
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/results")}>
            View Results <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
      {processingError && (
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/")}>
            Try Again
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
