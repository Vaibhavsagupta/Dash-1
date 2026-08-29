import io
import json
import random
from typing import List, Dict, Any, Optional
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from .. import models

VALID_TYPES = {"MCQ", "Multiple Select", "Short Answer", "Coding", "True/False"}
VALID_DIFFICULTIES = {"Easy", "Medium", "Hard"}
VALID_BLOOM = {"Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"}

def normalize_col(name: str) -> str:
    """Normalizes column names to snake_case lowercase."""
    return str(name).strip().lower().replace(" ", "_").replace("-", "_")

def generate_sample_template(file_format: str = "xlsx") -> io.BytesIO:
    """
    Generates a pre-populated sample template for bulk question upload.
    Supports Excel (.xlsx) and CSV (.csv).
    """
    data = [
        {
            "Question Text": "What is the worst-case time complexity of searching in a balanced Binary Search Tree (AVL / Red-Black)?",
            "Question Type": "MCQ",
            "Subject": "Data Structures",
            "Topic": "Trees",
            "Subtopic": "Binary Search Trees",
            "Difficulty": "Medium",
            "Bloom Taxonomy": "Understand",
            "Option A": "O(1)",
            "Option B": "O(log n)",
            "Option C": "O(n)",
            "Option D": "O(n log n)",
            "Correct Answer": "O(log n)",
            "Explanation": "In a self-balancing binary search tree, the height is guaranteed to be O(log n), so search is O(log n)."
        },
        {
            "Question Text": "Which of the following data structures follow the LIFO (Last In First Out) principle?",
            "Question Type": "MCQ",
            "Subject": "Data Structures",
            "Topic": "Stacks",
            "Subtopic": "LIFO Architecture",
            "Difficulty": "Easy",
            "Bloom Taxonomy": "Remember",
            "Option A": "Queue",
            "Option B": "Stack",
            "Option C": "Array",
            "Option D": "Linked List",
            "Correct Answer": "Stack",
            "Explanation": "Stack follows Last In First Out (LIFO) order where the last element inserted is removed first."
        },
        {
            "Question Text": "Which of the following sorting algorithms have an average-case time complexity of O(n log n)?",
            "Question Type": "Multiple Select",
            "Subject": "Data Structures",
            "Topic": "Sorting",
            "Subtopic": "Divide and Conquer",
            "Difficulty": "Hard",
            "Bloom Taxonomy": "Analyze",
            "Option A": "Merge Sort",
            "Option B": "Bubble Sort",
            "Option C": "Heap Sort",
            "Option D": "Quick Sort",
            "Correct Answer": "Merge Sort, Heap Sort, Quick Sort",
            "Explanation": "Merge Sort, Heap Sort, and Quick Sort average O(n log n), while Bubble Sort is O(n^2)."
        },
        {
            "Question Text": "Explain the concept of Primary Key vs Foreign Key in Relational Database Management Systems.",
            "Question Type": "Short Answer",
            "Subject": "DBMS",
            "Topic": "Relational Models",
            "Subtopic": "Integrity Constraints",
            "Difficulty": "Medium",
            "Bloom Taxonomy": "Understand",
            "Option A": "",
            "Option B": "",
            "Option C": "",
            "Option D": "",
            "Correct Answer": "A Primary Key uniquely identifies a record in a table and cannot be NULL. A Foreign Key references the Primary Key of another table to establish relationships and maintain referential integrity.",
            "Explanation": "Primary Key provides entity integrity while Foreign Key enforces referential integrity."
        },
        {
            "Question Text": "Arrays in Python (lists) are homogeneous and must contain elements of the same data type.",
            "Question Type": "True/False",
            "Subject": "Python Programming",
            "Topic": "Data Types",
            "Subtopic": "Lists",
            "Difficulty": "Easy",
            "Bloom Taxonomy": "Remember",
            "Option A": "True",
            "Option B": "False",
            "Option C": "",
            "Option D": "",
            "Correct Answer": "False",
            "Explanation": "Python lists are heterogeneous and can hold elements of different data types (integers, strings, objects)."
        }
    ]

    df = pd.DataFrame(data)
    output = io.BytesIO()

    if file_format.lower() == "csv":
        df.to_csv(output, index=False)
    else:
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Question_Bank_Template")
            
            # Format column widths
            worksheet = writer.sheets["Question_Bank_Template"]
            for col in worksheet.columns:
                max_len = max(len(str(cell.value or "")) for cell in col)
                col_letter = col[0].column_letter
                worksheet.column_dimensions[col_letter].width = max(max_len + 3, 14)

    output.seek(0)
    return output

