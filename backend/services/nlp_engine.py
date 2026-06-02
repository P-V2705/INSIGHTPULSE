"""
Core NLP Engine — Tokenization, Stopword Removal, Lemmatization,
Stemming, Sentiment Classification, Emotion Detection, Keyword Extraction,
Topic Modeling, Review Summarization
"""
import re
import string
import nltk
import numpy as np
from collections import Counter
from textblob import TextBlob

# Download required NLTK data — punkt_tab is required by NLTK 3.8.2+
for pkg in ["punkt", "punkt_tab", "stopwords", "wordnet",
            "averaged_perceptron_tagger", "averaged_perceptron_tagger_eng",
            "vader_lexicon", "omw-1.4"]:
    try:
        nltk.download(pkg, quiet=True)
    except Exception:
        pass

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import WordNetLemmatizer, PorterStemmer
from nltk.sentiment.vader import SentimentIntensityAnalyzer

STOP_WORDS = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()
stemmer = PorterStemmer()
vader = SentimentIntensityAnalyzer()


def clean_text(text: str) -> str:
    """Remove HTML, URLs, special chars, extra whitespace."""
    if not isinstance(text, str):
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def tokenize(text: str) -> list:
    return word_tokenize(clean_text(text))


def remove_stopwords(tokens: list) -> list:
    return [t for t in tokens if t not in STOP_WORDS and len(t) > 2]


def lemmatize(tokens: list) -> list:
    return [lemmatizer.lemmatize(t) for t in tokens]


def stem(tokens: list) -> list:
    return [stemmer.stem(t) for t in tokens]


def full_preprocess(text: str) -> dict:
    """Full NLP pipeline for a single review."""
    cleaned = clean_text(text)
    tokens = tokenize(text)
    no_stop = remove_stopwords(tokens)
    lemmas = lemmatize(no_stop)
    stems = stem(no_stop)
    return {
        "cleaned": cleaned,
        "tokens": tokens,
        "filtered_tokens": no_stop,
        "lemmas": lemmas,
        "stems": stems,
        "word_count": len(tokens),
        "sentence_count": len(sent_tokenize(text)) if text else 0,
    }


def vader_sentiment(text: str) -> dict:
    scores = vader.polarity_scores(text)
    compound = scores["compound"]
    if compound >= 0.05:
        label = "Positive"
    elif compound <= -0.05:
        label = "Negative"
    else:
        label = "Neutral"
    confidence = round(abs(compound) * 100, 2)
    return {
        "label": label,
        "compound": round(compound, 4),
        "positive": round(scores["pos"], 4),
        "negative": round(scores["neg"], 4),
        "neutral": round(scores["neu"], 4),
        "confidence": confidence,
    }


def textblob_sentiment(text: str) -> dict:
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    if polarity > 0.1:
        label = "Positive"
    elif polarity < -0.1:
        label = "Negative"
    else:
        label = "Neutral"
    return {
        "label": label,
        "polarity": round(polarity, 4),
        "subjectivity": round(subjectivity, 4),
    }


EMOTION_KEYWORDS = {
    "joy": ["happy", "great", "excellent", "love", "wonderful", "amazing", "fantastic", "delighted", "pleased", "enjoy"],
    "anger": ["angry", "furious", "terrible", "horrible", "awful", "disgusting", "hate", "worst", "useless", "broken"],
    "sadness": ["sad", "disappointed", "unhappy", "regret", "sorry", "unfortunate", "poor", "bad", "miss", "lost"],
    "fear": ["scared", "worried", "anxious", "nervous", "afraid", "concern", "risk", "danger", "unsafe", "problem"],
    "surprise": ["surprised", "unexpected", "shocked", "wow", "unbelievable", "incredible", "astonishing", "sudden"],
    "trust": ["reliable", "trustworthy", "honest", "genuine", "authentic", "quality", "consistent", "dependable"],
    "anticipation": ["excited", "looking forward", "hope", "expect", "await", "eager", "anticipate", "soon"],
    "disgust": ["disgusting", "gross", "nasty", "revolting", "repulsive", "awful", "horrible", "unpleasant"],
}


