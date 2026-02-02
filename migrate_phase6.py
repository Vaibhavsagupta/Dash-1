import sys
import os
from sqlalchemy import create_engine, text

# Add the parent directory to sys.path to allow importing backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

# Database connection URL
DATABASE_URL = "postgresql://postgres:Vaibhav4537@db.jagktlidgzbwinyyuqto.supabase.co:5432/postgres"

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Starting migration Phase 6...")
        
        # Add batch_id to students
        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN batch_id VARCHAR"))
            print("Added batch_id to students table.")
        except Exception as e:
            print(f"batch_id might already exist: {e}")
            
        # Add pre_remarks to students
        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN pre_remarks TEXT"))
            print("Added pre_remarks to students table.")
        except Exception as e:
            print(f"pre_remarks might already exist: {e}")
            
        # Add post_remarks to students
        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN post_remarks TEXT"))
            print("Added post_remarks to students table.")
        except Exception as e:
            print(f"post_remarks might already exist: {e}")
            
        conn.commit()
        print("Migration Phase 6 completed.")

if __name__ == "__main__":
    migrate()
