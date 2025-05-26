# from langchain_community.vectorstores import FAISS
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain.tools import Tool
# import google.generativeai as genai

# # Step 2: Embeddings
# embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

# # Step 3: Load FAISS vector store
# company_vector = FAISS.load_local(
#     "vector_stores/company_docs_NeuroBit_Company_Profile_f1b10feb-be1b-4712-b7d8-3922cf7cdb2a",
#     embeddings,
#     allow_dangerous_deserialization=True
# )

# # Step 4: Gemini LLM setup
# llm = genai.GenerativeModel("gemini-1.5-flash")

# # Step 5: Define function to search + query LLM manually
# def company_doc_tool_func(query: str) -> str:
#     print("hello2")
#     # 1. Get top context documents
#     docs = company_vector.similarity_search(query, k=5)
#     context = "\n\n".join(doc.page_content for doc in docs)

#     # 2. Prepare prompt for Gemini
#     prompt = f"""
# You are an assistant answering company-related queries.

# Context:
# {context}

# Question:
# {query}

# Answer based strictly on the context above.
# """

#     # 3. Generate response using Gemini
#     response = llm.generate_content(prompt)
#     return response.text

# # Step 6: Define LangChain Tool
# CompanyDocTool = Tool(
#     name="CompanyDocTool",
#     func=company_doc_tool_func,
#     description="Useful for answering questions about company-related topics."
# )

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.tools import Tool
from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_community.chat_models import ChatGroq
from langchain_groq import ChatGroq

from dotenv import load_dotenv

load_dotenv()
# Embeddings
embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

# Load vector store
company_vector = FAISS.load_local(
    "vector_stores/company_docs_NeuroBit_Company_Profile_f1b10feb-be1b-4712-b7d8-3922cf7cdb2a",
    embeddings,
    allow_dangerous_deserialization=True
)

# Gemini via LangChain wrapper
llm = ChatGroq(model="llama-3.3-70b-versatile")

# Retrieval chain
company_qa = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=company_vector.as_retriever(),
    chain_type="stuff"
)

# Tool for company-related queries
CompanyDocTool = Tool(
    name="CompanyDocTool",
    func=company_qa.run,
    description="Useful for answering questions about company-related topics."
)

