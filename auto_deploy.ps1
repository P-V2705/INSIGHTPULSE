# auto_deploy.ps1
# Run this anytime to instantly commit everything and deploy to Netlify.
# Usage: Right-click → Run with PowerShell  OR  call from Kiro terminal

param(
    [string]$Message = "auto: deploy from Kiro IDE"
)

$ROOT = "C:\Users\prade\OneDrive\Desktop\InsightPulse\sentiment-ai-platform"
$HOOK = "https://api.netlify.com/build_hooks/6a1ece5d2b3bd99bc56c64b0"

Write-Host "`n[InsightPulse] Auto-Deploy Pipeline" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Stage
Write-Host "[1/4] Staging all changes..." -ForegroundColor Yellow
git -C $ROOT add -A

# Check for changes
$diff = git -C $ROOT diff --cached --stat
if (-not $diff) {
    Write-Host "      No changes to commit." -ForegroundColor Gray
} else {
    Write-Host $diff -ForegroundColor Gray

    # Commit
    Write-Host "[2/4] Committing..." -ForegroundColor Yellow
    git -C $ROOT commit -m $Message

    # Push
    Write-Host "[3/4] Pushing to GitHub..." -ForegroundColor Yellow
    git -C $ROOT push origin main
    Write-Host "      Pushed. GitHub Actions CI running..." -ForegroundColor Green
}

# Always ping Netlify build hook directly
Write-Host "[4/4] Triggering Netlify build..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $HOOK -Method POST -Body "{}" -ContentType "application/json"
    Write-Host "      Netlify build triggered!" -ForegroundColor Green
} catch {
    Write-Host "      Netlify hook ping failed (GitHub Actions will still deploy)." -ForegroundColor Gray
}

Write-Host "`n[DONE] Deploying to:" -ForegroundColor Green
Write-Host "       https://insightpulseanalysis.netlify.app" -ForegroundColor Cyan
Write-Host "       (takes ~90 seconds to go live)`n" -ForegroundColor Gray
