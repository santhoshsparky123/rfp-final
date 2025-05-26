from pydantic import BaseModel
from typing import Dict, Any

# Pydantic models
class RFPData(BaseModel):
    success: bool
    rfp_data: Dict[str, Any]

class ToolOutput(BaseModel):
    content: str
    source: str

class AgentResponse(BaseModel):
    rfp_id: str
    section_responses: Dict[str, str]
    full_proposal: str
    download_urls: Dict[str, str]

# Store for processed RFPs
RFP_STORE = {}
