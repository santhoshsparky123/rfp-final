import { UploadForm } from "@/components/upload-form"
import { Features } from "@/components/features"
import { ProcessFlow } from "@/components/process-flow"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-purple-600 text-white p-2 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-file-text"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">RFP Processor</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
              Dashboard
            </a>
            <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
              Documents
            </a>
            <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
              Settings
            </a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
              RFP Document Processing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your RFP documents and let our AI-powered system extract, structure, and analyze the content.
            </p>
          </div>

          <UploadForm />

          <div className="mt-16">
            <ProcessFlow />
          </div>

          <div className="mt-16">
            <Features />
          </div>
        </div>
      </main>
    </div>
  )
}
