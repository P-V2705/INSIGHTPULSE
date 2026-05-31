"""
Upload router — streams large files to disk in chunks, no size cap.
Supports CSV, Excel, JSON.  Provides a pre-flight /info endpoint so
the frontend can validate extension before sending bytes.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
import uuid
import os
import asyncio
from pathlib import Path

from core.config import settings
from services.dataset_processor import (
    load_dataset, detect_columns, clean_dataset,
    get_dataset_summary, get_large_file_summary,
)

router = APIRouter()

# In-memory session store (swap for Redis in production)
_sessions: dict = {}


# ── Pre-flight check ──────────────────────────────────────────────────────────
@router.get("/info")
async def upload_info(filename: str = Query(...)):
    """
    Validate file extension before the client sends any bytes.
    Returns allowed status and the list of accepted extensions.
    """
    ext = Path(filename).suffix.lower()
    allowed = ext in settings.ALLOWED_EXTENSIONS
    return {
        "filename": filename,
        "extension": ext,
        "allowed": allowed,
        "accepted_extensions": settings.ALLOWED_EXTENSIONS,
        "max_file_size": "unlimited",
    }


# ── Main upload endpoint ──────────────────────────────────────────────────────
@router.post("/file")
async def upload_file(file: UploadFile = File(...)):
    """
    Stream-upload a dataset file of any size.
    The file is written to disk in 8 MB chunks so memory stays flat
    regardless of file size.
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{ext}'. "
                f"Allowed: {settings.ALLOWED_EXTENSIONS}"
            ),
        )

    session_id = str(uuid.uuid4())
    save_path = settings.UPLOAD_DIR / f"{session_id}{ext}"
    bytes_written = 0

    # ── Stream to disk in chunks ──────────────────────────────────────────────
    try:
        with open(save_path, "wb") as out:
            while True:
                chunk = await file.read(settings.UPLOAD_CHUNK_SIZE)
                if not chunk:
                    break
                out.write(chunk)
                bytes_written += len(chunk)
    except Exception as e:
        if save_path.exists():
            os.remove(save_path)
        raise HTTPException(status_code=500, detail=f"File write failed: {e}")

    # ── Inspect dataset ───────────────────────────────────────────────────────
    try:
        file_size_mb = bytes_written / (1024 * 1024)

        # For very large files use the memory-efficient summary path
        if file_size_mb > 200:
            df_head, detected, summary = get_large_file_summary(str(save_path), ext)
        else:
            df = load_dataset(str(save_path))
            detected = detect_columns(df)
            review_col = detected["review_column"]
            rating_col = detected["rating_column"]

            if review_col:
                df_clean = clean_dataset(df, review_col, rating_col)
                summary = get_dataset_summary(df_clean, review_col, rating_col)
            else:
                summary = {
                    "total_rows": int(len(df)),
                    "total_columns": int(len(df.columns)),
                    "columns": list(df.columns),
                    "preview": df.head(5).fillna("").astype(str).to_dict(orient="records"),
                }

        summary["file_size_bytes"] = bytes_written
        summary["file_size_mb"] = round(file_size_mb, 2)

        _sessions[session_id] = {
            "file_path": str(save_path),
            "filename": file.filename,
            "file_size_bytes": bytes_written,
            "detected": detected,
            "summary": summary,
        }

        return JSONResponse({
            "session_id": session_id,
            "filename": file.filename,
            "file_size_bytes": bytes_written,
            "file_size_mb": round(file_size_mb, 2),
            "detected_columns": detected,
            "summary": summary,
            "status": "uploaded",
        })

    except Exception as e:
        if save_path.exists():
            os.remove(save_path)
        raise HTTPException(status_code=422, detail=f"Failed to inspect file: {e}")


# ── Session helpers ───────────────────────────────────────────────────────────
@router.get("/session/{session_id}")
async def get_session(session_id: str):
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    return _sessions[session_id]


@router.post("/configure/{session_id}")
async def configure_columns(
    session_id: str,
    review_column: str,
    rating_column: str = None,
):
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    _sessions[session_id]["detected"]["review_column"] = review_column
    _sessions[session_id]["detected"]["rating_column"] = rating_column
    return {"status": "updated", "review_column": review_column, "rating_column": rating_column}


def get_session_data(session_id: str) -> dict:
    return _sessions.get(session_id)
