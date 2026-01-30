from app.analytics.observation import analyze_observation
from app.analytics.rag import analyze_rag

def get_comprehensive_stats():
    # Fetch detailed observation stats
    obs = analyze_observation()
    
    # Fetch RAG
    rag = analyze_rag()
    
    # Flatten structure for frontend
    response = {
        "student_count": obs.get("details_count", 0),
        "rag_distribution": rag.get("rag_distribution", {"Green": 0, "Amber": 0, "Red": 0}),
        "student_growth_data": obs.get("student_growth_data", []),
        # Spread competency breakdown
    }
    
    # Add competencies
    if "competency_breakdown" in obs:
        for k, v in obs["competency_breakdown"].items():
            response[k] = v
            
    # Fallback default keys if missing (prevent frontend crash)
    defaults = ["level_comparison", "communication_comparison", "fluency_comparison", "engagement_comparison", "knowledge_comparison", "confidence_comparison"]
    for d in defaults:
        if d not in response:
            response[d] = {"pre": 0, "post": 0}
            
    # Ensure RAG keys exist (Capitalized vs Lowercase tweak if needed)
    # Frontend expects Capital keys: Green, Amber, Red.
    # rag.py returns lowercase keys? Let's check rag.py... it returns "red", "amber", "green".
    # We need to map them.
    orig_rag = rag.get("rag_distribution", {})
    response["rag_distribution"] = {
        "Green": orig_rag.get("green", 0),
        "Amber": orig_rag.get("amber", 0),
        "Red": orig_rag.get("red", 0)
    }
    
    return response
