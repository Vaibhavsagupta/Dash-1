import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

from sqlalchemy import inspect

def migrate():
    print("Checking for OTP columns in users table...")
    inspector = inspect(engine)
    if 'users' not in inspector.get_table_names():
        print("Table 'users' does not exist. Please run the application first to create tables.")
        return
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    with engine.connect() as conn:
        if 'otp' not in columns:
            print("Adding 'otp' column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN otp VARCHAR(6);"))
            
        if 'otp_expiry' not in columns:
            print("Adding 'otp_expiry' column...")
            # SQLite doesn't have a specific TIMESTAMP WITH TIME ZONE, it uses DATETIME
            if "sqlite" in str(engine.url):
                conn.execute(text("ALTER TABLE users ADD COLUMN otp_expiry DATETIME;"))
            else:
                conn.execute(text("ALTER TABLE users ADD COLUMN otp_expiry TIMESTAMP WITH TIME ZONE;"))
            
        if 'is_verified' not in columns:
            print("Adding 'is_verified' column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;"))
            
        conn.commit()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
