import os
from dotenv import load_dotenv

# Load .env file
load_dotenv(override=True)

class Settings:
    PROJECT_NAME: str = "Dashboard API"
    
    # Database Configuration - PostgreSQL Required
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dashboard.db")
    
    # Fix for Heroku/Render/Other platforms that use 'postgres://' instead of 'postgresql://'
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
    # Auth Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 525600 # 365 days (1 year persistent session)
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID")

settings = Settings()
