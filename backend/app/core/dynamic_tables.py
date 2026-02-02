from sqlalchemy import text
from sqlalchemy.orm import Session
import re

def create_dynamic_table(db: Session, table_name: str):
    """
    Safely creates a dynamic table for specific monthly logs (e.g., attendance_2024_08).
    Ensures PostgreSQL compatibility with quoted identifiers and standard types.
    """
    # Sanitize table name to prevent SQL injection
    if not re.match(r"^[a-zA-Z0-9_]+$", table_name):
        raise ValueError(f"Invalid table name: {table_name}")

    # Use double quotes for table name to be safe in PG (quoted identifiers)
    # Use standard PG types: TEXT, DATE, TIMESTAMP
    sql = text(f"""
    CREATE TABLE IF NOT EXISTS "{table_name}" (
        student_id TEXT,
        date DATE,
        status TEXT,
        batch_id TEXT,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "idx_{table_name}_batch" ON "{table_name}" (batch_id);
    """)

    
    try:
        db.execute(sql)
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Failed to create dynamic table {table_name}: {str(e)}")

def insert_into_dynamic_table(db: Session, table_name: str, records: list):
    """
    Inserts records into a dynamically created table.
    """
    if not records:
        return
        
    # Sanitize
    if not re.match(r"^[a-zA-Z0-9_]+$", table_name):
        raise ValueError(f"Invalid table name: {table_name}")

    # Build values part
    sql = text(f"""
    INSERT INTO "{table_name}" (student_id, date, status, batch_id)
    VALUES (:student_id, :date, :status, :batch_id)
    """)
    
    try:
        for record in records:
            db.execute(sql, {
                "student_id": record.get("student_id"),
                "date": record.get("date"),
                "status": record.get("status"),
                "batch_id": record.get("batch_id")
            })
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Failed to insert into dynamic table {table_name}: {str(e)}")
