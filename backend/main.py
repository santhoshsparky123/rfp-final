import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from dotenv import load_dotenv
import google.generativeai as genai
from api import response_for_each, final_rfp, download_doc, authendication, all_company
# from api.super_admin import super_admin
from api.admin import admin
from api.user import user
from api.employee import employee
from api.all_company import router as company_router

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
os.makedirs("uploads", exist_ok=True)
os.makedirs("company_docs", exist_ok=True)
os.makedirs("outputs", exist_ok=True)
os.makedirs("vector_stores", exist_ok=True)


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
# app.include_router(final_rfp.router)
# app.include_router(download_doc.router)
# app.include_router(super_admin.router)
# app.include_router(authendication.router)
app.include_router(admin.router)
<<<<<<< HEAD
# app.include_router(all_company.router)
=======
app.include_router(employee.router)
>>>>>>> b9b0be69f9c63cefa9488cd5c9ce54f1df862f11
app.include_router(user.router)
app.include_router(company_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


