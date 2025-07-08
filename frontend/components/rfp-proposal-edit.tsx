import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input component
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RFPProposalEditProps {
  rfpId: number;
  token: string;
  pdfUrl: string;
  filename: string; // This is correctly defined here
  onFinal: (result: string) => void;
  generatedResponse?: any;
}

// Helper to split text into sections by headings (e.g., markdown #, ##, or numbered)
function splitSections(text: string): { title: string; content: string }[] {
  const sectionRegex = /(^#+ .+|^\d+\..+|^\*\*.+\*\*.*$)/gm;
  const matches = [...text.matchAll(sectionRegex)];
  if (!matches.length) return [{ title: "Full Text", content: text }];
  const sections = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index!;
    const end = matches[i + 1]?.index ?? text.length;
    const title = matches[i][0].replace(/^#+\s*/, "").replace(/^\*\*|\*\*$/g, "").trim();
    const content = text.slice(start, end).trim();
    sections.push({ title, content });
  }
  return sections;
}

const RFPProposalEdit: React.FC<RFPProposalEditProps> = ({ rfpId, token, pdfUrl, filename, onFinal, generatedResponse }) => {
  const [mode, setMode] = useState<'generated' | 'extracted' | null>(null);
  const [sections, setSections] = useState<{ title: string; content: string }[]>([]);
  const [originalSections, setOriginalSections] = useState<{ title: string; content: string }[]>([]);
  const [sectionEdits, setSectionEdits] = useState<string[]>([]);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [llmResult, setLlmResult] = useState<string | null>(null);
  const [finalLoading, setFinalLoading] = useState(false);
  const [finalError, setFinalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>(""); // New state for custom prompt

  // Fetch both generated response and extracted text
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // If generatedResponse prop is provided, use it directly
        if (generatedResponse) {
          const split = splitSections(generatedResponse);
          setSections(split);
          setOriginalSections(split);
          setSectionEdits(split.map(s => s.content));
          setMode('generated');
          setLoading(false);
          return;
        }
        // Try to fetch generated response
        const genRes = await fetch(`http://localhost:8000/api/employee/rfps/${rfpId}/response`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (genRes.ok) {
          const data = await genRes.json();
          if (data.response) {
            const split = splitSections(data.response);
            setSections(split);
            setOriginalSections(split);
            setSectionEdits(split.map(s => s.content));
            setMode('generated');
            setLoading(false);
            return;
          }
        }
        // If no generated response, fetch extracted text
        const extRes = await fetch(`http://localhost:8000/api/employee/rfps/${rfpId}/extract-file-text`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!extRes.ok) {
          const data = await extRes.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to extract file text");
        }
        const data = await extRes.json();
        const split = splitSections(data.text || "");
        setSections(split);
        setOriginalSections(split);
        setSectionEdits(split.map(s => s.content));
        setMode('extracted');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [rfpId, token, generatedResponse]);

  // Handle per-section edit
  const handleSectionEdit = (idx: number, value: string) => {
    setSectionEdits(edits => edits.map((e, i) => (i === idx ? value : e)));
  };

  // Save all edits (recombine sections)
  const handleSave = () => {
    setSections(sections.map((s, i) => ({ ...s, content: sectionEdits[i] })));
    setLlmResult(null);
  };

  // LLM correction for all sections with custom prompt
  const handleLLM = async () => {
    setLlmLoading(true);
    setLlmError(null);
    setLlmResult(null);

    try {
      
      const combined = sections.map((s, i) => sectionEdits[i]).join("\n\n");
      // Use customPrompt if provided, otherwise a default instruction
      const promptToSend = customPrompt || "Refine and improve the following text for clarity and conciseness.";

      const formData = new FormData();

      
      formData.append('text', combined); // Append the edited text
      formData.append("changes",promptToSend);
      console.log(formData.get('text'))
      const res = await fetch(`http://localhost:8000/api/employee/final_rfp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to get LLM response");
      }
      const data = await res.json();
      setLlmResult(data.result || "No response");
    } catch (err: any) {
      setLlmError(err.message);
    } finally {
      setLlmLoading(false);
    }
  };

  // Final process (save to backend)
  const handleFinalProcess = async () => {
    setFinalLoading(true);
    setFinalError(null);
    try {
      const proposal = llmResult || sections.map((s, i) => sectionEdits[i]).join("\n\n");
      const formData = new FormData();

      console.log(rfpId)
      formData.append('text', proposal); // Append the edited text
      formData.append("rfp_id",rfpId.toString());

      const res = await fetch(`http://localhost:8000/api/employee/ok`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type': 'application/json', // REMOVE this line when sending FormData
        },
        body: formData, // Send as FormData
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to generate final proposal");
      }
      const data = await res.json();
      onFinal(data.result || "Final proposal generated, but no result returned.");
    } catch (err: any) {
      setFinalError(err.message);
    } finally {
      setFinalLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {mode === 'generated' ? 'Edit Generated Response' : 'Edit Extracted RFP Text'}
      </h2>
      <div className="mb-4">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="RFP PDF Preview"
            width="100%"
            height="500px"
            style={{ border: "1px solid #ccc", borderRadius: 8 }}
          />
        ) : null}
      </div>
      <div>
        {/* Show the combined response in a single box */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Response Data</label>
          <textarea
            className="w-full min-h-[180px] border rounded p-2 text-sm bg-gray-50 mb-2"
            value={llmResult || sectionEdits.join("\n\n")}
            readOnly
          />
        </div>
        {/* Prompt box and LLM/Update buttons */}
        <div className="mb-4">
          <label htmlFor="prompt-box" className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
          <Input
            id="prompt-box"
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            className="w-full mb-2"
            disabled={llmLoading}
          />
          <div className="flex gap-2">
            <Button onClick={handleLLM} disabled={llmLoading || !customPrompt}>
              {llmLoading ? "LLM..." : "LLM"}
            </Button>
            <Button onClick={handleFinalProcess} disabled={finalLoading || !!finalError} className="bg-green-600 hover:bg-green-700 text-white rounded-xl">
              {finalLoading ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
        {/* Error/Result Alerts */}
        {llmError && (
          <Alert variant="destructive" className="mt-2"><AlertDescription>{llmError}</AlertDescription></Alert>
        )}
        {llmResult && (
          <Alert className="mt-2"><AlertDescription>{llmResult}</AlertDescription></Alert>
        )}
      </div>
    </div>
  );
};

export default RFPProposalEdit;