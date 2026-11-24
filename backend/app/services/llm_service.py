import json
import ollama
from fastapi import HTTPException

DEFAULT_MODEL="gemma3:4b"

def generate_study_notes(text:str, model:str= DEFAULT_MODEL)->dict:
    promt=f"""Aşağıdaki metni analiz et ve YALNIZCA geçerli bir JSON nesnesi döndür.
Başka hiçbir açıklama yazma. Anahtarlar tam olarak şu şekilde olmalı:
{{
  "summary": "Metnin açık ve öz özeti",
  "key_points": ["Madde 1", "Madde 2", "Madde 3"],
  "questions": ["Soru 1", "Soru 2", "Soru 3", "Soru 4", "Soru 5"]
}}

Metin:
\"\"\"{text}\"\"\"
"""
    try:
        response=ollama.chat(
            model=model,
            messages=[{"role":"user","content":promt}],
            format="json",
            options={"temparature":0.2},
                              )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Ollama bağlantı hatası: {exc}")

    try:
        data = json.loads(response["message"]["content"])
    except (KeyError, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail="Model geçerli JSON döndürmedi.")

    return {
        "summary": str(data.get("summary", "")).strip(),
        "key_points": [str(item).strip() for item in data.get("key_points", []) if str(item).strip()],
        "questions": [str(item).strip() for item in data.get("questions", []) if str(item).strip()][:5],
    }
