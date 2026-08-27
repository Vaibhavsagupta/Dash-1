"""
Dataset Preparation Script for Custom Academic Question Generation Model Fine-Tuning.
Exports verified questions from Question Bank to instruction-tuning JSONL format.
"""

import os
import sys
import json
import random
from typing import List, Dict, Any

# Add parent directory to path so app modules can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.main # Ensures all SQLAlchemy models & mappers are loaded
from app.database import SessionLocal
from app import models

def export_question_bank_to_dataset(output_dir: str = None) -> Dict[str, Any]:
    """
    Exports verified questions from the database into train and validation JSONL datasets.
    """
    if not output_dir:
        output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "training")
    
    os.makedirs(output_dir, exist_ok=True)
    db = SessionLocal()
    try:
        items = db.query(models.QuestionBankItem).all()
        dataset_records = []

        for it in items:
            options = []
            if it.options_json:
                try:
                    options = json.loads(it.options_json)
                except Exception:
                    options = []

            # Format Instruction-Tuning Pair
            prompt = (
                f"Instruction: Generate an academic assessment question.\n"
                f"Subject: {it.subject}\n"
                f"Topic: {it.topic}\n"
                f"Subtopic: {it.subtopic or it.topic}\n"
                f"Difficulty: {it.difficulty}\n"
                f"Bloom Level: {it.bloom_taxonomy}\n"
                f"Question Type: {it.question_type}"
            )

            target_output = json.dumps({
                "question_text": it.question_text,
                "question_type": it.question_type,
                "options": options,
                "correct_answer": it.correct_answer,
                "explanation": it.explanation or "",
                "difficulty": it.difficulty,
                "bloom_taxonomy": it.bloom_taxonomy
            })

            dataset_records.append({
                "prompt": prompt,
                "completion": target_output
            })

        # If dataset is small, augment with synthetic curriculum prompts to reach baseline
        if len(dataset_records) < 10:
            print(f"[Dataset Prep] Augmenting dataset with synthetic baseline curriculum pairs...")
            from app.services.ai import MOCK_QUESTIONS_POOL
            for subj, topics in MOCK_QUESTIONS_POOL.items():
                for top, q_list in topics.items():
                    for q in q_list:
                        prompt = (
                            f"Instruction: Generate an academic assessment question.\n"
                            f"Subject: {subj}\n"
                            f"Topic: {top}\n"
                            f"Subtopic: {q.get('subtopic', top)}\n"
                            f"Difficulty: {q.get('difficulty', 'Medium')}\n"
                            f"Bloom Level: Understand\n"
                            f"Question Type: {q.get('question_type', 'MCQ')}"
                        )
                        target_output = json.dumps({
                            "question_text": q["question_text"],
                            "question_type": q["question_type"],
                            "options": q.get("options", []),
                            "correct_answer": q["correct_answer"],
                            "explanation": q.get("explanation", ""),
                            "difficulty": q.get("difficulty", "Medium"),
                            "bloom_taxonomy": "Understand"
                        })
                        dataset_records.append({
                            "prompt": prompt,
                            "completion": target_output
                        })

        random.shuffle(dataset_records)
        split_idx = max(1, int(len(dataset_records) * 0.8))
        train_data = dataset_records[:split_idx]
        val_data = dataset_records[split_idx:]

        train_path = os.path.join(output_dir, "qg_train.jsonl")
        val_path = os.path.join(output_dir, "qg_val.jsonl")

        with open(train_path, "w", encoding="utf-8") as f:
            for rec in train_data:
                f.write(json.dumps(rec) + "\n")

        with open(val_path, "w", encoding="utf-8") as f:
            for rec in val_data:
                f.write(json.dumps(rec) + "\n")

        stats = {
            "total_samples": len(dataset_records),
            "train_samples": len(train_data),
            "val_samples": len(val_data),
            "train_file": train_path,
            "val_file": val_path
        }
        print(f"[Dataset Prep] Completed successfully: {stats}")
        return stats
    finally:
        db.close()

if __name__ == "__main__":
    export_question_bank_to_dataset()
