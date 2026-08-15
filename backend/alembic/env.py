import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, create_engine
from alembic import context

# Add backend root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set database URL dynamically from app settings
db_url = settings.DATABASE_URL or "postgresql://postgres:postgres@localhost:5432/dashboard_db"
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

config.set_main_option("sqlalchemy.url", db_url)
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    # Use app engine for online migration if connection succeeds, else use NullPool config
    url = config.get_main_option("sqlalchemy.url")
    try:
        connectable = create_engine(url, poolclass=pool.NullPool)
        with connectable.connect() as connection:
            context.configure(
                connection=connection, target_metadata=target_metadata
            )
            with context.begin_transaction():
                context.run_migrations()
    except Exception as e:
        print(f"PostgreSQL migration connection skipped ({e}). Offline/fallback mode active.")

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
