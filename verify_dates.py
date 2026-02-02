import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from app.database import SessionLocal
from app.models import Student

db = SessionLocal()
s = db.query(Student).first()
if s:
    print(f"Student: {s.name}")
    print(f"Start Date: {s.start_date}")
    print(f"End Date: {s.end_date}")
else:
    print("No students found.")
db.close()
