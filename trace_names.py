import pandas as pd
import os

ass_path = r"c:\Users\Vaibhav\Desktop\Dashboard-2\backend\Student Data\assessment.xlsx"
df_ass = pd.read_excel(ass_path, header=1)

extra_names = [
  'ashish singh bhadouriya',
  'shailja bhadoriya',
  'aryan singh'
]

print("Checking extra names in assessment.xlsx:")
for name in extra_names:
    found = False
    for col in ["Name", "Name.1", "Name.2"]:
        if col in df_ass.columns:
            if name in df_ass[col].dropna().str.strip().str.lower().tolist():
                print(f"  '{name}' found in column {col}")
                found = True
                break
    if not found:
        print(f"  '{name}' NOT found in assessment.xlsx")
