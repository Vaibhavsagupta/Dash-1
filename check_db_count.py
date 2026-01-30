import sqlite3
import os

db_path = r"c:\Users\Vaibhav\Desktop\Dashboard-2\backend\sql_app.db" # Standard path for this project usually
if not os.path.exists(db_path):
    # Check if there's a different name
    db_dir = r"c:\Users\Vaibhav\Desktop\Dashboard-2\backend"
    dbs = [f for f in os.listdir(db_dir) if f.endswith('.db')]
    if dbs:
        db_path = os.path.join(db_dir, dbs[0])

print(f"Connecting to database: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Tables: {[t[0] for t in tables]}")
    
    if ('students',) in tables:
        cursor.execute("SELECT COUNT(*) FROM students")
        count = cursor.fetchone()[0]
        print(f"Total students in 'students' table: {count}")
    else:
        # Maybe the table name is different?
        for (table_name,) in tables:
            if 'student' in table_name.lower():
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                print(f"Total entries in '{table_name}' table: {count}")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
