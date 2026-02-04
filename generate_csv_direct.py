import pandas as pd
import os
import random
from faker import Faker

fake = Faker()

input_dir = r"c:\Users\Vaibhav\Desktop\Dashboard-2\Student data\Student data"
output_dir = r"c:\Users\Vaibhav\Desktop\Dashboard-2\Batch 2 Data"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# 1. Students
print("Processing Students...")
try:
    df_in = pd.read_excel(os.path.join(input_dir, "student batch info.csv.xlsx"))
    cols = df_in.columns.tolist()
    
    new_rows = []
    for i in range(1, 31):
        sid = f"S{200+i}" # Using 200 series for clarity
        name = fake.name()
        
        row = {}
        for c in cols:
            cU = str(c).upper()
            if "ID" in cU or "NO" in cU and "PHONE" not in cU:
                row[c] = sid
            elif "NAME" in cU:
                row[c] = name
            elif "BATCH" in cU:
                row[c] = "Batch 2"
            elif "EMAIL" in cU:
                row[c] = f"{name.lower().replace(' ', '.')}@example.com"
            elif "ATTENDANCE" in cU:
                row[c] = random.randint(70, 100)
            else:
                row[c] = "N/A"
        new_rows.append(row)
        
    df_out = pd.DataFrame(new_rows)
    df_out.to_csv(os.path.join(output_dir, "Batch 2 Students.csv"), index=False)
    print("Created Batch 2 Students.csv")
    
except Exception as e:
    print(f"Error students: {e}")

# 2. Assessments
print("Processing Assessments...")
try:
    df_in = pd.read_excel(os.path.join(input_dir, "assessment 1 2 3.xlsx"))
    cols = df_in.columns.tolist()
    
    new_rows = []
    for i in range(1, 31):
        sid = f"S{200+i}"
        
        row = {}
        for c in cols:
            cU = str(c).upper()
            if "ID" in cU:
                row[c] = sid
            elif "NAME" in cU:
                row[c] = f"Student {200+i}"
            elif "BATCH" in cU:
                row[c] = "Batch 2"
            elif isinstance(random.choice(df_in[c].dropna().tolist() if not df_in.empty else [0]), (int, float)):
                 row[c] = random.randint(60, 95)
            else:
                 row[c] = "N/A"
                 
        new_rows.append(row)

    df_out = pd.DataFrame(new_rows)
    df_out.to_csv(os.path.join(output_dir, "Batch 2 Assessments.csv"), index=False)
    print("Created Batch 2 Assessments.csv")

except Exception as e:
    print(f"Error assessments: {e}")
