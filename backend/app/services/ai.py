import os
import json
import urllib.request
import urllib.error
import random
from typing import List, Dict, Any

# Mock Database of questions for offline/fallback mode
MOCK_QUESTIONS_POOL = {
    "Data Structures": {
        "Array": [
            {
                "question_text": "What is the time complexity of searching an element in an unsorted array of size N?",
                "question_type": "MCQ",
                "options": ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
                "correct_answer": "O(N)",
                "explanation": "In an unsorted array, we may have to traverse the entire array to find the element, leading to a linear time search.",
                "difficulty": "Easy",
                "subtopic": "Linear Search"
            },
            {
                "question_type": "True/False",
                "question_text": "An array allocates contiguous blocks of memory for its elements.",
                "options": ["True", "False"],
                "correct_answer": "True",
                "explanation": "Arrays use contiguous memory allocation, which allows constant-time access to elements using their indices.",
                "difficulty": "Easy",
                "subtopic": "Memory Allocation"
            },
            {
                "question_type": "Fill in the Blank",
                "question_text": "The index of the first element in a standard zero-indexed array of length N is ________.",
                "options": [],
                "correct_answer": "0",
                "explanation": "In zero-indexed arrays, the numbering starts at 0.",
                "difficulty": "Easy",
                "subtopic": "Indexing"
            }
        ],
        "Binary Tree": [
            {
                "question_text": "What is the maximum number of nodes in a binary tree of depth K?",
                "question_type": "MCQ",
                "options": ["2^K", "2^(K+1) - 1", "2^K - 1", "2^(K-1)"],
                "correct_answer": "2^(K+1) - 1",
                "explanation": "A full binary tree of depth K (where root is at depth 0) has 2^(K+1) - 1 nodes.",
                "difficulty": "Medium",
                "subtopic": "Tree Properties"
            },
            {
                "question_type": "Multiple Select",
                "question_text": "Select all valid tree traversal algorithms:",
                "options": ["In-order Traversal", "Breadth-First Traversal", "Post-order Traversal", "Heap-order Traversal"],
                "correct_answer": "[\"In-order Traversal\", \"Breadth-First Traversal\", \"Post-order Traversal\"]",
                "explanation": "In-order, post-order, and breadth-first are standard tree traversals. Heap-order is a heap property, not a traversal algorithm.",
                "difficulty": "Medium",
                "subtopic": "Tree Traversal"
            },
            {
                "question_type": "Short Answer",
                "question_text": "Explain the difference between a Binary Tree and a Binary Search Tree (BST).",
                "options": [],
                "correct_answer": "A BST enforces that all nodes in the left subtree have values less than the parent node, and all nodes in the right subtree have values greater than the parent node, whereas a binary tree has no such ordering constraints.",
                "explanation": "BST ordering makes operations like search, insertion, and deletion highly efficient (O(log N) average).",
                "difficulty": "Medium",
                "subtopic": "BST Properties"
            }
        ]
    },
    "Machine Learning": {
        "Neural Networks": [
            {
                "question_text": "Which activation function is commonly used in the output layer of a binary classifier?",
                "question_type": "MCQ",
                "options": ["ReLU", "Tanh", "Sigmoid", "Softmax"],
                "correct_answer": "Sigmoid",
                "explanation": "Sigmoid outputs a value between 0 and 1, representing the probability of the positive class.",
                "difficulty": "Easy",
                "subtopic": "Activation Functions"
            },
            {
                "question_text": "What is the primary purpose of backpropagation in training neural networks?",
                "question_type": "MCQ",
                "options": ["To initialize weights", "To calculate loss gradients with respect to weights", "To select activation functions", "To normalize input datasets"],
                "correct_answer": "To calculate loss gradients with respect to weights",
                "explanation": "Backpropagation computes the gradient of the loss function with respect to the network weights, enabling optimization via gradient descent.",
                "difficulty": "Medium",
                "subtopic": "Backpropagation"
            },
            {
                "question_type": "True/False",
                "question_text": "Overfitting occurs when a neural network performs exceptionally well on unseen validation data but poorly on the training data.",
                "options": ["True", "False"],
                "correct_answer": "False",
                "explanation": "Overfitting is the opposite: it performs well on the training data but poorly on unseen validation/test data.",
                "difficulty": "Easy",
                "subtopic": "Overfitting"
            },
            {
                "question_type": "Fill in the Blank",
                "question_text": "The learning rate is an example of a ________ parameter that controls the step size during gradient updates.",
                "options": [],
                "correct_answer": "hyperparameter",
                "explanation": "Parameters configured prior to training are called hyperparameters.",
                "difficulty": "Medium",
                "subtopic": "Training Configurations"
            }
        ]
    }
}

