// frontend/components/superadmin-dashboard.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Crown, Users, LogOut, CheckCircle, AlertCircle, Building, Mail, Calendar, Activity } from "lucide-react"

interface User {
  id: string;
  email: string;
  role: "super_admin";
  name: string;
  company?: string;
}

interface SuperAdminDashboardProps {
  user: User;
  onLogout: () => void;
  token: string; // Ensure token is passed from page.tsx
}

interface Company {
  id: number;
  name: string;
  subdomain: string;
  subscription_status: string; // Matches backend string
  subscription_start?: string;
  subscription_end?: string;
  created_at?: string;
  username?: string; // Corresponds to 'username' from fetch_username in backend
  userid?: number;
}

export default function SuperAdminDashboard({ user, onLogout, token }: SuperAdminDashboardProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0); // State for total users, could be fetched from another API

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:8000/api/all-companies", { // Adjust URL if different
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // Include the bearer token for authentication
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication failed. Please log in again.");
          }
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch companies.");
        }

        const data = await response.json();
        // Assuming the backend returns { "companies": [...] }
        setCompanies(data.companies || []);

        // This would ideally come from a separate API endpoint for total users
        // For now, we can calculate based on fetched companies if appropriate or keep a dummy
        // setTotalUsers(data.total_users_count || data.companies.length); // Example: if backend returns total_users_count
        setTotalUsers(50); // Keeping dummy for total users for now, as backend `all-companies` doesn't provide it
        
      } catch (err: any) {
        console.error("Failed to fetch companies:", err);
        setError(err.message || "Failed to load company data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (token) { // Only fetch if token is available
      fetchCompanies();
    } else {
      setLoading(false); // If no token, set loading to false immediately
      setError("Authentication token not found. Please log in.");
    }
  }, [token]); // Re-run effect if token changes

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10 pb-5 border-b border-gray-600">
          <div className="flex items-center space-x-4">
            <Crown className="w-10 h-10 text-yellow-400" />
            <h1 className="text-5xl font-extrabold text-white tracking-tight">Super Admin Dashboard</h1>
          </div>
          <Button
            onClick={onLogout}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition duration-300 flex items-center space-x-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-6 rounded-xl border-red-400 bg-red-900 text-red-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-gray-800 border border-gray-700 text-gray-100 rounded-xl shadow-lg">
          <CardContent className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 bg-gray-700 mb-6 rounded-lg p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white rounded-md">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="companies" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white rounded-md">
                  Companies
                </TabsTrigger>
                {/* Add more tabs as needed, e.g., "Users", "Settings" */}
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="bg-gray-700 border border-gray-600 text-gray-100 rounded-xl shadow-md">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-white">System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-800 rounded-xl">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="font-medium">System Status</span>
                          </div>
                          <Badge className="bg-green-600 text-white">Operational</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-800 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            <span className="font-medium">Total Users</span>
                          </div>
                          <Badge variant="outline" className="bg-blue-600 text-white">{totalUsers}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-800 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-purple-400" />
                            <span className="font-medium">Total Companies</span>
                          </div>
                          <Badge variant="outline" className="bg-purple-600 text-white">{companies.length}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="companies" className="mt-4">
                <Card className="bg-gray-700 border border-gray-600 text-gray-100 rounded-xl shadow-md">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-white">Managed Companies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center p-8">
                        <Activity className="h-8 w-8 animate-spin text-blue-400" />
                        <p className="ml-4 text-lg">Loading companies...</p>
                      </div>
                    ) : companies.length === 0 ? (
                      <Alert className="rounded-xl border-gray-600 bg-gray-800 text-gray-300">
                        <AlertCircle className="h-4 w-4 text-gray-500" />
                        <AlertDescription>No companies registered yet.</AlertDescription>
                      </Alert>
                    ) : (
                      <Table className="min-w-full divide-y divide-gray-600">
                        <TableHeader>
                          <TableRow className="bg-gray-600">
                            <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">Company Name</TableHead>
                            <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subdomain</TableHead>
                            <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Subscription Status</TableHead>
                            <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Admin/User</TableHead>
                            <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">Created At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-700">
                          {companies.map((company) => (
                            <TableRow key={company.id} className="hover:bg-gray-700 transition-colors duration-200">
                              <TableCell className="py-3 px-4 whitespace-nowrap font-medium text-gray-100">{company.name}</TableCell>
                              <TableCell className="py-3 px-4 whitespace-nowrap text-gray-300">{company.subdomain}</TableCell>
                              <TableCell className="py-3 px-4 whitespace-nowrap">
                                <Badge
                                  className={`
                                    ${company.subscription_status.toLowerCase() === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
                                    ${company.subscription_status.toLowerCase() === 'trial' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                                    ${company.subscription_status.toLowerCase() === 'inactive' ? 'bg-red-500 hover:bg-red-600' : ''}
                                    text-white
                                  `}
                                >
                                  {company.subscription_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 px-4 whitespace-nowrap text-gray-300 flex items-center gap-2">
                                {company.username || "N/A"} {/* Display username from backend */}
                                {company.username && <Mail className="w-4 h-4 text-blue-400" />}
                              </TableCell>
                              <TableCell className="py-3 px-4 whitespace-nowrap text-gray-300 flex items-center gap-2">
                                {company.created_at ? new Date(company.created_at).toLocaleDateString() : "N/A"}
                                {company.created_at && <Calendar className="w-4 h-4 text-purple-400" />}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}