from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    APP_NAME: str = "SentimentAI Platform"
    VERSION: str = "2.0.0"
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    EXPORT_DIR: Path = BASE_DIR / "exports"

    # No hard cap — accept any file the OS can handle.
    # Set to None to disable size checking entirely.
    MAX_FILE_SIZE: int = None

    # Chunk size used when streaming file to disk (8 MB per chunk)
    UPLOAD_CHUNK_SIZE: int = 8 * 1024 * 1024

    # Rows read per chunk when scanning large CSVs for column detection
    CSV_SCAN_CHUNK: int = 50_000

    ALLOWED_EXTENSIONS: list = [".csv", ".xlsx", ".xls", ".json"]

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(exist_ok=True)
settings.EXPORT_DIR.mkdir(exist_ok=True)
