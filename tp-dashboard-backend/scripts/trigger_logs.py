import logging
import sys

# Configure logging to stdout for this test
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

from app.analytics.attendance import analyze_attendance
from app.analytics.assessment import analyze_assessment
from app.analytics.observation import analyze_observation
from app.analytics.rag import analyze_rag

print("--- Triggering Analytics Hooks with Logging ---")

print("\n[Attendance]")
analyze_attendance()

print("\n[Assessment]")
analyze_assessment()

print("\n[Observation]")
analyze_observation()

print("\n[RAG]")
analyze_rag()

print("\n--- Diagnostic Run Complete ---")
