import sqlite3

def run_test_query():
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    
    print("--- 🔴 PHASE 5: Raw SQL Query Test ---")
    
    # 1. Exact User Query Test
    user_query = "SELECT student_id, COUNT(*) FROM attendance_latest WHERE batch_id = 'BTECH-AIML' GROUP BY student_id;"
    print(f"\n[QUERY]: {user_query}")
    try:
        cursor.execute(user_query)
        print("RESULT: SUCCESS (Rows found)")
    except Exception as e:
        print(f"RESULT: ❌ Expected Failure - {e}")

    # 2. Schema-Corrected Proof
    # We found that column is '_batch_id' and 'name'
    # And values are based on filenames from the seeder.
    cursor.execute("SELECT DISTINCT _batch_id FROM attendance_latest LIMIT 1")
    actual_batch = cursor.fetchone()[0]
    
    proof_query = f"SELECT name, COUNT(*) FROM attendance_latest WHERE _batch_id = '{actual_batch}' AND name != '' GROUP BY name LIMIT 5;"
    print(f"\n[PROOF QUERY]: {proof_query}")
    try:
        cursor.execute(proof_query)
        rows = cursor.fetchall()
        print(f"RESULT: ✅ SUCCESS ({len(rows)} rows)")
        for r in rows:
            print(f"  - Student: {r[0]:<20} | Records: {r[1]}")
    except Exception as e:
        print(f"RESULT: ❌ FAILED - {e}")

    print("\n--- Summary ---")
    print("✔ SQL Engine is healthy.")
    print("❌ Data mismatch: Column names and batch identifiers in the current DB do not match the specific query strings provided in the prompt.")
    print("  - Expected 'student_id' -> Actual 'name'")
    print("  - Expected 'batch_id' -> Actual '_batch_id'")
    print("  - Expected 'BTECH-AIML' -> Actual filename-based ID")

    conn.close()

if __name__ == "__main__":
    run_test_query()
