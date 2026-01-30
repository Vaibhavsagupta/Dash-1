import os
import sys
import pandas as pd
import glob

# Setup
sys.path.append(os.getcwd())
try:
    from app.ingestion.csv_loader import load_csv_to_db
except ImportError:
    pass

SOURCE_DIR = r"c:\Users\Vaibhav\Desktop\Dashboard-2\Student data\Student data"

# Setup logging
import logging
logging.basicConfig(filename='seed_debug.log', level=logging.INFO, filemode='w')

def find_header_row(file_path):
    """
    Scans first 20 rows of Excel to find the likely header row.
    Criteria: Contains 'Name' or 'Roll' or 'Student' or 'S.No'
    """
    logging.info(f"Scanning headers for {file_path}")
    try:
        # Read raw without header - deep scan
        df_scan = pd.read_excel(file_path, header=None, nrows=20)
        
        for idx, row in df_scan.iterrows():
            row_vals = [str(v).lower().strip() for v in row.values]
            logging.info(f"    [Row {idx}] {row_vals}")
            
            # Check for header-like keywords
            # Must contain 'name' or 'student' AND some score/status/roll indicator
            has_name = any('name' in x or 'student' in x for x in row_vals)
            has_id = any('roll' in x or 'enroll' in x or 's.no' in x or 'serial' in x for x in row_vals)
            has_data = any('score' in x or 'total' in x or 'result' in x or 'marks' in x or 'present' in x or 'status' in x or 'technical' in x or 'aptitude' in x for x in row_vals)
            
            if has_name and (has_id or has_data):
                logging.info(f"    -> Found header at {idx} (Reason: Name + ID/Data)")
                return idx
                
            # Fallback: Just "Name" and 3+ non-empty cols
            if 'name' in row_vals:
                 non_empty = [x for x in row_vals if x and x != 'nan']
                 if len(non_empty) > 3:
                     logging.info(f"    -> Found header at {idx} (Reason: Name + Columns)")
                     return idx
    except Exception as e:
        logging.error(f"Error scanning: {e}")
    
    logging.warning("    -> Header not found, defaulting to 0")
    return 0 # Default to 0

def seed():
    print(f"Scanning directory: {SOURCE_DIR}")
    files = glob.glob(os.path.join(SOURCE_DIR, "*"))
    print(f"Found {len(files)} files.")
    
    for file_path in files:
        filename = os.path.basename(file_path).lower()
        if os.path.isdir(file_path): continue
            
        print(f"Analyzing {filename}...")
        
        # Determine Dataset Type
        dt = "unknown"
        if "assessment" in filename: dt = "assessment"
        elif "attendance" in filename: dt = "attendance"
        elif "pre" in filename and "observation" in filename: dt = "observation" # Pre
        elif "post" in filename and "observation" in filename: dt = "observation" # Post
        elif "rag" in filename: dt = "rag"
        elif "batch" in filename: dt = "student_info"
        
        if dt == "unknown":
            print(f"  -> Skipping (Type unknown)")
            continue
            
        print(f"  -> Identified as {dt}")
        
        # Convert if Excel
        target_path = file_path
        header_row = 0
        if filename.endswith(".xlsx") or filename.endswith(".xls"):
            print("  -> Finding Header Row...")
            header_row = find_header_row(file_path)
            
            # FORCE FIX for Assessment if needed
            if "assessment" in filename and header_row == 0:
                 logging.info("Forcing Header=1 for Assessment file (Heuristic)")
                 header_row = 1

            print(f"  -> Detected Header at Row: {header_row}")
            logging.info(f"Detected Header at {header_row} for {filename}")
            
            print("  -> Converting to CSV...")
            try:
                # Load excel with correct header
                df = pd.read_excel(file_path, header=header_row)
                logging.info(f"Columns: {df.columns.tolist()}") # Log columns
                
                # Check column uniqueness (common issue in messy excels)
                # If duplicate cols like "Score", "Score", pandas handles it (Score.1)
                
                # Create temp csv
                temp_name = filename.replace(".xlsx", "").replace(".xls", "") + ".converted.csv"
                target_path = os.path.join(os.getcwd(), temp_name)
                df.to_csv(target_path, index=False)
                print(f"  -> Saved temp CSV to {target_path}")
            except Exception as e:
                print(f"  -> Conversion Error: {e}")
                continue
        
        # Ingest
        print("  -> Ingesting into DB...")
        try:
            res = load_csv_to_db(target_path, dt, f"seed_{dt}_{filename}", filename)
            print(f"  -> Result: {res}")
            
            # Cleanup temp
            if target_path != file_path and os.path.exists(target_path):
                os.remove(target_path)
                
        except Exception as e:
            print(f"  -> Ingest Error: {e}")

if __name__ == "__main__":
    seed()
