import pandas as pd
import re
import json
import os
from datetime import datetime
from app.core.database import engine

def clean_column_name(col: str) -> str:
    """
    Sanitizes column names for SQL compatibility.
    Rule: lowercase, replace spaces with _, trim whitespace.
    """
    if not col:
        return "unnamed"
    
    clean = str(col).strip().lower().replace(" ", "_")
    
    if not clean:
        return "unnamed"
    return clean

def load_csv_to_db(file_path: str, dataset_type: str, upload_id: str, original_filename: str = None):
    """
    Loads a CSV file into a dynamically generated table in the database.
    Also records the upload in the tracking table.
    """
    try:
        # Read the file
        if file_path.lower().endswith('.xlsx') or file_path.lower().endswith('.xls'):
            df = pd.read_excel(file_path)
        else:
            df = pd.read_csv(file_path)
        
        # Sanitize column names
        # Sanitize column names
        cleaned_columns = [clean_column_name(c) for c in df.columns]
        
        # Deduplicate
        seen = set()
        final_cols = []
        for c in cleaned_columns:
            new_c = c
            counter = 1
            while new_c in seen:
                new_c = f"{c}_{counter}"
                counter += 1
            seen.add(new_c)
            final_cols.append(new_c)
        
        df.columns = final_cols
        
        df.columns = final_cols
        
        # 1. Column Hardening (PHASE 12)
        # Verify if minimum required columns exist
        from app.ingestion.csv_validator import validate_csv_content
        
        # VALIDATE AND CLEAN (Pass dataset_type for schema enforcement)
        df, rejected_rows = validate_csv_content(df, dataset_type)
        
        # 2. Strict Batch ID Injection (PHASE 12)
        # Use filename as default batch_id if not explicitly provided
        batch_id = original_filename if original_filename else upload_id
        
        # Add system columns
        df['_uploaded_at'] = datetime.now()
        df['_upload_id'] = upload_id
        df['_batch_id'] = batch_id 
        # Format: {dataset_type}_{timestamp}
        # e.g., assessment_20260130_123045_123456
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        table_name = f"{dataset_type}_{timestamp_str}"
        
        # Write to SQLite
        # if_exists='fail' ensures we are creating a new table as requested (unique timestamp)
        df.to_sql(table_name, engine, if_exists='fail', index=False)
        
        # Record Upload Metadata
        from app.core.database import SessionLocal
        from app.models.sys_metadata import UploadHistory
        
        display_filename = original_filename or os.path.basename(file_path)
        
        session = SessionLocal()
        try:
            upload_record = UploadHistory(
                dataset_type=dataset_type,
                table_name=table_name,
                original_filename=display_filename,
                row_count=len(df),
                status="success",
                metadata_json=json.dumps({"rejected_rows": len(rejected_rows)})
            )
            session.add(upload_record)
            session.commit()
        except:
            session.rollback()
            raise
        finally:
            session.close()
        
        return {
            "success": True,
            "table_name": table_name,
            "rows": len(df),
            "rejected_rows": len(rejected_rows),
            "columns": df.columns.tolist()
        }
        
    except Exception as e:
        import traceback
        return {"success": False, "error": str(e) + "\n" + traceback.format_exc()}
