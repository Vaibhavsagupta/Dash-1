import pandas as pd
import os

base_path = r"c:\Users\Vaibhav\Desktop\Dashboard-2\backend\Student Data"
files = [
    "student batch info.csv.xlsx",
    "assessment.xlsx",
    "attendance sheet.csv.xlsx",
    "pre observation.csv.xlsx",
    "post observation.csv.xlsx",
    "rag analysis.csv.xlsx"
]

all_names = set()

def clean_name(name):
    if pd.isna(name): return None
    return str(name).strip().lower()

for f in files:
    path = os.path.join(base_path, f)
    if not os.path.exists(path): continue
    try:
        # Adjustment for headers
        header = 0
        if "assessment" in f: header = 1
        elif "attendance" in f: header = 3
        elif "observation" in f: header = 1
        
        df = pd.read_excel(path, header=header)
        
        # Look for name columns
        name_cols = [c for c in df.columns if 'name' in str(c).lower()]
        for col in name_cols:
            names = [clean_name(n) for n in df[col].dropna().unique()]
            names = [n for n in names if n and n not in ["name", "nan", ""]]
            all_names.update(names)
            print(f"File: {f}, col: {col}, count: {len(names)}")
    except Exception as e:
        print(f"Error {f}: {e}")

print(f"\nTotal unique names across all files: {len(all_names)}")
