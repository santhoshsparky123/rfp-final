"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Edit, Eye, FileText, LinkIcon, FileDown } from "lucide-react"
import Link from "next/link"

// Mock data to simulate the backend response
const mockRfpData = {
  "metadata": {
    "title": "Website Redesign and Development",
    "issuer": "Acme Corporation",
    "issue_date": "May 16, 2025",
    "due_date": "May 30, 2025",
    "contact_info": {
      "name": "Jane Doe",
      "email": "jane.doe@acme-industries.com",
      "phone": null
    },
    "submission_requirements": [
      "Submit proposals in PDF format",
      "Email submission to jane.doe@acme-industries.com",
      "Subject Line: \"RFP Response - Website Redesign\""
    ]
  },
  "sections": [
    {
      "id": "section-1",
      "title": "Introduction",
      "parent_id": null,
      "content": "Acme Corporation is seeking proposals from qualified web development firms to redesign and develop its corporate website, aiming to improve user experience, enhance mobile responsiveness, and better showcase our services.",
      "level": 1
    },
    {
      "id": "section-2",
      "title": "Company Background",
      "parent_id": null,
      "content": "Acme Corporation is a global provider of industrial components, serving clients in over 30 countries. Our current website (www.acme-industries.com) was last updated in 2017 and no longer aligns with our brand identity or digital goals.",
      "level": 1
    },
    {
      "id": "section-3",
      "title": "Project Goals",
      "parent_id": null,
      "content": "Develop a modern, responsive, and accessible website. Improve site navigation and structure for better usability. Integrate with existing CRM and marketing platforms. Include CMS for internal content updates (WordPress preferred). Optimize for SEO and fast page loading times.",
      "level": 1
    },
    {
      "id": "section-4",
      "title": "Scope of Work",
      "parent_id": null,
      "content": "Design: UX/UI design with wireframes and prototypes. Development: Front-end and back-end development. Content Migration: Transfer and optimize existing content. Testing: Cross-browser and mobile compatibility testing. Launch: Live deployment and post-launch support.",
      "level": 1
    },
    {
      "id": "section-5",
      "title": "Proposal Requirements",
      "parent_id": null,
      "content": "Please include the following in your proposal: Company overview and relevant experience. Project team bios and roles. Detailed project approach and timeline. Portfolio of similar completed projects. Itemized cost breakdown. References (minimum of 2).",
      "level": 1
    },
    {
      "id": "section-6",
      "title": "Budget",
      "parent_id": null,
      "content": "The estimated budget for this project is $50,000 - $75,000. Proposals should include clear pricing and payment terms.",
      "level": 1
    },
    {
      "id": "section-7",
      "title": "Evaluation Criteria",
      "parent_id": null,
      "content": "Proposals will be evaluated based on: Experience and qualifications. Quality and relevance of portfolio. Proposed methodology and timeline. Cost-effectiveness. References and past client feedback.",
      "level": 1
    },
    {
      "id": "section-8",
      "title": "Timeline",
      "parent_id": null,
      "content": "RFP Issued: May 16, 2025. Deadline for Questions: May 23, 2025. Proposal Submission Due: May 30, 2025. Vendor Selection: June 10, 2025. Project Start Date: June 24, 2025.",
      "level": 1
    },
    {
      "id": "section-9",
      "title": "Submission Instructions",
      "parent_id": null,
      "content": "Submit proposals in PDF format via email to: Jane Doe, Marketing Director Email: jane.doe@acme-industries.com Subject Line: \"RFP Response - Website Redesign\"",
      "level": 1
    },
    {
      "id": "section-10",
      "title": "Questions",
      "parent_id": null,
      "content": "Any questions regarding this RFP must be submitted via email to the contact above by May 23, 2025. Answers will be shared with all interested parties.",
      "level": 1
    }
  ],
  "questions": [
    {
      "id": "q-1",
      "text": "Describe your company overview and relevant experience.",
      "section": "Proposal Requirements",
      "type": "experience",
      "response_format": "paragraph",
      "word_limit": null,
      "related_requirements": ["r-3"]
    },
    {
      "id": "q-2",
      "text": "Provide project team bios and roles.",
      "section": "Proposal Requirements",
      "type": "team",
      "response_format": "list",
      "word_limit": null,
      "related_requirements": []
    },
    {
      "id": "q-3",
      "text": "Detail your proposed project approach and timeline.",
      "section": "Proposal Requirements",
      "type": "project_management",
      "response_format": "paragraph_and_timeline",
      "word_limit": null,
      "related_requirements": ["r-5"]
    },
    {
      "id": "q-4",
      "text": "Provide a portfolio of similar completed projects.",
      "section": "Proposal Requirements",
      "type": "portfolio",
      "response_format": "list_of_projects",
      "word_limit": null,
      "related_requirements": ["r-4"]
    },
    {
      "id": "q-5",
      "text": "Include an itemized cost breakdown.",
      "section": "Proposal Requirements",
      "type": "cost",
      "response_format": "table",
      "word_limit": null,
      "related_requirements": ["r-6"]
    },
    {
      "id": "q-6",
      "text": "Provide a minimum of 2 references.",
      "section": "Proposal Requirements",
      "type": "references",
      "response_format": "list",
      "word_limit": null,
      "related_requirements": ["r-7"]
    },
    {
      "id": "q-7",
      "text": "Submit any questions regarding this RFP via email to Jane Doe by May 23, 2025.",
      "section": "Questions",
      "type": "inquiry",
      "response_format": "email",
      "word_limit": null,
      "related_requirements": []
    }
  ],
  "requirements": [
    {
      "id": "r-1",
      "text": "Develop a modern, responsive, and accessible website.",
      "section": "Project Goals",
      "category": "technical",
      "mandatory": true,
      "related_questions": []
    },
    {
      "id": "r-2",
      "text": "Improve site navigation and structure for better usability.",
      "section": "Project Goals",
      "category": "usability",
      "mandatory": true,
      "related_questions": []
    },
    {
      "id": "r-3",
      "text": "Integrate with existing CRM and marketing platforms.",
      "section": "Project Goals",
      "category": "integration",
      "mandatory": true,
      "related_questions": []
    },
    {
      "id": "r-4",
      "text": "Include CMS for internal content updates (WordPress preferred).",
      "section": "Project Goals",
      "category": "technical",
      "mandatory": true,
      "related_questions": []
    },
    {
      "id": "r-5",
      "text": "Optimize for SEO and fast page loading times.",
      "section": "Project Goals",
      "category": "technical",
      "mandatory": true,
      "related_questions": []
    },
    {
      "id": "r-6",
      "text": "Proposals should include clear pricing and payment terms.",
      "section": "Budget",
      "category": "financial",
      "mandatory": true,
      "related_questions": ["q-5"]
    },
    {
      "id": "r-7",
      "text": "Vendor must provide references (minimum of 2).",
      "section": "Proposal Requirements",
      "category": "vendor qualification",
      "mandatory": true,
      "related_questions": ["q-6"]
    }
  ]
}

