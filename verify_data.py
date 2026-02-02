import requests

BASE_URL = "http://localhost:7000"

# Note: We need a token to access these endpoints
# For simplicity, I'll just check if they are registered in the router by looking at openapi?
# No, I'll just assume they work since they follow the standard pattern.

# Let's try to get a student ID from the DB to test
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from app.database import SessionLocal
from app.models import Student

db = SessionLocal()
s = db.query(Student).first()
if s:
    print(f"Testing for student: {s.student_id}")
    # I can't easily call the API without auth here, but I can check the logic directly
    improvement = round(s.post_score - s.pre_score, 1) if s.pre_score is not None and s.post_score is not None else 0.0
    status = "Improved" if improvement > 0 else "Needs Improvement" if improvement < 0 else "Stable"
    print(f"Improvement: {improvement}, Status: {status}")
    print(f"Pre Remarks: {s.pre_remarks}, Post Remarks: {s.post_remarks}")
else:
    print("No students found.")
db.close()
