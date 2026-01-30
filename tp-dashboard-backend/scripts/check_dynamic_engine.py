from app.analytics.dynamic_engine import DynamicAnalyticsEngine
import pandas as pd
import sys
import os
sys.path.append(os.getcwd())

def check():
    engine = DynamicAnalyticsEngine()
    df = engine.get_latest_dataset("assessment")
    print("Assessment Columns:", df.columns.tolist())
    
    df_att = engine.get_latest_dataset("attendance")
    print("\nAttendance Columns:", df_att.columns.tolist())

if __name__ == "__main__":
    check()