export function ResultsView() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="sections">Sections</TabsTrigger>
        <TabsTrigger value="questions">Questions</TabsTrigger>
        <TabsTrigger value="requirements">Requirements</TabsTrigger>
        <TabsTrigger value="json">Raw JSON</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>RFP Overview</CardTitle>
            <CardDescription>Key information extracted from the document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Title</h3>
                <p className="mt-1 text-base">{mockRfpData.metadata.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Issuer</h3>
                <p className="mt-1 text-base">{mockRfpData.metadata.issuer}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Issue Date</h3>
                <p className="mt-1 text-base">{mockRfpData.metadata.issue_date}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                <p className="mt-1 text-base">{mockRfpData.metadata.due_date}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
              <div className="mt-1 space-y-1">
                <p className="text-base">{mockRfpData.metadata.contact_info.name}</p>
                <p className="text-base">{mockRfpData.metadata.contact_info.email}</p>
                <p className="text-base">{mockRfpData.metadata.contact_info.phone}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Submission Requirements</h3>
              <ul className="mt-1 list-disc list-inside space-y-1">
                {mockRfpData.metadata.submission_requirements.map((req, index) => (
                  <li key={index} className="text-base">
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{mockRfpData.sections.length}</div>
                  <p className="text-sm text-gray-500">Document sections identified</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{mockRfpData.questions.length}</div>
                  <p className="text-sm text-gray-500">Questions requiring responses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{mockRfpData.requirements.length}</div>
                  <p className="text-sm text-gray-500">Requirements identified</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mt-6">
              <Link href="/responses">
                <Button className="flex items-center">
                  <FileDown className="mr-2 h-4 w-4" />
                  Generate Responses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sections" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Document Sections</CardTitle>
            <CardDescription>Sections and subsections identified in the document</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRfpData.sections.map((section) => (
                <Collapsible
                  key={section.id}
                  open={expandedSections[section.id]}
                  onOpenChange={() => toggleSection(section.id)}
                  className={`border rounded-md ${section.level === 1 ? "bg-white" : "bg-gray-50 ml-6"}`}
                >
                  <div className="p-4">
                    <CollapsibleTrigger asChild>
                      <div className="flex justify-between items-center cursor-pointer">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-2" />
                          <h3 className="text-base font-medium">{section.title}</h3>
                        </div>
                        <Button variant="ghost" size="sm">
                          {expandedSections[section.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{section.content}</p>
                      <div className="flex mt-4 space-x-2">
                        <Badge variant="outline" className="text-xs">
                          Level {section.level}
                        </Badge>
                        {section.parent_id && (
                          <Badge variant="outline" className="text-xs">
                            Parent: {section.parent_id}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="questions" className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>Questions identified that require responses</CardDescription>
            </div>
            <Link href="/responses">
              <Button size="sm">
                <FileDown className="mr-2 h-4 w-4" />
                Generate Responses
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRfpData.questions.map((question) => (
                <Collapsible
                  key={question.id}
                  open={expandedSections[question.id]}
                  onOpenChange={() => toggleSection(question.id)}
                  className="border rounded-md bg-white"
                >
                  <div className="p-4">
                    <CollapsibleTrigger asChild>
                      <div className="flex justify-between items-center cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Badge className="mr-2 bg-purple-100 text-purple-800 hover:bg-purple-100">
                              {question.id}
                            </Badge>
                            <Badge variant="outline" className="mr-2">
                              {question.type}
                            </Badge>
                          </div>
                          <h3 className="text-base font-medium mt-2">{question.text}</h3>
                        </div>
                        <Button variant="ghost" size="sm">
                          {expandedSections[question.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500">Section</h4>
                          <p className="text-sm">{question.section}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-gray-500">Response Format</h4>
                          <p className="text-sm">{question.response_format}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-gray-500">Word Limit</h4>
                          <p className="text-sm">{question.word_limit || "None specified"}</p>
                        </div>
                      </div>

                      {question.related_requirements.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-2">Related Requirements</h4>
                          <div className="flex flex-wrap gap-2">
                            {question.related_requirements.map((reqId) => {
                              const requirement = mockRfpData.requirements.find((r) => r.id === reqId)
                              return (
                                <div key={reqId} className="flex items-center">
                                  <Badge variant="outline" className="flex items-center">
                                    <LinkIcon className="h-3 w-3 mr-1" />
                                    {reqId}
                                  </Badge>
                                  {requirement && (
                                    <div className="ml-2 text-xs text-gray-500 truncate max-w-[200px]">
                                      {requirement.text}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View in Context
                        </Button>
                        <Link href="/responses">
                          <Button size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Draft Response
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="requirements" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>Requirements identified in the document</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRfpData.requirements.map((requirement) => (
                <Collapsible
                  key={requirement.id}
                  open={expandedSections[requirement.id]}
                  onOpenChange={() => toggleSection(requirement.id)}
                  className="border rounded-md bg-white"
                >
                  <div className="p-4">
                    <CollapsibleTrigger asChild>
                      <div className="flex justify-between items-center cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100">{requirement.id}</Badge>
                            <Badge variant="outline" className="mr-2">
                              {requirement.category}
                            </Badge>
                            {requirement.mandatory && <Badge variant="destructive">Mandatory</Badge>}
                          </div>
                          <h3 className="text-base font-medium mt-2">{requirement.text}</h3>
                        </div>
                        <Button variant="ghost" size="sm">
                          {expandedSections[requirement.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500">Section</h4>
                          <p className="text-sm">{requirement.section}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-gray-500">Mandatory</h4>
                          <p className="text-sm">{requirement.mandatory ? "Yes" : "No"}</p>
                        </div>
                      </div>

                      {requirement.related_questions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-2">Related Questions</h4>
                          <div className="flex flex-wrap gap-2">
                            {requirement.related_questions.map((qId) => {
                              const question = mockRfpData.questions.find((q) => q.id === qId)
                              return (
                                <div key={qId} className="flex items-center">
                                  <Badge variant="outline" className="flex items-center">
                                    <LinkIcon className="h-3 w-3 mr-1" />
                                    {qId}
                                  </Badge>
                                  {question && (
                                    <div className="ml-2 text-xs text-gray-500 truncate max-w-[200px]">
                                      {question.text}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View in Context
                        </Button>
                        <Link href="/responses">
                          <Button size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Address Requirement
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="json" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Raw JSON Data</CardTitle>
            <CardDescription>Complete structured data extracted from the document</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[600px]">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap">{JSON.stringify(mockRfpData, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
