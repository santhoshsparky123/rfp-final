import { apiRequest, uploadFile, uploadMultipleFiles, downloadFile } from "@/utils/api"

export interface RFPData {
  rfp_id: string
  structured_data: {
    metadata: any
    sections: any[]
    questions: any[]
    requirements: any[]
  }
}

export interface GeneratedResponse {
  rfp_id: string
  metadata: any
  sections: any[]
  questions: any[]
  requirements: any[]
}

export const rfpService = {
  // Upload RFP document
  async uploadRFP(file: File): Promise<RFPData> {
    return uploadFile("/api/upload-rfp/", file)
  },

  // Upload company documents
  async uploadCompanyDocs(files: FileList): Promise<{ message: string; vector_store_id: string }> {
    return uploadMultipleFiles("/api/upload-company-docs", files, "files")
  },

  // Generate AI response
  async generateResponse(rfpData: RFPData): Promise<GeneratedResponse> {
    return apiRequest("/api/generate-response", {
      method: "POST",
      body: JSON.stringify(rfpData),
    })
  },

  // Generate final proposal
  async generateFinalProposal(responseData: GeneratedResponse): Promise<{ docx: string; pdf: string }> {
    return apiRequest("/api/final-rfp", {
      method: "POST",
      body: JSON.stringify(responseData),
    })
  },

  // Download document
  async downloadDocument(rfpId: string, docType: "pdf" | "docx", filename: string): Promise<void> {
    return downloadFile(`/api/download-document/${rfpId}/${docType}`, filename)
  },

  // Check company docs status (you may need to implement this endpoint in backend)
  async checkCompanyDocs(): Promise<{
    exists: boolean
    count: number
    vector_store_id?: string
    last_updated?: string
  }> {
    try {
      return await apiRequest("/api/check-company-docs")
    } catch (error) {
      // Return default if endpoint doesn't exist
      return { exists: false, count: 0 }
    }
  },

  // Get company docs for workers (you may need to implement this endpoint in backend)
  async getCompanyDocs(): Promise<{ count: number; vector_store_id: string; last_updated: string }> {
    try {
      return await apiRequest("/api/get-company-docs")
    } catch (error) {
      // Return default if endpoint doesn't exist
      return { count: 0, vector_store_id: "default", last_updated: new Date().toISOString() }
    }
  },
}
