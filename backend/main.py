import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from dotenv import load_dotenv
import google.generativeai as genai
from api import response_for_each, final_rfp, authendication,upload_rfp
# from api.super_admin import super_admin
from api.admin import admin
from api.user import user
from api.employee.employee import router as employee_router
from api.all_company import router as company_router
from api.super_admin import super_admin
from api.fetch_username import router as fetch_username_router
from api.rfp_messages import router as rfp_messages_router
from api.employee.proposal_edit_llm import router as proposal_edit_llm_router
from api.pdf_url import router as pdf_url_router
# Initialize FastAPI app
app = FastAPI(title="RFP Response Agent API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
# os.makedirs("uploads", exist_ok=True)
# os.makedirs("company_docs", exist_ok=True)
# os.makedirs("outputs", exist_ok=True)
# os.makedirs("vector_stores", exist_ok=True)


# Load your .env
load_dotenv()

# Configure with your Gemini API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")
# Use the Gemini 1.5 Flash model
model = genai.GenerativeModel("gemini-1.5-flash")

# Make a request
response = model.generate_content("Explain LangChain in one sentence.")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": "1.0.0"}

# app.include_router(upload_company_docs.router)
app.include_router(response_for_each.router)
app.include_router(final_rfp.router)
# app.include_router(download_doc.router)
app.include_router(super_admin.router)
app.include_router(authendication.router)
app.include_router(admin.router)
app.include_router(employee_router)
app.include_router(user.router)
app.include_router(company_router)
app.include_router(upload_rfp.router)
app.include_router(fetch_username_router)
app.include_router(rfp_messages_router)
app.include_router(proposal_edit_llm_router)
app.include_router(pdf_url_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


