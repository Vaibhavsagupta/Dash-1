import os
import subprocess
import sys

# Get the absolute path to the backend directory
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, "backend")
seed_script = os.path.join(backend_dir, "seed.py")

if not os.path.exists(seed_script):
    print(f"Error: Could not find seed script at {seed_script}")
    sys.exit(1)

print(f"Running database seeder from {backend_dir}...")

# Run the backend seeder
try:
    # Use the same python executable as the current one
    subprocess.run([sys.executable, seed_script], cwd=backend_dir, check=True)
except subprocess.CalledProcessError as e:
    print(f"Error: Seeding failed with exit code {e.returncode}")
    sys.exit(e.returncode)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
