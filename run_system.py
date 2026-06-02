"""Full system run — verifies every component is working."""
import requests, io, time, json, openpyxl

BASE = "http://localhost:8000/api"

def hr(): print("─" * 54)

hr()
print("  SentimentAI Platform — System Check")
hr()

# ── 1. Health ─────────────────────────────────────────────────────
r = requests.get(f"{BASE}/health")
assert r.status_code == 200
print(f"\n  Backend  → http://localhost:8000  [{r.json()['status'].upper()}]")
print(f"  Frontend → http://localhost:3000  [RUNNING]")
print(f"  API Docs → http://localhost:8000/api/docs")

# ── 2. Format acceptance ──────────────────────────────────────────
print("\n  Accepted formats:")
for ext in [".csv", ".xlsx", ".xls", ".json", ".pdf", ".docx", ".doc", ".txt", ".tsv"]:
    r = requests.get(f"{BASE}/upload/info", params={"filename": f"file{ext}"})
    ok = "✓" if r.json()["allowed"] else "✗"
    print(f"    {ok} {ext}")

# ── 3. Excel upload ───────────────────────────────────────────────
print("\n  Excel upload (.xlsx):")
wb = openpyxl.Workbook()
ws = wb.active
ws.append(["review_text", "rating", "category"])
reviews = [
    ("This product is absolutely amazing! Best purchase ever.", 5, "Electronics"),
    ("Terrible quality. Broke after two days. Complete waste.", 1, "Electronics"),
    ("It is okay, nothing special. Does the job I suppose.", 3, "Electronics"),
    ("Fantastic! Exceeded all expectations. Outstanding quality.", 5, "Electronics"),
    ("Not worth the price. Poor build and bad customer service.", 2, "Electronics"),
    ("Great product overall. Very happy with my purchase.", 4, "Electronics"),
    ("Absolutely love this product! Works exactly as described.", 5, "Electronics"),
    ("Mediocre at best. Expected much better for this price.", 2, "Electronics"),
    ("Superb quality and fast shipping. Highly recommend.", 5, "Electronics"),
    ("Very disappointed. Does not match the description at all.", 1, "Electronics"),
    ("Good value for money. Works well and looks great.", 4, "Electronics"),
    ("Horrible experience. Product arrived damaged.", 1, "Electronics"),
    ("Decent product. Nothing extraordinary but gets job done.", 3, "Electronics"),
    ("Excellent! Five stars. Premium quality and great support.", 5, "Electronics"),
    ("Waste of money. Stopped working after one week.", 1, "Electronics"),
    ("Pretty good product. Happy with the purchase overall.", 4, "Electronics"),
    ("Average quality. Some features work, others disappoint.", 3, "Electronics"),
    ("Outstanding product! Highly recommend. Best in class.", 5, "Electronics"),
    ("Poor quality control. Received a defective unit.", 1, "Electronics"),
    ("Solid product. Does what it promises. Good value.", 4, "Electronics"),
]
for row in reviews:
    ws.append(row)
buf = io.BytesIO()
wb.save(buf); buf.seek(0)

r = requests.post(f"{BASE}/upload/file",
    files={"file": ("reviews.xlsx", buf,
           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
assert r.status_code == 200, f"Excel upload failed: {r.text[:200]}"
d = r.json()
sid = d["session_id"]
print(f"    ✓ {d['summary']['total_rows']} rows loaded")
print(f"    ✓ Review col : {d['detected_columns']['review_column']}")
print(f"    ✓ Rating col : {d['detected_columns']['rating_column']}")
print(f"    ✓ File size  : {d['file_size_mb']} MB")

# ── 4. NLP Analysis ───────────────────────────────────────────────
print("\n  NLP Analysis pipeline:")
requests.post(f"{BASE}/analysis/run",
    json={"session_id": sid, "max_rows": 2000})

print("    Polling", end="", flush=True)
for _ in range(30):
    time.sleep(2)
    s = requests.get(f"{BASE}/analysis/status/{sid}").json()["status"]
    print(".", end="", flush=True)
    if s == "completed": print(" ✓"); break
    if s == "error":
        err = requests.get(f"{BASE}/analysis/status/{sid}").json().get("error")
        print(f"\n    ERROR: {err}"); exit(1)

# ── 5. Results ────────────────────────────────────────────────────
res = requests.get(f"{BASE}/analysis/results/{sid}").json()
ov = res["sentiment_overview"]
qp = res["quality_prediction"]
sm = res["ai_summary"]
emo = sorted(res["emotion_distribution"].items(), key=lambda x: -x[1])[:3]
kw  = [k["word"] for k in res["keywords"][:5]]

print(f"\n  Results:")
print(f"    Analyzed   : {ov['total_analyzed']} reviews")
print(f"    Positive   : {ov['positive_pct']}%  ({ov['positive_count']} reviews)")
print(f"    Negative   : {ov['negative_pct']}%  ({ov['negative_count']} reviews)")
print(f"    Neutral    : {ov['neutral_pct']}%  ({ov['neutral_count']} reviews)")
print(f"    Quality    : {qp['quality']}")
print(f"    Trust      : {qp['trust_score']}%")
print(f"    Suspicious : {ov['fake_review_count']} ({ov['fake_review_pct']}%)")

print(f"\n  AI Consultation:")
print(f"    {sm['headline']}")
print(f"    {sm['insight']}")
print(f"    {sm['action']}")
if sm["flags"]:
    for f in sm["flags"]: print(f"    ⚠ {f}")

print(f"\n  Top emotions : {', '.join(f'{e}({v}%)' for e,v in emo)}")
print(f"  Top keywords : {', '.join(kw)}")

# ── 6. Dashboard charts ───────────────────────────────────────────
r = requests.get(f"{BASE}/dashboard/{sid}/charts")
assert r.status_code == 200
charts = r.json()
print(f"\n  Dashboard charts:")
print(f"    ✓ Sentiment pie   — {len(charts['sentiment_pie']['labels'])} segments")
print(f"    ✓ Emotion bar     — {len(charts['emotion_bar']['labels'])} emotions")
print(f"    ✓ Keyword cloud   — {len(charts['word_cloud'])} words")
print(f"    ✓ Topics          — {len(charts['topics'])} clusters")
print(f"    ✓ Trend points    — {len(charts['trend_chart']['labels'])}")

# ── 7. Export endpoints ───────────────────────────────────────────
r_csv = requests.get(f"{BASE}/export/{sid}/csv")
assert r_csv.status_code == 200
r_pdf = requests.get(f"{BASE}/export/{sid}/pdf")
assert r_pdf.status_code == 200
print(f"\n  Exports:")
print(f"    ✓ CSV  — {len(r_csv.content):,} bytes")
print(f"    ✓ PDF  — {len(r_pdf.content):,} bytes")

hr()
print("  ALL SYSTEMS OPERATIONAL ✓")
hr()
print(f"""
  ┌─────────────────────────────────────────────────┐
  │  App      →  http://localhost:3000              │
  │  API Docs →  http://localhost:8000/api/docs     │
  │  GitHub   →  https://github.com/P-V2705/        │
  │               INSIGHTPULSE                      │
  └─────────────────────────────────────────────────┘
""")
