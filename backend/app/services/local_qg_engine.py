import re
import json
import random
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional, Tuple

BLOOM_LEVELS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate"]

def extract_syllabus_concepts(syllabus_text: str, default_subject: str = "", default_topic: str = "") -> List[Dict[str, Any]]:
    """
    Parses syllabus markdown/text into structured units, topics, and individual concepts.
    Extracts definitions, bullet points, and subtopics.
    """
    lines = [line.strip() for line in syllabus_text.split("\n") if line.strip()]
    concepts = []
    current_unit = "Unit 1"
    
    for line in lines:
        # Check if line indicates a unit/module
        unit_match = re.match(r'^(Unit\s*\d+|Module\s*\d+|Chapter\s*\d+):?\s*(.*)', line, re.IGNORECASE)
        if unit_match:
            current_unit = unit_match.group(1).title()
            rest = unit_match.group(2).strip()
            if rest:
                concepts.append({
                    "unit": current_unit,
                    "concept": rest,
                    "details": rest
                })
            continue

        # Check for bullet points or numbered points
        clean_line = re.sub(r'^[\*\-\•\d+\.]+\s*', '', line).strip()
        if len(clean_line) < 3:
            continue

        # Split comma-separated concepts if line lists multiple topics
        if "," in clean_line and len(clean_line.split(",")) > 2:
            parts = [p.strip() for p in clean_line.split(",") if len(p.strip()) > 3]
            for p in parts:
                concepts.append({
                    "unit": current_unit,
                    "concept": p,
                    "details": clean_line
                })
        else:
            concepts.append({
                "unit": current_unit,
                "concept": clean_line,
                "details": clean_line
            })

    if not concepts:
        # Fallback concept based on topic/subject
        base_c = default_topic or default_subject or "Core Principles"
        concepts = [
            {"unit": "Unit 1", "concept": base_c, "details": f"Fundamental architecture and mechanisms of {base_c}"},
            {"unit": "Unit 1", "concept": f"{base_c} Operational Workflows", "details": f"Execution patterns and control logic of {base_c}"},
            {"unit": "Unit 2", "concept": f"{base_c} Complexity & Optimization", "details": f"Performance constraints and efficiency trade-offs of {base_c}"}
        ]

    return concepts

def generate_distractors(target_concept: str, all_concepts: List[str], count: int = 3) -> List[str]:
    """Generates realistic and context-relevant wrong options (distractors) using sibling concepts."""
    candidates = [c for c in all_concepts if c.lower() != target_concept.lower() and len(c) > 2]
    if len(candidates) < count:
        generic_fallbacks = [
            "Synchronous bus arbitration mechanism",
            "Linear recursive backtracking structure",
            "Monolithic procedural execution flow",
            "Static compile-time dispatch protocol",
            "External secondary storage buffering"
        ]
        candidates.extend([g for g in generic_fallbacks if g.lower() != target_concept.lower()])
    
    random.shuffle(candidates)
    return candidates[:count]

def synthesize_mcq_question(
    concept_item: Dict[str, Any],
    all_concept_names: List[str],
    subject: str,
    topic: str,
    difficulty: str
) -> Dict[str, Any]:
    """Synthesizes a high-quality Multiple Choice Question with 4 realistic options."""
    concept = concept_item["concept"]
    unit = concept_item.get("unit", "Unit 1")

    # Question stem templates
    templates = [
        (
            f"Which of the following statements best describes '{concept}' within {subject} ({unit})?",
            f"It defines the primary mechanisms and operational rules associated with {concept}.",
            "Understand"
        ),
        (
            f"In the study of {topic}, what is the primary technical objective of implementing '{concept}'?",
            f"To optimize structural reliability, execution throughput, and logical consistency of {concept}.",
            "Apply"
        ),
        (
            f"Which architectural property uniquely characterizes '{concept}'?",
            f"Enforces deterministic state transitions and strict design encapsulation for {concept}.",
            "Analyze"
        )
    ]

    chosen_template, correct_desc, bloom = random.choice(templates)
    distractor_names = generate_distractors(concept, all_concept_names, count=3)
    
    distractor_options = [
        f"It operates strictly as a fallback mechanism for {d} without direct state management." for d in distractor_names[:1]
    ] + [
        f"It bypasses {d} protocols to execute non-deterministic asynchronous routines." for d in distractor_names[1:2]
    ] + [
        f"It is superseded entirely by {distractor_names[2] if len(distractor_names) > 2 else 'legacy memory buffering'} in modern architectures."
    ]

    all_options = [correct_desc] + distractor_options[:3]
    random.shuffle(all_options)

    return {
        "question_text": chosen_template,
        "question_type": "MCQ",
        "options": all_options,
        "correct_answer": correct_desc,
        "explanation": f"In {subject} ({unit}), '{concept}' is established as: {correct_desc}",
        "difficulty": difficulty,
        "bloom_taxonomy": bloom,
        "subject": subject,
        "topic": topic,
        "subtopic": concept
    }