def detect_emotions(text: str) -> dict:
    text_lower = text.lower()
    scores = {}
    for emotion, keywords in EMOTION_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in text_lower)
        scores[emotion] = count
    total = sum(scores.values()) or 1
    return {k: round(v / total * 100, 2) for k, v in scores.items()}


def extract_keywords(texts: list, top_n: int = 30) -> list:
    """Extract top keywords from a list of texts."""
    all_tokens = []
    for text in texts:
        tokens = remove_stopwords(tokenize(text))
        lemmas = lemmatize(tokens)
        all_tokens.extend(lemmas)
    freq = Counter(all_tokens)
    return [{"word": w, "count": c} for w, c in freq.most_common(top_n)]


def simple_topic_model(texts: list, n_topics: int = 5) -> list:
    """Lightweight LDA-style topic extraction using TF-IDF + KMeans."""
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.cluster import KMeans

    cleaned = [clean_text(t) for t in texts if isinstance(t, str) and len(t) > 10]
    if len(cleaned) < n_topics:
        return []

    vectorizer = TfidfVectorizer(max_features=500, stop_words="english", min_df=2)
    try:
        X = vectorizer.fit_transform(cleaned)
    except Exception:
        return []

    n_topics = min(n_topics, len(cleaned))
    km = KMeans(n_clusters=n_topics, random_state=42, n_init=10)
    km.fit(X)

    feature_names = vectorizer.get_feature_names_out()
    topics = []
    for i, center in enumerate(km.cluster_centers_):
        top_indices = center.argsort()[-8:][::-1]
        top_words = [feature_names[j] for j in top_indices]
        topics.append({"topic": i + 1, "keywords": top_words})
    return topics


def summarize_reviews(texts: list, max_sentences: int = 3) -> str:
    """
    Extractive summarization — kept for backward compatibility.
    Returns at most max_sentences high-scoring sentences.
    """
    all_text = " ".join([t for t in texts if isinstance(t, str)])
    sentences = sent_tokenize(all_text)
    if not sentences:
        return "No reviews available for summarization."

    word_freq = Counter(remove_stopwords(tokenize(all_text)))
    if not word_freq:
        return sentences[0] if sentences else ""

    max_freq = max(word_freq.values())
    word_freq = {w: c / max_freq for w, c in word_freq.items()}

    scores = {}
    for sent in sentences:
        for word in word_tokenize(sent.lower()):
            if word in word_freq:
                scores[sent] = scores.get(sent, 0) + word_freq[word]

    top_sentences = sorted(scores, key=scores.get, reverse=True)[:max_sentences]
    ordered = [s for s in sentences if s in top_sentences]
    return " ".join(ordered[:max_sentences])


