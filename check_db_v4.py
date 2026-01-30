import sqlite3
import os

db_path = r"c:\Users\Vaibhav\Desktop\Dashboard-2\backend\dashboard_v4.db"

print(f"Connecting to database: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Tables: {[t[0] for t in tables]}")
    
    table_names = [t[0] for t in tables]
    
    if 'students' in table_names:
        cursor.execute("SELECT COUNT(*) FROM students")
        count = cursor.fetchone()[0]
        print(f"Total entries in 'students' table: {count}")
        
        # List first 10 names to see if they are duplicates
        cursor.execute("SELECT student_id, name FROM students LIMIT 10")
        rows = cursor.fetchall()
        print("First 10 students:")
        for r in rows:
            print(f"  {r[0]} - {r[1]}")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
