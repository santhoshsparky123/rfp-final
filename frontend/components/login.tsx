"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  Brain,
  Crown,
  Shield,
  Users,
} from "lucide-react"

interface LoginProps {
  onLogin: (user: {
    id: string
    email: string
    role: "super_admin" | "admin" | "worker" | "user"
    name: string
    company?: string
  }) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("login")

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    role: "user" as "worker" | "user",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock authentication - in real app, this would be an API call
      const mockUsers = [
        {
          id: "1",
          email: "superadmin@system.com",
          password: "super123",
          role: "super_admin" as const,
          name: "System Administrator",
          company: "RFP System",
        },
        {
          id: "2",
          email: "admin@company.com",
          password: "admin123",
          role: "admin" as const,
          name: "Company Admin",
          company: "TechCorp Solutions",
        },
        {
          id: "3",
          email: "worker@company.com",
          password: "worker123",
          role: "worker" as const,
          name: "John Worker",
          company: "TechCorp Solutions",
        },
        {
          id: "4",
          email: "user@company.com",
          password: "user123",
          role: "user" as const,
          name: "Jane User",
          company: "ClientCorp",
        },
      ]

      const user = mockUsers.find((u) => u.email === loginForm.email && u.password === loginForm.password)

      if (user) {
        onLogin({
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          company: user.company,
        })
      } else {
        setError("Invalid email or password")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validation
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (registerForm.password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSuccess("Account created successfully! Please login with your credentials.")
      setActiveTab("login")
      setRegisterForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        company: "",
        role: "user",
      })
    } catch (err) {
      setError("Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = (role: "super_admin" | "admin" | "worker" | "user") => {
    const demoCredentials = {
      super_admin: { email: "superadmin@system.com", password: "super123" },
      admin: { email: "admin@company.com", password: "admin123" },
      worker: { email: "worker@company.com", password: "worker123" },
      user: { email: "user@company.com", password: "user123" },
    }

    setLoginForm(demoCredentials[role])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
            RFP Response Generator
          </h1>
          <p className="text-gray-600">AI-powered proposal generation system</p>
        </div>

        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-100 bg-gray-50/50">
              <TabsList className="grid w-full grid-cols-2 bg-transparent p-2">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-3 font-medium transition-all duration-200"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-3 font-medium transition-all duration-200"
                >
                  Register
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-8">
              <TabsContent value="login" className="mt-0 space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                  <p className="text-gray-600">Sign in to your account to continue</p>
                </div>

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

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="pl-10 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="pl-10 pr-10 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl font-semibold shadow-lg"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                {/* Demo Accounts */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Try Demo Accounts</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => demoLogin("super_admin")}
                      className="h-12 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 flex flex-col items-center py-2"
                    >
                      <Crown className="w-4 h-4 mb-1" />
                      <span className="text-xs">Super Admin</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => demoLogin("admin")}
                      className="h-12 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 flex flex-col items-center py-2"
                    >
                      <Shield className="w-4 h-4 mb-1" />
                      <span className="text-xs">Admin</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => demoLogin("worker")}
                      className="h-12 rounded-xl border-green-200 text-green-700 hover:bg-green-50 flex flex-col items-center py-2"
                    >
                      <Users className="w-4 h-4 mb-1" />
                      <span className="text-xs">Worker</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => demoLogin("user")}
                      className="h-12 rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50 flex flex-col items-center py-2"
                    >
                      <User className="w-4 h-4 mb-1" />
                      <span className="text-xs">User</span>
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="register" className="mt-0 space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
                  <p className="text-gray-600">Join us to start generating RFP responses</p>
                </div>

                {error && (
                  <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="name"
                        type="text"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className="pl-10 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="reg-email"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="pl-10 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                      Company Name
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="company"
                        type="text"
                        value={registerForm.company}
                        onChange={(e) => setRegisterForm({ ...registerForm, company: e.target.value })}
                        className="pl-10 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your company name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Account Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegisterForm({ ...registerForm, role: "user" })}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          registerForm.role === "user"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">👤</div>
                          <div className="font-medium">User</div>
                          <div className="text-xs text-gray-500">Submit RFPs</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegisterForm({ ...registerForm, role: "worker" })}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          registerForm.role === "worker"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">👨‍💼</div>
                          <div className="font-medium">Worker</div>
                          <div className="text-xs text-gray-500">Full Access</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          className="pl-10 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Password"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                        Confirm
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          className="pl-10 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Confirm"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-xl font-semibold shadow-lg"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 RFP Response Generator. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
