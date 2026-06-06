@echo off
echo ============================================================
echo   INSIGHT PULSE — Push to GitHub
echo ============================================================
echo.

set /p REPO_URL="Paste your GitHub repo URL (e.g. https://github.com/username/repo.git): "

if "%REPO_URL%"=="" (
    echo ERROR: No URL entered. Exiting.
    pause
    exit /b 1
)

cd /d "%~dp0"

echo.
echo [1] Setting remote origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo [2] Pushing to GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   SUCCESS! Code pushed to GitHub.
    echo ============================================================
    echo.
    echo Next steps:
    echo  1. Go to dash.cloudflare.com ^> Workers ^& Pages ^> Create ^> Pages
    echo  2. Connect GitHub and select your repo
    echo  3. Build settings:
    echo     - Root directory: frontend
    echo     - Build command:  npm install --legacy-peer-deps ^&^& npm run build
    echo     - Output dir:     dist
    echo  4. Add GitHub secrets: CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
    echo     (Settings ^> Secrets and variables ^> Actions)
    echo.
    echo  Cloudflare Pages will auto-deploy on every push to main!
    echo  Live at: https://insightpulse.pages.dev
    echo.
) else (
    echo.
    echo ERROR: Push failed. Check your GitHub credentials and repo URL.
    echo If prompted for password, use a Personal Access Token (not your password).
    echo Generate one at: https://github.com/settings/tokens
    echo.
)

pause
