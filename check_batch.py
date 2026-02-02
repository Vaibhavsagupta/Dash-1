import pandas as pd
import os

f = "c:/Users/Vaibhav/Desktop/Dashboard-2/Student data/Student data/student batch info.csv.xlsx"
print(f"--- File: {os.path.basename(f)} ---")
try:
    df = pd.read_excel(f)
    print("Columns found:", df.columns.tolist())
    if not df.empty:
        print("First row values:")
        for col in df.columns:
            print(f"  {col}: {df.iloc[0][col]}")
except Exception as e:
    print(f"Error reading {f}: {e}")
