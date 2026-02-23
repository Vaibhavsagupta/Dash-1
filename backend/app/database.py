from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .core.config import settings

# PostgreSQL specific configuration with optimized pooling for production
# PostgreSQL specific configuration with optimized pooling for production
engine_args = {
    "pool_pre_ping": True     # Check connection health before every use
}

# PostgreSQL specific configuration
if "sqlite" not in settings.DATABASE_URL:
    engine_args.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_recycle": 1800,
    })

# If using PostgreSQL (Supabase/Render), configure connection args
connect_args = {}
if "postgres" in settings.DATABASE_URL:
    connect_args["prepare_threshold"] = None
    
    # Force SSL for cloud databases
    if "localhost" not in settings.DATABASE_URL and "127.0.0.1" not in settings.DATABASE_URL:
        connect_args["sslmode"] = "require"
elif "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False

if connect_args:
    engine_args["connect_args"] = connect_args

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


