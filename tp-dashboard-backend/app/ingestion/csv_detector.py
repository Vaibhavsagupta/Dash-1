import pandas as pd
import numpy as np

def detect_csv_structure(file_path: str):
    """
    Analyzes a CSV file to determine its structure, headers, and potential types.
    """
    try:
        # Read only the first few rows to infer schema efficiently
        if file_path.lower().endswith('.xlsx') or file_path.lower().endswith('.xls'):
            df = pd.read_excel(file_path, nrows=100)
        else:
            df = pd.read_csv(file_path, nrows=100)
        
        columns = df.columns.tolist()
        total_rows = 0 # We don't want to read the whole file just for this if it's huge, 
                       # but for accurate type detection on small files it's fine. 
                       # Let's stick to simple type inference from head.
        
        # Categorize columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        date_cols = []
        categorical_cols = []
        
        for col in df.select_dtypes(include=['object', 'category']).columns:
            col_str = str(col).lower()
            # tailored heuristic for date detection
            if "date" in col_str or "time" in col_str:
                 try:
                     pd.to_datetime(df[col], errors='raise')
                     date_cols.append(col)
                     continue
                 except:
                     pass
            
            # If unique values are few compared to total non-null, likely categorical
            if df[col].nunique() < 20: 
                categorical_cols.append(col)
        
        # In case we missed some based on names, try to parse generally (expensive, so maybe skip for now or keep simple)
        
        # Identify Dataset Type
        from app.ingestion.schema_registry import SchemaRegistry
        dataset_type = SchemaRegistry.identify_dataset_type(columns)
        
        return {
            "columns": columns,
            "numeric_columns": numeric_cols,
            "date_columns": date_cols,
            "categorical_columns": categorical_cols,
            "sample_data": df.head(5).to_dict(orient='records'),
            "dataset_type": dataset_type
        }
    except Exception as e:
        return {"error": str(e)}
