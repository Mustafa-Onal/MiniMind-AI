from fastapi import APIRouter, File, UploadFile
from app.schemas import StudyNotesResponse
from app.services.file_parser import extract_text_from_txt
from app.services.llm_service import generate_study_notes

router = APIRouter(prefix="/api", tags=["Analyze"])


@router.post("/analyze", response_model=StudyNotesResponse)
async def analyze_document(file: UploadFile = File(...)):
    text = await extract_text_from_txt(file)
    result = generate_study_notes(text)
    return StudyNotesResponse(
        filename=file.filename,
        summary=result["summary"],
        key_points=result["key_points"],
        questions=result["questions"],
    )