import pandas as pd
from sqlalchemy import text
from app.core.database import engine, SessionLocal
from app.models.sys_metadata import UploadHistory

import logging

logger = logging.getLogger(__name__)

class DynamicAnalyticsEngine:
    
    @staticmethod
    def get_latest_dataset(dataset_type: str) -> pd.DataFrame:
        """
        Fetches the dataframe for the latest upload of a given type.
        """
        session = SessionLocal()
        try:
            record = session.query(UploadHistory)\
                .filter(UploadHistory.dataset_type == dataset_type)\
                .order_by(UploadHistory.upload_time.desc())\
                .first()
            
            if not record:
                logger.warning(f"No record found for dataset_type: {dataset_type}")
                return pd.DataFrame() # Empty if not found
                
            table_name = record.table_name
            logger.info(f"Fetching dataset_type '{dataset_type}' from table '{table_name}'")
            
            try:
                df = pd.read_sql_table(table_name, engine)
                logger.info(f"Query returned {len(df)} rows from table '{table_name}'")
                return df
            except ValueError as e:
                logger.error(f"Error reading table '{table_name}': {e}")
                return pd.DataFrame() 
                
        except Exception as e:
            logger.error(f"Error fetching dataset {dataset_type}: {e}")
            return pd.DataFrame() # Return empty on error
        finally:
            session.close()
