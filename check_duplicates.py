import sqlite3
import os

db_path = r"c:\Users\Vaibhav\Desktop\Dashboard-2\backend\dashboard_v4.db"

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name, COUNT(*) as count FROM students GROUP BY name HAVING count > 1")
    duplicates = cursor.fetchall()
    print(f"Duplicate names: {duplicates}")
    
    cursor.execute("SELECT student_id, COUNT(*) as count FROM students GROUP BY student_id HAVING count > 1")
    duplicate_ids = cursor.fetchall()
    print(f"Duplicate IDs: {duplicate_ids}")
    
    cursor.execute("SELECT COUNT(*) FROM students")
    total = cursor.fetchone()[0]
    print(f"Total students: {total}")
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
