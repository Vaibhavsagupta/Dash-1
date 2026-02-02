import pandas as pd
import os

f = "c:/Users/Vaibhav/Desktop/Dashboard-2/Student data/Student data/pre observation.csv.xlsx"
df = pd.read_excel(f, header=1)
print(df.columns.tolist())
print(df.head(2).to_dict())
