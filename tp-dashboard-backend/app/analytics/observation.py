from app.analytics.dynamic_engine import DynamicAnalyticsEngine
import pandas as pd
import numpy as np

import logging

logger = logging.getLogger(__name__)

def analyze_observation():
    # Attempt to fetch Observation data (Pre/Post)
    # Logic: Look for 'observation' type which might be combined or separate.
    # We rely on DynamicEngine to give us the best guess.
    
    # For robust handling, let's try to query 'observation' history.
    from app.core.database import SessionLocal, engine
    from app.models.sys_metadata import UploadHistory
    
    pre_df = pd.DataFrame()
    post_df = pd.DataFrame()
    
    session = SessionLocal()
    try:
        # Fetch last 5 observation uploads
        records = session.query(UploadHistory)\
            .filter(UploadHistory.dataset_type == "observation")\
            .order_by(UploadHistory.upload_time.desc())\
            .limit(5)\
            .all()
            
        for r in records:
            fname = r.original_filename.lower()
            if "post" in fname and post_df.empty:
                logger.info(f"Using '{r.table_name}' as Post-Observation")
                post_df = pd.read_sql_table(r.table_name, engine)
            elif "pre" in fname and pre_df.empty:
                logger.info(f"Using '{r.table_name}' as Pre-Observation")
                pre_df = pd.read_sql_table(r.table_name, engine)
                
        # If we didn't find separate files, check if newest record has both
        if pre_df.empty and post_df.empty and records:
             latest_df = pd.read_sql_table(records[0].table_name, engine)
             cols = [c.lower() for c in latest_df.columns]
             # Check for pre/post keywords in columns
             if any('pre' in c for c in cols) and any('post' in c for c in cols):
                 logger.info(f"Using combined table '{records[0].table_name}' for Observation")
                 pre_df = latest_df
                 post_df = latest_df
    except Exception as e:
        logger.error(f"Error fetching observation data: {e}")
    finally:
        session.close()

    logger.info(f"Observation data loaded: Pre-rows={len(pre_df)}, Post-rows={len(post_df)}")

    if pre_df.empty or post_df.empty:
        logger.warning("Observation data missing (either Pre or Post is empty)")
        # Return empty structure to prevent crashes
        return {
            "status": "no_data",
            "message": "Please upload observation datasets (Pre and Post)",
            "average_growth": 0,
            "students_improved": 0,
            "details_count": 0,
            "student_growth": [],
            "competency_breakdown": {
                "level_comparison": {"pre": 0, "post": 0},
                "communication_comparison": {"pre": 0, "post": 0},
                "fluency_comparison": {"pre": 0, "post": 0},
                "engagement_comparison": {"pre": 0, "post": 0},
                "knowledge_comparison": {"pre": 0, "post": 0},
                "confidence_comparison": {"pre": 0, "post": 0}
            },
            "student_growth_data": []
        }
        
    # Identification
    def get_id_col(d):
        c = [x for x in d.columns if 'name' in x.lower() or 'roll' in x.lower()]
        return c[0] if c else d.columns[0]
        
    pre_id = get_id_col(pre_df)
    post_id = get_id_col(post_df)
    
    # Filter empty
    pre_df = pre_df[pre_df[pre_id].notna() & (pre_df[pre_id].astype(str).str.strip() != "")]
    post_df = post_df[post_df[post_id].notna() & (post_df[post_id].astype(str).str.strip() != "")]
    
    # Merge
    combined = False
    if pre_df is post_df: 
        merged = pre_df
        combined = True
    else:
        # Clean IDs
        pre_df[pre_id] = pre_df[pre_id].astype(str).str.lower().str.strip()
        post_df[post_id] = post_df[post_id].astype(str).str.lower().str.strip()
        merged = pd.merge(pre_df, post_df, left_on=pre_id, right_on=post_id, suffixes=('_pre', '_post'))

    # Competency Analysis
    competencies = ["Communication", "Fluency", "Engagement", "Knowledge", "Confidence", "Level"]
    comp_stats = {}
    
    for comp in competencies:
        # Find columns
        # If combined, look for "Comp Pre"
        # If separate, look for "Comp" in pre_df (which became Comp_pre in merge)
        
        # In merged df, columns are suffixed.
        # heuristic: find column containing 'comp' and 'pre'
        pre_c = [c for c in merged.columns if comp.lower() in c.lower() and ("pre" in c.lower() or (not combined and "_pre" in c))]
        post_c = [c for c in merged.columns if comp.lower() in c.lower() and ("post" in c.lower() or (not combined and "_post" in c))]
        
        pre_val = 0
        post_val = 0
        
        if pre_c: 
            # fillna(0) for safety
            pre_val = pd.to_numeric(merged[pre_c[0]], errors='coerce').fillna(0).mean()
        if post_c: 
            post_val = pd.to_numeric(merged[post_c[0]], errors='coerce').fillna(0).mean()
        
        key = f"{comp.lower()}_comparison"
        comp_stats[key] = {
            "pre": round(pre_val, 2),
            "post": round(post_val, 2)
        }

    # Student Growth Data (Scatter)
    # Try to find Total Score. If not, fallback to 'Level' or 'Average'
    # Or sum the competencies if valid
    
    scatter_data = []
    
    # Find scorable columns
    # We'll use 'Level' if available, else 'Total'
    score_metric = "level" 
    
    pre_score_col = [c for c in merged.columns if score_metric in c.lower() and ("pre" in c.lower() or (not combined and "_pre" in c))]
    post_score_col = [c for c in merged.columns if score_metric in c.lower() and ("post" in c.lower() or (not combined and "_post" in c))]
    
    if pre_score_col and post_score_col:
        pre_sc = pre_score_col[0]
        post_sc = post_score_col[0]
        
        for idx, row in merged.iterrows():
            p = pd.to_numeric(row[pre_sc], errors='coerce') or 0
            pt = pd.to_numeric(row[post_sc], errors='coerce') or 0
            
            # Name
            name_col = pre_id if pre_id in merged.columns else (pre_id + "_pre")
            name = row.get(name_col, f"Student {idx}")
            
            scatter_data.append({
                "name": str(name),
                "pre": round(p, 2),
                "post": round(pt, 2),
                "growth": round(pt - p, 2)
            })
            
    # Calculate global average growth based on scatter data
    avg_growth = 0
    students_improved = 0
    if scatter_data:
        growths = [s['growth'] for s in scatter_data]
        avg_growth = sum(growths) / len(growths)
        students_improved = len([g for g in growths if g > 0])
        
    return {
        "average_growth": round(avg_growth, 2),
        "students_improved": students_improved,
        "details_count": len(merged),
        "competency_breakdown": comp_stats,
        "student_growth_data": scatter_data,
        "student_growth": merged.replace({np.nan: None}).to_dict(orient='records') # Full detail dump
    }
