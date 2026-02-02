
# -----------------------------------------------------------
# Google Sheets Sync Script (Template)
# -----------------------------------------------------------
# Instructions:
# 1. Enable Google Sheets API in Google Cloud Console
# 2. Create Service Account & Download credentials.json
# 3. Share your target sheet with the Service Account Email
# 4. Install: pip install gspread oauth2client requests
# -----------------------------------------------------------

import gspread
from oauth2client.service_account import ServiceAccountCredentials
import requests
import sys

# CONFIGURATION
SHEET_NAME = "HR_Student_Data"
API_ENDPOINT = "http://localhost:7000/ingest/csv" # We can reuse the CSV endpoint if we format data, or create a direct JSON one.
# For this script, let's assume we push directly to a JSON endpoint or specific /sync endpoint if we built it.
# Actually, since we built a /csv endpoint, let's adapt this script to just hit the DB directly or call a new endpoint.
# But for "Ingestion", usually this script runs on the server.

def sync_data():
    try:
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        
        # NOTE: You must place your credentials.json in this directory
        creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scope)
        client = gspread.authorize(creds)
        
        sheet = client.open(SHEET_NAME).sheet1
        records = sheet.get_all_records() # Returns list of dicts
        
        print(f"Fetched {len(records)} records from Google Sheet.")
        
        # In a real scenario, we would POST this `records` list to an API endpoint.
        # requests.post("http://localhost:8000/ingest/json-dump", json=records)
        
        print("Sync completed.")
        
    except Exception as e:
        print(f"Sync failed: {e}")
        print("Note: This script requires a valid 'credentials.json' from Google Cloud.")

if __name__ == "__main__":
    sync_data()
