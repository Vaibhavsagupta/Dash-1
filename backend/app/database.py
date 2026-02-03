from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .core.config import settings

# PostgreSQL specific configuration with optimized pooling for production
# PostgreSQL specific configuration with optimized pooling for production
engine_args = {
    "pool_size": 20,          # Increased for production concurrency
    "max_overflow": 10,       # Allow some temporary spike overflow
    "pool_timeout": 30,       # Timeout after 30s waiting for a connection
    "pool_recycle": 1800,     # Recycle connections every 30 mins to prevent stale links
    "pool_pre_ping": True     # Check connection health before every use
}

# If using PostgreSQL (Supabase), disable prepared statements to support Transaction Pooler (Port 6543)
if "postgres" in settings.DATABASE_URL:
    engine_args["connect_args"] = {"prepare_threshold": None}

engine = create_engine(
    settings.DATABASE_URL,
    **engine_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


