import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Starting migration Phase 8...")
        
        # Add start_date to students
        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN start_date DATE"))
            print("Added start_date to students table.")
        except Exception as e:
            print(f"start_date might already exist: {e}")
            
        # Add end_date to students
        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN end_date DATE"))
            print("Added end_date to students table.")
        except Exception as e:
            print(f"end_date might already exist: {e}")
            
        conn.commit()
        print("Migration Phase 8 completed.")

if __name__ == "__main__":
    migrate()