# General Fallback pool if topic is not found
FALLBACK_QUESTIONS = [
    {
        "question_text": "What is the definition of a primary key in a relational database?",
        "question_type": "MCQ",
        "options": ["A key that allows duplicate values", "A unique identifier for each row in a table", "A key that links to another table", "A variable-length field"],
        "correct_answer": "A unique identifier for each row in a table",
        "explanation": "A primary key uniquely identifies each record in a database table and cannot contain null values.",
        "difficulty": "Easy",
        "subtopic": "Databases"
    },
    {
        "question_type": "True/False",
        "question_text": "HTTP is a stateful communication protocol.",
        "options": ["True", "False"],
        "correct_answer": "False",
        "explanation": "HTTP is stateless. Cookies and sessions are used to manage state on top of HTTP.",
        "difficulty": "Easy",
        "subtopic": "Networking"
    },
    {
        "question_type": "Fill in the Blank",
        "question_text": "The protocol used to securely transfer hypertext over the internet is ________.",
        "options": [],
        "correct_answer": "HTTPS",
        "explanation": "HTTPS encrypts communications using SSL/TLS.",
        "difficulty": "Easy",
        "subtopic": "Security"
    },
    {
        "question_type": "Short Answer",
        "question_text": "Explain the concept of recursion in computer science.",
        "options": [],
        "correct_answer": "Recursion is a programming technique where a function calls itself directly or indirectly to solve a problem by breaking it down into smaller sub-problems of the same type.",
        "explanation": "It requires a base case to terminate execution and prevent infinite loops.",
        "difficulty": "Medium",
        "subtopic": "Programming Fundamentals"
    }
]

def generate_mock_questions(subject: str, topic: str, count: int, question_types: Any, difficulty: str) -> List[Dict[str, Any]]:
    """Generates structured questions from the mock pool based on criteria."""
    sub_pool = MOCK_QUESTIONS_POOL.get(subject, {})
    topic_pool = []
    
    # Check case-insensitive subject
    for sub_k, sub_val in MOCK_QUESTIONS_POOL.items():
        if sub_k.lower() == subject.lower():
            sub_pool = sub_val
            break
            
    # Check case-insensitive topic
    if isinstance(sub_pool, dict):
        for top_k, top_val in sub_pool.items():
            if top_k.lower() == topic.lower():
                topic_pool = top_val
                break
                
    # If topic not found, gather all questions from the subject
    if not topic_pool and isinstance(sub_pool, dict):
        for val in sub_pool.values():
            topic_pool.extend(val)
            
    # If still empty, use fallback pool
    if not topic_pool:
        topic_pool = FALLBACK_QUESTIONS
        
    results = []
    
    if isinstance(question_types, dict):
        # Generate exact counts per type
        for q_type, q_count in question_types.items():
            type_pool = [q for q in topic_pool if q["question_type"].lower() == q_type.lower()]
            if not type_pool:
                # Fallback to general fallback questions matching the type
                type_pool = [q for q in FALLBACK_QUESTIONS if q["question_type"].lower() == q_type.lower()]
            if not type_pool:
                # Absolute fallback to whatever is available
                type_pool = topic_pool
                
            for i in range(q_count):
                base_q = random.choice(type_pool)
                q_copy = base_q.copy()
                if i >= len(type_pool):
                    q_copy["question_text"] = f"[Version {i//len(type_pool) + 1}] " + q_copy["question_text"]
                q_copy["subject"] = subject
                q_copy["topic"] = topic
                q_copy["difficulty"] = difficulty
                results.append(q_copy)
    else:
        # List of question types
        typed_pool = [q for q in topic_pool if q["question_type"] in question_types] if question_types else topic_pool
        if not typed_pool:
            typed_pool = topic_pool

        for i in range(count):
            base_q = random.choice(typed_pool)
            q_copy = base_q.copy()
            if i >= len(typed_pool):
                q_copy["question_text"] = f"[Version {i//len(typed_pool) + 1}] " + q_copy["question_text"]
            q_copy["subject"] = subject
            q_copy["topic"] = topic
            q_copy["difficulty"] = difficulty
            results.append(q_copy)
            
    # Ensure correct count
    return results[:count] if len(results) > count else results

