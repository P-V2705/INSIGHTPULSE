# SentimentAI Platform
### Advanced AI-Powered Customer Sentiment Analysis System

[![CI](https://github.com/P-V2705/INSIGHTPULSE/actions/workflows/ci.yml/badge.svg)](https://github.com/P-V2705/INSIGHTPULSE/actions)
[![Netlify Status](https://api.netlify.com/api/v1/badges/insightpulseanalysis/deploy-status)](https://insightpulseanalysis.netlify.app)

---

## Live Demo
**Frontend:** [https://insightpulseanalysis.netlify.app](https://insightpulseanalysis.netlify.app)

> **Note:** The backend must be deployed separately (see instructions below).
> Once deployed, set `BACKEND_URL` in Netlify → Site Settings → Environment Variables.

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | React 18, Vite, Tailwind CSS, Recharts          |
| Backend      | Python 3.11, FastAPI, Uvicorn                   |
| NLP          | NLTK, TextBlob, scikit-learn                    |
| Export       | ReportLab (PDF), CSV, JSON                      |
| CI/CD        | GitHub Actions → Netlify (frontend auto-deploy) |
| Backend Host | Render (free tier — see deploy steps below)     |

---

## Architecture

```
Browser → https://insightpulseanalysis.netlify.app
              │
              │  /api/*  (Netlify proxy redirect)
              ▼
         FastAPI backend on Render
         https://sentimentai-backend.onrender.com
```

The frontend always calls `/api/...` (relative URL).  
Netlify's `netlify.toml` proxy forwards those requests to your Render backend.  
No backend URL is hardcoded in the JS bundle.

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

## Full Deployment Guide

### Step 1 — Deploy Backend to Render (free)

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo: `P-V2705/INSIGHTPULSE`
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt && python download_nltk.py`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3
4. Click **Create Web Service**
5. Wait for deployment — copy the URL, e.g. `https://sentimentai-backend.onrender.com`

> Alternatively, Render auto-detects `render.yaml` at the repo root for one-click deploy.

---

### Step 2 — Connect Backend to Netlify

Go to **Netlify → insightpulseanalysis → Site configuration → Environment variables** and add:

| Variable | Value |
|---|---|
| `BACKEND_URL` | `https://sentimentai-backend.onrender.com` (your Render URL, no trailing slash) |

Then **trigger a redeploy** (Deploys → Trigger deploy → Deploy site).

The `netlify.toml` proxy rule will now forward all `/api/*` requests to your backend:
```toml
[[redirects]]
  from   = "/api/*"
  to     = ":BACKEND_URL/api/:splat"
  status = 200
  force  = true
```

---

### Step 3 — GitHub Secrets (for CI/CD auto-deploy)

Go to **GitHub repo → Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|---|---|
| `NETLIFY_AUTH_TOKEN` | Netlify → User Settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | Netlify → Site → Site configuration → Site ID |

---

## Features

- **File upload** — CSV, Excel, JSON, PDF, Word, TXT, TSV — no size limit
- **Full NLP pipeline** — tokenization, lemmatization, VADER + TextBlob sentiment
- **Emotion detection** — 8 emotion categories
- **Keyword extraction** — TF-IDF top terms
- **Topic modeling** — KMeans clustering
- **AI consultation** — structured headline + insight + action + flags
- **Quality prediction** — Excellent / Good / Average / Poor / Bad
- **Fake review detection** — heuristic suspicion scoring
- **Category breakdown** — per-category sentiment chart
- **Interactive dashboard** — pie, bar, line, rating, category charts + keyword cloud
- **PDF + CSV + JSON export**
- **Mobile-responsive** — full hamburger nav on small screens

---

## Project Structure

```
sentiment-ai-platform/
├── render.yaml                 # One-click Render backend deploy
├── netlify.toml                # Netlify build + /api/* proxy
├── .github/workflows/
│   ├── ci.yml                  # Build + lint on every push
│   └── deploy.yml              # Auto-deploy frontend to Netlify on main
├── backend/
│   ├── Procfile                # Render/Heroku start command
│   ├── runtime.txt             # Python 3.11
│   ├── core/config.py
│   ├── routers/                # upload, analysis, dashboard, export
│   ├── services/               # nlp_engine, analysis_engine, dataset_processor, export_service
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/              # HomePage, UploadPage, AnalysisPage, DashboardPage
│   │   ├── components/         # Navbar (with mobile menu)
│   │   ├── context/            # AppContext
│   │   └── utils/api.js        # All axios calls — always uses relative /api path
│   ├── vite.config.js          # Dev proxy: /api → localhost:8000
│   └── tailwind.config.js
└── README.md
```
