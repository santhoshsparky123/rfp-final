"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Building, AlertCircle, CheckCircle, CreditCard, Calendar, Users } from "lucide-react"

interface CreateCompanyFormProps {
  userId: string
  onSuccess: () => void
}

interface SubscriptionPlan {
  id: string
  name: string
  duration: number // in months
  pricePerEmployee: number
  description: string
  savings?: string
}

export default function CreateCompanyForm({ userId, onSuccess }: CreateCompanyFormProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"company" | "subscription" | "payment">("company")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [companyData, setCompanyData] = useState({
    name: "",
    subdomain: "",
    employees: 1,
  })

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "3month",
      name: "3 Months",
      duration: 3,
      pricePerEmployee: 14,
      description: "Quarterly plan with 7% savings",
      savings: "Save 7%",
    },
    {
      id: "6month",
      name: "6 Months",
      duration: 6,
      pricePerEmployee: 27,
      description: "Half-yearly plan with 10% savings",
      savings: "Save 10%",
    },
  ]

  const calculateTotalAmount = () => {
    const plan = subscriptionPlans.find((p) => p.id === selectedPlan)
    if (!plan) return 0
    return plan.pricePerEmployee * companyData.employees
  }

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/
    if (!subdomainRegex.test(companyData.subdomain)) {
      setError("Subdomain can only contain lowercase letters, numbers, and hyphens")
      return
    }

    if (companyData.employees < 1 || companyData.employees > 100) {
      setError("Number of employees must be between 1 and 100")
      return
    }

    setStep("subscription")
    setError(null)
  }

  const handleSubscriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPlan) {
      setError("Please select a subscription plan")
      return
    }

    setStep("payment")
    setError(null)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const plan = subscriptionPlans.find((p) => p.id === selectedPlan)
    const totalAmount = calculateTotalAmount()

    if (!plan) {
      setError("Invalid subscription plan")
      setLoading(false)
      return
    }

    try {
      // Create company with payment details using the new API endpoint
      const companyResponse = await fetch("http://localhost:8000/api/user/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userid: Number.parseInt(userId),
          amount: totalAmount * 100, // Convert to paise for Razorpay
          currency: "INR",
          receipt: `userid_${userId}`,
          company_name: companyData.name,
          subdomain: companyData.subdomain
        }),
      })

      if (!companyResponse.ok) {
        const errorData = await companyResponse.json()
        throw new Error(errorData.detail || "Failed to create company")
      }

      const data = await companyResponse.json()

      // Initialize Razorpay
      const options = {
        key: data.order.razorpay_key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "RFP Response Generator",
        description: `${plan.name} Subscription for ${companyData.employees} employee(s)`,
        order_id: data.order.order_id,
        handler: async (response: any) => {
  try {
    const verifyResponse = await fetch("http://localhost:8000/api/payment/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        userid: Number.parseInt(userId),
        subdomain: companyData.subdomain,
        company_name: companyData.name,
      }),
    })

    if (!verifyResponse.ok) {
      throw new Error("Payment verification failed")
    }

    setSuccess("Company created and payment successful!")
    setTimeout(() => {
      setOpen(false)
      onSuccess()
    }, 2000)
  } catch (err) {
    console.error("Payment verification error:", err)
    setError("Payment verification failed")
  }
        },

        prefill: {
          name: companyData.name,
        },
        theme: {
          color: "#4F46E5",
        },
      }

      // @ts-ignore - Razorpay is loaded via script
      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      console.error("Payment error:", err)
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep("company")
    setCompanyData({
      name: "",
      subdomain: "",
      employees: 1,
    })
    setSelectedPlan(null)
    setError(null)
    setSuccess(null)
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) resetForm()
        }}
      >
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl">
            <Building className="w-5 h-5 mr-2" />
            Create Company
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md md:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Building className="w-6 h-6 text-blue-600" />
              {step === "company" && "Create New Company"}
              {step === "subscription" && "Choose Subscription Plan"}
              {step === "payment" && "Payment Details"}
            </DialogTitle>
            <DialogDescription>
              {step === "company" && "Set up your company profile to start using the RFP platform"}
              {step === "subscription" && "Select a subscription plan based on your team size"}
              {step === "payment" && "Complete your payment to activate your subscription"}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="rounded-xl border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {step === "company" && (
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  placeholder="Enter company name"
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center">
                  <Input
                    id="subdomain"
                    value={companyData.subdomain}
                    onChange={(e) => setCompanyData({ ...companyData, subdomain: e.target.value.toLowerCase() })}
                    placeholder="your-company"
                    required
                    className="rounded-l-xl"
                  />
                  <span className="bg-gray-100 px-3 py-2 border border-l-0 border-gray-300 rounded-r-xl text-gray-500">
                    .rfp.com
                  </span>
                </div>
                <p className="text-xs text-gray-500">Only lowercase letters, numbers, and hyphens allowed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employees">Number of Employees</Label>
                <Input
                  id="employees"
                  type="number"
                  min="1"
                  max="100"
                  value={companyData.employees}
                  onChange={(e) => setCompanyData({ ...companyData, employees: Number.parseInt(e.target.value) })}
                  required
                  className="rounded-xl"
                />
                <p className="text-xs text-gray-500">This will determine your subscription cost</p>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700">
                  Continue to Subscription
                </Button>
              </div>
            </form>
          )}

          {step === "subscription" && (
            <form onSubmit={handleSubscriptionSubmit} className="space-y-4">
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Users className="w-4 h-4" />
                  <span>
                    <strong>{companyData.employees}</strong> employee(s) selected
                  </span>
                </div>
              </div>

              <RadioGroup value={selectedPlan || ""} onValueChange={setSelectedPlan} className="space-y-4">
                {subscriptionPlans.map((plan) => {
                  const totalCost = plan.pricePerEmployee * companyData.employees
                  return (
                    <div key={plan.id} className="flex">
                      <div className="flex items-center space-x-2 w-full">
                        <RadioGroupItem value={plan.id} id={plan.id} />
                        <Card
                          className={`flex-1 cursor-pointer transition-all ${selectedPlan === plan.id ? "border-blue-500 shadow-md" : "border-gray-200"}`}
                          onClick={() => setSelectedPlan(plan.id)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span>{plan.name}</span>
                                {plan.savings && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    {plan.savings}
                                  </span>
                                )}
                              </div>
                              <span className="text-blue-600">₹{(totalCost / 100).toFixed(2)}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{plan.duration} month(s) subscription</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>₹{(plan.pricePerEmployee / 100).toFixed(2)} per employee</span>
                              </div>
                              <p className="text-sm text-gray-500">{plan.description}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )
                })}
              </RadioGroup>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStep("company")} className="rounded-xl">
                  Back
                </Button>
                <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700">
                  Continue to Payment
                </Button>
              </div>
            </form>
          )}

          {step === "payment" && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-medium">{companyData.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subdomain:</span>
                    <span className="font-medium">{companyData.subdomain}.rfp.com</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Employees:</span>
                    <span className="font-medium">{companyData.employees}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium">{subscriptionPlans.find((p) => p.id === selectedPlan)?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rate per employee:</span>
                    <span className="font-medium">
                      ₹{(subscriptionPlans.find((p) => p.id === selectedPlan)?.pricePerEmployee || 0) / 100}
                    </span>
                  </div>
                  <div className="border-t border-blue-200 my-2 pt-2 flex justify-between">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-blue-700">₹{(calculateTotalAmount() / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePaymentSubmit}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </Button>

              <div className="flex justify-start">
                <Button type="button" variant="outline" onClick={() => setStep("subscription")} className="rounded-xl">
                  Back to Plans
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>Secure payment powered by Razorpay</p>
                <p>You will be redirected to the payment gateway to complete your transaction</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
