from typing import List, Dict

class SchemaRegistry:
    """
    Manages schemas and identifies dataset types based on column fingerprints.
    """
    
    # Define fingerprints for known dataset types
    # Each entry is a list of keywords. If a sufficient number of these keywords 
    # appear in the columns (partial match), we classify the dataset.
    FINGERPRINTS = {
        "assessment": ["technical", "verbal", "logical", "numerical", "marks", "percentage", "score"],
        "student_info": ["roll no", "batch", "phone", "email", "branch", "university", "aadhar"],
        "attendance": ["week", "date", "unnamed: 0", "unnamed: 1"], # Attendance often has messed up headers like Unnamed
        "observation": ["pre", "post", "observation", "growth", "fluency", "confidence"],
        "schedule": ["time", "day", "subject", "classroom", "period"],
        "rag_context": ["context", "question", "answer", "source"]
    }

    @staticmethod
    def identify_dataset_type(columns: List[str]) -> str:
        """
        Identifies the dataset type by comparing column names against fingerprints.
        Returns the confirmed type or 'generic_dataset'.
        """
        best_match = "generic_dataset"
        max_score = 0
        
        # Normalize columns for comparison
        norm_columns = [str(c).lower().strip() for c in columns]
        
        for dataset_type, keywords in SchemaRegistry.FINGERPRINTS.items():
            score = 0
            for keyword in keywords:
                # check if keyword is in any of the columns
                if any(keyword in col for col in norm_columns):
                    score += 1
            
            # Heuristic: If we match more than 30% of key terms or at least 2 strong unique matches
            # We consider it a candidate. We pick the highest score.
            if score > max_score and score >= 2:
                max_score = score
                best_match = dataset_type
                
        return best_match

