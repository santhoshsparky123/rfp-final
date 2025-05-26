from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.tools import Tool
import google.generativeai as genai
import os
import uuid
from .extract_rfp_structure import process_document   

class vector_the_documents:
    """RAG tool for retrieving information from company documents"""
    
    def __init__(self, vector_store_path=None):
        # Load the model
        self.embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')
        self.llm = genai.GenerativeModel("gemini-1.5-flash")
        # self.embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY)
        self.vector_store = None
        if vector_store_path and os.path.exists(vector_store_path):
            self.vector_store = FAISS.load_local(vector_store_path, self.embeddings, allow_dangerous_deserialization=True)
    
    def ingest_documents(self, file_paths):
        """Process and index company documents"""
        all_chunks = []
        for file_path in file_paths:
            chunks = process_document(file_path)
            all_chunks.extend(chunks)
        
        # Create vector store
        if not all_chunks:
            return False

        store_id = f"vector_stores/company_docs_{file_paths[0].split('/')[-1].split('.')[0]}_{uuid.uuid4()}"
        
        self.vector_store = FAISS.from_documents(all_chunks, self.embeddings)
        self.vector_store.save_local(store_id)
        return store_id
