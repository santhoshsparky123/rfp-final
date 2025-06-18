# # from langchain_community.vectorstores import FAISS
# # from langchain_huggingface import HuggingFaceEmbeddings
# # from langchain_community.tools import Tool
# # import google.generativeai as genai

# # # Step 2: Embeddings
# # embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

# # # Step 3: Load FAISS vector store
# # company_vector = FAISS.load_local(
# #     "vector_stores/company_docs_job-salary_8f7ed0f5-475f-4da0-ace3-b937064115ab",
# #     embeddings,
# #     allow_dangerous_deserialization=True
# # )

# # # Step 4: Gemini LLM setup
# # llm = genai.GenerativeModel("gemini-1.5-flash")

# # # Step 5: Define function to search + query LLM manually
# # def pricing_doc_tool_func(query: str) -> str:
# #     print("hello3")
# #     # 1. Get top context documents
# #     docs = company_vector.similarity_search(query, k=5)
# #     context = "\n\n".join(doc.page_content for doc in docs)

# #     # 2. Prepare prompt for Gemini
# #     prompt = f"""
# # You are an assistant answering company-related queries.

# # Context:
# # {context}

# # Question:
# # {query}

# # Answer based strictly on the context above.
# # """

# #     # 3. Generate response using Gemini
# #     response = llm.generate_content(prompt)
# #     return response.text

# # # Step 6: Define LangChain Tool
# # PricingDocTool = Tool(
# #     name="PricingDocTool",
# #     func=pricing_doc_tool_func,
# #     description="Useful for answering questions about cost, resource allocation, or pricing based on roles and durations."
# # )

# from langchain_community.vectorstores import FAISS
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain.chains import RetrievalQA
# from langchain.tools import Tool
# from langchain_google_genai import ChatGoogleGenerativeAI
# # from langchain_community.chat_models import ChatGroq
# from langchain_groq import ChatGroq
# import os
# from dotenv import load_dotenv

# load_dotenv()
# # Embeddings
# embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

# # Load vector store
# company_vector = FAISS.load_local(
#     "vector_stores/company_docs_job-salary_8f7ed0f5-475f-4da0-ace3-b937064115ab",
#     embeddings,
#     allow_dangerous_deserialization=True
# )

# # Gemini via LangChain wrapper
# llm = ChatGroq(model="llama-3.3-70b-versatile",groq_api_key =os.getenv("GROQ_API_KEY"))

# # Retrieval chain
# company_qa = RetrievalQA.from_chain_type(
#     llm=llm,
#     retriever=company_vector.as_retriever(),
#     chain_type="stuff"
# )

# # Tool
# PricingDocTool = Tool(
#     name="PricingDocTool",
#     func=company_qa.run,
#     description="Useful for answering questions about cost, resource allocation, or pricing based on roles and durations  make it neat and clear according to the company document there are some stars in side the result avoid that start if giving the timeline and cost give it in table format the format alignment need to be neat and clear the alignment must be neat and easy to read."
# )
