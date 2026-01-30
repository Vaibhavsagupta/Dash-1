from app.analytics.dynamic_engine import DynamicAnalyticsEngine
import pandas as pd
import numpy as np
import re

import logging

logger = logging.getLogger(__name__)

def analyze_assessment():
    df = DynamicAnalyticsEngine.get_latest_dataset("assessment")
    if df.empty:
        logger.warning("Assessment dataframe is empty")
        return {
            "status": "no_data", 
            "message": "Please upload assessment dataset",
            "class_average": 0, 
            "top_performers": [], 
            "all_students": []
        }
        
    logger.info(f"Analyzing assessment for {len(df)} rows")
        
    # Detect Layout: Single vs Multi-Block
    # Look for multiple 'name' columns
    name_cols = [c for c in df.columns if "name" in c.lower() and "unnamed" not in c.lower() and "college" not in c.lower()]
    if not name_cols:
        # Fallback to first column
        name_cols = [df.columns[0]]
    
    all_data = []
    
    for name_col in name_cols:
        # Determine suffix (e.g., "_1", "_2") from "name_1"
        # Regex to find ending _\d+
        match = re.search(r'(_\d+)$', name_col)
        suffix = match.group(1) if match else ""
        
        # Identify columns belonging to this block
        # Heuristic: Columns that end with this suffix OR (if suffix is empty) don't end with _\d
        # This is tricky because "technical" might become "technical_1".
        
        # Strategy: Select columns that match the suffix pattern
        block_cols = {}
        for c in df.columns:
            if c == name_col:
                block_cols["name"] = c
                continue
                
            if suffix:
                if c.endswith(suffix):
                    # Check if base name matches known subjects/metrics
                    base = c[:-len(suffix)]
                    block_cols[base] = c
            else:
                # No suffix. Check if it DOES NOT end with _\d+
                if not re.search(r'_\d+$', c):
                    block_cols[c] = c
        
        # Extract and Normalize
        sub_df = df[list(block_cols.values())].copy()
        
        # Rename to base names
        # Invert block_cols map: {real_col: base_name}
        rename_map = {v: k for k, v in block_cols.items()}
        # Ensure name is standardized
        rename_map[name_col] = "name"
        
        sub_df.rename(columns=rename_map, inplace=True)
        
        # Cleaning
        if "name" in sub_df.columns:
            sub_df = sub_df[sub_df["name"].notna() & (sub_df["name"].astype(str).str.strip() != "")]
        
        # Append to master
        if not sub_df.empty:
            all_data.append(sub_df)
            
    # Combine All Blocks
    if all_data:
        full_df = pd.concat(all_data, ignore_index=True)
    else:
        full_df = pd.DataFrame() 
        
    if full_df.empty:
         return {"class_average": 0, "top_performers": [], "all_students": []}

    # --- Standard Analysis on Combined Data ---
    
    # Identify Score Column
    score_col = None
    possible = [c for c in full_df.columns if "percentage" in c.lower() or "total_marks" in c.lower()]
    if possible:
        score_col = possible[0]
    else:
        # Calc average of numerics
        numerics = full_df.select_dtypes(include=[np.number]).columns.tolist()
        subjects = [c for c in numerics if "s_no" not in c.lower() and "s.no" not in c.lower() and "total" not in c.lower()]
        if subjects:
            full_df['calculated_avg'] = full_df[subjects].mean(axis=1)
            score_col = 'calculated_avg'
    
    # Identify Subjects for Averages
    numerics = full_df.select_dtypes(include=[np.number]).columns.tolist()
    subjects = [c for c in numerics if c != score_col and "s_no" not in c.lower() and "s.no" not in c.lower() and "total" not in c.lower() and "percentage" not in c.lower()]

    analytics = {}
    
    # 1. Subject Averages
    if subjects:
        analytics["subject_averages"] = full_df[subjects].mean().to_dict()
        
    # 2. Rankings & Top Performers
    if score_col:
        full_df[score_col] = pd.to_numeric(full_df[score_col], errors='coerce').fillna(0)
        
        # Rank
        full_df['rank'] = full_df[score_col].rank(ascending=False, method='min')
        full_df['percentile'] = full_df[score_col].rank(pct=True) * 100
        
        # Top 5
        top = full_df.nlargest(5, score_col)[['name', score_col]].to_dict(orient='records')
        analytics["top_performers"] = top
        analytics["class_average"] = round(full_df[score_col].mean(), 1)
        
        # All Students (with subjects)
        # Keep relevant cols
        keep_cols = ['name', score_col, 'rank', 'percentile'] + subjects
        # Filter existing
        keep_cols = [c for c in keep_cols if c in full_df.columns]
        
        analytics["all_students"] = full_df[keep_cols].replace({np.nan: None}).to_dict(orient='records')
    else:
        analytics["class_average"] = 0
        analytics["top_performers"] = []
        analytics["all_students"] = []
        
    return analytics
