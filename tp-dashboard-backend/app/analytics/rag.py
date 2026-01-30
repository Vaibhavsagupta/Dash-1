from app.analytics.dynamic_engine import DynamicAnalyticsEngine
import pandas as pd
import numpy as np

import logging

logger = logging.getLogger(__name__)

def analyze_rag():
    df = DynamicAnalyticsEngine.get_latest_dataset("rag")
    
    if df.empty:
        # Fallback to Assessment for derivation
        logger.info("RAG-specific dataset not found, falling back to Assessment derivation")
        df = DynamicAnalyticsEngine.get_latest_dataset("assessment")
        
    if df.empty:
        logger.warning("RAG derivation failed: No RAG or Assessment data found")
        return {
            "status": "no_data",
            "message": "Please upload RAG or assessment dataset",
            "rag_distribution": {"red": 0, "amber": 0, "green": 0, "total": 0},
            "percentages": {"red": 0, "amber": 0, "green": 0}
        }
    
    logger.info(f"Analyzing RAG for {len(df)} rows")

    # Look for 'percentage', 'total marks', or 'final_rag'
    score_col = None
    possible_score_cols = [c for c in df.columns if "percentage" in c.lower() or "final_rag" in c.lower() or "rag_status" in c.lower()]
    
    if possible_score_cols:
        score_col = possible_score_cols[0]
    else:
        # try calculating from numeric cols if mostly subjects
        num_cols = df.select_dtypes(include=[np.number]).columns
        subjects = [c for c in num_cols if "_up" not in c and "s_no" not in c.lower() and "s.no" not in c.lower()]
        if subjects:
             df['calculated_perc'] = df[subjects].mean(axis=1)
             score_col = 'calculated_perc'
    
    if not score_col:
        return {"error": "Could not determine score column for RAG"}
        
    # Categorize
    # Ensure score_col is numeric for comparison
    df[score_col] = pd.to_numeric(df[score_col], errors='coerce').fillna(0)
    
    # Check if this is a 1-3 scale (common in RAG sheets) or 0-100 scale
    max_val = df[score_col].max()
    is_small_scale = max_val <= 3 and max_val > 0
    
    if is_small_scale:
        # 1-3 scale: 1=Red, 2=Amber, 3=Green
        red = df[df[score_col] == 1].shape[0]
        amber = df[df[score_col] == 2].shape[0]
        green = df[df[score_col] == 3].shape[0]
    else:
        # Red < 60, Amber 60-75, Green > 75 (Example logic for 0-100)
        red = df[df[score_col] < 60].shape[0]
        amber = df[(df[score_col] >= 60) & (df[score_col] < 75)].shape[0]
        green = df[df[score_col] >= 75].shape[0]
    
    total = red + amber + green
    
    return {
        "rag_distribution": {
            "red": red,
            "amber": amber,
            "green": green,
            "total": total
        },
        "percentages": {
            "red": round(red/total*100, 1) if total else 0,
            "amber": round(amber/total*100, 1) if total else 0,
            "green": round(green/total*100, 1) if total else 0
        }
    }
