import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from ..core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL or "postgresql://postgres:postgres@localhost:5432/dashboard_db"

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine_args = {
    "pool_pre_ping": True
}

if "postgres" in db_url:
    engine_args.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_recycle": 1800,
    })
    connect_args = {}
    if "sslmode=require" in db_url or ".render.com" in db_url:
        connect_args["sslmode"] = "require"
    if connect_args:
        engine_args["connect_args"] = connect_args
elif "sqlite" in db_url:
    engine_args["connect_args"] = {"check_same_thread": False}

engine = create_engine(db_url, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