def call_gemini_api(api_key: str, prompt: str) -> List[Dict[str, Any]]:
    """Calls Gemini API directly with HTTP POST and returns parsed question list."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            text_out = res_data["candidates"][0]["content"]["parts"][0]["text"]
            if text_out.startswith("```json"):
                text_out = text_out.split("```json")[1].split("```")[0].strip()
            elif text_out.startswith("```"):
                text_out = text_out.split("```")[1].split("```")[0].strip()
            
            questions = json.loads(text_out)
            if isinstance(questions, dict) and "questions" in questions:
                questions = questions["questions"]
            return questions
    except Exception as e:
        print(f"Gemini API failure: {e}")
        raise e

def call_openai_api(api_key: str, prompt: str) -> List[Dict[str, Any]]:
    """Calls OpenAI API directly with HTTP POST and returns parsed question list."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    payload = {
        "model": "gpt-4o-mini",
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "value": "You are a teacher question generator. Return JSON object containing key 'questions' with question list."},
            {"role": "user", "content": prompt}
        ]
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            text_out = res_data["choices"][0]["message"]["content"]
            questions = json.loads(text_out)
            if "questions" in questions:
                questions = questions["questions"]
            return questions
    except Exception as e:
        print(f"OpenAI API failure: {e}")
        raise e

def generate_questions(
    subject: str,
    topic: str,
    syllabus: str,
    question_types: Any,  # List[str] or Dict[str, int]
    count: int,
    difficulty: str
) -> List[Dict[str, Any]]:
    """Primary service entry point that routes to AI APIs or fallback mock generator."""
    
    if isinstance(question_types, dict):
        distribution_desc = ", ".join([f"{c} questions of type '{t}'" for t, c in question_types.items()])
        allowed_types_list = list(question_types.keys())
    else:
        distribution_desc = f"total of {count} questions of types: {', '.join(question_types)}"
        allowed_types_list = question_types

    prompt = f"""
Generate exactly {count} test questions based on the following:
Subject: {subject}
Topic: {topic}
Syllabus / Content: {syllabus}
Allowed Question Types: {", ".join(allowed_types_list)}
Difficulty: {difficulty}

Please generate: {distribution_desc}

Return STRICT JSON format containing an array of questions.
Each question MUST have the following keys:
- question_text (string)
- question_type (must be one of: {", ".join(allowed_types_list)})
- options (array of strings, only for MCQ and 'Multiple Select', else empty array or null)
- correct_answer (string. For 'Multiple Select', this should be a JSON array string representing list of correct options. For 'True/False', must be 'True' or 'False'. For others, the exact text.)
- explanation (string explaining why it is correct)
- difficulty (must be: {difficulty})
- subject (must be: {subject})
- topic (must be: {topic})
- subtopic (string representing the specific subconcept)

JSON Output template:
{{
  "questions": [
     {{
        "question_text": "...",
        "question_type": "...",
        "options": [...],
        "correct_answer": "...",
        "explanation": "...",
        "difficulty": "...",
        "subject": "...",
        "topic": "...",
        "subtopic": "..."
     }}
  ]
}}
"""

    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if gemini_key:
        try:
            return call_gemini_api(gemini_key, prompt)
        except Exception:
            pass
            
    if openai_key:
        try:
            return call_openai_api(openai_key, prompt)
        except Exception:
            pass
            
    return generate_mock_questions(subject, topic, count, question_types, difficulty)
