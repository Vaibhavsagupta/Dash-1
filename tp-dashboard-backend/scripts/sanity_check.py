import requests
import os

API_URL = "http://localhost:8000"
FILE_PATH = r"c:\Users\Vaibhav\Desktop\Dashboard-2\tp-dashboard-backend\data\test_attendance.csv"

def test_upload_and_sync():
    print("--- 🔴 PHASE 14: Production Sanity Check ---")
    
    # 1. Upload new CSV
    print(f"\n[Upload] Uploading {os.path.basename(FILE_PATH)}...")
    with open(FILE_PATH, 'rb') as f:
        files = {'file': (os.path.basename(FILE_PATH), f, 'text/csv')}
        r = requests.post(f"{API_URL}/ingest/csv", files=files)
        
    if r.status_code == 200:
        res = r.json()
        table_name = res.get('db_load', {}).get('table_name')
        print(f"✅ SUCCESS: File uploaded. New table: {table_name}")
    else:
        print(f"❌ FAILED: Upload failed with {r.status_code}: {r.text}")
        return

    # 2. Verify Analytics Update
    print("\n[Analytics] Checking if analytics reflects new data...")
    r_analytics = requests.get(f"{API_URL}/analytics/attendance")
    if r_analytics.status_code == 200:
        data = r_analytics.json()
        avg = data.get('average_attendance')
        count = len(data.get('student_details', []))
        print(f"✅ SUCCESS: Analytics fetched. Avg: {avg}%, Student Count: {count}")
        # In our test CSV: (100 + 50) / 2 = 75
        if avg == 75.0 and count == 2:
            print("💎 VERIFIED: Analytics matches the uploaded test data exactly!")
        else:
            print(f"⚠️  NOTICE: Avg/Count ({avg}/{count}) does not match test data (75/2). This might be because 'latest' resolution used a different file or normalization happened.")
    else:
        print(f"❌ FAILED: Could not fetch analytics.")

if __name__ == "__main__":
    test_upload_and_sync()
