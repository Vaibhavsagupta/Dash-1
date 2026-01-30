import pandas as pd
import os

base_path = r"c:\Users\Vaibhav\Desktop\Dashboard-2\backend\Student Data"
files = [f for f in os.listdir(base_path) if f.endswith('.xlsx')]

for f in files:
    try:
        df = pd.read_excel(os.path.join(base_path, f))
        name_cols = [c for c in df.columns if 'name' in str(c).lower()]
        for col in name_cols:
            names = df[col].dropna().unique()
            print(f"File: {f}, Col: {col}, Unique names: {len(names)}")
    except:
        pass
