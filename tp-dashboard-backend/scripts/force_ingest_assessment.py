import pandas as pd
import sys
import os
sys.path.append(os.getcwd())
from app.ingestion.csv_loader import load_csv_to_db

FILE_PATH = r"c:\Users\Vaibhav\Desktop\Dashboard-2\Student data\Student data\assessment.xlsx"

def force_ingest():
    print(f"Force Ingesting {FILE_PATH} with Header=1")
    
    # 1. Convert
    df = pd.read_excel(FILE_PATH, header=1)
    print("Raw Excel Columns:", df.columns.tolist())
    
    # Check duplicates after cleaning
    from app.ingestion.csv_loader import clean_column_name
    clean = [clean_column_name(c) for c in df.columns]
    print("Cleaned Columns:", clean)
    if len(clean) != len(set(clean)):
        print("!! DUPLICATE COLUMNS DETECTED !!")
        from collections import Counter
        print([item for item, count in Counter(clean).items() if count > 1])
    
    temp_csv = "force_assessment.csv"
    df.to_csv(temp_csv, index=False)
    
    # 2. Ingest
    res = load_csv_to_db(temp_csv, "assessment", "force_manual_1", "assessment.xlsx")
    print("Result:", res)
    
    # 3. Cleanup
    if os.path.exists(temp_csv): os.remove(temp_csv)

if __name__ == "__main__":
    force_ingest()
