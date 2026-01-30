import sqlite3

def create_latest_views():
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    
    # Get unique dataset types
    cursor.execute("SELECT DISTINCT dataset_type FROM dataset_uploads")
    types = [row[0] for row in cursor.fetchall()]
    
    for dtype in types:
        # Get latest table for this type
        cursor.execute(f"SELECT table_name FROM dataset_uploads WHERE dataset_type='{dtype}' ORDER BY upload_time DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            table_name = row[0]
            view_name = f"{dtype}_latest"
            print(f"Creating view {view_name} for table {table_name}")
            cursor.execute(f"DROP VIEW IF EXISTS {view_name}")
            cursor.execute(f"CREATE VIEW {view_name} AS SELECT * FROM {table_name}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_latest_views()
