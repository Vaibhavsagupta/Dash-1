import pandas as pd
import sqlite3
import os

excel_file = r"c:\Users\Vaibhav\Desktop\Dashboard-2\backend\Student Data\student batch info.csv.xlsx"
db_path = r"c:\Users\Vaibhav\Desktop\Dashboard-2\backend\dashboard_v4.db"

try:
    df = pd.read_excel(excel_file)
    excel_names = set(df['Name'].dropna().str.strip().str.lower().tolist())
    print(f"Unique names in Excel: {len(excel_names)}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM students")
    db_names = set(row[0].strip().lower() for row in cursor.fetchall())
    print(f"Unique names in DB: {len(db_names)}")
    
    extra_in_db = db_names - excel_names
    print(f"Extra students in DB (not in Excel): {len(extra_in_db)}")
    print("Example extra students:")
    for name in list(extra_in_db)[:10]:
        print(f"  {name}")
        
    missing_in_db = excel_names - db_names
    print(f"Students in Excel but MISSING in DB: {len(missing_in_db)}")
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
