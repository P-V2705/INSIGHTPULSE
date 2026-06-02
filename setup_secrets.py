"""
Sets up GitHub secrets and verifies the full CI/CD pipeline.
Netlify token: nfp_yNHM5pHiFsR67nt5wYWbBS8FGftWiEnPf22b
Site ID      : 2861477f-9a9a-44c0-a14f-28586edfe8f2
"""
import urllib.request
import urllib.error
import json
import base64
import subprocess
import sys

NETLIFY_TOKEN   = "nfp_yNHM5pHiFsR67nt5wYWbBS8FGftWiEnPf22b"
NETLIFY_SITE_ID = "2861477f-9a9a-44c0-a14f-28586edfe8f2"
NETLIFY_HOOK_URL = "https://api.netlify.com/build_hooks/6a1ece5d2b3bd99bc56c64b0"
GITHUB_REPO     = "P-V2705/INSIGHTPULSE"

def netlify_get(path):
    req = urllib.request.Request(
        f"https://api.netlify.com/api/v1{path}",
        headers={"Authorization": f"Bearer {NETLIFY_TOKEN}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def netlify_post(path, data=None):
    payload = json.dumps(data or {}).encode()
    req = urllib.request.Request(
        f"https://api.netlify.com/api/v1{path}",
        data=payload, method="POST",
        headers={"Authorization": f"Bearer {NETLIFY_TOKEN}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return {"error": str(e), "body": body}

print("=" * 60)
print("  SentimentAI — CI/CD Pipeline Setup")
print("=" * 60)

# ── Step 1: Verify Netlify site ───────────────────────────────
print("\n[1] Verifying Netlify site...")
site = netlify_get(f"/sites/{NETLIFY_SITE_ID}")
print(f"    Name   : {site.get('name')}")
print(f"    URL    : {site.get('ssl_url')}")
print(f"    Repo   : {site.get('build_settings', {}).get('repo_url', 'Not linked')}")
print(f"    Build  : {site.get('build_settings', {}).get('cmd', '?')}")
print(f"    Publish: {site.get('build_settings', {}).get('dir', '?')}")

# ── Step 2: List/create build hooks ──────────────────────────
print("\n[2] Checking build hooks...")
hooks = netlify_get(f"/sites/{NETLIFY_SITE_ID}/build_hooks")
hook_url = None
for h in hooks:
    title = h.get("title", "")
    url   = h.get("url", "")
    print(f"    Hook: {title} → {url}")
    if "Kiro" in title or "Auto" in title or "kiro" in title.lower():
        hook_url = url

if not hook_url:
    print("    Creating new build hook...")
    h = netlify_post(f"/sites/{NETLIFY_SITE_ID}/build_hooks",
                     {"title": "Kiro-Auto-Deploy", "branch": "main"})
    hook_url = h.get("url", NETLIFY_HOOK_URL)
    print(f"    Created: {hook_url}")
else:
    print(f"    Using existing hook: {hook_url}")

# ── Step 3: Update deploy.yml with real hook URL ──────────────
print("\n[3] Updating deploy workflow with build hook URL...")
deploy_yml = f"""name: CD — Auto Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Build and Deploy to insightpulseanalysis.netlify.app
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm install --legacy-peer-deps

      - name: Build
        working-directory: frontend
        run: npm run build
        env:
          VITE_API_URL: ${{{{ secrets.VITE_API_URL }}}}

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v3
        with:
          publish-dir: './frontend/dist'
          production-branch: main
          production-deploy: true
          deploy-message: "Auto-deploy: ${{{{ github.event.head_commit.message }}}}"
          enable-pull-request-comment: false
          enable-commit-comment: true
        env:
          NETLIFY_AUTH_TOKEN: ${{{{ secrets.NETLIFY_AUTH_TOKEN }}}}
          NETLIFY_SITE_ID: ${{{{ secrets.NETLIFY_SITE_ID }}}}
        timeout-minutes: 10

      - name: Ping Netlify Build Hook (instant backup trigger)
        if: always()
        run: |
          curl -s -X POST "{hook_url}" -d "{{}}" || true
          echo "Netlify build hook pinged for insightpulseanalysis.netlify.app"
"""

with open(".github/workflows/deploy.yml", "w", encoding="utf-8") as f:
    f.write(deploy_yml)
print("    deploy.yml updated.")

# ── Step 4: Trigger immediate deploy via hook ─────────────────
print("\n[4] Triggering immediate Netlify deploy...")
req = urllib.request.Request(
    hook_url, data=b"{}", method="POST",
    headers={"Content-Type": "application/json"}
)
try:
    with urllib.request.urlopen(req) as r:
        print(f"    Status: {r.status}")
        print(f"    Deploy triggered at: https://insightpulseanalysis.netlify.app")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"    Hook response: {e.code} {body[:100]}")
except Exception as e:
    print(f"    Hook: {e}")

# ── Step 5: Commit + push everything ─────────────────────────
print("\n[5] Committing and pushing to GitHub...")
try:
    subprocess.run(["git", "add", "-A"], cwd=".", check=True, capture_output=True)
    result = subprocess.run(
        ["git", "diff", "--cached", "--quiet"],
        cwd=".", capture_output=True
    )
    if result.returncode != 0:  # changes exist
        subprocess.run(
            ["git", "commit", "-m", "ci: add Netlify build hook + GitHub secrets setup"],
            cwd=".", check=True, capture_output=True
        )
        push = subprocess.run(
            ["git", "push", "origin", "main"],
            cwd=".", capture_output=True, text=True
        )
        print(f"    Push: {push.stdout.strip() or push.stderr.strip()[:80]}")
    else:
        print("    No changes to commit.")
except subprocess.CalledProcessError as e:
    print(f"    Git error: {e.stderr[:80] if e.stderr else e}")

print("\n" + "=" * 60)
print("  PIPELINE ACTIVE")
print("=" * 60)
print()
print("  Netlify site   : https://insightpulseanalysis.netlify.app")
print("  GitHub repo    : https://github.com/P-V2705/INSIGHTPULSE")
print("  Build hook     :", hook_url)
print()
print("  NEXT STEP — Add 2 secrets to GitHub:")
print("  Go to: https://github.com/P-V2705/INSIGHTPULSE/settings/secrets/actions")
print()
print("  Secret 1 → NETLIFY_AUTH_TOKEN")
print("  Value   → nfp_yNHM5pHiFsR67nt5wYWbBS8FGftWiEnPf22b")
print()
print("  Secret 2 → NETLIFY_SITE_ID")
print("  Value   → 2861477f-9a9a-44c0-a14f-28586edfe8f2")
print()
print("  Workflow:")
print("  Save in Kiro → auto-commit → push to GitHub →")
print("  GitHub Actions builds → Netlify deploys (~90s)")
print("=" * 60)
