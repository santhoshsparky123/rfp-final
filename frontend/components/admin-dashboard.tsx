"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Shield,
  UserPlus,
  Users,
  LogOut,
  Trash2,
  CheckCircle,
  AlertCircle,
  Mail,
  Calendar,
  FileText,
  Download,
  Eye, // Keep Eye if you plan to use it elsewhere, otherwise remove
  Activity,
  PlusCircle,
  LayoutDashboard, // For dashboard icon
  RefreshCw, // For unassign action
  UploadCloud, // Added for upload document
} from "lucide-react"

interface AdminDashboardProps {
  user: {
    id: string
    email: string
    role: "admin"
    name: string
    company?: string
    company_id?: number
  }
  onLogout: () => void
  token: string
}

interface Worker {
  id: string
  name: string
  email: string
  created_at: string
  status: "active" | "inactive"
  last_login?: string
  rfps_processed: number
  current_projects: number
  role: "employee"
  // Assuming the backend provides rfps_assigned as an array of RFP IDs
  rfps_assigned?: number[]
}

interface RFP {
  id: number
  filename: string
  content_type: string
  status: "pending" | "in_progress" | "completed" | "assigned" // Explicitly define status types
  uploaded_by: number
  uploaded_by_name: string
  uploaded_by_email: string
  created_at: string
  assigned_to_worker_id?: string // Optional: To store the ID of the worker it's assigned to
  assigned_to_worker_name?: string // Optional: To store the name of the worker it's assigned to
  file_url: string // <-- Add this line
  pdf_url?: string // Optional: URL to the PDF proposal document
  docx_url?: string // Optional: URL to the DOCX proposal document
}

