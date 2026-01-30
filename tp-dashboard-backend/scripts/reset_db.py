import sqlite3
import os

DB_PATH = "test.db"

def reset_database():
    print(f"--- Resetting Database: {DB_PATH} ---")
    
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} does not exist. Nothing to reset.")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 1. Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        # 2. Drop all tables except system ones if any (none for now)
        for table in tables:
            table_name = table[0]
            if table_name == 'sqlite_sequence': continue
            
            print(f"Dropping table: {table_name}")
            cursor.execute(f"DROP TABLE IF EXISTS \"{table_name}\"")
            
        # 3. Re-create UploadHistory if we dropped it (which we did)
        # Assuming the model will re-create it on next run? 
        # Better to just truncate it if we want to keep schema, 
        # but dropping is cleaner since we want to remove dynamic tables too.
        
        conn.commit()
        conn.close()
        print("Database cleared.")
    except Exception as e:
        print(f"Failed to reset database: {e}")

if __name__ == "__main__":
    reset_database()
