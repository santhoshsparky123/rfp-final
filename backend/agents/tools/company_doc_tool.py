# from langchain_community.vectorstores import FAISS
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain.chains import RetrievalQA
# from langchain.tools import Tool
# from langchain_google_genai import ChatGoogleGenerativeAI
# # from langchain_community.chat_models import ChatGroq
# from langchain_groq import ChatGroq

# from dotenv import load_dotenv

# load_dotenv()
# # Embeddings
# embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

# # Load vector store
# company_vector = FAISS.load_local(
#     "vector_stores/company_docs_NeuroBit_Company_Profile_f1b10feb-be1b-4712-b7d8-3922cf7cdb2a",
#     embeddings,
#     allow_dangerous_deserialization=True
# )

# # Gemini via LangChain wrapper
# llm = ChatGroq(model="llama-3.3-70b-versatile",groq_api_key = "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")

# # Retrieval chain
# company_qa = RetrievalQA.from_chain_type(
#     llm=llm,
#     retriever=company_vector.as_retriever(),
#     chain_type="stuff"
# )

# # Tool for company-related queries
# CompanyDocTool = Tool(
#     name="CompanyDocTool",
#     func=company_qa.run,
#     description="Useful for answering questions about company-related topics."
# )
import os
# from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import PGVector
from langchain.chains import RetrievalQA
from langchain.tools import Tool
from langchain_groq import ChatGroq
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()
raw_url = os.getenv("VECTOR_DATABASE_URL")
if not raw_url:
    raise ValueError("DATABASE_URL environment variable is not set")
PGVECTOR_CONNECTION_STRING = raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Load embeddings
embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

# LLM (Groq + LLaMA 3)
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    groq_api_key = "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"
)

def get_company_qa_tool(company_id: int) -> Tool:
    """Create a Tool that queries company-specific documents from PGVector."""
    vectorstore = PGVector(
        collection_name="company_docs",
        connection_string=PGVECTOR_CONNECTION_STRING,
        embedding_function=embeddings
    )

    retriever = vectorstore.as_retriever(search_kwargs={"filter": {"company_id": company_id}})
    
    company_qa = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff"
    )
    print("helloooooooooooooooooooooooooooooooooooooo")
    return Tool(
        name=f"CompanyDocTool-{company_id}",
        func=company_qa.run,
        description=f"Answer queries using only documents from company_id={company_id}."
    )