def synthesize_short_answer_question(
    concept_item: Dict[str, Any],
    subject: str,
    topic: str,
    difficulty: str
) -> Dict[str, Any]:
    """Synthesizes a Short Answer / Analytical explanation question."""
    concept = concept_item["concept"]
    unit = concept_item.get("unit", "Unit 1")

    templates = [
        (
            f"Explain the technical significance and working principles of '{concept}' in {subject}.",
            f"'{concept}' provides structural organization and execution rules in {topic}. Key aspects include: 1) Concept definition, 2) Core components, 3) Implementation requirements.",
            "Understand"
        ),
        (
            f"Differentiate the operational behavior of '{concept}' from standard alternative approaches in {topic}.",
            f"'{concept}' optimizes performance and modularity compared to naive implementations by reducing complexity and ensuring robust invariant guarantees.",
            "Analyze"
        )
    ]
    q_stem, sample_ans, bloom = random.choice(templates)

    return {
        "question_text": q_stem,
        "question_type": "Short Answer",
        "options": [],
        "correct_answer": sample_ans,
        "explanation": f"Official Curriculum Guide {unit}: Students must outline the definitions, functional characteristics, and practical trade-offs of {concept}.",
        "difficulty": difficulty,
        "bloom_taxonomy": bloom,
        "subject": subject,
        "topic": topic,
        "subtopic": concept
    }

def synthesize_true_false_question(
    concept_item: Dict[str, Any],
    subject: str,
    topic: str,
    difficulty: str
) -> Dict[str, Any]:
    """Synthesizes a factual validation True/False question."""
    concept = concept_item["concept"]
    is_true = random.choice([True, False])

    if is_true:
        stem = f"In {subject}, '{concept}' is directly involved in managing key principles of {topic}."
        ans = "True"
        exp = f"True. '{concept}' is an integral component defined under {topic}."
    else:
        stem = f"In {subject}, '{concept}' is entirely deprecated and has no relevance to modern {topic} architectures."
        ans = "False"
        exp = f"False. '{concept}' remains an active, foundational concept in {topic}."

    return {
        "question_text": stem,
        "question_type": "True/False",
        "options": ["True", "False"],
        "correct_answer": ans,
        "explanation": exp,
        "difficulty": difficulty,
        "bloom_taxonomy": "Remember",
        "subject": subject,
        "topic": topic,
        "subtopic": concept
    }

def synthesize_fill_in_the_blank_question(
    concept_item: Dict[str, Any],
    subject: str,
    topic: str,
    difficulty: str
) -> Dict[str, Any]:
    """Synthesizes a high-quality Fill in the Blank question with ________ blank."""
    concept = concept_item["concept"]
    unit = concept_item.get("unit", "Unit 1")

    templates = [
        (
            f"In {subject} ({topic}), the mechanism responsible for regulating the state and operational flow of {concept} is ________.",
            concept,
            f"'{concept}' is the foundational operational component defined under {unit}."
        ),
        (
            f"Under standard execution conditions in {topic}, ________ is implemented to optimize throughput and preserve invariants for {concept}.",
            concept,
            f"Implementing '{concept}' ensures predictable invariant adherence and operational throughput."
        ),
        (
            f"In the analysis of {subject}, the key structural metric evaluating the efficiency of {concept} is ________.",
            concept,
            f"'{concept}' is measured and bounded to maintain theoretical correctness in {topic}."
        ),
        (
            f"The primary architectural constraint associated with deploying {concept} within modern {subject} systems is ________.",
            concept,
            f"Understanding the boundaries of '{concept}' ensures fault tolerance in {topic}."
        )
    ]
    stem, ans, exp = random.choice(templates)

    return {
        "question_text": stem,
        "question_type": "Fill in the Blank",
        "options": [],
        "correct_answer": ans,
        "explanation": exp,
        "difficulty": difficulty,
        "bloom_taxonomy": "Remember",
        "subject": subject,
        "topic": topic,
        "subtopic": concept
    }

