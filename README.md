# InsightPulse
### Advanced AI-Powered Customer Sentiment Analysis System

[![CI](https://github.com/P-V2705/INSIGHTPULSE/actions/workflows/ci.yml/badge.svg)](https://github.com/P-V2705/INSIGHTPULSE/actions)
[![Deploy](https://github.com/P-V2705/INSIGHTPULSE/actions/workflows/deploy.yml/badge.svg)](https://github.com/P-V2705/INSIGHTPULSE/actions)

---

## Live Demo
**Frontend:** [https://insightpulse.pages.dev](https://insightpulse.pages.dev)  
**Backend API:** [https://insightpulse-ja7r.onrender.com/api/health](https://insightpulse-ja7r.onrender.com/api/health)

---

## Architecture

```
User Browser
     │
     ▼
Cloudflare Pages (insightpulse.pages.dev)
  React 18 + Vite SPA — global CDN edge delivery
     │
     │  /api/*  (_redirects proxy — transparent, no URL in JS bundle)
     ▼
Render (insightpulse-ja7r.onrender.com)
  FastAPI + Python 3.11 — NLTK / pandas / scikit-learn
```

The frontend always calls **relative `/api/...` paths**.  
Cloudflare Pages' `_redirects` file proxies those requests to the Render backend.  
No backend URL is ever baked into the JavaScript bundle.

---

## CI/CD Pipeline

```
Developer edits in Kiro
         │
         ▼  (auto_deploy.ps1 or manual git push)
  GitHub — P-V2705/INSIGHTPULSE
         │
         ├── CI workflow (ci.yml)   → frontend build + backend smoke test
         │
         └── CD workflow (deploy.yml) → Cloudflare Pages deploy
                  │
                  ▼
         https://insightpulse.pages.dev  ← live in ~60 seconds
```

---

## Tech Stack

| Layer        | Technology                                        |
|--------------|---------------------------------------------------|
| Frontend     | React 18, Vite 5, Tailwind CSS, Recharts          |
| Hosting      | Cloudflare Pages (global CDN)                     |
| Backend      | Python 3.11, FastAPI, Uvicorn                     |
| Backend Host | Render                                            |
| NLP          | NLTK, TextBlob, scikit-learn                      |
| Export       | ReportLab (PDF), CSV, JSON                        |
| CI/CD        | GitHub Actions → Cloudflare Pages (auto-deploy)   |

---

## Quick Start (Local Development)

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

The Vite dev proxy in `vite.config.js` forwards `/api/*` to `localhost:8000`.

---

## Production Deployment Guide

### Step 1 — Backend on Render (already configured)

The `render.yaml` file at the repo root configures the Render web service.  
If re-deploying from scratch:

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect `P-V2705/INSIGHTPULSE`
3. Root dir: `backend` | Build: `pip install -r requirements.txt && python download_nltk.py` | Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Copy the deployed URL (e.g. `https://insightpulse-ja7r.onrender.com`)

---

### Step 2 — Frontend on Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages**
2. Connect GitHub → select `P-V2705/INSIGHTPULSE`
3. Build settings:
   - **Framework preset:** None (custom)
   - **Root directory:** `frontend`
   - **Build command:** `npm install --legacy-peer-deps && npm run build`
   - **Build output directory:** `dist`
4. Environment variables (Production):
   - `NODE_VERSION` = `20`
   - `VITE_API_URL` = *(leave blank — production uses _redirects proxy)*
5. Click **Save and Deploy**

> The `_redirects` file in `frontend/public/` is automatically picked up by Cloudflare Pages and proxies `/api/*` to Render.

---

### Step 3 — GitHub Secrets (for CI/CD auto-deploy via GitHub Actions)

Go to **GitHub repo → Settings → Secrets and variables → Actions** and add:

| Secret | Where to find it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → **Edit Cloudflare Workers** template (add Pages permission) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → right sidebar when logged in |

> **VITE_API_URL** secret is no longer needed — the production build leaves it blank intentionally.

---

### Step 4 — Auto-deploy from Kiro

Run `auto_deploy.ps1` from the project root to stage, commit, push, and trigger the full pipeline:

```powershell
.\auto_deploy.ps1 -Message "feat: my change description"
```

Or just double-click it in Explorer (runs with default message).

---

## Custom Domain (optional)

1. Cloudflare Dashboard → Pages → insightpulse → **Custom domains** → **Set up a custom domain**
2. Enter your domain (e.g. `app.insightpulse.ai`)
3. Cloudflare auto-provisions SSL and configures DNS if your domain is on Cloudflare
4. Update `FRONTEND_ORIGIN` env var on Render to your custom domain for CORS

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
├── wrangler.toml                # Cloudflare Pages configuration
├── render.yaml                  # Render backend deploy config
├── auto_deploy.ps1              # Kiro → GitHub → Cloudflare one-click deploy
├── .github/workflows/
│   ├── ci.yml                   # Build + smoke test on every push/PR
│   └── deploy.yml               # Auto-deploy to Cloudflare Pages on main push
├── backend/
│   ├── Procfile                 # Render/Heroku start command
│   ├── runtime.txt              # Python 3.11
│   ├── core/config.py
│   ├── routers/                 # upload, analysis, dashboard, export
│   ├── services/                # nlp_engine, analysis_engine, dataset_processor, export_service
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── public/
    │   ├── _redirects           # Cloudflare Pages: /api/* proxy + SPA fallback
    │   └── _headers             # Security + cache headers
    ├── src/
    │   ├── pages/               # HomePage, UploadPage, AnalysisPage, DashboardPage
    │   ├── components/          # Navbar (with mobile menu)
    │   ├── context/             # AppContext
    │   └── utils/api.js         # All axios calls — always uses relative /api path
    ├── vite.config.js           # Dev proxy + production build config
    └── tailwind.config.js
```
