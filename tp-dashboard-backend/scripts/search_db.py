import sqlite3

def search_value(value):
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cursor.fetchall()]
    
    print(f"Searching for '{value}'...")
    found_any = False
    for table in tables:
        cursor.execute(f"PRAGMA table_info({table})")
        cols = [r[1] for r in cursor.fetchall()]
        for col in cols:
            try:
                # Use a safer query for searching
                cursor.execute(f'SELECT COUNT(*) FROM "{table}" WHERE "{col}" LIKE ?', (f'%{value}%',))
                count = cursor.fetchone()[0]
                if count > 0:
                    print(f"✅ Found in table '{table}', column '{col}': {count} rows")
                    found_any = True
            except Exception as e:
                pass
                
    if not found_any:
        print(f"❌ '{value}' not found in any table.")
        
        # If not found, let's see what batch_ids DO exist
        print("\nAvailable values in columns containing 'batch' or 'info':")
        for table in tables:
            cursor.execute(f"PRAGMA table_info({table})")
            cols = [r[1] for r in cursor.fetchall()]
            batch_cols = [c for c in cols if 'batch' in c.lower() or 'info' in c.lower()]
            for c in batch_cols:
                cursor.execute(f'SELECT DISTINCT "{c}" FROM "{table}" LIMIT 5')
                vals = [str(r[0]) for r in cursor.fetchall()]
                if vals:
                    print(f"  {table}.{c}: {vals}")
                    
    conn.close()

if __name__ == "__main__":
    search_value('BTECH-AIML')
