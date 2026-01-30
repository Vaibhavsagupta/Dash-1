import pandas as pd
import glob
import os

data_dir = r"c:\Users\Vaibhav\Desktop\Dashboard-2\Student data"
files = glob.glob(os.path.join(data_dir, "*.xlsx"))

print(f"Checking files in {data_dir}...")

all_students = set()

for file in files:
    try:
        df = pd.read_excel(file)
        # Try common student ID column names
        id_cols = ['Student ID', 'student_id', 'ID', 'enrollment_id', 'Enrollment ID', 'Student ID ']
        found_col = None
        for col in df.columns:
            if col.strip() in id_cols:
                found_col = col
                break
        
        if found_col:
            students = df[found_col].dropna().unique()
            print(f"File: {os.path.basename(file)} - Students found: {len(students)}")
            all_students.update(students)
        else:
            print(f"File: {os.path.basename(file)} - No ID column found. Columns: {df.columns.tolist()}")
    except Exception as e:
        print(f"File: {os.path.basename(file)} - Error: {e}")

print(f"\nTotal unique students across all files: {len(all_students)}")
