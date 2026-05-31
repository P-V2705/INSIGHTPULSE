# SentimentAI Platform
### Advanced AI-Powered Customer Sentiment Analysis System

A full-stack enterprise-grade NLP intelligence platform for analyzing Kaggle review datasets.

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | React 18, Vite, Tailwind CSS, Recharts          |
| Backend      | Python, FastAPI, Uvicorn                        |
| NLP          | NLTK, TextBlob, spaCy, scikit-learn             |
| Visualization| Recharts (interactive), custom word cloud       |
| Export       | ReportLab (PDF), CSV                            |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Start Backend
```bash
# Double-click start_backend.bat  OR run manually:
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python setup_nltk.py
uvicorn main:app --reload --port 8000
```

### 2. Start Frontend
```bash
# Double-click start_frontend.bat  OR run manually:
cd frontend
npm run dev
```

### 3. Open App
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/api/docs

---

## Features

### NLP Pipeline
- Tokenization & stopword removal
- Lemmatization & stemming
- VADER + TextBlob ensemble sentiment
- Emotion detection (8 emotions)
- Keyword extraction (TF-IDF)
- Topic modeling (KMeans clustering)
- Extractive review summarization

### Analysis
- Positive / Negative / Neutral classification
- Confidence & trust scoring
- Product quality prediction (Excellent → Bad)
- Fake/suspicious review detection

### Dashboard
- Sentiment pie chart
- Emotion distribution bar chart
- Sentiment trend line chart
- Rating distribution chart
- Keyword word cloud
- Topic clusters
- Filterable review table with pagination

### Export
- PDF report (ReportLab)
- CSV results export
- JSON data export

---

## Supported Dataset Formats
- `.csv` — Kaggle CSV exports
- `.xlsx` / `.xls` — Excel files
- `.json` — JSON review arrays

## Supported Review Categories
Products · Movies · Perfumes · Grocery · Restaurants · Mobile Phones · Gadgets · Hotels · Apps · Services · General

---

## Project Structure
```
sentiment-ai-platform/
├── backend/
│   ├── main.py                  # FastAPI app entry
│   ├── requirements.txt
│   ├── setup_nltk.py
│   ├── core/
│   │   └── config.py
│   ├── routers/
│   │   ├── upload.py            # Dataset upload endpoints
│   │   ├── analysis.py          # NLP analysis endpoints
│   │   ├── dashboard.py         # Chart data endpoints
│   │   └── export.py            # PDF/CSV export endpoints
│   └── services/
│       ├── nlp_engine.py        # Core NLP functions
│       ├── dataset_processor.py # Data loading & cleaning
│       ├── analysis_engine.py   # Full pipeline orchestrator
│       └── export_service.py    # PDF/CSV generation
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── UploadPage.jsx
    │   │   ├── AnalysisPage.jsx
    │   │   └── DashboardPage.jsx
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── context/AppContext.jsx
    │   └── utils/api.js
    └── package.json
```
