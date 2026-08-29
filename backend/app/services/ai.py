import os
import json
import urllib.request
import urllib.error
import random
from typing import List, Dict, Any, Optional

# Comprehensive Academic Question Pool with extensive diversity across subjects, topics, and question types
MOCK_QUESTIONS_POOL = {
    "Machine Learning": {
        "Activation Functions": [
            {
                "question_text": "Which activation function is commonly used in the output layer of a binary classification neural network?",
                "question_type": "MCQ",
                "options": ["ReLU", "Tanh", "Sigmoid", "Softmax"],
                "correct_answer": "Sigmoid",
                "explanation": "Sigmoid compresses continuous inputs into probabilities between 0 and 1, ideal for binary classification.",
                "difficulty": "Easy",
                "subtopic": "Activation Functions"
            },
            {
                "question_text": "Which activation function suffers from the 'dying unit' problem when inputs are negative?",
                "question_type": "MCQ",
                "options": ["Leaky ReLU", "ELU", "Standard ReLU", "Softmax"],
                "correct_answer": "Standard ReLU",
                "explanation": "Standard ReLU outputs zero for all negative inputs, which can cause neurons to become permanently inactive during backpropagation.",
                "difficulty": "Medium",
                "subtopic": "Activation Functions"
            },
            {
                "question_text": "For multi-class classification with mutually exclusive classes, the ________ function is applied at the output layer.",
                "question_type": "Fill in the Blank",
                "options": [],
                "correct_answer": "Softmax",
                "explanation": "Softmax normalizes unnormalized logits into a probability distribution summing strictly to 1.0.",
                "difficulty": "Easy",
                "subtopic": "Activation Functions"
            },
            {
                "question_text": "The derivative of the Sigmoid function achieves its maximum value of ________ at z = 0.",
                "question_type": "Fill in the Blank",
                "options": [],
                "correct_answer": "0.25",
                "explanation": "Since sigma'(z) = sigma(z)*(1 - sigma(z)), at z=0, sigma(0) = 0.5, so 0.5 * 0.5 = 0.25.",
                "difficulty": "Hard",
                "subtopic": "Mathematical Derivations"
            },
            {
                "question_type": "True/False",
                "question_text": "The Tanh activation function is zero-centered with an output range between -1 and +1.",
                "options": ["True", "False"],
                "correct_answer": "True",
                "explanation": "Tanh maps real numbers to the interval (-1, 1), making gradient descent optimization smoother than standard Sigmoid.",
                "difficulty": "Easy",
                "subtopic": "Activation Functions"
            },
            {
                "question_type": "Multiple Select",
                "question_text": "Select all activation functions designed to alleviate the vanishing gradient problem in deep networks:",
                "options": ["ReLU (Rectified Linear Unit)", "Leaky ReLU", "Standard Sigmoid", "ELU (Exponential Linear Unit)"],
                "correct_answer": "[\"ReLU (Rectified Linear Unit)\", \"Leaky ReLU\", \"ELU (Exponential Linear Unit)\"]",
                "explanation": "ReLU and its variants maintain non-saturating gradients for positive activations, unlike Sigmoid.",
                "difficulty": "Medium",
                "subtopic": "Vanishing Gradients"
            },
            {
                "question_type": "Short Answer",
                "question_text": "Explain why linear activation functions cannot be stacked to build deep neural network representations.",
                "options": [],
                "correct_answer": "A composition of linear functions is mathematically equivalent to a single linear transformation (W2 * W1 * x = W_combined * x), preventing the network from learning non-linear decision boundaries.",
                "explanation": "Non-linear activations are strictly required to enable universal function approximation.",
                "difficulty": "Medium",
                "subtopic": "Non-linearity"
            }
        ],
        "Neural Networks": [
            {
                "question_text": "What is the primary purpose of backpropagation in training neural networks?",
                "question_type": "MCQ",
                "options": ["To initialize network weights", "To calculate loss gradients with respect to weights", "To select optimal activation functions", "To perform mini-batch normalization"],
                "correct_answer": "To calculate loss gradients with respect to weights",
                "explanation": "Backpropagation recursively applies the chain rule of calculus to compute loss gradients for gradient descent.",
                "difficulty": "Medium",
                "subtopic": "Backpropagation"
            },
            {
                "question_text": "Which regularization technique randomly deactivates a subset of neurons during each training forward pass?",
                "question_type": "MCQ",
                "options": ["L2 Weight Decay", "Dropout", "Batch Normalization", "Early Stopping"],
                "correct_answer": "Dropout",
                "explanation": "Dropout prevents co-adaptation of features by stochastically dropping units during training.",
                "difficulty": "Easy",
                "subtopic": "Regularization"
            },
            {
                "question_text": "The learning rate is an example of a ________ that controls the step size during parameter updates.",
                "question_type": "Fill in the Blank",
                "options": [],
                "correct_answer": "hyperparameter",
                "explanation": "Variables configured before model training begins are designated as hyperparameters.",
                "difficulty": "Easy",
                "subtopic": "Hyperparameters"
            },
            {
                "question_text": "In a deep neural network, vanishing gradients occur when weights are small and activation derivatives are bounded below ________.",
                "question_type": "Fill in the Blank",
                "options": [],
                "correct_answer": "1",
                "explanation": "Repeated multiplication of fractions strictly less than 1 exponentially shrinks gradients as they backpropagate to early layers.",
                "difficulty": "Hard",
                "subtopic": "Gradient Flow"
            },
            {
                "question_type": "True/False",
                "question_text": "Overfitting occurs when a neural network performs exceptionally well on training data but poorly on unseen test data.",
                "options": ["True", "False"],
                "correct_answer": "True",
                "explanation": "Overfitting happens when a model learns noise and specifics of training data rather than generalizable underlying patterns.",
                "difficulty": "Easy",
                "subtopic": "Overfitting"
            },
            {
                "question_type": "Multiple Select",
                "question_text": "Select all optimization algorithms commonly used to accelerate neural network convergence:",
                "options": ["Adam Optimizer", "RMSprop", "Stochastic Gradient Descent with Momentum", "K-Means Clustering"],
                "correct_answer": "[\"Adam Optimizer\", \"RMSprop\", \"Stochastic Gradient Descent with Momentum\"]",
                "explanation": "Adam, RMSprop, and SGD with Momentum are gradient-based optimizers. K-Means is an unsupervised clustering algorithm.",
                "difficulty": "Medium",
                "subtopic": "Optimizers"
            }
        ],
        "Supervised Learning": [
            {
                "question_text": "Which evaluation metric represents the harmonic mean of Precision and Recall?",
                "question_type": "MCQ",
                "options": ["Accuracy Score", "F1 Score", "ROC-AUC", "Mean Squared Error"],
                "correct_answer": "F1 Score",
                "explanation": "F1 Score balances precision and recall: 2 * (Precision * Recall) / (Precision + Recall).",
                "difficulty": "Easy",
                "subtopic": "Evaluation Metrics"
            },
            {
                "question_text": "A confusion matrix cell indicating a negative sample incorrectly predicted as positive is called a ________ positive.",
                "question_type": "Fill in the Blank",
                "options": [],
                "correct_answer": "false",
                "explanation": "Type I error occurs when the model predicts the positive class for an actual negative instance (False Positive).",
                "difficulty": "Easy",
                "subtopic": "Confusion Matrix"
            },
            {
                "question_type": "True/False",
                "question_text": "Lasso Regression (L1 regularization) can perform feature selection by shrinking coefficients entirely to zero.",
                "options": ["True", "False"],
                "correct_answer": "True",
                "explanation": "L1 penalty encourages sparsity in the parameter vector, effectively zeroing out unimportant feature coefficients.",
                "difficulty": "Medium",
                "subtopic": "Regularization"
            }
        ]
    },
    "Data Structures": {
        "Array": [
            {
                "question_text": "What is the worst-case time complexity of searching an element in an unsorted array of size N?",
                "question_type": "MCQ",
                "options": ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
                "correct_answer": "O(N)",
                "explanation": "Linear search requires traversing each element one by one until a match is found or end of array is reached.",
                "difficulty": "Easy",
                "subtopic": "Linear Search"
            },
            {
                "question_text": "The memory address of array element arr[i] with base address B and element size S is computed as B + (i * ________).",
                "question_type": "Fill in the Blank",
                "options": [],
                "correct_answer": "S",
                "explanation": "Contiguous memory layout allows direct address computation using offset = index * element_size.",
                "difficulty": "Easy",
                "subtopic": "Memory Addressing"
            },
            {
                "question_text": "In a dynamic array (like std::vector or Python list), the amortized time complexity of an append operation is ________.",
                "question_type": "Fill in the Blank",
                "options": [],
                "correct_answer": "O(1)",
                "explanation": "Although array resizing takes O(N), doubling capacity ensures that geometric amortized cost per append remains constant O(1).",
                "difficulty": "Medium",
                "subtopic": "Amortized Analysis"
            },
            {
                "question_type": "True/False",
                "question_text": "Arrays allow constant time O(1) random access to any element via its index.",
                "options": ["True", "False"],
                "correct_answer": "True",
                "explanation": "Contiguous allocation enables direct pointer offset calculation in O(1) time.",
                "difficulty": "Easy",
                "subtopic": "Random Access"
            }
        ],
        "Binary Tree": [
            {
                "question_text": "What is the maximum number of nodes in a binary tree of depth K (with root at depth 0)?",
                "question_type": "MCQ",
                "options": ["2^K", "2^(K+1) - 1", "2^K - 1", "2^(K-1)"],
                "correct_answer": "2^(K+1) - 1",
                "explanation": "Sum of geometric progression 2^0 + 2^1 + ... + 2^K equals 2^(K+1) - 1.",
                "difficulty": "Medium",
                "subtopic": "Tree Properties"
            },
            {
                "question_text": "An in-order traversal of a valid Binary Search Tree (BST) produces node values in ________ sorted order.",
                "question_type": "Fill in the Blank",
                "options": [],
                "correct_answer": "ascending",
                "explanation": "In-order traversal visits Left Subtree -> Root -> Right Subtree, which yields ascending sorted values in a BST.",
                "difficulty": "Easy",
                "subtopic": "BST Traversal"
            },
            {
                "question_type": "Multiple Select",
                "question_text": "Select all depth-first traversal strategies for binary trees:",
                "options": ["Pre-order Traversal", "In-order Traversal", "Post-order Traversal", "Level-order Traversal"],
                "correct_answer": "[\"Pre-order Traversal\", \"In-order Traversal\", \"Post-order Traversal\"]",
                "explanation": "Pre-order, in-order, and post-order are DFS traversals. Level-order traversal uses a Queue and is Breadth-First Search (BFS).",
                "difficulty": "Medium",
                "subtopic": "DFS vs BFS"
            }
        ],
        "Linked List": [
            {
                "question_text": "What is the time complexity to insert a new node at the head of a Singly Linked List?",
                "question_type": "MCQ",
                "options": ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
                "correct_answer": "O(1)",
                "explanation": "Inserting at the head only requires updating the new node's next pointer and head pointer, taking constant O(1) time.",
                "difficulty": "Easy",
                "subtopic": "Insertion"
            },
            {
                "question_text": "In a Doubly Linked List, each node maintains two pointer references: ________ and next.",
                "question_type": "Fill in the Blank",
                "options": [],
                "correct_answer": "prev",
                "explanation": "Each node in a doubly linked list contains pointers to both the previous (prev) and next nodes.",
                "difficulty": "Easy",
                "subtopic": "Node Structure"
            }
        ]
    },
    "Quantitative Aptitude": {
        "Linear Algebra": [
            {
                "question_text": "If matrix A has determinant det(A) = 0, matrix A is classified as ________.",
                "question_type": "Fill in the Blank",
                "options": [],
                "correct_answer": "singular",
                "explanation": "A square matrix with determinant equal to zero is non-invertible and called a singular matrix.",
                "difficulty": "Easy",
                "subtopic": "Determinants"
            },
            {
                "question_text": "What is the relationship between eigenvalues lambda and eigenvector v of matrix A?",
                "question_type": "MCQ",
                "options": ["Av = lambda * v", "Av = lambda + v", "A + v = lambda", "Av = lambda / v"],
                "correct_answer": "Av = lambda * v",
                "explanation": "Eigenvectors maintain their direction under transformation A, scaled strictly by eigenvalue lambda.",
                "difficulty": "Medium",
                "subtopic": "Eigenvalues"
            }
        ]
    }
}

