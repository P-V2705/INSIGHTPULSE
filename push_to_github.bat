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
    echo Next steps — Netlify setup:
    echo  1. Go to app.netlify.com ^> Add new site ^> Import from Git
    echo  2. Connect GitHub ^> select your repo
    echo  3. Build settings (auto-detected from netlify.toml):
    echo     - Base dir:     frontend
    echo     - Build cmd:    npm install --legacy-peer-deps ^&^& npm run build
    echo     - Publish dir:  dist
    echo  4. Add GitHub Secrets (Settings ^> Secrets ^> Actions):
    echo     - NETLIFY_AUTH_TOKEN  ^(Netlify User Settings ^> Applications^)
    echo     - NETLIFY_SITE_ID     3df6f028-cca6-4c87-952c-1ebac20409a9
    echo.
    echo  Live at: https://ana-pulse.netlify.app
    echo.
) else (
    echo.
    echo ERROR: Push failed. Check your GitHub credentials and repo URL.
    echo If prompted for password, use a Personal Access Token (not your password).
    echo Generate one at: https://github.com/settings/tokens
    echo.
)

pause
