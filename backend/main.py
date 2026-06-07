import os
import time
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from routers import upload, analysis, dashboard, export
from core.config import settings

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("insightpulse")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="InsightPulse API",
    description="Advanced AI-Powered Customer Sentiment Analysis Engine",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── Trusted hosts ─────────────────────────────────────────────────────────────
# Allow all hosts — Render sits behind its own proxy which handles host validation.
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# ── CORS ──────────────────────────────────────────────────────────────────────
# All /api/* calls arrive from Netlify's proxy (same-origin — browser sends
# no cross-origin headers). We whitelist our known origins for direct API access
# (e.g. local dev, Netlify previews) and the production Netlify domain.
_EXTRA_ORIGIN = os.getenv("FRONTEND_ORIGIN", "")

CORS_ORIGINS = [
    # Production Netlify site
    "https://ana-pulse.netlify.app",
    # Local development
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
]

# Allow Netlify deploy-preview URLs dynamically
_NETLIFY_SUBDOMAIN = os.getenv("NETLIFY_SITE_SUBDOMAIN", "ana-pulse")

# Add any extra origin from env (custom domain, etc.)
if _EXTRA_ORIGIN and _EXTRA_ORIGIN not in CORS_ORIGINS:
    CORS_ORIGINS.append(_EXTRA_ORIGIN)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://deploy-preview-\d+--ana-pulse\.netlify\.app",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization", "X-Forwarded-Host"],
    max_age=600,
)

# ── Request logging middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %s  (%.1f ms)",
        request.method, request.url.path, response.status_code, elapsed,
    )
    return response

# ── Security headers middleware ───────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(upload.router,    prefix="/api/upload",    tags=["Dataset Upload"])
app.include_router(analysis.router,  prefix="/api/analysis",  tags=["NLP Analysis"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(export.router,    prefix="/api/export",    tags=["Export"])

# ── Root / Health ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message": "InsightPulse API",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/api/docs",
        "frontend": "https://ana-pulse.netlify.app",
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "InsightPulse Backend",
        "version": "2.0.0",
        "frontend": "https://ana-pulse.netlify.app",
    }


# ── Local dev entry point ─────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
        limit_concurrency=10,
        timeout_keep_alive=300,
    )
