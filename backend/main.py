from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from routers import upload, analysis, dashboard, export
from core.config import settings

app = FastAPI(
    title="InsightPulse API",
    description="Advanced AI-Powered Customer Sentiment Analysis Engine",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(upload.router,    prefix="/api/upload",    tags=["Dataset Upload"])
app.include_router(analysis.router,  prefix="/api/analysis",  tags=["NLP Analysis"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(export.router,    prefix="/api/export",    tags=["Export"])


# ── Root / Health ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "InsightPulse API", "version": "2.0.0", "status": "operational"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "InsightPulse Backend"}


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        limit_concurrency=10,
        timeout_keep_alive=300,
    )
