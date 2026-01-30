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
    s = str(name).strip().lower()
    if s in ["name", "nan", "", "None"]: return None
    return s

for f in files:
    path = os.path.join(base_path, f)
    if not os.path.exists(path): continue
    try:
        header = 0
        if "assessment" in f: header = 1
        elif "attendance" in f: header = 3
        elif "observation" in f: header = 1
        
        df = pd.read_excel(path, header=header)
        name_cols = [c for c in df.columns if 'name' in str(c).lower()]
        file_names = set()
        for col in name_cols:
            names = [clean_name(n) for n in df[col].dropna().unique()]
            names = [n for n in names if n]
            file_names.update(names)
        
        print(f"{f}: {len(file_names)} unique names")
        all_names.update(file_names)
    except:
        pass

print(f"Grand Total Unique Names: {len(all_names)}")
