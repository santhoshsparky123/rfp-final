from fastapi import APIRouter, FastAPI
import google.generativeai as genai
from docx import Document
from datetime import datetime
import os

# Optional: for converting Word to PDF
from docx2pdf import convert  # You can replace this with another converter if needed

# Initialize FastAPI
app = FastAPI()

# Define API router
router = APIRouter(prefix="/api", tags=["RFP"])

@router.post("/final-rfp", response_model=dict)
def final_rfp(rfp_data: dict):
    """Generate the final proposal document for the RFP"""
    rfp_id = rfp_data.get("rfp_id")
    if not rfp_id:
        return {"error": "RFP ID is required"}

    # Generate content using Gemini
    llm = genai.GenerativeModel("gemini-1.5-flash")

    prompt = llm.generate_content(
        f"""
        You are an expert proposal writer. Compile the following question responses into a cohesive, professional
        proposal document that addresses the original RFP requirements.

        Format the proposal with appropriate sections, an executive summary, introduction, and conclusion.
        Ensure the document flows well and presents a compelling case for why our company should be selected.

        The final proposal should be in Markdown format with appropriate headings, bullet points, and formatting.

        rfp_data: {rfp_data}
        """
    )

    final_proposal_markdown = prompt.text  # or .content if that's the correct attribute

    # Generate Word and PDF documents from proposal
    file_paths = generate_proposal_document(rfp_id, {
        "title": "RFP Response",
        "final_proposal": final_proposal_markdown
    })

    return file_paths


def generate_proposal_document(rfp_id, responses):
    """Generate a Word document and PDF from proposal responses"""
    # Create Word document
    doc = Document()

    # Add title
    title = responses.get("title", "RFP Response")
    doc.add_heading(title, 0)

    # Add date
    doc.add_paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d')}")
    doc.add_paragraph("\n")

    # Add content from markdown
    final_proposal = responses.get("final_proposal", "")
    if final_proposal:
        # Split the markdown content by headings
        sections = final_proposal.split("## ")

        for i, section in enumerate(sections):
            if i == 0 and not section.startswith("#"):
                doc.add_paragraph(section)
                continue

            lines = section.split("\n", 1)
            if len(lines) > 0:
                heading = lines[0].strip()
                doc.add_heading(heading, level=2)

                if len(lines) > 1:
                    content = lines[1]
                    paragraphs = content.split("\n\n")
                    for para in paragraphs:
                        if para.strip():
                            if para.strip().startswith("- "):
                                bullet_items = para.split("- ")
                                for item in bullet_items:
                                    if item.strip():
                                        doc.add_paragraph(item.strip(), style='List Bullet')
                            else:
                                doc.add_paragraph(para.strip())
    else:
        # Add individual question responses
        for q_id, response in responses.items():
            if q_id != "final_proposal" and q_id != "title":
                doc.add_heading(f"Question {q_id}", level=2)
                doc.add_paragraph(response)

    # Ensure output folder exists
    os.makedirs("outputs", exist_ok=True)

    # File paths
    docx_path = f"outputs/{rfp_id}_proposal.docx"
    pdf_path = f"outputs/{rfp_id}_proposal.pdf"

    # Save Word document
    doc.save(docx_path)

    # Convert to PDF
    try:
        convert(docx_path, pdf_path)
    except Exception as e:
        print(f"Error converting to PDF: {e}")

    return {
        "docx": docx_path,
        "pdf": pdf_path if os.path.exists(pdf_path) else None
    }
