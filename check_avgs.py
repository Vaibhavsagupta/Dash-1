import requests
import json

try:
    r = requests.get("http://localhost:8000/analytics/batch/comprehensive_stats")
    data = r.json()
    print(json.dumps(data.get("subject_avgs", {}), indent=2))
except Exception as e:
    print(f"Error: {e}")
