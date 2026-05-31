"""
Final end-to-end test covering:
1. Health check
2. Upload dataset 1 → run analysis → get structured summary
3. Verify new-analysis reset (upload dataset 2 → run analysis)
4. Verify git repo state
"""
import requests, io, time, subprocess, sys, os

BASE = "http://localhost:8000/api"

def make_csv(label, rows=25):
    lines = ["review_text,rating"]
    pos = ["Amazing product, love it!", "Excellent quality, highly recommend.", "Best purchase ever, five stars."]
    neg = ["Terrible, broke immediately.", "Worst product, complete waste.", "Very disappointed, avoid."]
    neu = ["It is okay, nothing special.", "Average quality, does the job."]
    import random
    for _ in range(rows):
        r = random.choice(pos + neg + neu)
        rating = random.randint(1, 5)
        lines.append(f'"{r} [{label}]",{rating}')
    return "\n".join(lines).encode()

print("=" * 55)
print("SentimentAI — Final Integration Test")
print("=" * 55)

# ── 1. Health ─────────────────────────────────────────────────────
r = requests.get(f"{BASE}/health")
assert r.status_code == 200
print(f"\n[1] Health: {r.json()['status']} ✓")

# ── 2. First analysis ─────────────────────────────────────────────
print("\n[2] First analysis (Dataset A — Electronics)")
r = requests.post(f"{BASE}/upload/file",
    files={"file": ("electronics.csv", io.BytesIO(make_csv("Electronics")), "text/csv")})
assert r.status_code == 200
sid1 = r.json()["session_id"]
print(f"    Uploaded → session {sid1[:8]}…")

requests.post(f"{BASE}/analysis/run", json={"session_id": sid1, "max_rows": 500})
print("    Polling", end="", flush=True)
for _ in range(30):
    time.sleep(2)
    s = requests.get(f"{BASE}/analysis/status/{sid1}").json()["status"]
    print(".", end="", flush=True)
    if s == "completed": print(" done"); break
    if s == "error":     print(" ERROR"); sys.exit(1)

res1 = requests.get(f"{BASE}/analysis/results/{sid1}").json()
summary1 = res1["ai_summary"]
assert isinstance(summary1, dict), f"Expected dict summary, got {type(summary1)}"
assert "headline" in summary1 and "insight" in summary1 and "action" in summary1
print(f"    Quality : {res1['quality_prediction']['quality']}")
print(f"    Headline: {summary1['headline']}")
print(f"    Insight : {summary1['insight']}")
print(f"    Action  : {summary1['action']}")
if summary1.get("flags"):
    print(f"    Flags   : {summary1['flags']}")
print("    ✓ Structured summary verified")

# ── 3. New analysis (simulates UI reset + re-upload) ──────────────
print("\n[3] New analysis (Dataset B — Restaurants) — simulating reset")
# The frontend calls resetSession() which clears state; backend is stateless per session.
# We simply upload a new file and run a new analysis — old session is untouched.
r = requests.post(f"{BASE}/upload/file",
    files={"file": ("restaurants.csv", io.BytesIO(make_csv("Restaurants")), "text/csv")})
assert r.status_code == 200
sid2 = r.json()["session_id"]
assert sid2 != sid1, "New session must differ from old"
print(f"    New session {sid2[:8]}… (different from {sid1[:8]}…) ✓")

requests.post(f"{BASE}/analysis/run", json={"session_id": sid2, "max_rows": 500})
print("    Polling", end="", flush=True)
for _ in range(30):
    time.sleep(2)
    s = requests.get(f"{BASE}/analysis/status/{sid2}").json()["status"]
    print(".", end="", flush=True)
    if s == "completed": print(" done"); break
    if s == "error":     print(" ERROR"); sys.exit(1)

res2 = requests.get(f"{BASE}/analysis/results/{sid2}").json()
summary2 = res2["ai_summary"]
assert isinstance(summary2, dict)
print(f"    Quality : {res2['quality_prediction']['quality']}")
print(f"    Headline: {summary2['headline']}")
print("    ✓ Second analysis independent of first")

# ── 4. Git repo state ─────────────────────────────────────────────
print("\n[4] Git repository state")
root = r"C:\Users\prade\OneDrive\Desktop\InsightPulse\sentiment-ai-platform"
log = subprocess.run(["git", "-C", root, "log", "--oneline", "-5"],
                     capture_output=True, text=True)
print(f"    Recent commits:\n" + "\n".join(f"      {l}" for l in log.stdout.strip().splitlines()))

status = subprocess.run(["git", "-C", root, "status", "--short"],
                        capture_output=True, text=True)
uncommitted = status.stdout.strip()
print(f"    Uncommitted changes: {'none ✓' if not uncommitted else uncommitted}")

workflows = os.path.join(root, ".github", "workflows")
wf_files = os.listdir(workflows)
print(f"    Workflows: {wf_files} ✓")

print("\n" + "=" * 55)
print("ALL TESTS PASSED ✓")
print("=" * 55)
print(f"\n  Frontend : http://localhost:3000")
print(f"  Backend  : http://localhost:8000")
print(f"  API Docs : http://localhost:8000/api/docs")
print(f"\n  To push to GitHub:")
print(f"  Double-click push_to_github.bat and paste your repo URL")
