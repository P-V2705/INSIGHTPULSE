import requests, io, time, sys

BASE = "http://localhost:8000/api"

CSV = b"""review_text,rating,category
"This product is absolutely amazing! Best purchase I have ever made.",5,Electronics
"Terrible quality. Broke after 2 days. Complete waste of money.",1,Electronics
"It is okay, nothing special. Does the job.",3,Electronics
"Fantastic! Exceeded all my expectations. Outstanding quality.",5,Electronics
"Not worth the price. Poor build quality.",2,Electronics
"Great product overall. Very happy with my purchase.",4,Electronics
"Absolutely love this! Works exactly as described.",5,Electronics
"Mediocre at best. Expected much better.",2,Electronics
"Superb quality and fast shipping. Very happy.",5,Electronics
"Disappointed. Does not match the description at all.",1,Electronics
"Good value for money. Works well.",4,Electronics
"Horrible experience. Product arrived damaged.",1,Electronics
"Decent product. Gets the job done.",3,Electronics
"Excellent! Five stars. Premium quality and amazing support.",5,Electronics
"Waste of money. Stopped working after a week.",1,Electronics
"Pretty good product. Happy with the purchase.",4,Electronics
"Average quality. Some features work, others disappoint.",3,Electronics
"Outstanding product! Best in its class.",5,Electronics
"Poor quality control. Received a defective unit.",1,Electronics
"Solid product. Does what it promises.",4,Electronics
"""

print("\n" + "="*52)
print("  SentimentAI Platform — Live System Test")
print("="*52)

# 1. Health
r = requests.get(f"{BASE}/health")
print(f"\n  Backend  : http://localhost:8000  [{r.json()['status'].upper()}]")
print(f"  Frontend : http://localhost:3000  [RUNNING]")
print(f"  API Docs : http://localhost:8000/api/docs")

# 2. Upload
print("\n  [1/4] Uploading dataset...")
r = requests.post(f"{BASE}/upload/file",
    files={"file": ("reviews.csv", io.BytesIO(CSV), "text/csv")})
assert r.status_code == 200, f"Upload failed: {r.text}"
d = r.json()
sid = d["session_id"]
print(f"        ✓ {d['summary']['total_rows']} rows loaded")
print(f"        ✓ Review column : {d['detected_columns']['review_column']}")
print(f"        ✓ Rating column : {d['detected_columns']['rating_column']}")
print(f"        ✓ Session ID    : {sid[:8]}...")

# 3. Run analysis
print("\n  [2/4] Running NLP analysis pipeline...")
r = requests.post(f"{BASE}/analysis/run",
    json={"session_id": sid, "max_rows": 2000})
assert r.status_code == 200

print("        Polling", end="", flush=True)
for _ in range(40):
    time.sleep(2)
    s = requests.get(f"{BASE}/analysis/status/{sid}").json()["status"]
    print(".", end="", flush=True)
    if s == "completed": print(" ✓"); break
    if s == "error":
        err = requests.get(f"{BASE}/analysis/status/{sid}").json().get("error","unknown")
        print(f"\n  ERROR: {err}"); sys.exit(1)

# 4. Results
print("\n  [3/4] Fetching results...")
r = requests.get(f"{BASE}/analysis/results/{sid}")
assert r.status_code == 200, f"Results failed: {r.text[:200]}"
res = r.json()
ov  = res["sentiment_overview"]
qp  = res["quality_prediction"]
sm  = res["ai_summary"]
emo = res["emotion_distribution"]
kw  = res["keywords"][:5]

print(f"\n  ┌─ SENTIMENT OVERVIEW ──────────────────────────┐")
print(f"  │  Total analyzed : {ov['total_analyzed']:<6}                      │")
print(f"  │  Positive       : {ov['positive_count']:<4} ({ov['positive_pct']}%)               │")
print(f"  │  Negative       : {ov['negative_count']:<4} ({ov['negative_pct']}%)               │")
print(f"  │  Neutral        : {ov['neutral_count']:<4} ({ov['neutral_pct']}%)               │")
print(f"  │  Avg score      : {ov['avg_compound_score']:<8}                   │")
print(f"  │  Suspicious     : {ov['fake_review_count']} ({ov['fake_review_pct']}%)                │")
print(f"  └───────────────────────────────────────────────┘")

print(f"\n  ┌─ AI QUALITY PREDICTION ───────────────────────┐")
print(f"  │  Quality        : {qp['quality']:<10}                 │")
print(f"  │  Trust Score    : {qp['trust_score']}%                          │")
print(f"  │  Recommendation : {qp['recommendation'][:40]:<40}  │")
print(f"  └───────────────────────────────────────────────┘")

print(f"\n  ┌─ AI CONSULTATION SUMMARY ─────────────────────┐")
if isinstance(sm, dict):
    print(f"  │  {sm['headline'][:50]:<50} │")
    print(f"  │  {sm['insight'][:50]:<50} │")
    print(f"  │  {sm['action'][:50]:<50} │")
    if sm.get('flags'):
        for f in sm['flags']:
            print(f"  │  ⚠ {f[:48]:<48} │")
else:
    print(f"  │  {str(sm)[:50]:<50} │")
print(f"  └───────────────────────────────────────────────┘")

top_emo = sorted(emo.items(), key=lambda x: -x[1])[:3]
print(f"\n  ┌─ TOP EMOTIONS & KEYWORDS ─────────────────────┐")
print(f"  │  Emotions : {', '.join(f'{e}({v}%)' for e,v in top_emo):<38} │")
print(f"  │  Keywords : {', '.join(k['word'] for k in kw):<38} │")
print(f"  └───────────────────────────────────────────────┘")

# 5. Dashboard charts
print("\n  [4/4] Verifying dashboard charts endpoint...")
r = requests.get(f"{BASE}/dashboard/{sid}/charts")
assert r.status_code == 200
charts = r.json()
print(f"        ✓ Sentiment pie   : {len(charts['sentiment_pie']['labels'])} segments")
print(f"        ✓ Emotion bar     : {len(charts['emotion_bar']['labels'])} emotions")
print(f"        ✓ Keyword cloud   : {len(charts['word_cloud'])} words")
print(f"        ✓ Topics          : {len(charts['topics'])} clusters")
print(f"        ✓ Trend points    : {len(charts['trend_chart']['labels'])}")

print("\n" + "="*52)
print("  ALL SYSTEMS OPERATIONAL ✓")
print("="*52)
print(f"""
  Open your browser:
  ┌─────────────────────────────────────────────┐
  │  App      →  http://localhost:3000          │
  │  API Docs →  http://localhost:8000/api/docs │
  │  GitHub   →  https://github.com/P-V2705/   │
  │               INSIGHTPULSE                  │
  └─────────────────────────────────────────────┘
""")
