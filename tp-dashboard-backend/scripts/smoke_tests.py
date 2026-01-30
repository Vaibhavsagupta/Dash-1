import requests
import sqlite3
import os

# Configuration
API_URL = "http://localhost:8000"
DB_PATH = "test.db"

def run_smoke_tests():
    print("--- 🔴 PHASE 11: Automated Smoke Tests ---")
    
    # 1. Database Integrity Test
    print("\n[DB] Checking SQLite connectivity and seed status...")
    if not os.path.exists(DB_PATH):
        print(f"❌ FAILED: Database file {DB_PATH} not found.")
        return
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM dataset_uploads")
        count = cursor.fetchone()[0]
        print(f"✅ SUCCESS: Found {count} dataset uploads in tracking table.")
        conn.close()
    except Exception as e:
        print(f"❌ FAILED: DB Query error - {e}")

    # 2. View Resolution Test
    print("\n[View] Verifying latest views...")
    views = ["attendance_latest", "assessment_latest", "student_info_latest"]
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        for v in views:
            cursor.execute(f"SELECT COUNT(*) FROM {v}")
            c = cursor.fetchone()[0]
            print(f"✅ SUCCESS: {v} is active with {c} rows.")
        conn.close()
    except Exception as e:
        print(f"❌ FAILED: View check error - {e}")

    # 3. API Health Test
    print("\n[API] Pinging Analytics Endpoints...")
    endpoints = [
        "/analytics/attendance",
        "/analytics/assessment",
        "/analytics/rag",
        "/analytics/dashboard/admin",
        "/analytics/students/all"
    ]
    
    for ep in endpoints:
        try:
            r = requests.get(API_URL + ep, timeout=5)
            if r.status_code == 200:
                data = r.json()
                if isinstance(data, dict):
                    # Check for status: no_data or actual content keys
                    if data.get("status") == "no_data":
                        print(f"⚠️  WARNING: {ep} returned 'no_data' (Expected if DB empty, check logs if not)")
                    else:
                        print(f"✅ SUCCESS: {ep} returned valid JSON data.")
                elif isinstance(data, list):
                    print(f"✅ SUCCESS: {ep} returned {len(data)} items.")
            else:
                print(f"❌ FAILED: {ep} returned status {r.status_code}")
        except Exception as e:
            print(f"❌ FAILED: Could not reach {ep} - {e}")

    print("\n--- Smoke Test Run Complete ---")

if __name__ == "__main__":
    run_smoke_tests()