FALLBACK_QUESTIONS = [
    {
        "question_text": "What is the definition of a primary key in a relational database?",
        "question_type": "MCQ",
        "options": ["A key that permits duplicate values", "A unique identifier for each record in a table", "A key linking foreign schemas", "An unindexed text attribute"],
        "correct_answer": "A unique identifier for each record in a table",
        "explanation": "A primary key uniquely identifies each record in a database table and cannot contain null values.",
        "difficulty": "Easy",
        "subtopic": "Databases"
    },
    {
        "question_type": "Fill in the Blank",
        "question_text": "The communication protocol used to securely transmit encrypted hypertext over the Internet is ________.",
        "options": [],
        "correct_answer": "HTTPS",
        "explanation": "HTTPS encrypts communications using SSL/TLS cryptographic protocols.",
        "difficulty": "Easy",
        "subtopic": "Networking"
    },
    {
        "question_type": "True/False",
        "question_text": "HTTP is inherently a stateless application-layer communication protocol.",
        "options": ["True", "False"],
        "correct_answer": "True",
        "explanation": "HTTP does not retain session state between requests; cookies and sessions are used to manage state.",
        "difficulty": "Easy",
        "subtopic": "Networking Protocols"
    },
    {
        "question_type": "Short Answer",
        "question_text": "Explain the concept and termination condition of recursion in computer science.",
        "options": [],
        "correct_answer": "Recursion occurs when a function calls itself to solve smaller instances of a problem. It requires a base case to terminate execution and avoid infinite recursion or stack overflow.",
        "explanation": "Every recursive procedure must include a base condition and a recursive step progressing towards that base condition.",
        "difficulty": "Medium",
        "subtopic": "Programming Fundamentals"
    }
]

