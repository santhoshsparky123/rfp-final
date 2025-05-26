from langchain.tools import Tool
import google.generativeai as genai

llm = genai.GenerativeModel("gemini-1.5-flash")

FallbackLLMTool = Tool(
    name="FallbackLLMTool",
    func=lambda q: llm.generate_content(q).text,
    description="Use this if no tools return useful information. It generates an answer using LLM's general reasoning."
)