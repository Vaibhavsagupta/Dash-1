import os
import sys

# Add app to path
sys.path.append(os.getcwd())

from app.ingestion.csv_detector import detect_csv_structure
from app.ingestion.csv_loader import load_csv_to_db
from app.ingestion.schema_registry import SchemaRegistry

DATA_DIR = r"c:\Users\Vaibhav\Desktop\Dashboard-2\Student data\Student data"

def seed_data():
    print(f"--- Seeding Data from {DATA_DIR} ---")
    
    if not os.path.exists(DATA_DIR):
        print(f"❌ Error: {DATA_DIR} not found.")
        return

    files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith(('.csv', '.xlsx', '.xls'))]
    
    for filename in files:
        file_path = os.path.join(DATA_DIR, filename)
        print(f"\nProcessing: {filename}")
        
        try:
            # 1. Detect columns
            analysis = detect_csv_structure(file_path)
            if "error" in analysis:
                print(f"  Detection failed: {analysis['error']}")
                continue
                
            # 2. Identify Type
            # Detection already does this, but let's be explicit
            dataset_type = analysis.get("dataset_type", "generic_dataset")
            
            # Special Overrides for known naming patterns if detection fails
            if "attendance" in filename.lower(): dataset_type = "attendance"
            elif "assessment" in filename.lower(): dataset_type = "assessment"
            elif "rag" in filename.lower(): dataset_type = "rag"
            elif "observation" in filename.lower(): dataset_type = "observation"
            elif "batch" in filename.lower() or "student" in filename.lower(): dataset_type = "student_info"

            print(f"  Detected Type: {dataset_type}")
            
            # 3. Load to DB
            result = load_csv_to_db(
                file_path=file_path, 
                dataset_type=dataset_type, 
                upload_id=f"seed_{filename}", 
                original_filename=filename
            )
            
            if result.get("success"):
                print(f"  SUCCESS: Loaded {result.get('rows')} rows into '{result.get('table_name')}'")
            else:
                print(f"  FAILED: {result.get('error')}")
                
        except Exception as e:
            print(f"  CRITICAL ERROR: {e}")

if __name__ == "__main__":
    seed_data()
