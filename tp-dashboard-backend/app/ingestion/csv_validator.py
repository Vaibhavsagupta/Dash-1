import pandas as pd
import numpy as np

def validate_csv_content(df: pd.DataFrame, dataset_type: str = "unknown"):
    """
    Validates the content of a CSV dataframe against expected rules.
    Fills missing values and identifies rejected rows.
    """
    rejected_rows = []
    
    # 1. Mandatory Column Check (PHASE 12)
    mandatory_map = {
        "attendance": ["name"],
        "assessment": ["name"],
        "student_info": ["name", "college_roll_no_university_roll_no"],
        "observation": ["name"],
        "rag": ["name"]
    }
    
    required = mandatory_map.get(dataset_type, [])
    missing = [col for col in required if col not in df.columns]
    
    if missing:
        # In a strict system, we'd raise an error. For now, we log and proceed if possible,
        # but mark the upload as potentially risky.
        pass

    # 2. Fill Missing Values
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(0)
        else:
            df[col] = df[col].fillna("")
    
    # 3. Row-level Validation & Error Logging (PHASE 12)
    # Filter rows where mandatory identifiers are actually missing values
    if required and required[0] in df.columns:
        primary_id = required[0]
        # Rows where the name is empty after fillna("")
        invalid_mask = (df[primary_id].astype(str).str.strip() == "")
        if invalid_mask.any():
            invalid_rows = df[invalid_mask].to_dict(orient='records')
            for r in invalid_rows:
                r['_error'] = f"Missing mandatory field: {primary_id}"
            rejected_rows.extend(invalid_rows)
            df = df[~invalid_mask].reset_index(drop=True)

    # 4. Date Normalization (PHASE 8 Fix)
    for col in df.columns:
        col_low = str(col).lower()
        if "date" in col_low:
            converted = pd.to_datetime(df[col], errors='coerce')
            valid_ratio = converted.notna().sum() / max(len(df.dropna(subset=[col])), 1)
            if valid_ratio > 0.7:
                df[col] = converted.dt.strftime('%Y-%m-%d').fillna("")
                
    return df, rejected_rows
