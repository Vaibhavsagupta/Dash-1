import pandas as pd
import os

files = [
    "c:/Users/Vaibhav/Desktop/Dashboard-2/Student data/Student data/pre observation.csv.xlsx",
    "c:/Users/Vaibhav/Desktop/Dashboard-2/Student data/Student data/post observation.csv.xlsx"
]

for f in files:
    print(f"--- File: {os.path.basename(f)} ---")
    try:
        # Some files might have different headers, let's try to find where the data starts
        df = pd.read_excel(f, header=1)
        print("Columns found:", df.columns.tolist())
        if not df.empty:
            print("First row values:")
            for col in df.columns:
                print(f"  {col}: {df.iloc[0][col]}")
    except Exception as e:
        print(f"Error reading {f}: {e}")
    print("\n")
