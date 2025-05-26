import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            New RFP
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-blue-50 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total RFPs</p>
                    <h3 className="text-2xl font-semibold text-gray-900">24</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-50 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">In Progress</p>
                    <h3 className="text-2xl font-semibold text-gray-900">7</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-green-50 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <h3 className="text-2xl font-semibold text-gray-900">15</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-red-50 p-3 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Issues</p>
                    <h3 className="text-2xl font-semibold text-gray-900">2</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Tabs defaultValue="recent">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="recent">Recent RFPs</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent RFP Submissions</CardTitle>
                    <CardDescription>Your most recently processed RFP documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          id: "RFP-2023-005",
                          title: "Cloud Migration Project",
                          client: "TechCorp",
                          status: "processing",
                          date: "May 18, 2025",
                        },
                        {
                          id: "RFP-2023-004",
                          title: "Data Analytics Platform",
                          client: "DataInsights Inc",
                          status: "completed",
                          date: "May 15, 2025",
                        },
                        {
                          id: "RFP-2023-003",
                          title: "Mobile App Development",
                          client: "MobileFirst",
                          status: "completed",
                          date: "May 10, 2025",
                        },
                        {
                          id: "RFP-2023-002",
                          title: "Network Infrastructure Upgrade",
                          client: "ConnectCo",
                          status: "error",
                          date: "May 5, 2025",
                        },
                      ].map((rfp) => (
                        <div key={rfp.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{rfp.title}</h4>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-gray-500">{rfp.client}</span>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-xs text-gray-500">{rfp.id}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-4">{rfp.date}</span>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                rfp.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : rfp.status === "processing"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {rfp.status.charAt(0).toUpperCase() + rfp.status.slice(1)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="active" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Active RFPs</CardTitle>
                    <CardDescription>RFPs currently being processed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          id: "RFP-2023-005",
                          title: "Cloud Migration Project",
                          client: "TechCorp",
                          progress: 65,
                          date: "May 18, 2025",
                        },
                        {
                          id: "RFP-2023-001",
                          title: "Enterprise Software Implementation",
                          client: "Acme Corporation",
                          progress: 80,
                          date: "May 1, 2025",
                        },
                      ].map((rfp) => (
                        <div key={rfp.id} className="p-4 bg-white border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{rfp.title}</h4>
                            <span className="text-xs text-gray-500">{rfp.date}</span>
                          </div>
                          <div className="flex items-center mt-1 mb-3">
                            <span className="text-xs text-gray-500">{rfp.client}</span>
                            <span className="mx-2 text-gray-300">•</span>
                            <span className="text-xs text-gray-500">{rfp.id}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${rfp.progress}%` }}></div>
                          </div>
                          <div className="flex justify-end mt-1">
                            <span className="text-xs text-gray-500">{rfp.progress}% complete</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Completed RFPs</CardTitle>
                    <CardDescription>Successfully processed RFP documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          id: "RFP-2023-004",
                          title: "Data Analytics Platform",
                          client: "DataInsights Inc",
                          date: "May 15, 2025",
                        },
                        {
                          id: "RFP-2023-003",
                          title: "Mobile App Development",
                          client: "MobileFirst",
                          date: "May 10, 2025",
                        },
                      ].map((rfp) => (
                        <div key={rfp.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{rfp.title}</h4>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-gray-500">{rfp.client}</span>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-xs text-gray-500">{rfp.id}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-4">{rfp.date}</span>
                            <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                              View Report
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
