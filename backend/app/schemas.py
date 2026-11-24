from pydantic import BaseModel, Field


class StudyNotesResponse(BaseModel):
    filename: str
    summary: str = Field(..., description="Metnin kısa özeti")
    key_points: list[str] = Field(..., description="Önemli maddeler")
    questions: list[str] = Field(..., description="Metinden çıkarılan 5 soru")