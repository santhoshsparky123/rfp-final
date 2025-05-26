import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, Edit, Eye, FileText, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function RfpDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RFP-{params.id}</h1>
              <p className="text-sm text-gray-500">Enterprise Software Implementation</p>
            </div>
            <div className="ml-auto flex space-x-2">
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-3 lg:col-span-2">
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>RFP Overview</CardTitle>
                      <CardDescription>General information about this RFP</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Client</h3>
                            <p className="mt-1 text-sm text-gray-900">Acme Corporation</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Project Title</h3>
                            <p className="mt-1 text-sm text-gray-900">Enterprise Software Implementation</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Submission Deadline</h3>
                            <p className="mt-1 text-sm text-gray-900">June 30, 2023</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Expected Start Date</h3>
                            <p className="mt-1 text-sm text-gray-900">August 15, 2023</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Project Duration</h3>
                            <p className="mt-1 text-sm text-gray-900">12 months</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Budget Range</h3>
                            <p className="mt-1 text-sm text-gray-900">$500,000 - $750,000</p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Project Description</h3>
                          <p className="mt-1 text-sm text-gray-900">
                            Acme Corporation is seeking proposals for the implementation of an enterprise software
                            solution to streamline their business operations, including inventory management, order
                            processing, and customer relationship management. The solution should integrate with their
                            existing ERP system and provide robust reporting capabilities.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Original Documents</h3>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center p-3 bg-gray-50 rounded-md">
                              <FileText className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-700 flex-1">RFP-2023-001.pdf</span>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center p-3 bg-gray-50 rounded-md">
                              <FileText className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-700 flex-1">Requirements_Appendix.docx</span>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="requirements" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>RFP Requirements</CardTitle>
                      <CardDescription>Extracted and structured requirements from the RFP</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  ID
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Category
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Description
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Priority
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {[
                                {
                                  id: "REQ-001",
                                  category: "Technical",
                                  description: "The system must support single sign-on authentication",
                                  priority: "High",
                                },
                                {
                                  id: "REQ-002",
                                  category: "Performance",
                                  description: "The system must support at least 1000 concurrent users",
                                  priority: "Medium",
                                },
                                {
                                  id: "REQ-003",
                                  category: "Security",
                                  description: "All data must be encrypted at rest and in transit",
                                  priority: "High",
                                },
                                {
                                  id: "REQ-004",
                                  category: "Integration",
                                  description: "The system must integrate with our existing ERP system",
                                  priority: "High",
                                },
                                {
                                  id: "REQ-005",
                                  category: "Reporting",
                                  description: "The system must provide customizable reporting capabilities",
                                  priority: "Medium",
                                },
                                {
                                  id: "REQ-006",
                                  category: "User Interface",
                                  description: "The system must have a responsive design for mobile access",
                                  priority: "Low",
                                },
                              ].map((req) => (
                                <tr key={req.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {req.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.category}</td>
                                  <td className="px-6 py-4 text-sm text-gray-500">{req.description}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        req.priority === "High"
                                          ? "bg-red-100 text-red-800"
                                          : req.priority === "Medium"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {req.priority}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="response" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>RFP Response</CardTitle>
                      <CardDescription>Generated response to the RFP requirements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Response
                          </Button>
                          <Button size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>

                        <div className="prose prose-sm max-w-none">
                          <h2>Executive Summary</h2>
                          <p>
                            We are pleased to submit our proposal for the Enterprise Software Implementation project at
                            Acme Corporation. Our solution is designed to meet all the requirements specified in the
                            RFP, with a focus on seamless integration, robust security, and scalable performance.
                          </p>

                          <h3>Technical Approach</h3>
                          <p>
                            Our approach to implementing the enterprise software solution involves a phased deployment
                            strategy that minimizes disruption to your existing operations while ensuring a smooth
                            transition to the new system. We will leverage our expertise in cloud-based solutions to
                            provide a scalable and flexible platform that can grow with your business needs.
                          </p>

                          <h3>Security Measures</h3>
                          <p>
                            Security is a top priority in our implementation. All data will be encrypted both at rest
                            and in transit using industry-standard encryption protocols. Our solution includes robust
                            access controls, audit logging, and compliance with relevant security standards such as SOC
                            2 and GDPR.
                          </p>

                          <h3>Integration Capabilities</h3>
                          <p>
                            Our solution offers seamless integration with your existing ERP system through a combination
                            of API-based connectors and custom integration modules. This ensures that data flows
                            smoothly between systems, eliminating silos and providing a unified view of your business
                            operations.
                          </p>

                          <h3>Pricing and Timeline</h3>
                          <p>
                            We propose a total implementation cost of $650,000, which includes software licensing,
                            implementation services, training, and one year of premium support. The project will be
                            completed within 10 months, with key milestones as outlined in the attached project plan.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Processing History</CardTitle>
                      <CardDescription>Timeline of RFP processing activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flow-root">
                          <ul className="-mb-8">
                            {[
                              { id: 1, content: "RFP documents uploaded", date: "May 1, 2025", time: "09:30 AM" },
                              {
                                id: 2,
                                content: "Document extraction completed",
                                date: "May 1, 2025",
                                time: "09:45 AM",
                              },
                              { id: 3, content: "Data structuring completed", date: "May 1, 2025", time: "10:15 AM" },
                              { id: 4, content: "RAG processing completed", date: "May 1, 2025", time: "11:30 AM" },
                              {
                                id: 5,
                                content: "Response generation completed",
                                date: "May 1, 2025",
                                time: "01:45 PM",
                              },
                              { id: 6, content: "Editorial review completed", date: "May 1, 2025", time: "03:30 PM" },
                              { id: 7, content: "Final documents generated", date: "May 1, 2025", time: "04:15 PM" },
                            ].map((event, eventIdx) => (
                              <li key={event.id}>
                                <div className="relative pb-8">
                                  {eventIdx !== 6 ? (
                                    <span
                                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                      aria-hidden="true"
                                    />
                                  ) : null}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                        <CheckCircle className="h-5 w-5 text-white" />
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-sm text-gray-500">{event.content}</p>
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        <time dateTime={event.date}>
                                          {event.date} at {event.time}
                                        </time>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="col-span-3 lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Processing Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mr-4">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Processing Complete</p>
                      <p className="text-sm text-gray-500">All steps completed successfully</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Document Extraction</span>
                      <span className="text-xs text-green-500">Completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-green-500 h-1 rounded-full w-full"></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Data Structuring</span>
                      <span className="text-xs text-green-500">Completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-green-500 h-1 rounded-full w-full"></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">RAG Processing</span>
                      <span className="text-xs text-green-500">Completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-green-500 h-1 rounded-full w-full"></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Response Generation</span>
                      <span className="text-xs text-green-500">Completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-green-500 h-1 rounded-full w-full"></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Editorial Review</span>
                      <span className="text-xs text-green-500">Completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-green-500 h-1 rounded-full w-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-blue-50 p-2 rounded-full mr-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">RFP Response</h4>
                          <p className="text-xs text-gray-500">PDF Format • 2.4 MB</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-blue-50 p-2 rounded-full mr-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">RFP Response</h4>
                          <p className="text-xs text-gray-500">Word Format • 1.8 MB</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-blue-50 p-2 rounded-full mr-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">Structured Data</h4>
                          <p className="text-xs text-gray-500">JSON Format • 56 KB</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