def build_concise_summary(
    total: int,
    pos_pct: float,
    neg_pct: float,
    neu_pct: float,
    avg_compound: float,
    quality: str,
    trust_score: float,
    top_keywords: list,
    dominant_emotion: str,
    fake_pct: float,
    avg_rating: float = None,
) -> dict:
    """
    Build a short, structured consultation summary from aggregated analytics.
    Returns a dict with:
      - headline   : one bold verdict sentence
      - insight    : one sentence on sentiment split
      - action     : one concrete recommendation
      - flags      : list of brief alert strings (may be empty)
    """
    # ── Headline ──────────────────────────────────────────────────────────────
    if quality == "Excellent":
        headline = f"Customers are highly satisfied — {pos_pct}% of reviews are positive."
    elif quality == "Good":
        headline = f"Overall reception is positive at {pos_pct}%, with minor concerns."
    elif quality == "Average":
        headline = f"Mixed feedback: {pos_pct}% positive vs {neg_pct}% negative."
    elif quality == "Poor":
        headline = f"Significant dissatisfaction detected — {neg_pct}% of reviews are negative."
    else:
        headline = f"Overwhelmingly negative: {neg_pct}% of {total:,} reviews express dissatisfaction."

    # ── Insight ───────────────────────────────────────────────────────────────
    kw_str = ", ".join([k["word"] for k in top_keywords[:4]]) if top_keywords else "N/A"
    rating_str = f" Average rating: {avg_rating:.1f}/5." if avg_rating else ""
    insight = (
        f"Dominant emotion is {dominant_emotion}, and the most discussed topics are: {kw_str}.{rating_str}"
    )

    # ── Action ────────────────────────────────────────────────────────────────
    if quality in ("Excellent", "Good"):
        action = "Maintain current quality standards and highlight positive themes in marketing."
    elif quality == "Average":
        action = "Address recurring negative keywords and improve areas customers flag most."
    else:
        action = "Immediate attention needed — investigate top negative keywords and resolve core complaints."

    # ── Flags ─────────────────────────────────────────────────────────────────
    flags = []
    if fake_pct >= 10:
        flags.append(f"{fake_pct:.0f}% of reviews flagged as suspicious — verify authenticity.")
    if neg_pct >= 40:
        flags.append(f"High negative rate ({neg_pct}%) warrants urgent product/service review.")
    if trust_score < 40:
        flags.append(f"Low trust score ({trust_score}%) — data reliability may be limited.")

    return {
        "headline": headline,
        "insight": insight,
        "action": action,
        "flags": flags,
        "quality": quality,
        "trust_score": trust_score,
    }


def detect_fake_reviews(text: str, sentiment_score: float) -> dict:
    """Heuristic fake review detection."""
    flags = []
    score = 0

    # Very short review
    if len(text.split()) < 5:
        flags.append("Extremely short review")
        score += 20

    # All caps
    if text.isupper() and len(text) > 10:
        flags.append("All caps text")
        score += 15

    # Excessive punctuation
    exclamation_count = text.count("!")
    if exclamation_count > 5:
        flags.append(f"Excessive exclamation marks ({exclamation_count})")
        score += 10

    # Extreme sentiment with no detail
    if abs(sentiment_score) > 0.9 and len(text.split()) < 15:
        flags.append("Extreme sentiment with minimal content")
        score += 25

    # Repetitive words
    words = text.lower().split()
    if words:
        most_common_word_freq = Counter(words).most_common(1)[0][1]
        if most_common_word_freq / len(words) > 0.3:
            flags.append("Highly repetitive language")
            score += 20

    is_fake = score >= 40
    return {
        "is_suspicious": is_fake,
        "suspicion_score": min(score, 100),
        "flags": flags,
        "verdict": "Suspicious" if is_fake else "Authentic"
    }


def predict_quality(avg_sentiment: float, avg_rating: float = None) -> dict:
    """Predict product/service quality from sentiment and rating."""
    score = avg_sentiment
    if avg_rating is not None:
        normalized_rating = (avg_rating - 1) / 4  # normalize 1-5 to 0-1
        score = (score + normalized_rating) / 2

    if score >= 0.7:
        quality = "Excellent"
        recommendation = "Highly Recommended — Outstanding customer satisfaction."
    elif score >= 0.4:
        quality = "Good"
        recommendation = "Recommended — Positive reception with minor concerns."
    elif score >= 0.1:
        quality = "Average"
        recommendation = "Neutral — Mixed reviews. Improvements needed."
    elif score >= -0.2:
        quality = "Poor"
        recommendation = "Not Recommended — Significant issues reported."
    else:
        quality = "Bad"
        recommendation = "Avoid — Overwhelmingly negative feedback."

    return {
        "quality": quality,
        "quality_score": round(score, 4),
        "recommendation": recommendation,
        "trust_score": round(max(0, min(100, (score + 1) / 2 * 100)), 1),
    }