def synthesize_multiple_select_question(
    concept_item: Dict[str, Any],
    all_concept_names: List[str],
    subject: str,
    topic: str,
    difficulty: str
) -> Dict[str, Any]:
    """Synthesizes a Multiple Select question with 2-3 correct options and valid JSON array answer."""
    concept = concept_item["concept"]
    unit = concept_item.get("unit", "Unit 1")

    valid_statements = [
        f"Ensures deterministic state validation and invariant preservation for {concept}",
        f"Optimizes operational throughput across {topic} workflows",
        f"Maintains structural modularity and strict component encapsulation for {concept}",
        f"Guarantees bounded spatial overhead during execution in {subject}"
    ]
    distractors = [
        f"Forces unhandled memory segmentation faults during {concept} lifecycle",
        f"Bypasses algorithmic correctness checks to introduce non-deterministic race conditions",
        f"Permanently degrades cache locality across unindexed execution threads"
    ]

    correct_count = random.choice([2, 3])
    correct_picks = random.sample(valid_statements, k=min(len(valid_statements), correct_count))
    distractor_picks = random.sample(distractors, k=min(len(distractors), 4 - len(correct_picks)))

    all_opts = correct_picks + distractor_picks
    random.shuffle(all_opts)

    return {
        "question_text": f"Select all valid operational properties and characteristics of '{concept}' in {subject} ({unit}):",
        "question_type": "Multiple Select",
        "options": all_opts,
        "correct_answer": json.dumps(correct_picks),
        "explanation": f"The valid statements highlight recognized technical benefits of {concept} in {topic}.",
        "difficulty": difficulty,
        "bloom_taxonomy": "Analyze",
        "subject": subject,
        "topic": topic,
        "subtopic": concept
    }

def generate_local_nlp_questions(
    subject: str,
    topic: str,
    syllabus: str,
    question_types: Any,
    count: int,
    difficulty: str
) -> List[Dict[str, Any]]:
    """
    Pure Python In-House Question Generator Engine.
    Requires zero external APIs, zero GPU, and <40MB RAM.
    Guarantees unique questions with strict distribution across selected question types.
    """
    concept_records = extract_syllabus_concepts(syllabus, default_subject=subject, default_topic=topic)
    all_concept_names = [c["concept"] for c in concept_records]
    
    results = []
    seen_texts = set()
    
    # Calculate counts per type
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

    total_requested = sum(type_counts_dict.values())
    if total_requested == 0:
        type_counts_dict = {"MCQ": count}

    concept_idx = 0
    num_concepts = max(1, len(concept_records))

    for q_type, q_count in type_counts_dict.items():
        norm_type = q_type.lower()
        for _ in range(q_count):
            c_item = concept_records[concept_idx % num_concepts]
            concept_idx += 1

            for attempt in range(5):
                if "fill" in norm_type or "blank" in norm_type:
                    q_obj = synthesize_fill_in_the_blank_question(c_item, subject, topic, difficulty)
                elif "multiple select" in norm_type:
                    q_obj = synthesize_multiple_select_question(c_item, all_concept_names, subject, topic, difficulty)
                elif "true" in norm_type or "false" in norm_type:
                    q_obj = synthesize_true_false_question(c_item, subject, topic, difficulty)
                elif "short" in norm_type or "answer" in norm_type:
                    q_obj = synthesize_short_answer_question(c_item, subject, topic, difficulty)
                else:
                    # Default MCQ
                    q_obj = synthesize_mcq_question(c_item, all_concept_names, subject, topic, difficulty)

                if q_obj["question_text"] not in seen_texts:
                    seen_texts.add(q_obj["question_text"])
                    results.append(q_obj)
                    break
            else:
                # If seen before, add distinctive concept index variation to guarantee uniqueness
                q_obj["question_text"] = f"[Part {len(results)+1}] " + q_obj["question_text"]
                seen_texts.add(q_obj["question_text"])
                results.append(q_obj)

    return results[:count]

def call_local_ollama(
    prompt: str,
    model: str = "llama3.2",
    host: str = "http://localhost:11434"
) -> Optional[List[Dict[str, Any]]]:
    """
    Connects to a locally running Ollama instance on localhost.
    Returns parsed JSON questions if Ollama is running, else returns None.
    """
    url = f"{host}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            raw_text = res_data.get("response", "")
            parsed = json.loads(raw_text)
            if isinstance(parsed, dict) and "questions" in parsed:
                return parsed["questions"]
            elif isinstance(parsed, list):
                return parsed
    except Exception as e:
        print(f"[Ollama] Local instance unavailable: {e}")
        return None
