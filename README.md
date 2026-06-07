# InsightPulse
### Advanced AI-Powered Customer Sentiment Analysis System

[![CI](https://github.com/P-V2705/INSIGHTPULSE/actions/workflows/ci.yml/badge.svg)](https://github.com/P-V2705/INSIGHTPULSE/actions)
[![Netlify Status](https://api.netlify.com/api/v1/badges/3df6f028-cca6-4c87-952c-1ebac20409a9/deploy-status)](https://ana-pulse.netlify.app)

---

## Live Site
**Frontend:** [https://ana-pulse.netlify.app](https://ana-pulse.netlify.app)  
**Backend API:** [https://insightpulse-ja7r.onrender.com/api/health](https://insightpulse-ja7r.onrender.com/api/health)  
**API Docs:** [https://insightpulse-ja7r.onrender.com/api/docs](https://insightpulse-ja7r.onrender.com/api/docs)

---

## Architecture

```
User Browser
     │
     ▼
Netlify CDN  (ana-pulse.netlify.app)
  React 18 + Vite SPA — global CDN delivery
     │
     │  /api/*  (netlify.toml transparent proxy)
     ▼
Render  (insightpulse-ja7r.onrender.com)
  FastAPI + Python 3.11 — NLTK / pandas / scikit-learn
```

The frontend always calls **relative `/api/...` paths**.  
`netlify.toml` proxies those to Render with `status=200, force=true`.  
No backend URL is ever baked into the JavaScript bundle.

---

## CI/CD Pipeline: Kiro → GitHub → Netlify

```
Kiro IDE (edit + save)
         │
         │  auto_deploy.ps1  OR  Kiro hook "Auto Push on Save"
         ▼
  GitHub  (P-V2705/INSIGHTPULSE  /  branch: main)
         │
         ├─ CI workflow (ci.yml)        → frontend build + backend smoke test
         │
         └─ CD workflow (deploy.yml)    → Netlify production deploy
                  │
                  ▼
    https://ana-pulse.netlify.app   ← live in ~90 seconds
```

**Netlify Site ID:** `3df6f028-cca6-4c87-952c-1ebac20409a9`

---

## Tech Stack

| Layer        | Technology                                           |
|--------------|------------------------------------------------------|
| Frontend     | React 18, Vite 5, Tailwind CSS, Recharts             |
| Hosting      | Netlify (CDN + proxy + auto-deploy)                  |
| Backend      | Python 3.11, FastAPI, Uvicorn                        |
| Backend Host | Render                                               |
| NLP          | NLTK, TextBlob, scikit-learn                         |
| Export       | ReportLab (PDF), CSV, JSON                           |
| CI/CD        | GitHub Actions → Netlify (automatic on every push)   |

---

## Quick Start (Local)

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python download_nltk.py      # one-time NLTK data download
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev                  # http://localhost:3000
```

Vite's dev proxy in `vite.config.js` forwards `/api/*` to `localhost:8000`.

---

## Production Deployment

### GitHub Secrets Required

Go to **GitHub → P-V2705/INSIGHTPULSE → Settings → Secrets → Actions** and add:

| Secret | Value |
|---|---|
| `NETLIFY_AUTH_TOKEN` | Netlify → User Settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | `3df6f028-cca6-4c87-952c-1ebac20409a9` |
| `NETLIFY_BUILD_HOOK` | Netlify → ana-pulse → Site configuration → Build hooks → URL (optional backup trigger) |

### How deployment works

1. You save a file in Kiro
2. The **Auto Push on Save** Kiro hook (or `auto_deploy.ps1`) stages, commits, and pushes to GitHub
3. GitHub Actions runs `ci.yml` (build check) then `deploy.yml` (Netlify deploy)
4. `nwtgck/actions-netlify@v3` builds and deploys to production
5. Site is live at **https://ana-pulse.netlify.app** in ~90 seconds

### One-click deploy from Kiro

```powershell
.\auto_deploy.ps1 -Message "feat: my change"
```

---

## Project Structure

```
sentiment-ai-platform/
├── netlify.toml                 # Netlify build + /api/* proxy + headers
├── render.yaml                  # Render backend config
├── auto_deploy.ps1              # Kiro → GitHub → Netlify one-click deploy
├── .github/workflows/
│   ├── ci.yml                   # Build check + smoke test (push + PR)
│   └── deploy.yml               # Auto-deploy to Netlify on main push
├── .kiro/hooks/
│   ├── auto-push-on-save.json   # Auto-commit + push when any file is saved
│   └── deploy-now.json          # Manual deploy trigger button
├── backend/
│   ├── Procfile                 # Render start command
│   ├── runtime.txt              # Python 3.11
│   ├── core/config.py
│   ├── routers/                 # upload, analysis, dashboard, export
│   ├── services/                # nlp_engine, analysis_engine, dataset_processor, export_service
│   ├── main.py                  # FastAPI app + CORS + security headers
│   └── requirements.txt
└── frontend/
    ├── public/
    │   ├── _redirects           # Netlify: /api/* proxy + SPA fallback (backup)
    │   └── _headers             # Netlify: security + cache headers (backup)
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── context/
    │   └── utils/api.js         # All axios calls — relative /api/* only
    ├── .env.example
    ├── .npmrc                   # legacy-peer-deps=true
    ├── vite.config.js           # Dev proxy + production code splitting
    └── tailwind.config.js
```

---

## Features

- File upload — CSV, Excel, JSON, PDF, Word, TXT, TSV — no size limit
- Full NLP pipeline — VADER + TextBlob sentiment analysis
- Emotion detection — 8 emotion categories
- Keyword extraction — TF-IDF
- Topic modeling — KMeans clustering
- AI consultation — headline + insight + action items
- Quality prediction — Excellent / Good / Average / Poor / Bad
- Fake review detection — heuristic scoring
- Interactive dashboard — pie, bar, line, rating, category charts + keyword cloud
- PDF + CSV + JSON export
- Mobile-responsive UI
