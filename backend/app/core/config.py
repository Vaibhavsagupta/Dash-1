import os
from dotenv import load_dotenv

# Load .env file
load_dotenv(override=True)

class Settings:
    PROJECT_NAME: str = "Dashboard API"
    
    # Database Configuration - PostgreSQL Required
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is required. Please set it in your .env file.")
    
    # Fix for Heroku/Render/Other platforms that use 'postgres://' instead of 'postgresql://'
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
    # Auth Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours

settings = Settings()
