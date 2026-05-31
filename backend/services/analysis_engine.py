"""
Analysis Engine — orchestrates full NLP pipeline over a dataset,
returns structured results for the dashboard.
"""
import pandas as pd
import numpy as np
from typing import Optional
from collections import Counter

from services.nlp_engine import (
    vader_sentiment, textblob_sentiment, detect_emotions,
    extract_keywords, simple_topic_model, summarize_reviews,
    build_concise_summary, detect_fake_reviews, predict_quality, clean_text
)
from services.dataset_processor import (
    load_dataset, detect_columns, clean_dataset,
    get_dataset_summary, sample_for_analysis,
    sample_for_analysis_large,
)


def _to_native(obj):
    """Recursively convert numpy/pandas types to native Python types for JSON serialization."""
    if isinstance(obj, dict):
        return {k: _to_native(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_to_native(i) for i in obj]
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        return float(obj)
    elif isinstance(obj, (np.bool_,)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif pd.isna(obj) if not isinstance(obj, (list, dict, str, bool)) else False:
        return None
    return obj


def run_full_analysis(file_path: str, review_col: str = None,
                      rating_col: str = None, max_rows: int = 5000) -> dict:
    """
    Full analysis pipeline:
    1. Load & clean dataset (memory-efficient for large files)
    2. Run NLP on each review
    3. Aggregate results
    4. Generate insights
    """
    import os
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    is_large = file_size_mb > 200

    # --- Load ---
    if is_large:
        # Use reservoir sampling — never loads the full file into RAM
        from services.dataset_processor import get_large_file_summary
        from pathlib import Path
        ext = Path(file_path).suffix.lower()
        first_chunk, detected_auto, summary = get_large_file_summary(file_path, ext)
        detected = detected_auto
        if not review_col:
            review_col = detected["review_column"]
        if not rating_col:
            rating_col = detected["rating_column"]
        if not review_col:
            raise ValueError("Could not detect a review/text column in the dataset.")
        df_sample = sample_for_analysis_large(file_path, review_col, rating_col, max_rows)
    else:
        df = load_dataset(file_path)
        detected = detect_columns(df)
        if not review_col:
            review_col = detected["review_column"]
        if not rating_col:
            rating_col = detected["rating_column"]
        if not review_col:
            raise ValueError("Could not detect a review/text column in the dataset.")
        df = clean_dataset(df, review_col, rating_col)
        summary = get_dataset_summary(df, review_col, rating_col)
        df_sample = sample_for_analysis(df, max_rows)
    reviews = df_sample[review_col].tolist()

    # --- Per-review NLP ---
    results = []
    sentiment_labels = []
    compound_scores = []
    emotion_totals = {
        "joy": 0, "anger": 0, "sadness": 0, "fear": 0,
        "surprise": 0, "trust": 0, "anticipation": 0, "disgust": 0
    }
    fake_count = 0

    for i, review in enumerate(reviews):
        if not isinstance(review, str) or len(review.strip()) < 3:
            continue

        vader_res = vader_sentiment(review)
        tb_res = textblob_sentiment(review)
        emotions = detect_emotions(review)
        fake = detect_fake_reviews(review, vader_res["compound"])

        # Ensemble label (VADER primary, TextBlob secondary)
        compound = vader_res["compound"]
        compound_scores.append(compound)
        label = vader_res["label"]
        sentiment_labels.append(label)

        # Accumulate emotions
        for emo, val in emotions.items():
            emotion_totals[emo] = emotion_totals.get(emo, 0) + val

        if fake["is_suspicious"]:
            fake_count += 1

        row = {
            "index": i,
            "review_snippet": review[:200],
            "sentiment": label,
            "compound_score": vader_res["compound"],
            "confidence": vader_res["confidence"],
            "polarity": tb_res["polarity"],
            "subjectivity": tb_res["subjectivity"],
            "dominant_emotion": max(emotions, key=emotions.get),
            "is_suspicious": fake["is_suspicious"],
            "suspicion_score": fake["suspicion_score"],
        }

        if rating_col and rating_col in df_sample.columns:
            row["rating"] = df_sample[rating_col].iloc[i] if i < len(df_sample) else None

        results.append(row)

    # --- Aggregates ---
    total = len(results)
    if total == 0:
        raise ValueError("No valid reviews found after processing.")

    label_counts = Counter(sentiment_labels)
    pos_pct = round(label_counts.get("Positive", 0) / total * 100, 1)
    neg_pct = round(label_counts.get("Negative", 0) / total * 100, 1)
    neu_pct = round(label_counts.get("Neutral", 0) / total * 100, 1)

    avg_compound = round(np.mean(compound_scores), 4) if compound_scores else 0

    # Normalize emotion totals
    emo_total_sum = sum(emotion_totals.values()) or 1
    emotion_distribution = {k: round(v / emo_total_sum * 100, 1) for k, v in emotion_totals.items()}

    # --- Keywords ---
    keywords = extract_keywords(reviews, top_n=30)

    # --- Topics ---
    topics = simple_topic_model(reviews, n_topics=5)

    # --- Summary (concise structured consultation) ---
    dominant_emotion = max(emotion_distribution, key=emotion_distribution.get)
    avg_rating_val = None
    if rating_col and rating_col in df_sample.columns:
        avg_rating_val = float(df_sample[rating_col].dropna().mean())

    ai_summary = build_concise_summary(
        total=total,
        pos_pct=pos_pct,
        neg_pct=neg_pct,
        neu_pct=neu_pct,
        avg_compound=avg_compound,
        quality=quality["quality"],
        trust_score=quality["trust_score"],
        top_keywords=keywords[:6],
        dominant_emotion=dominant_emotion,
        fake_pct=round(fake_count / total * 100, 1),
        avg_rating=avg_rating_val,
    )

    # --- Quality Prediction ---
    avg_rating = None
    if rating_col and rating_col in df_sample.columns:
        avg_rating = df_sample[rating_col].dropna().mean()
    quality = predict_quality(avg_compound, avg_rating)

    # --- Rating distribution for chart ---
    rating_dist = {}
    if rating_col and rating_col in df_sample.columns:
        rd = df_sample[rating_col].dropna().round().astype(int).value_counts().sort_index()
        rating_dist = {str(k): int(v) for k, v in rd.items()}

    # --- Sentiment over time (index-based trend) ---
    chunk_size = max(1, total // 20)
    trend_data = []
    for i in range(0, total, chunk_size):
        chunk = results[i:i + chunk_size]
        if chunk:
            avg_score = np.mean([r["compound_score"] for r in chunk])
            trend_data.append({
                "index": i,
                "avg_sentiment": round(float(avg_score), 4),
                "positive_count": sum(1 for r in chunk if r["sentiment"] == "Positive"),
                "negative_count": sum(1 for r in chunk if r["sentiment"] == "Negative"),
                "neutral_count": sum(1 for r in chunk if r["sentiment"] == "Neutral"),
            })

    # --- Category breakdown (if available) ---
    category_breakdown = {}
    detected_cat_col = detected.get("category_column")
    if detected_cat_col and detected_cat_col in df_sample.columns:
        for cat, group in df_sample.groupby(detected_cat_col):
            cat_reviews = group[review_col].tolist()
            cat_scores = [vader_sentiment(r)["compound"] for r in cat_reviews[:100]]
            category_breakdown[str(cat)] = {
                "count": len(cat_reviews),
                "avg_sentiment": round(np.mean(cat_scores), 4) if cat_scores else 0,
            }

    raw = {
        "summary": summary,
        "sentiment_overview": {
            "total_analyzed": total,
            "positive_count": label_counts.get("Positive", 0),
            "negative_count": label_counts.get("Negative", 0),
            "neutral_count": label_counts.get("Neutral", 0),
            "positive_pct": pos_pct,
            "negative_pct": neg_pct,
            "neutral_pct": neu_pct,
            "avg_compound_score": avg_compound,
            "fake_review_count": fake_count,
            "fake_review_pct": round(fake_count / total * 100, 1),
        },
        "quality_prediction": quality,
        "emotion_distribution": emotion_distribution,
        "keywords": keywords,
        "topics": topics,
        "ai_summary": ai_summary,
        "trend_data": trend_data,
        "rating_distribution": rating_dist,
        "category_breakdown": category_breakdown,
        "review_samples": results[:100],  # First 100 for table display
        "detected_columns": detected,
    }
    return _to_native(raw)
