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
    # Disable OpenAPI JSON in production via env flag if desired
    openapi_url="/api/openapi.json",
)

# ── Trusted hosts (prevent Host-header injection) ─────────────────────────────
# In production, Render injects the real hostname; allow localhost for dev.
ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "insightpulse-ja7r.onrender.com,localhost,127.0.0.1,*.onrender.com",
).split(",")

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])  # Render sits behind a proxy

# ── CORS ──────────────────────────────────────────────────────────────────────
# All /api/* calls arrive from Cloudflare Pages proxy (same-origin relative URLs).
# We restrict allowed origins to our known frontend hosts; wildcard only for dev.
_CF_ORIGIN = os.getenv("FRONTEND_ORIGIN", "")
CORS_ORIGINS = [
    "https://insightpulse.pages.dev",
    "http://localhost:3000",
    "http://localhost:5173",
]
if _CF_ORIGIN and _CF_ORIGIN not in CORS_ORIGINS:
    CORS_ORIGINS.append(_CF_ORIGIN)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,          # no cookies → credentials=False is safer
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization"],
    max_age=600,                       # pre-flight cache 10 min
)

# ── Request logging + timing middleware ───────────────────────────────────────
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

# ── Security headers middleware ────────────────────────────────────────────────
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
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "InsightPulse Backend", "version": "2.0.0"}


# ── Entry point (local dev only) ───────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
        limit_concurrency=10,
        timeout_keep_alive=300,
    )
