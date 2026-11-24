import io
from fastapi.testclient import TestClient
from app.main import app
from app.routes import analyze as analyze_route

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_txt_success(monkeypatch):
    def fake_generate_study_notes(text: str):
        return {
            "summary": "Kısa özet",
            "key_points": ["Madde 1", "Madde 2"],
            "questions": ["Soru 1", "Soru 2", "Soru 3", "Soru 4", "Soru 5"],
        }

    monkeypatch.setattr(analyze_route, "generate_study_notes", fake_generate_study_notes)

    sample_content = "Bu metin FastAPI ve yerel LLM doküman analiz akışını test etmek için hazırlanmıştır."
    files = {"file": ("notlar.txt", io.BytesIO(sample_content.encode("utf-8")), "text/plain")}

    response = client.post("/api/analyze", files=files)
    assert response.status_code == 200

    body = response.json()
    assert body["filename"] == "notlar.txt"
    assert body["summary"] == "Kısa özet"
    assert len(body["questions"]) == 5


def test_analyze_rejects_non_txt():
    files = {"file": ("notlar.pdf", io.BytesIO(b"fake pdf"), "application/pdf")}
    response = client.post("/api/analyze", files=files)
    assert response.status_code == 400