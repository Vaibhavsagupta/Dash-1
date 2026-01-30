from sqlalchemy import Column, Integer, String
from app.core.database import Base

class DynamicTable(Base):
    __tablename__ = "dynamic_tables"
    
    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String, unique=True, index=True)
    # This model will likely need to be much more complex or generated dynamically
