# ══════════════════════════════════════════════════════════════════════════════
# auto_deploy.ps1
# InsightPulse — Kiro → GitHub → Netlify one-click deploy script.
#
# Pipeline: Kiro (edit) → git commit+push → GitHub Actions → Netlify build
#           → https://ana-pulse.netlify.app  (live in ~90 seconds)
#
# Usage:
#   .\auto_deploy.ps1                          # default message
#   .\auto_deploy.ps1 -Message "feat: update"  # custom commit message
#   Right-click → "Run with PowerShell"
# ══════════════════════════════════════════════════════════════════════════════

param(
    [string]$Message = "auto: deploy from Kiro IDE"
)

$ROOT = "C:\Users\prade\OneDrive\Desktop\InsightPulse\sentiment-ai-platform"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   InsightPulse — Kiro → GitHub → Netlify Pipeline   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Stage all changes ──────────────────────────────────────────────────────────
Write-Host "[1/3] Staging all changes..." -ForegroundColor Yellow
git -C $ROOT add -A

# ── Check if anything to commit ───────────────────────────────────────────────
$diff = git -C $ROOT diff --cached --stat
if (-not $diff) {
    Write-Host ""
    Write-Host "      No changes detected — nothing to deploy." -ForegroundColor Gray
    Write-Host "      Your Netlify site is already up to date:" -ForegroundColor Gray
    Write-Host "      https://ana-pulse.netlify.app" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host $diff -ForegroundColor Gray
Write-Host ""

# ── Commit ─────────────────────────────────────────────────────────────────────
Write-Host "[2/3] Committing: '$Message'..." -ForegroundColor Yellow
git -C $ROOT commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ERROR: Commit failed. Check git status." -ForegroundColor Red
    exit 1
}

# ── Push ───────────────────────────────────────────────────────────────────────
Write-Host "[3/3] Pushing to GitHub (origin/main)..." -ForegroundColor Yellow
git -C $ROOT push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ERROR: Push failed. Check credentials and remote." -ForegroundColor Red
    exit 1
}

# ── Summary ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅  PUSHED TO GITHUB SUCCESSFULLY                  ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  📋 GitHub Actions CI/CD running:" -ForegroundColor White
Write-Host "     https://github.com/P-V2705/INSIGHTPULSE/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "  🌍 Netlify deploying to production (~90 seconds):" -ForegroundColor White
Write-Host "     https://ana-pulse.netlify.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📊 Netlify deploy log:" -ForegroundColor White
Write-Host "     https://app.netlify.com/sites/ana-pulse/deploys" -ForegroundColor Cyan
Write-Host ""
