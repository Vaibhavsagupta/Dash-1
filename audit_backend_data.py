import pandas as pd
import os

file_path = r"c:\Users\Vaibhav\Desktop\Dashboard-2\backend\Student Data\student batch info.csv.xlsx"

try:
    df = pd.read_excel(file_path)
    print(f"Total rows in {os.path.basename(file_path)}: {len(df)}")
    print(f"Non-empty 'Name' columns: {df['Name'].dropna().count()}")
    
    # Also check assessment.xlsx
    ass_path = r"c:\Users\Vaibhav\Desktop\Dashboard-2\backend\Student Data\assessment.xlsx"
    df_ass = pd.read_excel(ass_path, header=1)
    print(f"Total rows in assessment.xlsx: {len(df_ass)}")
    
    # The seeder processes 3 blocks in assessment.xlsx: Name, Name.1, Name.2
    names = set()
    for col in ["Name", "Name.1", "Name.2"]:
        if col in df_ass.columns:
            names.update(df_ass[col].dropna().unique())
    print(f"Unique names in assessment.xlsx across all blocks: {len(names)}")
    
    # Check if there are students in assessment that ARE NOT in batch info
    info_names = set(df['Name'].dropna().unique())
    extra = names - info_names
    print(f"Names in assessment but NOT in batch info: {len(extra)}")

except Exception as e:
    print(f"Error: {e}")