def parse_and_validate_bulk_file(
    file_bytes: bytes,
    filename: str,
    teacher_id: Optional[str],
    db: Session,
    default_subject: Optional[str] = None,
    default_topic: Optional[str] = None
) -> Dict[str, Any]:
    """
    Parses and ingests an uploaded Excel (.xlsx) or CSV (.csv) question bank file.
    Returns details on saved rows, skipped rows, and validation errors.
    """
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            return {"error": "Unsupported file format. Please upload an Excel (.xlsx) or CSV file."}
    except Exception as e:
        return {"error": f"Failed to parse file content: {str(e)}"}

    if df.empty:
        return {"error": "The uploaded spreadsheet is empty."}

    # Map column aliases
    col_map = {normalize_col(c): c for c in df.columns}
    
    def get_val(row, aliases, default=""):
        for a in aliases:
            norm = normalize_col(a)
            if norm in col_map:
                val = row[col_map[norm]]
                if pd.notna(val):
                    return str(val).strip()
        return default

    saved_items = []
    errors = []

    for index, row in df.iterrows():
        row_num = index + 2  # 1-indexed header + 1
        q_text = get_val(row, ["question_text", "question", "question_description", "problem_statement"])
        if not q_text or len(q_text) < 5:
            errors.append(f"Row {row_num}: Missing or too short question text.")
            continue

        q_type_raw = get_val(row, ["question_type", "type", "q_type"], "MCQ")
        # Normalize question type
        q_type = "MCQ"
        for vt in VALID_TYPES:
            if vt.lower() == q_type_raw.lower() or vt.lower() in q_type_raw.lower():
                q_type = vt
                break
        if "true" in q_type_raw.lower() or "false" in q_type_raw.lower():
            q_type = "True/False"

        subject = get_val(row, ["subject", "course", "subject_name"], default_subject or "General")
        topic = get_val(row, ["topic", "unit", "chapter", "module"], default_topic or "General")
        subtopic = get_val(row, ["subtopic", "concept", "sub_topic"], None)

        diff_raw = get_val(row, ["difficulty", "level"], "Medium").capitalize()
        difficulty = diff_raw if diff_raw in VALID_DIFFICULTIES else "Medium"

        bloom_raw = get_val(row, ["bloom_taxonomy", "bloom", "bloom_level"], "Understand").capitalize()
        bloom = bloom_raw if bloom_raw in VALID_BLOOM else "Understand"

        # Collect options for MCQs and Multiple Select
        options = []
        for opt_label in ["option_a", "option_b", "option_c", "option_d", "option_e"]:
            opt_val = get_val(row, [opt_label, opt_label.replace("_", " ")], "")
            if opt_val:
                options.append(opt_val)

        # If options are in a single column separated by comma or semicolon
        if not options and q_type in ["MCQ", "Multiple Select"]:
            combined_opts = get_val(row, ["options", "choices"], "")
            if combined_opts:
                if ";" in combined_opts:
                    options = [o.strip() for o in combined_opts.split(";") if o.strip()]
                elif "|" in combined_opts:
                    options = [o.strip() for o in combined_opts.split("|") if o.strip()]
                else:
                    options = [o.strip() for o in combined_opts.split(",") if o.strip()]

        if q_type == "True/False" and not options:
            options = ["True", "False"]

        correct_ans = get_val(row, ["correct_answer", "answer", "correct_option", "key"], "")
        if not correct_ans:
            errors.append(f"Row {row_num}: Missing correct answer.")
            continue

        # If answer is just 'A', 'B', 'C', 'D' for MCQ, map to option text if possible
        if q_type == "MCQ" and len(correct_ans) == 1 and correct_ans.upper() in ["A", "B", "C", "D"]:
            idx = ord(correct_ans.upper()) - ord("A")
            if idx < len(options):
                correct_ans = options[idx]

        explanation = get_val(row, ["explanation", "solution", "reason", "rationale"], "")

        item = models.QuestionBankItem(
            teacher_id=teacher_id,
            question_text=q_text,
            question_type=q_type,
            options_json=json.dumps(options) if options else None,
            correct_answer=correct_ans,
            explanation=explanation,
            difficulty=difficulty,
            bloom_taxonomy=bloom,
            subject=subject,
            topic=topic,
            subtopic=subtopic
        )
        db.add(item)
        saved_items.append(item)

    if saved_items:
        db.commit()

    return {
        "total_rows": len(df),
        "saved_count": len(saved_items),
        "skipped_count": len(errors),
        "errors": errors[:15]  # Return first 15 errors for preview
    }

def get_question_bank_stats(db: Session, teacher_id: Optional[str] = None) -> Dict[str, Any]:
    """Returns overview statistics of the Question Bank repository."""
    query = db.query(models.QuestionBankItem)
    total_count = query.count()

    # Breakdown by subject
    subject_counts = (
        db.query(models.QuestionBankItem.subject, func.count(models.QuestionBankItem.id))
        .group_by(models.QuestionBankItem.subject)
        .all()
    )

    # Breakdown by question_type
    type_counts = (
        db.query(models.QuestionBankItem.question_type, func.count(models.QuestionBankItem.id))
        .group_by(models.QuestionBankItem.question_type)
        .all()
    )

    # Breakdown by difficulty
    difficulty_counts = (
        db.query(models.QuestionBankItem.difficulty, func.count(models.QuestionBankItem.id))
        .group_by(models.QuestionBankItem.difficulty)
        .all()
    )

    # Breakdown by bloom taxonomy
    bloom_counts = (
        db.query(models.QuestionBankItem.bloom_taxonomy, func.count(models.QuestionBankItem.id))
        .group_by(models.QuestionBankItem.bloom_taxonomy)
        .all()
    )

    # Unique topics
    topics = [t[0] for t in db.query(models.QuestionBankItem.topic).distinct().all() if t[0]]

    return {
        "total_questions": total_count,
        "by_subject": {s: count for s, count in subject_counts if s},
        "by_type": {t: count for t, count in type_counts if t},
        "by_difficulty": {d: count for d, count in difficulty_counts if d},
        "by_bloom": {b: count for b, count in bloom_counts if b},
        "topics": topics
    }

