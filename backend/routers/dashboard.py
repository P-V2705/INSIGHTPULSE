from fastapi import APIRouter, HTTPException
from routers.analysis import _results

router = APIRouter()


@router.get("/{session_id}/charts")
async def get_chart_data(session_id: str):
    """Return all chart-ready data for the dashboard."""
    if session_id not in _results:
        raise HTTPException(status_code=404, detail="No analysis results found.")

    r = _results[session_id]
    overview = r.get("sentiment_overview", {})
    emotion_dist = r.get("emotion_distribution", {})
    keywords = r.get("keywords", [])
    trend = r.get("trend_data", [])
    rating_dist = r.get("rating_distribution", {})
    topics = r.get("topics", [])
    category_breakdown = r.get("category_breakdown", {})

    # Sentiment pie chart data
    sentiment_pie = {
        "labels": ["Positive", "Negative", "Neutral"],
        "values": [
            overview.get("positive_count", 0),
            overview.get("negative_count", 0),
            overview.get("neutral_count", 0),
        ],
        "percentages": [
            overview.get("positive_pct", 0),
            overview.get("negative_pct", 0),
            overview.get("neutral_pct", 0),
        ],
        "colors": ["#10b981", "#ef4444", "#f59e0b"],
    }

    # Emotion bar chart
    emotion_bar = {
        "labels": list(emotion_dist.keys()),
        "values": list(emotion_dist.values()),
        "colors": [
            "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6",
            "#06b6d4", "#10b981", "#f97316", "#ec4899"
        ],
    }

    # Keyword word cloud data
    word_cloud = [{"text": k["word"], "value": k["count"]} for k in keywords[:30]]

    # Trend line chart
    trend_chart = {
        "labels": [str(t["index"]) for t in trend],
        "sentiment_scores": [t["avg_sentiment"] for t in trend],
        "positive": [t["positive_count"] for t in trend],
        "negative": [t["negative_count"] for t in trend],
        "neutral": [t["neutral_count"] for t in trend],
    }

    # Rating distribution bar
    rating_chart = {
        "labels": list(rating_dist.keys()),
        "values": list(rating_dist.values()),
    }

    # Category comparison
    category_chart = {
        "labels": list(category_breakdown.keys())[:10],
        "avg_sentiments": [v["avg_sentiment"] for v in list(category_breakdown.values())[:10]],
        "counts": [v["count"] for v in list(category_breakdown.values())[:10]],
    }

    return {
        "sentiment_pie": sentiment_pie,
        "emotion_bar": emotion_bar,
        "word_cloud": word_cloud,
        "trend_chart": trend_chart,
        "rating_chart": rating_chart,
        "category_chart": category_chart,
        "topics": topics,
        "summary": r.get("summary"),
        "quality_prediction": r.get("quality_prediction"),
        "ai_summary": r.get("ai_summary"),
        "sentiment_overview": overview,
    }


@router.get("/{session_id}/reviews")
async def get_review_table(session_id: str, page: int = 1, page_size: int = 20,
                            sentiment: str = None, search: str = None):
    """Paginated, filterable review table."""
    if session_id not in _results:
        raise HTTPException(status_code=404, detail="No analysis results found.")

    samples = _results[session_id].get("review_samples", [])

    # Filter
    if sentiment:
        samples = [r for r in samples if r.get("sentiment", "").lower() == sentiment.lower()]
    if search:
        search_lower = search.lower()
        samples = [r for r in samples if search_lower in r.get("review_snippet", "").lower()]

    total = len(samples)
    start = (page - 1) * page_size
    end = start + page_size
    page_data = samples[start:end]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "reviews": page_data,
    }
