@echo off
echo ============================================
echo   INSIGHT PULSE - Backend Server
echo ============================================
echo.

cd /d "%~dp0backend"

:: Check if venv exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate venv
call venv\Scripts\activate.bat

:: Install dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet

:: Download NLTK data
echo Setting up NLTK data...
python setup_nltk.py

:: Start server
echo.
echo Starting FastAPI server on http://localhost:8000
echo API Docs: http://localhost:8000/api/docs
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
