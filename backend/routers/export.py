from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from routers.analysis import _results
from services.export_service import generate_pdf_report, generate_csv_export

router = APIRouter()


@router.get("/{session_id}/pdf")
async def export_pdf(session_id: str):
    """Generate and download PDF report."""
    if session_id not in _results:
        raise HTTPException(status_code=404, detail="No analysis results found.")

    try:
        path = generate_pdf_report(_results[session_id])
        return FileResponse(
            path=path,
            media_type="application/pdf",
            filename="sentiment_analysis_report.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.get("/{session_id}/csv")
async def export_csv(session_id: str):
    """Export review results as CSV."""
    if session_id not in _results:
        raise HTTPException(status_code=404, detail="No analysis results found.")

    try:
        path = generate_csv_export(_results[session_id])
        if not path:
            raise HTTPException(status_code=404, detail="No review data to export.")
        return FileResponse(
            path=path,
            media_type="text/csv",
            filename="sentiment_results.csv"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV export failed: {str(e)}")


@router.get("/{session_id}/json")
async def export_json(session_id: str):
    """Export full analysis as JSON."""
    if session_id not in _results:
        raise HTTPException(status_code=404, detail="No analysis results found.")
    return _results[session_id]
