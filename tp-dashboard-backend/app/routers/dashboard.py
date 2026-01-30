from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.sys_metadata import UploadHistory
from typing import List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class DatasetSummary(BaseModel):
    id: int
    dataset_type: str
    original_filename: str
    upload_time: datetime
    row_count: int
    status: str

@router.get("/datasets", response_model=List[DatasetSummary])
def list_datasets(db: Session = Depends(get_db)):
    """
    Returns a list of all uploaded datasets with metadata.
    """
    datasets = db.query(UploadHistory).order_by(UploadHistory.upload_time.desc()).all()
    return datasets

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns aggregated stats about the system data.
    """
    total_datasets = db.query(UploadHistory).count()
    last_upload = db.query(UploadHistory).order_by(UploadHistory.upload_time.desc()).first()
    
    return {
        "total_datasets": total_datasets,
        "last_updated": last_upload.upload_time if last_upload else None,
        "status": "Healthy"
    }
