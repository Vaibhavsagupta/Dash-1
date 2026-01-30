import os
import shutil
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, HTTPException
from app.core.config import settings

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/csv")
async def upload_csv(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.csv', '.xlsx', '.xls']:
        raise HTTPException(status_code=400, detail="Invalid file type. Only CSV or Excel files are allowed.")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_location = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Analyze structure
        from app.ingestion.csv_detector import detect_csv_structure
        structure_analysis = detect_csv_structure(file_location)

        # Identify Dataset Type
        from app.ingestion.schema_registry import SchemaRegistry
        dataset_type = SchemaRegistry.identify_dataset_type(structure_analysis['columns'])
        structure_analysis['dataset_type'] = dataset_type
        
        # Load into Database
        from app.ingestion.csv_loader import load_csv_to_db
        # We use the filename timestamp as a rough upload_id, or just generate one. 
        # The filename variable already contains a timestamp prefix.
        load_result = load_csv_to_db(file_location, dataset_type, upload_id=filename, original_filename=file.filename)
        
        # 3. Smoke Test Assertion (PHASE 11)
        if load_result.get("success") and load_result.get("rows", 0) == 0:
             raise HTTPException(status_code=422, detail="File was parsed but yielded 0 valid rows after cleaning.")
             
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save, analyze, or load file: {str(e)}")
        
    return {
        "filename": filename,
        "original_filename": file.filename,
        "upload_timestamp": datetime.now().isoformat(),
        "location": file_location,
        "structure": structure_analysis,
        "db_load": load_result,
        "message": "CSV successfully uploaded, analyzed, and stored in DB"
    }
