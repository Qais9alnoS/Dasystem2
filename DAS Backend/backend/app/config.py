import os
from typing import Optional
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    # Database
    DATABASE_URL: str = "sqlite:///./school_management.db"
    
    # Security
    SECRET_KEY: str = "123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Network
    HOST: str = "127.0.0.1"  # Localhost only
    PORT: int = 8000  # Back to original port
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None
    
    # Backup
    BACKUP_DIRECTORY: str = "./backups"
    BACKUP_INTERVAL_HOURS: int = 24
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIRECTORY: str = "./uploads"
    
    def __init__(self):
        # Load from environment variables if available
        self.DATABASE_URL = os.getenv("DATABASE_URL", self.DATABASE_URL)
        self.SECRET_KEY = os.getenv("SECRET_KEY", self.SECRET_KEY)
        self.HOST = os.getenv("HOST", self.HOST)
        self.PORT = int(os.getenv("PORT", str(self.PORT)))
        self.TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
        self.TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
        self.BACKUP_DIRECTORY = os.getenv("BACKUP_DIRECTORY", self.BACKUP_DIRECTORY)
        self.UPLOAD_DIRECTORY = os.getenv("UPLOAD_DIRECTORY", self.UPLOAD_DIRECTORY)

settings = Settings()