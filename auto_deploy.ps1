# auto_deploy.ps1
# InsightPulse — Kiro → GitHub → Cloudflare Pages auto-deploy pipeline.
#
# Usage:
#   Right-click → "Run with PowerShell"
#   OR from Kiro terminal: .\auto_deploy.ps1
#   OR with custom message: .\auto_deploy.ps1 -Message "feat: my change"
#
# What this does:
#   1. Stages all uncommitted changes
#   2. Commits with your message
#   3. Pushes to GitHub (origin/main)
#   → GitHub Actions picks up the push and automatically deploys to Cloudflare Pages
#   → No manual Cloudflare trigger needed — the CI/CD pipeline handles everything.

param(
    [string]$Message = "auto: deploy from Kiro IDE"
)

$ROOT = "C:\Users\prade\OneDrive\Desktop\InsightPulse\sentiment-ai-platform"

Write-Host ""
Write-Host "[InsightPulse] Kiro → GitHub → Cloudflare Pipeline" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# ── Stage ──────────────────────────────────────────────────────────────────────
Write-Host "[1/3] Staging all changes..." -ForegroundColor Yellow
git -C $ROOT add -A

# ── Check for changes ──────────────────────────────────────────────────────────
$diff = git -C $ROOT diff --cached --stat
if (-not $diff) {
    Write-Host "      No changes to commit." -ForegroundColor Gray
    Write-Host ""
    Write-Host "[INFO] Nothing to deploy. Your Cloudflare Pages site is already up to date:" -ForegroundColor Green
    Write-Host "       https://insightpulse.pages.dev" -ForegroundColor Cyan
    exit 0
}

Write-Host $diff -ForegroundColor Gray

# ── Commit ─────────────────────────────────────────────────────────────────────
Write-Host "[2/3] Committing..." -ForegroundColor Yellow
git -C $ROOT commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "      Commit failed. Check git status." -ForegroundColor Red
    exit 1
}

# ── Push ───────────────────────────────────────────────────────────────────────
Write-Host "[3/3] Pushing to GitHub (origin/main)..." -ForegroundColor Yellow
git -C $ROOT push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "      Push failed. Check your GitHub credentials and remote." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[DONE] Changes pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "  GitHub Actions CI/CD is now running:" -ForegroundColor White
Write-Host "  https://github.com/P-V2705/INSIGHTPULSE/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Cloudflare Pages will auto-deploy on successful build (~60s):" -ForegroundColor White
Write-Host "  https://insightpulse.pages.dev" -ForegroundColor Cyan
Write-Host "  (or your custom domain if configured in Cloudflare dashboard)" -ForegroundColor Gray
Write-Host ""
