import os
import sys
import subprocess

# Setup paths
os.chdir(r"c:\Users\Vaibhav\Desktop\Dashboard-2\tp-dashboard-backend")

def run():
    # 1. Delete DB
    if os.path.exists("test.db"):
        try:
            os.remove("test.db")
            print("Deleted test.db")
        except Exception as e:
            print(f"Error deleting test.db: {e}")
            return # Abort if file locked

    # 2. Init DB
    print("Running init_db.py...")
    subprocess.run([sys.executable, "scripts/init_db.py"], check=True)
    
    # 3. Seed Data
    print("Running seed_data_v2.py...")
    subprocess.run([sys.executable, "scripts/seed_data_v2.py"], check=True)
    
    print("Done.")

if __name__ == "__main__":
    run()
