# MiniMind AI

A local document analysis tool powered by a React + Vite frontend and a FastAPI + Ollama (`gemma3:4b`) backend.

## Features

- **Three-Column Dark Interface:** Focus mode selection, live status cards, analysis history, and one-click Markdown copying.
- **Local LLM Processing:** Reads `.txt` files through the FastAPI (`/api/analyze`) endpoint and generates summaries, key points, and five study questions.
- **Testing Infrastructure:** Includes `pytest` support for backend testing.

## Interface Preview

![MiniMind AI Arayüzü](assets/arayuz.jpeg)

## Project Structure

```text
MiniMind-AI/
├── assets/
│   └── arayuz.jpeg
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── schemas.py
│   │   └── services/
│   ├── requirements.txt
│   └── tests/
│       ├── conftest.py
│       └── test_analyze.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── assets/
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── tests/
├── notlar.txt
├── .gitignore
└── README.md

## run

### Backend
```bash
cd backend
source ../.venv/bin/activate
PYTHONPATH=. uvicorn app.main:app --reload

### Frontend
cd frontend
npm install
npm run dev