export default function AdminDashboard({ user, onLogout, token }: AdminDashboardProps) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [rfps, setRfps] = useState<RFP[]>([])
  const [pendingRfps, setPendingRfps] = useState<RFP[]>([])

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAssignRfpDialog, setShowAssignRfpDialog] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [showUploadDocumentDialog, setShowUploadDocumentDialog] = useState(false) // New state for upload dialog
  const [newDocument, setNewDocument] = useState<File | null>(null) // New state for selected document file

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [newWorker, setNewWorker] = useState({
    name: "",
    email: "",
    password: "",
  })

  const [activeContent, setActiveContent] = useState<"dashboard" | "workers" | "rfps" | "completion">("dashboard")

  const [usernames, setUsernames] = useState<{ [userId: number]: string }>({});
  // State to store fetched PDF URLs for RFPs
  const [pdfUrls, setPdfUrls] = useState<{ [rfpId: number]: string }>({});

  // Function to fetch company ID
  const fetchCompanyId = useCallback(async (userId: string) => {
    try {
      const companyIdResponse = await fetch(`http://localhost:8000/api/company_id/${userId}`) // Updated route
      if (!companyIdResponse.ok) {
        throw new Error(`Failed to fetch company ID: HTTP status ${companyIdResponse.status}`)
      }
      const companyIdData = await companyIdResponse.json()
      return companyIdData.company_id
    } catch (err: any) {
      console.error("Error fetching company ID:", err)
      setError(`Failed to fetch company ID: ${err.message}`)
      return null
    }
  }, [])

  // Helper to fetch username by user ID
  const fetchUsername = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/fetch-username/${userId}`);
      const data = await res.json();
      if (data.username) {
        setUsernames(prev => ({ ...prev, [userId]: data.username }));
        return data.username;
      }
    } catch (e) {
      console.error("Failed to fetch username for userId", userId, e);
    }
    setUsernames(prev => ({ ...prev, [userId]: userId.toString() }));
    return userId.toString();
  }, []);

  // Function to fetch workers
  const fetchWorkers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const company_id_from_backend = await fetchCompanyId(user.id)
      if (!company_id_from_backend)
        return
      const response = await fetch(`http://localhost:8000/api/all-employee/${company_id_from_backend}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const rawData = await response.json()
      const fetchedEmployees = rawData.employees

      if (!Array.isArray(fetchedEmployees)) {
          throw new Error("Backend response 'employees' is not an array.")
      }

      setWorkers(
        fetchedEmployees.map((worker: any) => ({
          id: worker.id.toString(),
          name: worker.name,
          email: worker.email,
          created_at: worker.created_at ? new Date(worker.created_at).toLocaleDateString() : "N/A",
          status: "active",
          last_login: "N/A",
          rfps_processed: Array.isArray(worker.rfps_assigned) ? worker.rfps_assigned.length : 0,
          current_projects: Array.isArray(worker.rfps_assigned) ? worker.rfps_assigned.length : 0,
          role: "employee",
          rfps_assigned: worker.rfps_assigned, // Store assigned RFP IDs
        })),
      )
    } catch (err: any) {
      console.error("Error fetching workers:", err)
      setError(`Failed to fetch workers: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [token, user.id, fetchCompanyId])

  // Function to fetch RFPs
  const fetchRfps = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const company_id_from_backend = await fetchCompanyId(user.id)
      if (!company_id_from_backend) return

      const response = await fetch(`http://localhost:8000/api/get_rfps/${company_id_from_backend}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const rawData = await response.json()
      const fetchedRfps = rawData.rfps

      if (!Array.isArray(fetchedRfps)) {
        throw new Error("Backend response 'rfps' is not an array.")
      }

      setRfps(
        fetchedRfps.map((rfp: any) => ({
          id: rfp.id,
          filename: rfp.filename,
          content_type: rfp.content_type,
          status: rfp.status, // Ensure status is correctly fetched
          uploaded_by: rfp.uploaded_by,
          uploaded_by_name: rfp.uploaded_by_name,
          uploaded_by_email: rfp.uploaded_by_email,
          created_at: rfp.created_at ? new Date(rfp.created_at).toLocaleDateString() : "N/A",
          assigned_to_worker_id: rfp.assigned_to_worker_id || undefined, // Populate if available from backend
          assigned_to_worker_name: rfp.assigned_to_worker_name || undefined, // Populate if available from backend
          file_url: rfp.file_url || undefined, // Optional: URL to the original file
          pdf_url: rfp.pdf_url || undefined, // Optional: URL to the PDF proposal document
          docx_url: rfp.docx_url || undefined, // Optional: URL to the DOCX proposal document
        })),
      )

      // Filter pending RFPs based on status and if they are assigned
      setPendingRfps(fetchedRfps.filter((rfp: any) => rfp.status === "pending" && !rfp.assigned_to_worker_id));

    } catch (err: any) {
      console.error("Error fetching RFPs:", err)
      setError(`Failed to fetch RFPs: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [token, user.id, fetchCompanyId])

  useEffect(() => {
    fetchWorkers()
  }, [fetchWorkers])

  useEffect(() => {
    fetchRfps()
  }, [fetchRfps])

  // When fetching RFPs, also fetch usernames for uploaded_by
  useEffect(() => {
    if (rfps.length > 0) {
      const uniqueUserIds = Array.from(new Set(rfps.map((r) => r.uploaded_by)));
      uniqueUserIds.forEach((id) => {
        if (!usernames[id]) fetchUsername(id);
      });
    }
  }, [rfps, fetchUsername, usernames]);
  
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const company_id_for_new_worker = await fetchCompanyId(user.id)
      if (!company_id_for_new_worker) return

      const payload = {
        username: newWorker.name,
        email: newWorker.email,
        password: newWorker.password,
        company_id: company_id_for_new_worker,
        role: "employee",
      }

      const response = await fetch("http://localhost:8000/api/admin/create-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMsg = errorData.detail || JSON.stringify(errorData) || errorMsg
        } catch (e) {
          try {
            const text = await response.text()
            errorMsg = text || errorMsg
          } catch {}
        }
        throw new Error(errorMsg)
      }

      setSuccess("Worker created successfully!")
      setNewWorker({ name: "", email: "", password: "" })
      setShowCreateDialog(false)
      fetchWorkers()
    } catch (err: any) {
      setError(`Failed to create worker: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorker = async (workerId: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`http://localhost:8000/api/admin/remove-employee/${workerId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      setSuccess("Worker removed successfully!")
      fetchWorkers() // Re-fetch workers to update their assigned RFPs count
      fetchRfps()    // Re-fetch RFPs to update their status based on backend changes
    } catch (err: any) {
      setError(`Failed to remove worker: ${err} `)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAssignRfpDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    setShowAssignRfpDialog(true)
  }

  const handleAssignRFP = async (rfpId: number) => {
    if (!selectedEmployeeId) {
      setError("No employee selected for RFP assignment.")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`http://localhost:8000/api/admin/assign-rfp-to-employee/${selectedEmployeeId}/${rfpId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      setSuccess(`RFP ${rfpId} assigned successfully to worker ${selectedEmployeeId}!`)
      setShowAssignRfpDialog(false)
      fetchWorkers() // Re-fetch workers to update their assigned RFPs count
      fetchRfps() // Re-fetch RFPs to update their status and refresh pending RFPs list
    } catch (err: any) {
      setError(`Failed to assign RFP: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUnassignRFP = async (rfpId: number) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Find the employee who is assigned this RFP
    const assignedWorker = workers.find(worker =>
      Array.isArray(worker.rfps_assigned) && worker.rfps_assigned.includes(rfpId)
    );
    const employeeId = assignedWorker ? assignedWorker.id : null;

    try {
      if (!employeeId) {
        throw new Error("Could not determine the employee assigned to this RFP.");
      }
      const response = await fetch(`http://localhost:8000/api/admin/unassign-rfp/${employeeId}/${rfpId}`, {
        method: "POST", // Or DELETE, depending on your backend
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      setSuccess(`RFP ${rfpId} unassigned successfully!`);
      fetchWorkers(); // Re-fetch workers to update their assigned RFPs count
      fetchRfps(); // Re-fetch RFPs to update their status and refresh pending RFPs list
    } catch (err: any) {
      setError(`Failed to unassign RFP: ${err.message}`);
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadRFP = async (rfpId: number, filename: string, file_url: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Assuming your backend has an endpoint to download the RFP content
      // e.g., GET /api/get_rfp/{rfpId}
      const response = await fetch(`http://localhost:8000/api/get_rfp/${rfpId}`, { // Updated route
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      // Get the blob data from the response
      const blob = await response.blob();
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      // Create a temporary link element
      const a = document.createElement('a');
      a.href = url;
      a.download = file_url; // Use the original filename for download
      document.body.appendChild(a);
      a.click();
      a.remove(); // Clean up the temporary link
      window.URL.revokeObjectURL(url); // Release the object URL

      setSuccess(`RFP ${file_url} downloaded successfully!`);
    } catch (err: any) {
      setError(`Failed to download RFP: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // New functions for document upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewDocument(e.target.files[0])
    } else {
      setNewDocument(null)
    }
  }

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!newDocument) {
      setError("Please select a file to upload.")
      setLoading(false)
      return
    }

    try {
      const company_id_for_document = await fetchCompanyId(user.id)
      if (!company_id_for_document) {
        setLoading(false)
        return
      }

      const formData = new FormData()
      formData.append("file", newDocument)
      formData.append("company_id", company_id_for_document.toString()) // Ensure company_id is a string if expected

      const response = await fetch("http://localhost:8000/api/add-document/", { // Updated route
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMsg = errorData.detail || JSON.stringify(errorData) || errorMsg
        } catch (e) {
          try {
            const text = await response.text()
            errorMsg = text || errorMsg
          } catch {}
        }
        throw new Error(errorMsg)
      }

      setSuccess(`Document "${newDocument.name}" uploaded successfully!`)
      setNewDocument(null)
      setShowUploadDocumentDialog(false)
      fetchRfps() // Refresh the RFP list to show the newly uploaded document
    } catch (err: any) {
      setError(`Failed to upload document: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch PDF URL for a given RFP ID (match user dashboard logic)
  const fetchPdfUrl = async (rfpId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/api/final-rfp/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ rfp_id: rfpId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.pdf_url) {
        setPdfUrls((prev) => ({ ...prev, [rfpId]: data.pdf_url }));
      } else {
        setError("No PDF proposal document available for this RFP.");
      }
    } catch (err: any) {
      setError(`Failed to fetch proposal document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalRFPs = rfps.length
  const activeWorkers = workers.filter((worker) => worker.status === "active").length
  const currentProjects = workers.reduce((sum, worker) => sum + worker.current_projects, 0)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-700 to-indigo-800 text-white shadow-xl flex flex-col p-4">
        <div className="flex items-center gap-3 mb-8 px-2 py-3 rounded-lg bg-blue-800/50">
          <Shield className="w-7 h-7 text-blue-200" />
          <h2 className="text-2xl font-bold">Admin Panel</h2>
        </div>

        <nav className="flex-1 space-y-2">
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-lg text-lg py-6 ${activeContent === "dashboard" ? "bg-blue-600 hover:bg-blue-600/90" : "hover:bg-blue-700/70"}`}
            onClick={() => setActiveContent("dashboard")}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-lg text-lg py-6 ${activeContent === "workers" ? "bg-blue-600 hover:bg-blue-600/90" : "hover:bg-blue-700/70"}`}
            onClick={() => setActiveContent("workers")}
          >
            <Users className="w-5 h-5 mr-3" />
            Employees
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-lg text-lg py-6 ${activeContent === "rfps" ? "bg-blue-600 hover:bg-blue-600/90" : "hover:bg-blue-700/70"}`}
            onClick={() => setActiveContent("rfps")}
          >
            <FileText className="w-5 h-5 mr-3" />
            View All RFPs
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-lg text-lg py-6 ${activeContent === "completion" ? "bg-blue-600 hover:bg-blue-600/90" : "hover:bg-blue-700/70"}`}
            onClick={() => setActiveContent("completion")}
          >
            <CheckCircle className="w-5 h-5 mr-3" />
            Completion of RFP
          </Button>
        </nav>

        <div className="mt-auto border-t border-blue-600 pt-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg mb-3">
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  Add New Employee
                </DialogTitle>
                <DialogDescription>Create a new employee account with RFP processing capabilities.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateWorker} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newWorker.name}
                    onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newWorker.email}
                    onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newWorker.password}
                    onChange={(e) => setNewWorker({ ...newWorker, password: e.target.value })}
                    placeholder="Enter initial password"
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                  >
                    {loading ? "Creating..." : "Add Worker"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* New Button: Upload Company Document */}
          <Dialog open={showUploadDocumentDialog} onOpenChange={setShowUploadDocumentDialog}>
            <DialogTrigger asChild>
              <Button className="w-full bg-green-600 hover:bg-green-700 rounded-xl shadow-lg mb-3">
                <UploadCloud className="w-4 h-4 mr-2" />
                Upload Company Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-green-600" />
                  Upload Company Document
                </DialogTitle>
                <DialogDescription>Upload a new RFP document for processing.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document">Select Document</Label>
                  <Input
                    id="document"
                    type="file"
                    onChange={handleFileChange}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !newDocument}
                    className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-xl"
                  >
                    {loading ? "Uploading..." : "Upload Document"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowUploadDocumentDialog(false);
                      setNewDocument(null); // Clear selected file on cancel
                    }}
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            onClick={onLogout}
            className="w-full bg-red-500 hover:bg-red-600 rounded-xl shadow-lg mt-3"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800">Welcome, {user.name}</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-lg px-4 py-2 rounded-full">
              <Mail className="w-4 h-4 mr-2" />
              {user.email}
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2 rounded-full bg-blue-500 text-white">
              <Shield className="w-4 h-4 mr-2" />
              {user.role.toUpperCase()}
            </Badge>
          </div>
        </header>

        {loading && (
          <Alert className="mb-4 bg-blue-100 border-blue-200 text-blue-700 rounded-xl">
            <Activity className="h-4 w-4" />
            <AlertDescription>Loading data...</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-4 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-100 border-green-200 text-green-700 rounded-xl">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {activeContent === "dashboard" && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-2xl shadow-lg border border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-medium text-gray-700">Total RFPs</CardTitle>
                <FileText className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gray-900">{totalRFPs}</div>
                <p className="text-xs text-gray-500">All uploaded documents</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-medium text-gray-700">Active Employees</CardTitle>
                <Users className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gray-900">{activeWorkers}</div>
                <p className="text-xs text-gray-500">Currently active employees</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-medium text-gray-700">Current Projects</CardTitle>
                <Activity className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gray-900">{currentProjects}</div>
                <p className="text-xs text-gray-500">RFPs currently being processed</p>
              </CardContent>
            </Card>
          </section>
        )}

        {activeContent === "workers" && (
          <section className="mb-8">
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">Employee Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>RFPs Processed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                          No workers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      workers.map((worker) => (
                        <TableRow key={worker.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{worker.name}</TableCell>
                          <TableCell className="text-gray-700">{worker.email}</TableCell>
                          <TableCell className="text-gray-500">{worker.created_at}</TableCell>
                          <TableCell>
                            <Badge
                              variant={worker.status === "active" ? "default" : "outline"}
                              className={`rounded-xl ${
                                worker.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {worker.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">{worker.rfps_processed}</TableCell>
                          <TableCell className="text-right flex space-x-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-600 hover:bg-blue-50 rounded-lg"
                              onClick={() => handleOpenAssignRfpDialog(worker.id)}
                            >
                              <PlusCircle className="h-4 w-4 mr-1" /> Assign RFP
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50 rounded-lg"
                              onClick={() => handleDeleteWorker(worker.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={showAssignRfpDialog} onOpenChange={setShowAssignRfpDialog}>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" /> Assign RFP to Worker
                  </DialogTitle>
                  <DialogDescription>Select an RFP to assign to the chosen worker.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {pendingRfps.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No pending RFPs available for assignment.</p>
                  ) : (
                    pendingRfps.map((rfp) => (
                      <Card key={rfp.id} className="flex items-center justify-between p-4 rounded-xl shadow-sm border border-gray-200">
                        <div>
                          <p className="font-medium text-gray-900">{rfp.filename}</p>
                          <p className="text-sm text-gray-500">Uploaded by: {usernames[rfp.uploaded_by] || rfp.uploaded_by}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAssignRFP(rfp.id)}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                        >
                          {loading ? "Assigning..." : "Assign"}
                        </Button>
                      </Card>
                    ))
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAssignRfpDialog(false)}
                    className="rounded-xl"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>
        )}

        {activeContent === "rfps" && (
          <section className="mb-8">
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">All RFPs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Filename</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Assigned To</TableHead> {/* New column for assigned worker */}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfps.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500"> {/* Updated colspan */}
                          No RFPs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rfps.map((rfp) => (
                        <TableRow key={rfp.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{rfp.filename}</TableCell>
                          <TableCell className="text-gray-700">{rfp.content_type}</TableCell>
                          <TableCell>
                            <Badge
                              variant={rfp.status === "completed" ? "default" : "outline"}
                              className={`rounded-xl ${
                                rfp.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : rfp.status === "in_progress"
                                    ? "bg-blue-100 text-blue-700"
                                    : rfp.status === "assigned" // New status styling
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-green-100 text-green-700"
                              }`}
                            >
                              {rfp.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">{usernames[rfp.uploaded_by] || rfp.uploaded_by}</TableCell>
                          <TableCell className="text-gray-500">{rfp.created_at}</TableCell>
                          <TableCell className="text-gray-700">
                              {rfp.assigned_to_worker_name || "N/A"} {/* Display assigned worker */}
                          </TableCell>
                          <TableCell className="text-right flex space-x-2 justify-end">
                            {rfp.status === "assigned" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-orange-600 border-orange-600 hover:bg-orange-50 rounded-lg"
                                  onClick={() => handleUnassignRFP(rfp.id)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-1" /> Unassign
                                </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-purple-600 border-purple-600 hover:bg-purple-50 rounded-lg"
                              onClick={() => window.open(rfp.file_url, "_blank")}
                            >
                              <Download className="h-4 w-4 mr-1" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        )}

        {activeContent === "completion" && (
          <section className="mb-8">
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">RFPs Pending Admin Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Filename</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Submitted Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfps.filter(rfp => rfp.status === "pending").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No RFPs pending admin verification.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rfps.filter(rfp => rfp.status === "pending").map((rfp) => (
                        <TableRow key={rfp.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{rfp.filename}</TableCell>
                          <TableCell>
                            <Badge className="rounded-xl bg-yellow-100 text-yellow-700">Pending Review</Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">{rfp.assigned_to_worker_name || "N/A"}</TableCell>
                          <TableCell className="text-gray-500">{rfp.created_at}</TableCell>
                          <TableCell className="text-right flex space-x-2 justify-end">
                            {rfp.pdf_url ? (
                              <Button
                                onClick={() => window.open(rfp.pdf_url, "_blank")}
                                size="sm"
                                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-lg"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Response
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg cursor-not-allowed opacity-60"
                                disabled
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                No PDF
                              </Button>
                            )}
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                              onClick={async () => {
                                setLoading(true);
                                setError(null);
                                setSuccess(null);
                                try {
                                  const response = await fetch(`http://localhost:8000/api/admin/rfps/${rfp.id}/accept`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      "Authorization": `Bearer ${token}`,
                                    },
                                  });
                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
                                  }
                                  setSuccess(`RFP ${rfp.filename} marked as completed!`);
                                  fetchRfps();
                                } catch (err: any) {
                                  setError(`Failed to mark RFP as completed: ${err.message}`);
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Verified
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  )
}