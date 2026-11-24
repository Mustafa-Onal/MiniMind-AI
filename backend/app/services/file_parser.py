from fastapi import HTTPException, UploadFile

async def extract_text_from_txt(file:UploadFile)->str:
    if not file.filename or not file.filename.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="yalnızca .txt dosyaları desteklenir.")
    raw_bytes=await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="yüklenen dosya boş.")
    try:
        text=raw_bytes.decode("utf-8").strip()
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Dosya Utf-8 formatında değil.")
    if len(text)<20:
        raise(HTTPException(status_code=400, detail="Analiz için metin çok kısa."))