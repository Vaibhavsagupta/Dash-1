import sqlite3
import pandas as pd

def perform_tests():
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    
    print("--- 🔴 PHASE 7: Remove Filters (Isolation Test) ---")
    cursor.execute("SELECT COUNT(*) FROM attendance_latest")
    total_count = cursor.fetchone()[0]
    print(f"Total Rows in attendance_latest: {total_count}")
    
    if total_count > 0:
        print("✅ Data exists without filters. Filter logic is verified as the isolation point.")
    else:
        print("❌ TABLE WRONG: attendance_latest is empty or missing.")

    print("\n--- 🔴 PHASE 8: Date Handling Fix ---")
    cursor.execute("PRAGMA table_info(attendance_latest)")
    columns = cursor.fetchall()
    
    # Heuristic: Find columns that might be dates
    # In this dataset, we saw '22', '23', etc. which are likely days of the month.
    # Let's also look for any ISO or standard date columns.
    
    possible_dates = [col[1] for col in columns if any(char.isdigit() for char in col[1]) and col[1] not in ['_uploaded_at', '_upload_id', '_batch_id']]
    
    if not possible_dates:
        print("No date-like columns found in attendance_latest.")
    else:
        sample_col = possible_dates[0]
        cursor.execute(f'SELECT typeof("{sample_col}"), "{sample_col}" FROM attendance_latest WHERE "{sample_col}" IS NOT NULL LIMIT 5')
        results = cursor.fetchall()
        print(f"Sample Column: '{sample_col}'")
        print(f"Storage Type (SQLite): {results[0][0] if results else 'N/A'}")
        print("Sample Values:")
        for r in results:
            print(f"  - {r[1]}")

    conn.close()

if __name__ == "__main__":
    perform_tests()
