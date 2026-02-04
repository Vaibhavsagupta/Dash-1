import pandas as pd
import os

source_dir = r"c:\Users\Vaibhav\Desktop\Dashboard-2\Batch 2 Data"

files_to_convert = [
    "Batch 2 Students.xlsx",
    "Batch 2 Assessments.xlsx"
]

print(f"Converting files in {source_dir} to CSV...")

for file_name in files_to_convert:
    excel_path = os.path.join(source_dir, file_name)
    csv_name = file_name.replace(".xlsx", ".csv")
    csv_path = os.path.join(source_dir, csv_name)
    
    if os.path.exists(excel_path):
        try:
            df = pd.read_excel(excel_path)
            # Create CSV
            df.to_csv(csv_path, index=False)
            print(f"Successfully converted {file_name} -> {csv_name}")
            
            # Verify CSV creation
            if os.path.exists(csv_path):
                print(f"Verified: {csv_name} exists.")
            
        except Exception as e:
            print(f"Error converting {file_name}: {e}")
    else:
        print(f"Source file not found: {file_name}")
