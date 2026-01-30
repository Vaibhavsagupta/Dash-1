import os
import sys
import pandas as pd
import glob

# Setup Path
sys.path.append(os.getcwd())
from app.ingestion.csv_loader import load_csv_to_db
from app.core.database import SessionLocal

SOURCE_DIR = r"c:\Users\Vaibhav\Desktop\Dashboard-2\Student data"

def seed():
    print(f"Scanning {SOURCE_DIR}...")
    files = glob.glob(os.path.join(SOURCE_DIR, "*"))
    
    for file_path in files:
        filename = os.path.basename(file_path).lower()
        print(f"Processing {filename}...")
        
        # Determine Type
        dataset_type = "unknown"
        if "assessment" in filename:
            dataset_type = "assessment"
        elif "attendance" in filename:
            dataset_type = "attendance"
        elif "observation" in filename:
            dataset_type = "observation"
        elif "teacher" in filename:
            dataset_type = "teacher_performance"
        elif "student" in filename and "batch" in filename:
            dataset_type = "student_info"
            
        if dataset_type == "unknown":
            print(f"Skipping {filename} (Unknown type)")
            continue
            
        # Handle Excel
        final_path = file_path
        if filename.endswith(".xlsx") or filename.endswith(".xls"):
            print("Converting Excel to CSV...")
            try:
                df = pd.read_excel(file_path)
                final_path = file_path + ".converted.csv"
                df.to_csv(final_path, index=False)
            except Exception as e:
                print(f"Failed to convert {filename}: {e}")
                continue
                
        try:
            print(f"Ingesting as {dataset_type}...")
            res = load_csv_to_db(final_path, dataset_type, f"seed_{dataset_type}", os.path.basename(file_path))
            print(f"Success: {res['success']}")
        except Exception as e:
            print(f"Failed to ingest: {e}")

if __name__ == "__main__":
    seed()
