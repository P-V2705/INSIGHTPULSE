"""
Export Service — generates PDF reports and CSV exports.
"""
import json
import csv
import os
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

EXPORT_DIR = Path(__file__).resolve().parent.parent / "exports"
EXPORT_DIR.mkdir(exist_ok=True)


def generate_pdf_report(analysis_data: dict, filename: str = None) -> str:
    """Generate a professional PDF report from analysis results."""
    if not filename:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"sentiment_report_{ts}.pdf"

    output_path = EXPORT_DIR / filename
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    story = []

    # --- Title ---
    title_style = ParagraphStyle(
        "Title", parent=styles["Title"],
        fontSize=22, textColor=colors.HexColor("#6366f1"),
        spaceAfter=6, alignment=TA_CENTER
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        fontSize=11, textColor=colors.HexColor("#64748b"),
        spaceAfter=20, alignment=TA_CENTER
    )
    heading_style = ParagraphStyle(
        "Heading", parent=styles["Heading2"],
        fontSize=14, textColor=colors.HexColor("#1e293b"),
        spaceBefore=16, spaceAfter=8,
        borderPad=4
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor("#334155"),
        spaceAfter=6, leading=16
    )

    story.append(Paragraph("SentimentAI Platform", title_style))
    story.append(Paragraph("Customer Sentiment Analysis Report", subtitle_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}", body_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#6366f1")))
    story.append(Spacer(1, 0.2 * inch))

    # --- Dataset Summary ---
    summary = analysis_data.get("summary", {})
    story.append(Paragraph("Dataset Overview", heading_style))
    ds_data = [
        ["Metric", "Value"],
        ["Total Reviews", str(summary.get("total_rows", "N/A"))],
        ["Columns", str(summary.get("total_columns", "N/A"))],
        ["Avg Review Length", f"{summary.get('avg_review_length', 'N/A')} chars"],
        ["Missing Values", str(summary.get("missing_values", 0))],
    ]
    if summary.get("avg_rating"):
        ds_data.append(["Average Rating", f"{summary['avg_rating']} / 5.0"])

    t = Table(ds_data, colWidths=[3 * inch, 3.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6366f1")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.2 * inch))

    # --- Sentiment Overview ---
    overview = analysis_data.get("sentiment_overview", {})
    story.append(Paragraph("Sentiment Analysis Results", heading_style))
    sent_data = [
        ["Metric", "Value"],
        ["Total Analyzed", str(overview.get("total_analyzed", 0))],
        ["Positive Reviews", f"{overview.get('positive_count', 0)} ({overview.get('positive_pct', 0)}%)"],
        ["Negative Reviews", f"{overview.get('negative_count', 0)} ({overview.get('negative_pct', 0)}%)"],
        ["Neutral Reviews", f"{overview.get('neutral_count', 0)} ({overview.get('neutral_pct', 0)}%)"],
        ["Avg Sentiment Score", str(overview.get("avg_compound_score", 0))],
        ["Suspicious Reviews", f"{overview.get('fake_review_count', 0)} ({overview.get('fake_review_pct', 0)}%)"],
    ]
    t2 = Table(sent_data, colWidths=[3 * inch, 3.5 * inch])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#10b981")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f0fdf4"), colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(t2)
    story.append(Spacer(1, 0.2 * inch))

    # --- Quality Prediction ---
    quality = analysis_data.get("quality_prediction", {})
    story.append(Paragraph("AI Quality Prediction", heading_style))
    story.append(Paragraph(f"<b>Quality Rating:</b> {quality.get('quality', 'N/A')}", body_style))
    story.append(Paragraph(f"<b>Trust Score:</b> {quality.get('trust_score', 0)}%", body_style))
    story.append(Paragraph(f"<b>AI Recommendation:</b> {quality.get('recommendation', '')}", body_style))
    story.append(Spacer(1, 0.15 * inch))

    # --- AI Consultation Summary ---
    story.append(Paragraph("AI Consultation Summary", heading_style))
    ai_summary = analysis_data.get("ai_summary", {})

    if isinstance(ai_summary, dict):
        # New structured format
        if ai_summary.get("headline"):
            story.append(Paragraph(f"<b>Verdict:</b> {ai_summary['headline']}", body_style))
        if ai_summary.get("insight"):
            story.append(Paragraph(f"<b>Insight:</b> {ai_summary['insight']}", body_style))
        if ai_summary.get("action"):
            story.append(Paragraph(f"<b>Action:</b> {ai_summary['action']}", body_style))
        for flag in ai_summary.get("flags", []):
            story.append(Paragraph(f"<b>⚠ Alert:</b> {flag}", body_style))
    else:
        # Legacy string format
        story.append(Paragraph(str(ai_summary) or "No summary available.", body_style))
    story.append(Spacer(1, 0.15 * inch))

    # --- Top Keywords ---
    keywords = analysis_data.get("keywords", [])[:15]
    if keywords:
        story.append(Paragraph("Top Keywords", heading_style))
        kw_text = " • ".join([f"{k['word']} ({k['count']})" for k in keywords])
        story.append(Paragraph(kw_text, body_style))
        story.append(Spacer(1, 0.15 * inch))

    # --- Topics ---
    topics = analysis_data.get("topics", [])
    if topics:
        story.append(Paragraph("Discovered Topics", heading_style))
        for topic in topics:
            kws = ", ".join(topic.get("keywords", []))
            story.append(Paragraph(f"<b>Topic {topic['topic']}:</b> {kws}", body_style))
        story.append(Spacer(1, 0.15 * inch))

    # --- Footer ---
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0")))
    story.append(Spacer(1, 0.1 * inch))
    footer_style = ParagraphStyle("Footer", parent=styles["Normal"],
                                   fontSize=8, textColor=colors.HexColor("#94a3b8"),
                                   alignment=TA_CENTER)
    story.append(Paragraph("Generated by SentimentAI Platform — Advanced NLP Intelligence System", footer_style))

    doc.build(story)
    return str(output_path)


def generate_csv_export(analysis_data: dict, filename: str = None) -> str:
    """Export review-level results to CSV."""
    if not filename:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"sentiment_results_{ts}.csv"

    output_path = EXPORT_DIR / filename
    samples = analysis_data.get("review_samples", [])

    if not samples:
        return None

    fieldnames = list(samples[0].keys())
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(samples)

    return str(output_path)
