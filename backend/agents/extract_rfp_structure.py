from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, UnstructuredExcelLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import google.generativeai as genai
import json
from fastapi import HTTPException

# Document processing functions
def process_document(file_path):
    print("hello3")
    """Extract text and metadata from uploaded documents (PDF or DOCX)"""
    if file_path.endswith('.pdf'):
        loader = PyPDFLoader(file_path)
        documents = loader.load()
    elif file_path.endswith('.docx'):
        loader = Docx2txtLoader(file_path)
        documents = loader.load()
    elif file_path.endswith('.xlsx'):
        loader = UnstructuredExcelLoader(file_path)
        documents = loader.load()
    else:
        raise ValueError("Unsupported file format. Only PDF and DOCX are supported.")
    
    # Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = text_splitter.split_documents(documents)
    
    return chunks

def extract_rfp_structure(file_path):
    """Extract RFP structure and generate structured JSON data"""
    print("hello2")
    chunks = process_document(file_path)
    combined_text = " ".join([chunk.page_content for chunk in chunks])
    
    # Use the Gemini 1.5 Flash model
    llm = genai.GenerativeModel("gemini-1.5-flash")
    print("hello llm")
    # Using LLM to extract structured data from RFP
    prompt = (
        """
        You are an expert in analyzing RFP documents. Extract the structure and key information from the following RFP text and return it as structured JSON with the following format:

        {
          "metadata": {
            "title": "...",
            "issuer": "...",
            "issue_date": "...",
            "due_date": "...",
            "contact_info": {
              "name": "...",
              "email": "...",
              "phone": "..."
            },
            "submission_requirements": ["..."]
          },
          "sections": [
            {
              "id": "...",
              "title": "...",
              "parent_id": null or section ID,
              "content": "...",
              "level": 1 or 2
            }
          ],
          "questions": [
            {
              "id": "...",
              "text": "...",
              "section": "...",
              "type": "...",
              "response_format": "...",
              "word_limit": number or null,
              "related_requirements": ["..."]
            }
          ],
          "requirements": [
            {
              "id": "...",
              "text": "...",
              "section": "...",
              "category": "...",
              "mandatory": true/false,
              "related_questions": ["..."]
            }
          ]
        }

        RFP Text:
        """
        + combined_text +
        """

        Respond ONLY with the JSON data.
        """
    )


    # chain = prompt | llm
    # response = chain.invoke({"text": combined_text})
    response = llm.generate_content(prompt)
    print("hello by llm")
    # Extract JSON from response
    try:
        import re
        # Safely get the content from the response
        if hasattr(response, "candidates"):
            content = response.candidates[0].content.parts[0].text
        elif hasattr(response, "content"):
            content = response.content
        else:
            content = str(response)

        match = re.search(r"```json\s*(\{.*\})\s*```", content, re.DOTALL)
        if match:
            json_str = match.group(1)
        else:
            # Fallback: extract from first '{' to last '}'
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            if json_start == -1 or json_end == 0:
                raise ValueError("No JSON object found in LLM response.")
            json_str = content[json_start:json_end]
        structured_data = json.loads(json_str)
        return structured_data
    except Exception as e:
        print(f"Error extracting JSON: {e}")
        print(f"Response content: {getattr(response, 'content', str(response))}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Failed to extract RFP structure: {str(e)}")