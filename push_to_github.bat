@echo off
echo ============================================================
echo   SentimentAI Platform — Push to GitHub
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
    echo  1. Go to app.netlify.com ^> Add new site ^> Import from Git
    echo  2. Select your repo — netlify.toml is pre-configured
    echo  3. Set VITE_API_URL env var to your backend URL
    echo  4. Add NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID to GitHub Secrets
    echo.
) else (
    echo.
    echo ERROR: Push failed. Check your GitHub credentials and repo URL.
    echo If prompted for password, use a Personal Access Token (not your password).
    echo Generate one at: https://github.com/settings/tokens
    echo.
)

pause