def generate_mock_questions(
    subject: str,
    topic: str,
    count: int,
    question_types: Any,
    difficulty: str = "Medium"
) -> List[Dict[str, Any]]:
    """
    Guarantees unique questions strictly distributed across requested types without duplicates.
    """
    from .local_qg_engine import (
        synthesize_mcq_question,
        synthesize_fill_in_the_blank_question,
        synthesize_true_false_question,
        synthesize_multiple_select_question,
        synthesize_short_answer_question
    )

    # 1. Gather all candidates matching subject and topic
    sub_pool = MOCK_QUESTIONS_POOL.get(subject, {})
    topic_pool: List[Dict[str, Any]] = []

    for sub_k, sub_val in MOCK_QUESTIONS_POOL.items():
        if sub_k.lower() in subject.lower() or subject.lower() in sub_k.lower():
            sub_pool = sub_val
            break

    if isinstance(sub_pool, dict):
        for top_k, top_val in sub_pool.items():
            if top_k.lower() in topic.lower() or topic.lower() in top_k.lower():
                topic_pool.extend(top_val)

    if not topic_pool and isinstance(sub_pool, dict):
        for val in sub_pool.values():
            topic_pool.extend(val)

    if not topic_pool:
        topic_pool = list(FALLBACK_QUESTIONS)

    # 2. Determine exact quota per question type
    type_counts: Dict[str, int] = {}
    if isinstance(question_types, dict):
        type_counts = {k: int(v) for k, v in question_types.items() if int(v) > 0}
    elif isinstance(question_types, list) and question_types:
        per_type = count // len(question_types)
        rem = count % len(question_types)
        for idx, t in enumerate(question_types):
            type_counts[t] = per_type + (1 if idx < rem else 0)
    else:
        type_counts = {"MCQ": count}

    results: List[Dict[str, Any]] = []
    used_texts = set()

    for q_type, q_count in type_counts.items():
        norm_type = q_type.lower()

        # Find questions in pool matching this type
        matching_pool = [
            q for q in topic_pool
            if q.get("question_type", "").lower() == norm_type or
               ("fill" in norm_type and "fill" in q.get("question_type", "").lower()) or
               ("mcq" in norm_type and "mcq" in q.get("question_type", "").lower()) or
               ("select" in norm_type and "select" in q.get("question_type", "").lower()) or
               ("true" in norm_type and "true" in q.get("question_type", "").lower()) or
               ("short" in norm_type and "short" in q.get("question_type", "").lower())
        ]

        # Prioritize matching difficulty if available
        diff_matches = [q for q in matching_pool if q.get("difficulty", "").lower() == difficulty.lower()]
        other_matches = [q for q in matching_pool if q.get("difficulty", "").lower() != difficulty.lower()]

        available_ordered = diff_matches + other_matches
        random.shuffle(available_ordered)

        picked_for_this_type = 0
        for item in available_ordered:
            if picked_for_this_type >= q_count:
                break
            if item["question_text"] not in used_texts:
                item_copy = dict(item)
                item_copy["subject"] = subject
                item_copy["topic"] = topic
                item_copy["difficulty"] = difficulty
                results.append(item_copy)
                used_texts.add(item["question_text"])
                picked_for_this_type += 1

        # If shortfall, synthesize fresh unique questions for this type
        shortfall = q_count - picked_for_this_type
        for s_idx in range(shortfall):
            concept_item = {
                "concept": f"{topic} Principle {len(results)+1}",
                "unit": f"Module {s_idx+1}"
            }
            if "fill" in norm_type or "blank" in norm_type:
                synth = synthesize_fill_in_the_blank_question(concept_item, subject, topic, difficulty)
            elif "multiple select" in norm_type:
                synth = synthesize_multiple_select_question(concept_item, [topic], subject, topic, difficulty)
            elif "true" in norm_type or "false" in norm_type:
                synth = synthesize_true_false_question(concept_item, subject, topic, difficulty)
            elif "short" in norm_type or "answer" in norm_type:
                synth = synthesize_short_answer_question(concept_item, subject, topic, difficulty)
            else:
                synth = synthesize_mcq_question(concept_item, [topic, f"{topic} Core"], subject, topic, difficulty)

            results.append(synth)
            used_texts.add(synth["question_text"])

    return results[:count]

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
    difficulty: str,
    engine_mode: str = "auto"
) -> List[Dict[str, Any]]:
    """
    Primary question generation service routing through:
    1. Gemini Cloud API (if GEMINI_API_KEY is configured in env)
    2. Local Ollama LLM (if selected or available on localhost)
    3. In-House Semantic NLP Generator (Zero external API, runs in <40MB RAM)
    4. Mock Question Pool with strict non-duplication as graceful fallback
    """
    from .local_qg_engine import generate_local_nlp_questions, call_local_ollama

    if isinstance(question_types, dict):
        distribution_desc = ", ".join([f"{c} questions of type '{t}'" for t, c in question_types.items()])
        allowed_types_list = list(question_types.keys())
    else:
        distribution_desc = f"total of {count} questions evenly distributed across types: {', '.join(question_types)}"
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
- correct_answer (string)
- explanation (string explaining why it is correct)
- difficulty (must be: {difficulty})
- subject (must be: {subject})
- topic (must be: {topic})
- subtopic (string)

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

    # 1. Try Gemini API if API key is present
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and engine_mode in ["auto", "gemini"]:
        try:
            gemini_qs = call_gemini_api(gemini_key, prompt)
            if gemini_qs and len(gemini_qs) > 0:
                return gemini_qs[:count]
        except Exception as e:
            print(f"[Gemini QG] Warning: {e}")

    # 2. Try Local Ollama if requested
    if engine_mode in ["ollama", "auto"]:
        try:
            ollama_qs = call_local_ollama(prompt, model="llama3.2")
            if ollama_qs and len(ollama_qs) > 0:
                return ollama_qs[:count]
        except Exception:
            pass

    # 3. In-House Semantic NLP Generator (Primary default for self-hosted / cloud without GPU)
    try:
        nlp_qs = generate_local_nlp_questions(
            subject=subject,
            topic=topic,
            syllabus=syllabus or topic,
            question_types=question_types,
            count=count,
            difficulty=difficulty
        )
        if nlp_qs and len(nlp_qs) > 0:
            return nlp_qs
    except Exception as e:
        print(f"[Local QG Engine] Warning: {e}")

    # 4. Graceful Fallback
    return generate_mock_questions(subject, topic, count, question_types, difficulty)
