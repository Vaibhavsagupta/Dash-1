from app.analytics.dynamic_engine import DynamicAnalyticsEngine
import pandas as pd
import numpy as np

import logging

logger = logging.getLogger(__name__)

def analyze_attendance():
    df = DynamicAnalyticsEngine.get_latest_dataset("attendance")
    if df.empty:
        logger.warning("Attendance dataframe is empty")
        return {
            "status": "no_data",
            "message": "Please upload attendance dataset",
            "average_attendance": 0,
            "student_details": [],
            "low_attendance_count": 0
        }
    
    logger.info(f"Analyzing attendance for {len(df)} rows")
    
    # Heuristics to find Student Identifier
    id_cols = [c for c in df.columns if "name" in c.lower() or "student" in c.lower() or "roll" in c.lower()]
    student_col = id_cols[0] if id_cols else df.columns[0]
    
    # Filter out empty rows
    df = df[df[student_col].notna() & (df[student_col].astype(str).str.strip() != "")]
    
    # Identify Date/Attendance columns (exclude system cols and ID)
    # Be robust with s_no variations
    system_cols = ['_uploaded_at', '_upload_id', '_batch_id', student_col.lower()]
    
    def is_system_col(c):
        c_low = c.lower()
        if c_low in system_cols: return True
        if "s_no" in c_low or "s.no" in c_low or "sno" in c_low: return True
        if "unnamed" in c_low: return True
        return False

    att_cols = [c for c in df.columns if not is_system_col(c)]
    
    def parse_status(val):
        s = str(val).lower()
        if s in ['p', 'present', '1', '1.0', 'true']: return 1
        return 0
    
    # Identify Pre-calculated Percentage Column
    # Heuristic: looks for 'percentage' or 'unnamed_36' (specific fix)
    perc_col = next((c for c in df.columns if "percentage" in c.lower()), None)
    if not perc_col:
        perc_col = next((c for c in df.columns if "unnamed_36" in c.lower()), None)
        
    stats = []
    
    for idx, row in df.iterrows():
        # Option 1: Use existing percentage
        if perc_col:
            raw_val = row[perc_col]
            # Clean
            try:
                perc = float(raw_val) * 100 if raw_val < 1.05 and raw_val >= 0 else float(raw_val) # Handle 0.9 vs 90
            except:
                perc = 0
            
            stats.append({
                "student": str(row[student_col]).strip(),
                "name": str(row[student_col]).strip(), # Alias for all_students.py
                "attendance_percentage": round(perc, 1),
                "total_classes": 0,
                "present_classes": 0
            })
            continue

        # Option 2: Calculate from daily logs (Fallback)
        total = 0
        present = 0
        for c in att_cols:
            val = row[c]
            # Ignore NaNs or obvious system cols missed
            if pd.notna(val) and c != student_col and c != perc_col:
                total += 1
                if parse_status(val):
                    present += 1
        
        perc = (present / total * 100) if total > 0 else 0
        stats.append({
            "student": str(row[student_col]).strip(),
            "name": str(row[student_col]).strip(),
            "attendance_percentage": round(perc, 1),
            "total_classes": total,
            "present_classes": present
        })
        
    df_stats = pd.DataFrame(stats)
    
    return {
        "average_attendance": round(df_stats['attendance_percentage'].mean(), 1) if not df_stats.empty else 0,
        "student_details": df_stats.to_dict(orient='records'),
        "low_attendance_count": len(df_stats[df_stats['attendance_percentage'] < 75])
    }
