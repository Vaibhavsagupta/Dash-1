import sqlite3
import os

db_path = 'test.db'
if not os.path.exists(db_path):
    print(f"Database {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Tables ---")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in cursor.fetchall()]
for t in tables:
    print(t)

print("\n--- Verifying Counts ---")
# Try the suggested name
try:
    cursor.execute("SELECT COUNT(*) FROM attendance_latest")
    count = cursor.fetchone()[0]
    print(f"attendance_latest: {count}")
except Exception as e:
    print(f"attendance_latest: FAILED ({e})")

# Verify actual timestamped tables
latest_attendance = [t for t in tables if t.startswith('attendance_')][-1] if any(t.startswith('attendance_') for t in tables) else None
latest_assessment = [t for t in tables if t.startswith('assessment_')][-1] if any(t.startswith('assessment_') for t in tables) else None

if latest_attendance:
    cursor.execute(f"SELECT COUNT(*) FROM {latest_attendance}")
    print(f"{latest_attendance}: {cursor.fetchone()[0]}")

if latest_assessment:
    cursor.execute(f"SELECT COUNT(*) FROM {latest_assessment}")
    print(f"{latest_assessment}: {cursor.fetchone()[0]}")

conn.close()
