@echo off
echo ============================================
echo   INSIGHT PULSE - Frontend Server
echo ============================================
echo.

cd /d "%~dp0frontend"

echo Starting React dev server on http://localhost:3000
echo.
npm run dev

pause
