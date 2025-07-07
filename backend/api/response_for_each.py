from fastapi import APIRouter, HTTPException, Body
# from langchain_community.chat_models import ChatGroq
from langchain.agents import initialize_agent
from langchain.agents.agent_types import AgentType
from agents.tools.company_doc_tool import get_company_qa_tool
from agents.tools.wikipedia_tool import WikipediaTool
from agents.tools.fall_back_tool import FallbackLLMTool
import asyncio
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from methods.functions import Depends,require_role,Session,get_db
from models.schema import User,UserRole, Employee, Company

load_dotenv()
router = APIRouter(prefix="/api", tags=["RFP"])

# Set Groq API key as env variable or securely load from vault
# os.environ["GROQ_API_KEY"] = "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"

@router.post("/generate-response", response_model=dict)
async def generate_response(
    json_data: dict = Body(...),
    # current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.EMPLOYEE])),
    db: Session = Depends(get_db)
):
    try:
        
        metadata = json_data["structured_data"]["metadata"]
        sections = json_data["structured_data"]["sections"]
        questions = json_data["structured_data"]["questions"]
        requirements = json_data["structured_data"]["requirements"]


        company_id = json_data["structured_data"]["company_id"]
        rfp_id = json_data["structured_data"]["rfp_id"]
        employee_id = json_data["structured_data"]["employee_id"]
        
        
        final_output = {
            "company_id": company_id,
            "rfp_id":rfp_id,
            "employee_id":employee_id,
            "metadata": metadata,
            "sections": [],
            "questions": [],
            "requirements": []
        }
        print(final_output)
        # if(current_user.role=="employee"):
        #     company_id = db.query(Employee).filter(Employee.company_id==current_user.id).first().company_id
        # else:
        #     company_id = db.query(Company).filter(Company.userid == current_user.id).first()

        CompanyDocTool = get_company_qa_tool(company_id)
        print(company_id)
        # Tools
        tools = [CompanyDocTool,FallbackLLMTool]

# Use Google Generative AI model
        llm = ChatGroq(model_name="llama-3.3-70b-versatile", groq_api_key = os.getenv("GROQ_API_KEY"))
        print("GROQ_API_KEY:", os.getenv("GROQ_API_KEY"))
        agent_executor = initialize_agent(
            tools,
            llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            handle_parsing_errors=True
        )

        for section in sections:
            print(f"Processing section: {section}")
            query = f"Answer this RFP section based on our docs: {section['title']} - {section['content']}"
            try:
                answer = agent_executor.run(query)
            except Exception as e:
                import requests
                if isinstance(e, requests.exceptions.ConnectionError):
                    answer = "Wikipedia lookup failed due to network error."
                else:
                    answer = f"Error occurred: {str(e)}"
            final_output["sections"].append({
                "id": section["id"],
                "title": section["title"],
                "parent_id": section["parent_id"],
                "content": section["content"],
                "answer": answer,
                "level": section["level"]
            })
            # await asyncio.sleep(5)

        for idx, question in enumerate(questions):
            print(f"Processing question: {question}")
            query = f"Answer this RFP question based on our docs: {question.get('title', '')} - {question.get('content', '')}"
            try:
                answer = await asyncio.wait_for(
                    asyncio.to_thread(agent_executor.run, query),
                    timeout=30  # seconds
                )
            except asyncio.TimeoutError:
                answer = "LLM timed out while answering this question."
            except Exception as e:
                answer = f"Error occurred: {str(e)}"

            final_output["questions"].append({
                "id": question["id"],
                "text": question["text"],
                "answer": answer,
                "section": question["section"],
                "type": question["type"],
                "response_format": question["response_format"],
                "word_limit": question["word_limit"],
                "related_requirements": question["related_requirements"],
            })
            # Stop after the first question
            break

        for req in requirements:
            print(f"Processing requirement: {req}")
            query = f"Does the company satisfy this requirement: {req['text']}?"
            evidence = agent_executor.run(query)
            satisfied = "yes" in evidence.lower() or "satisfied" in evidence.lower()

            final_output["requirements"].append({
                "id": req["id"],
                "text": req["text"],
                "section": req["section"],
                "category": req["category"],
                "mandatory": req["mandatory"],
                "related_questions": req["related_questions"],
                "satisfied": satisfied,
                "evidence": evidence
            })
            # await asyncio.sleep(5)

        print("Final output ready")
        print(final_output)
        return final_output

    except Exception as e:
        import traceback
        print("Exception in generate_response:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
