import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from ..core.config import settings

logger = logging.getLogger(__name__)

def create_db_engine():
    db_url = settings.DATABASE_URL or "sqlite:///./dashboard.db"
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    engine_args = {"pool_pre_ping": True}
    if "postgres" in db_url:
        engine_args.update({
            "pool_size": 10,
            "max_overflow": 5,
            "pool_timeout": 10,
            "pool_recycle": 1800,
        })
        connect_args = {}
        if "sslmode=require" in db_url or ".render.com" in db_url:
            connect_args["sslmode"] = "require"
        if connect_args:
            engine_args["connect_args"] = connect_args

        try:
            test_engine = create_engine(db_url, **engine_args)
            with test_engine.connect() as conn:
                logger.info("Successfully connected to PostgreSQL database.")
            return test_engine
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed ({e}). Falling back to local SQLite database.")
            return create_engine("sqlite:///./dashboard.db", connect_args={"check_same_thread": False})

    return create_engine(db_url, connect_args={"check_same_thread": False})

engine = create_db_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
