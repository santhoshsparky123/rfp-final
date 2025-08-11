"use client"

import { useState, FormEvent } from "react"

const DirectPasswordReset: React.FC = () => {
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validate = (): boolean => {
    if (!email) {
      setError("Email is required.")
      return false
    }
    if (!newPassword || !confirmPassword) {
      setError("Both password fields are required.")
      return false
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return false
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return false
    }
    setError(null)
    return true
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSuccess(null)
    if (!validate()) return

    setLoading(true)
    try {
      const resp = await fetch("/api/password/direct-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      })

      if (resp.ok) {
        const data = await resp.json()
        setSuccess(data.message || "Password updated successfully.")
        setEmail("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const err = await resp.json()
        setError(err.detail || "Failed to reset password.")
      }
    } catch (e) {
      setError("Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        {error && (
          <div className="mb-3 p-3 bg-red-100 text-red-800 rounded">{error}</div>
        )}
        {success && (
          <div className="mb-3 p-3 bg-green-100 text-green-800 rounded">{success}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="newPassword">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
              placeholder="New password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Confirm password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Updating..." : "Submit"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <a href="/login" className="text-sm text-blue-600 hover:underline">
            Back to login
          </a>
        </div>
      </div>
    </div>
  )
}

export default DirectPasswordReset;
