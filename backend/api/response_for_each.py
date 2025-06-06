# from fastapi import APIRouter, HTTPException, BackgroundTasks, Form
# from langchain_google_genai import ChatGoogleGenerativeAI
# from pydantic_models.datatypes import RFP_STORE
# from langchain.agents import initialize_agent
# from agents.tools.company_doc_tool import CompanyDocTool
# from agents.tools.pricing_tool import PricingDocTool
# from agents.tools.wikipedia_tool import WikipediaTool
# from langchain.agents.agent_types import AgentType
# from agents.tools.fall_back_tool import FallbackLLMTool
# import asyncio

# router = APIRouter(prefix="/api", tags=["RFP"])
# @router.post("/generate-response", response_model=dict)
# async def generate_response(
#     json_data: dict,
# ):
    
#     try:
#         """Generate RFP response using the agent graph"""
#         if "rfp_id" not in json_data:
#             raise HTTPException(status_code=400, detail="RFP ID not found in structured data")
#         metadata = json_data["structured_data"]["metadata"]
#         sections = json_data["structured_data"]["sections"]
#         questions = json_data["structured_data"]["questions"]
#         requirements = json_data["structured_data"]["requirements"]
        
#         final_output = {
#             "rfp_id": json_data["rfp_id"],
#             "metadata": metadata,
#             "sections": [],
#             "questions": [],
#             "requirements": []
#         }

        
#         tools = [CompanyDocTool, PricingDocTool, WikipediaTool, FallbackLLMTool]
        
#         # Use the Gemini 1.5 Flash model via LangChain wrapper
#         llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
        
#         agent_executor = initialize_agent(
#             tools,
#             llm,
#             agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
#             verbose=True,
#         )
        
#         for section in sections:
#             print(f"Processing section: {section}")
#             query = f"Answer this RFP section based on our docs: {section['title']} - {section['content']}"
#             answer = agent_executor.run(query)

#             final_output["sections"].append({
#                 "id": section["id"],
#                 "title": section["title"],
#                 "parent_id": section["parent_id"],
#                 "content": section["content"],
#                 "answer": answer,
#                 "level": section["level"]
#             })
#             await asyncio.sleep(5)

#         for question in questions:
#             print(f"Processing question: {question}")
#             query = f"Answer this RFP question based on our docs: {question.get('title', '')} - {question.get('content', '')}"
#             answer = agent_executor.run(query)

#             final_output["questions"].append({
#                 "id": question["id"],
#                 "text": question["text"],
#                 "answer": answer,
#                 "section": question["section"],
#                 "type": question["type"],
#                 "response_format": question["response_format"],
#                 "word_limit": question["word_limit"],
#                 "related_requirements": question["related_requirements"],
#             })
#             await asyncio.sleep(5)
            
#         for req in requirements:
#             print(f"Processing requirement: {req}")
#             query = f"Does the company satisfy this requirement: {req['text']}?"
#             evidence = agent_executor.run(query)
#             satisfied = "yes" in evidence.lower() or "satisfied" in evidence.lower()

#             final_output["requirements"].append({
#                 "id": req["id"],
#                 "text": req["text"],
#                 "section": req["section"],
#                 "category": req["category"],
#                 "mandatory": req["mandatory"],
#                 "related_questions": req["related_questions"],
#                 "satisfied": satisfied,
#                 "evidence": evidence
#             })
#             await asyncio.sleep(5)
#         print("Final output ready")
#         return final_output
#     except Exception as e:
#         import traceback
#         print("Exception in generate_response:", traceback.format_exc())
#         raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

from fastapi import APIRouter, HTTPException
# from langchain_community.chat_models import ChatGroq
from langchain.agents import initialize_agent
from langchain.agents.agent_types import AgentType
from agents.tools.company_doc_tool import CompanyDocTool
from agents.tools.pricing_tool import PricingDocTool
#from agents.tools.wikipedia_tool import WikipediaTool
from agents.tools.fall_back_tool import FallbackLLMTool
import asyncio
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/api", tags=["RFP"])

# Set Groq API key as env variable or securely load from vault
# os.environ["GROQ_API_KEY"] = "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"

@router.post("/generate-response", response_model=dict)
async def generate_response(json_data: dict):
    try:
        if "rfp_id" not in json_data:
            raise HTTPException(status_code=400, detail="RFP ID not found in structured data")
        
        metadata = json_data["structured_data"]["metadata"]
        sections = json_data["structured_data"]["sections"]
        questions = json_data["structured_data"]["questions"]
        requirements = json_data["structured_data"]["requirements"]

        final_output = {
            "rfp_id": json_data["rfp_id"],
            "metadata": metadata,
            "sections": [],
            "questions": [],
            "requirements": []
        }

        # Tools
        tools = [CompanyDocTool, PricingDocTool, FallbackLLMTool]

# Use Google Generative AI model
        llm = ChatGroq(model="llama-3.3-70b-versatile")

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

        for question in questions:
            print(f"Processing question: {question}")
            query = f"Answer this RFP question based on our docs: {question.get('title', '')} - {question.get('content', '')}"
            answer = agent_executor.run(query)

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
            # await asyncio.sleep(5)

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
        return final_output

    except Exception as e:
        import traceback
        print("Exception in generate_response:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
