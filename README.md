# SentimentAI Platform
### Advanced AI-Powered Customer Sentiment Analysis System

[![CI](https://github.com/P-V2705/INSIGHTPULSE/actions/workflows/ci.yml/badge.svg)](https://github.com/P-V2705/INSIGHTPULSE/actions)
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_BADGE_ID/deploy-status)](https://app.netlify.com)

---

## Live Demo
**Live Demo:** `https://YOUR_SITE.netlify.app` ← update after deployment

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | React 18, Vite, Tailwind CSS, Recharts          |
| Backend      | Python 3.11+, FastAPI, Uvicorn                  |
| NLP          | NLTK, TextBlob, scikit-learn                    |
| Export       | ReportLab (PDF), CSV                            |
| CI/CD        | GitHub Actions → Netlify                        |

---

## Quick Start (Local)

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python download_nltk.py        # one-time NLTK data download
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev                    # http://localhost:3000
```

---

## GitHub + Netlify CI/CD Setup

### Step 1 — Push to GitHub
```bash
# Already done! Your repo is live at:
# https://github.com/P-V2705/INSIGHTPULSE
```

### Step 2 — Connect Netlify
1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
2. Select your GitHub repo
3. Netlify auto-detects `netlify.toml` — build settings are pre-configured
4. Set environment variable: `VITE_API_URL` = your deployed backend URL

### Step 3 — Add GitHub Secrets
Go to **GitHub repo → Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `NETLIFY_AUTH_TOKEN` | From Netlify → User Settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | From Netlify → Site → Site configuration → Site ID |
| `VITE_API_URL` | Your deployed backend URL (e.g. `https://your-api.railway.app`) |

### Step 4 — Auto-sync from Kiro IDE
The Kiro hook `auto-push-on-save` is already configured. Every time you save a source file in Kiro, it will:
1. Stage all changes (`git add -A`)
2. Commit with message `auto: sync changes from Kiro IDE`
3. Push to `origin main`
4. GitHub Actions CI runs automatically
5. Netlify deploys the new build

---

## Backend Deployment (Railway / Render / Fly.io)

The backend is a standard FastAPI app. Deploy it to any Python-compatible host:

### Railway (recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

### Render
1. New Web Service → connect GitHub repo
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt && python download_nltk.py`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## Features

- **Unlimited file upload** — CSV, Excel, JSON, any size
- **Full NLP pipeline** — tokenization, lemmatization, VADER + TextBlob sentiment
- **Emotion detection** — 8 emotion categories
- **Keyword extraction** — TF-IDF top terms
- **Topic modeling** — KMeans clustering
- **Concise AI consultation** — headline + insight + action + flags
- **Quality prediction** — Excellent / Good / Average / Poor / Bad
- **Fake review detection** — heuristic suspicion scoring
- **Interactive dashboard** — pie, bar, line, rating charts + keyword cloud
- **New Analysis flow** — reset and re-analyze without restarting
- **PDF + CSV export**

---

## Project Structure
```
sentiment-ai-platform/
├── .github/workflows/
│   ├── ci.yml          # Build + lint on every push
│   └── deploy.yml      # Auto-deploy to Netlify on main
├── backend/
│   ├── core/config.py
│   ├── routers/        # upload, analysis, dashboard, export
│   ├── services/       # nlp_engine, analysis_engine, dataset_processor, export_service
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/      # HomePage, UploadPage, AnalysisPage, DashboardPage
│   │   ├── components/ # Navbar
│   │   ├── context/    # AppContext (session + resetSession)
│   │   └── utils/      # api.js
│   ├── vite.config.js
│   └── netlify.toml    # ← Netlify reads this automatically
├── netlify.toml
└── README.md
```
