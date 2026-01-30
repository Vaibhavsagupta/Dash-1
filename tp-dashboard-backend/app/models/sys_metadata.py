from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.core.database import Base

class UploadHistory(Base):
    __tablename__ = "dataset_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    dataset_type = Column(String, index=True)
    table_name = Column(String, unique=True, index=True)
    original_filename = Column(String)
    upload_time = Column(DateTime, default=datetime.utcnow, index=True)
    row_count = Column(Integer)
    status = Column(String) # success, partial, failed
    metadata_json = Column(Text, nullable=True) # Stored as JSON string