def generate_questions_from_bank(
    db: Session,
    subject: str,
    topic: str,
    question_types: Any,
    count: int,
    difficulty: str
) -> Dict[str, Any]:
    """
    Blueprint-guided sampler from the internal Question Bank.
    Extracts matching verified questions without using external APIs.
    """
    # 1. Base Query for Subject
    query = db.query(models.QuestionBankItem)
    if subject:
        query = query.filter(models.QuestionBankItem.subject.ilike(f"%{subject.strip()}%"))

    # If topic specified, filter by topic
    topic_query = query
    if topic:
        topic_query = query.filter(
            or_(
                models.QuestionBankItem.topic.ilike(f"%{topic.strip()}%"),
                models.QuestionBankItem.subtopic.ilike(f"%{topic.strip()}%")
            )
        )

    matched_items = topic_query.all()
    # Fallback to subject-level pool if topic had too few items
    if len(matched_items) < count:
        matched_items = query.all()

    if not matched_items:
        return {
            "source": "question_bank",
            "found_count": 0,
            "requested_count": count,
            "questions": []
        }

    # Group available items by type
    items_by_type: Dict[str, List[models.QuestionBankItem]] = {}
    for item in matched_items:
        items_by_type.setdefault(item.question_type, []).append(item)

    selected: List[models.QuestionBankItem] = []
    used_ids = set()

    def pick_from_pool(pool: List[models.QuestionBankItem], n: int, target_diff: str) -> List[models.QuestionBankItem]:
        available = [it for it in pool if it.id not in used_ids]
        if not available:
            return []
        
        # Prioritize matching target difficulty
        exact_diff = [it for it in available if it.difficulty.lower() == target_diff.lower()]
        other_diff = [it for it in available if it.difficulty.lower() != target_diff.lower()]

        chosen = []
        random.shuffle(exact_diff)
        random.shuffle(other_diff)

        for it in exact_diff[:n]:
            chosen.append(it)
            used_ids.add(it.id)

        shortfall = n - len(chosen)
        if shortfall > 0:
            for it in other_diff[:shortfall]:
                chosen.append(it)
                used_ids.add(it.id)

        return chosen

    # Handle distribution: Dict[str, int] or List[str]
    type_counts_dict: Dict[str, int] = {}
    if isinstance(question_types, dict):
        type_counts_dict = {k: int(v) for k, v in question_types.items() if int(v) > 0}
    elif isinstance(question_types, list) and question_types:
        per_type = count // len(question_types)
        rem = count % len(question_types)
        for idx, t in enumerate(question_types):
            type_counts_dict[t] = per_type + (1 if idx < rem else 0)
    else:
        type_counts_dict = {"MCQ": count}

    for q_type, q_count in type_counts_dict.items():
        pool = items_by_type.get(q_type, [])
        if not pool:
            # Try case-insensitive matching
            for k, v in items_by_type.items():
                if k.lower() == q_type.lower() or (
                    ("fill" in q_type.lower() and "fill" in k.lower()) or
                    ("select" in q_type.lower() and "select" in k.lower()) or
                    ("mcq" in q_type.lower() and "mcq" in k.lower())
                ):
                    pool = v
                    break
        if pool:
            picked = pick_from_pool(pool, q_count, difficulty)
            selected.extend(picked)

    # If count still not satisfied, fill with any remaining available questions
    shortfall = count - len(selected)
    if shortfall > 0:
        remaining = [it for it in matched_items if it.id not in used_ids]
        random.shuffle(remaining)
        for it in remaining[:shortfall]:
            selected.append(it)
            used_ids.add(it.id)

    # Format into standard test questions output
    formatted_questions = []
    for item in selected:
        options = []
        if item.options_json:
            try:
                options = json.loads(item.options_json)
            except Exception:
                options = []

        formatted_questions.append({
            "question_text": item.question_text,
            "question_type": item.question_type,
            "options": options,
            "correct_answer": item.correct_answer,
            "explanation": item.explanation or "",
            "difficulty": item.difficulty,
            "bloom_taxonomy": item.bloom_taxonomy,
            "subject": item.subject,
            "topic": item.topic,
            "subtopic": item.subtopic or "",
            "source": "question_bank",
            "bank_item_id": item.id
        })

    return {
        "source": "question_bank",
        "found_count": len(formatted_questions),
        "requested_count": count,
        "questions": formatted_questions
    }
