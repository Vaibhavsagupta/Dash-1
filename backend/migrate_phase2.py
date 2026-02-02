import sys
import os
from sqlalchemy import text

# Add the current directory to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import engine

def migrate():
    with engine.connect() as conn:
        print("Starting manual migration...")
        
        # Add columns to users table
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN approved BOOLEAN DEFAULT FALSE"))
            print("Added 'approved' to users")
        except Exception as e:
            print(f"Column 'approved' might already exist in users: {e}")
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN approved_by TEXT"))
            print("Added 'approved_by' to users")
        except Exception as e:
            print(f"Column 'approved_by' might already exist in users: {e}")
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE"))
            print("Added 'approved_at' to users")
        except Exception as e:
            print(f"Column 'approved_at' might already exist in users: {e}")
            
        # Add columns to admins table
        try:
            conn.execute(text("ALTER TABLE admins ADD COLUMN approved_by TEXT"))
            print("Added 'approved_by' to admins")
        except Exception as e:
            print(f"Column 'approved_by' might already exist in admins: {e}")
            
        try:
            conn.execute(text("ALTER TABLE admins ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE"))
            print("Added 'approved_at' to admins")
        except Exception as e:
            print(f"Column 'approved_at' might already exist in admins: {e}")
            
        # Update existing records
        conn.execute(text("UPDATE users SET approved = TRUE WHERE email IN ('admin@college.com', 'admin@samatrix.com')"))
        print("Updated initial admins to be approved")
        
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
