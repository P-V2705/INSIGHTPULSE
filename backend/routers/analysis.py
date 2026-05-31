from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import asyncio

from services.analysis_engine import run_full_analysis
from routers.upload import get_session_data

router = APIRouter()

# Store analysis results in memory
_results: dict = {}
_status: dict = {}


class AnalysisRequest(BaseModel):
    session_id: str
    review_column: Optional[str] = None
    rating_column: Optional[str] = None
    max_rows: Optional[int] = 2000


@router.post("/run")
async def run_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """Start analysis for a session."""
    session = get_session_data(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a dataset first.")

    file_path = session["file_path"]
    review_col = request.review_column or session["detected"].get("review_column")
    rating_col = request.rating_column or session["detected"].get("rating_column")

    if not review_col:
        raise HTTPException(status_code=400, detail="No review column detected or specified.")

    _status[request.session_id] = {"status": "processing", "progress": 0}

    # Run in background
    background_tasks.add_task(
        _run_analysis_task,
        request.session_id, file_path, review_col, rating_col, request.max_rows
    )

    return {"status": "processing", "session_id": request.session_id, "message": "Analysis started."}


def _run_analysis_task(session_id: str, file_path: str, review_col: str,
                        rating_col: str, max_rows: int):
    try:
        _status[session_id] = {"status": "processing", "progress": 10}
        result = run_full_analysis(file_path, review_col, rating_col, max_rows)
        _results[session_id] = result
        _status[session_id] = {"status": "completed", "progress": 100}
    except Exception as e:
        _status[session_id] = {"status": "error", "error": str(e), "progress": 0}


@router.get("/status/{session_id}")
async def get_status(session_id: str):
    """Poll analysis status."""
    status = _status.get(session_id, {"status": "not_started"})
    return status


@router.get("/results/{session_id}")
async def get_results(session_id: str):
    """Get full analysis results."""
    if session_id not in _results:
        status = _status.get(session_id, {})
        if status.get("status") == "processing":
            raise HTTPException(status_code=202, detail="Analysis still in progress.")
        elif status.get("status") == "error":
            raise HTTPException(status_code=500, detail=status.get("error", "Analysis failed."))
        raise HTTPException(status_code=404, detail="No results found. Run analysis first.")

    return _results[session_id]


@router.get("/results/{session_id}/overview")
async def get_overview(session_id: str):
    """Get just the sentiment overview (lightweight)."""
    if session_id not in _results:
        raise HTTPException(status_code=404, detail="No results found.")
    r = _results[session_id]
    return {
        "sentiment_overview": r.get("sentiment_overview"),
        "quality_prediction": r.get("quality_prediction"),
        "emotion_distribution": r.get("emotion_distribution"),
    }


@router.post("/analyze-text")
async def analyze_single_text(text: str):
    """Analyze a single text snippet (quick demo)."""
    from services.nlp_engine import (
        vader_sentiment, textblob_sentiment, detect_emotions,
        detect_fake_reviews, predict_quality
    )
    vader = vader_sentiment(text)
    tb = textblob_sentiment(text)
    emotions = detect_emotions(text)
    fake = detect_fake_reviews(text, vader["compound"])
    quality = predict_quality(vader["compound"])

    return {
        "text": text[:500],
        "vader": vader,
        "textblob": tb,
        "emotions": emotions,
        "fake_detection": fake,
        "quality": quality,
    }
