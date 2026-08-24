"""
Curriculum OS Constants & Predefined Data Structure
"""

PROGRAMS = [
    ("AI", "Artificial Intelligence"),
    ("CSF", "Cyber Security & Forensics"),
    ("FSD", "Full Stack Development"),
]

SEMESTER_MARKS = {
    1: 900,
    2: 950,
    3: 1050,
    4: 1000,
    5: 1000,
    6: 900,
    7: 600,
    8: 600,
}

BATCHES = [2020, 2021, 2022, 2023]

ACADEMIC_SESSIONS = [
    {"session_name": "2025-26", "is_current": True}
]

# Base Course Slots for Semesters 1 to 8
BASE_SLOTS = {
    1: [
        {"slot_code": "UC20B101", "slot_name": "Environmental Studies and Disaster Management", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 1},
        {"slot_code": "UC20B102", "slot_name": "Communication Skills", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 2},
        {"slot_code": "MA20B103", "slot_name": "Engineering Mathematics-I", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 3},
        {"slot_code": "PY20B104", "slot_name": "Engineering Physics", "slot_type": "Theory+Practical", "max_marks": 150, "is_specialization": False, "is_generic_elective": False, "display_order": 4},
        {"slot_code": "ME20B105", "slot_name": "Engineering Drawing", "slot_type": "Theory+Practical", "max_marks": 150, "is_specialization": False, "is_generic_elective": False, "display_order": 5},
        {"slot_code": "CS20B106", "slot_name": "Programming Practice-I", "slot_type": "Practical", "max_marks": 50, "is_specialization": False, "is_generic_elective": False, "display_order": 6},
        {"slot_code": "DSE-I", "slot_name": "Specialization Subject-1", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 7},
        {"slot_code": "PB20B101", "slot_name": "Project Based Learning-I", "slot_type": "Project", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 8},
    ],
    2: [
        {"slot_code": "UC20B201", "slot_name": "Entrepreneurship Development", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 1},
        {"slot_code": "MA20B202", "slot_name": "Engineering Mathematics-II", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 2},
        {"slot_code": "CH20B203", "slot_name": "Engineering Chemistry", "slot_type": "Theory+Practical", "max_marks": 150, "is_specialization": False, "is_generic_elective": False, "display_order": 3},
        {"slot_code": "EE20B204", "slot_name": "Basic Electrical Engineering", "slot_type": "Theory+Practical", "max_marks": 150, "is_specialization": False, "is_generic_elective": False, "display_order": 4},
        {"slot_code": "CS20B205", "slot_name": "Programming Practice-II (C++)", "slot_type": "Practical", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 5},
        {"slot_code": "DSE-II", "slot_name": "Specialization Subject-2", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 6},
        {"slot_code": "PB20B201", "slot_name": "Project Based Learning-II", "slot_type": "Project", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 7},
        {"slot_code": "UC20B202", "slot_name": "Soft Skills & Aptitude", "slot_type": "Practical", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 8},
    ],
    3: [
        {"slot_code": "CS20B301", "slot_name": "Data Structures & Algorithms", "slot_type": "Theory+Practical", "max_marks": 150, "is_specialization": False, "is_generic_elective": False, "display_order": 1},
        {"slot_code": "CS20B302", "slot_name": "Computer Organization & Architecture", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 2},
        {"slot_code": "CS20B303", "slot_name": "Database Management Systems", "slot_type": "Theory+Practical", "max_marks": 150, "is_specialization": False, "is_generic_elective": False, "display_order": 3},
        {"slot_code": "CS20B304", "slot_name": "Discrete Mathematics", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 4},
        {"slot_code": "CS20B305", "slot_name": "Object Oriented Programming with Java", "slot_type": "Theory+Practical", "max_marks": 150, "is_specialization": False, "is_generic_elective": False, "display_order": 5},
        {"slot_code": "DSE-III", "slot_name": "Specialization Subject-3", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 6},
        {"slot_code": "PB20B301", "slot_name": "Project Based Learning-III", "slot_type": "Project", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 7},
        {"slot_code": "UC20B301", "slot_name": "Skill Development-I", "slot_type": "Practical", "max_marks": 150, "is_specialization": False, "is_generic_elective": False, "display_order": 8},
    ],
    4: [
        {"slot_code": "CS20B401", "slot_name": "Operating Systems", "slot_type": "Theory+Practical", "max_marks": 150, "is_specialization": False, "is_generic_elective": False, "display_order": 1},
        {"slot_code": "CS20B402", "slot_name": "Theory of Computation", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 2},
        {"slot_code": "CS20B403", "slot_name": "Software Engineering", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 3},
        {"slot_code": "CS20B404", "slot_name": "Computer Networks", "slot_type": "Theory+Practical", "max_marks": 150, "is_specialization": False, "is_generic_elective": False, "display_order": 4},
        {"slot_code": "DSE-IV", "slot_name": "Specialization Subject-4", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 5},
        {"slot_code": "DSE-V", "slot_name": "Specialization Subject-5", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 6},
        {"slot_code": "PB20B401", "slot_name": "Project Based Learning-IV", "slot_type": "Project", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 7},
        {"slot_code": "UC20B401", "slot_name": "Skill Development-II", "slot_type": "Practical", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 8},
    ],
    5: [
        {"slot_code": "CS20B501", "slot_name": "Design & Analysis of Algorithms", "slot_type": "Theory+Practical", "max_marks": 150, "is_specialization": False, "is_generic_elective": False, "display_order": 1},
        {"slot_code": "CS20B502", "slot_name": "Compiler Design", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 2},
        {"slot_code": "DSE-VI", "slot_name": "Specialization Subject-6", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 3},
        {"slot_code": "DSE-VII", "slot_name": "Specialization Subject-7", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 4},
        {"slot_code": "DSE-VIII", "slot_name": "Specialization Subject-8", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 5},
        {"slot_code": "GE-I", "slot_name": "Generic Elective-I", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": True, "display_order": 6},
        {"slot_code": "PB20B501", "slot_name": "Project Based Learning-V", "slot_type": "Project", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 7},
        {"slot_code": "UC20B501", "slot_name": "Professional Ethics & Aptitude", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": False, "display_order": 8},
    ],
    6: [
        {"slot_code": "CS20B601", "slot_name": "Cloud Computing", "slot_type": "Theory+Practical", "max_marks": 150, "is_specialization": False, "is_generic_elective": False, "display_order": 1},
        {"slot_code": "DSE-IX", "slot_name": "Specialization Subject-9", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 2},
        {"slot_code": "DSE-X", "slot_name": "Specialization Subject-10", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 3},
        {"slot_code": "DSE-XI", "slot_name": "Specialization Subject-11", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 4},
        {"slot_code": "GE-II", "slot_name": "Generic Elective-II", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": True, "display_order": 5},
        {"slot_code": "PB20B601", "slot_name": "Minor Project", "slot_type": "Project", "max_marks": 200, "is_specialization": False, "is_generic_elective": False, "display_order": 6},
    ],
    7: [
        {"slot_code": "DSE-XII", "slot_name": "Specialization Subject-12", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 1},
        {"slot_code": "DSE-XIII", "slot_name": "Specialization Subject-13", "slot_type": "Specialization", "max_marks": 150, "is_specialization": True, "is_generic_elective": False, "display_order": 2},
        {"slot_code": "GE-III", "slot_name": "Generic Elective-III", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": True, "display_order": 3},
        {"slot_code": "IN20B701", "slot_name": "Industrial Internship", "slot_type": "Practical", "max_marks": 200, "is_specialization": False, "is_generic_elective": False, "display_order": 4},
    ],
    8: [
        {"slot_code": "GE-IV", "slot_name": "Generic Elective-IV", "slot_type": "Theory", "max_marks": 100, "is_specialization": False, "is_generic_elective": True, "display_order": 1},
        {"slot_code": "PR20B801", "slot_name": "Major Project / Dissertation", "slot_type": "Project", "max_marks": 500, "is_specialization": False, "is_generic_elective": False, "display_order": 2},
    ],
}

# Specialization Course Mappings for AI, CSF, and FSD for DSE slots (DSE-I to DSE-XIII)
PROGRAM_SPECIALIZATIONS = {
    "AI": {
        "DSE-I": {"code": "AI101", "name": "Introduction to AI & Data Science", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-II": {"code": "AI201", "name": "Python for Data Science & AI", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-III": {"code": "AI301", "name": "Statistical Methods for Artificial Intelligence", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-IV": {"code": "AI401", "name": "Machine Learning Fundamentals", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-V": {"code": "AI402", "name": "Data Mining & Knowledge Discovery", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-VI": {"code": "AI501", "name": "Deep Learning & Neural Networks", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-VII": {"code": "AI502", "name": "Natural Language Processing", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-VIII": {"code": "AI503", "name": "Computer Vision & Image Processing", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-IX": {"code": "AI601", "name": "Reinforcement Learning & Decision Systems", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-X": {"code": "AI602", "name": "Generative AI & Large Language Models", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-XI": {"code": "AI603", "name": "Big Data Analytics & Infrastructure", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-XII": {"code": "AI701", "name": "Cloud Computing & AI Deployment", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-XIII": {"code": "AI702", "name": "MLOps & AI System Engineering", "theory": 100, "practical": 50, "internal": 40, "external": 110},
    },
    "CSF": {
        "DSE-I": {"code": "CF101", "name": "Fundamentals of Cyber Security & Threats", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-II": {"code": "CF201", "name": "Computer Networks & Defense Systems", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-III": {"code": "CF301", "name": "Information Security Principles", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-IV": {"code": "CF401", "name": "Cryptography & Network Security", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-V": {"code": "CF402", "name": "Ethical Hacking Fundamentals", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-VI": {"code": "CF501", "name": "Cyber Laws, Ethics & IPR", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-VII": {"code": "CF502", "name": "Digital Forensics & Incident Response", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-VIII": {"code": "CF503", "name": "Web Application Security & Audit", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-IX": {"code": "CF601", "name": "Network Penetration Testing & Vulnerability Assessment", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-X": {"code": "CF602", "name": "Mobile & Wireless Network Security", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-XI": {"code": "CF603", "name": "Malware Analysis & Reverse Engineering", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-XII": {"code": "CF701", "name": "Ethical Hacking & Advanced Defense", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-XIII": {"code": "CF702", "name": "Cloud Security, SOC & Threat Intelligence", "theory": 100, "practical": 50, "internal": 40, "external": 110},
    },
    "FSD": {
        "DSE-I": {"code": "FS101", "name": "Web Development Fundamentals (HTML/CSS/JS)", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-II": {"code": "FS201", "name": "Modern Javascript & React Framework", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-III": {"code": "FS301", "name": "Advanced Frontend Architecture & UI/UX", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-IV": {"code": "FS401", "name": "Node.js & Express Server Systems", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-V": {"code": "FS402", "name": "REST API Design & Microservices", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-VI": {"code": "FS501", "name": "Full Stack Next.js & Server Side Rendering", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-VII": {"code": "FS502", "name": "DevOps, Docker & CI/CD Pipelines", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-VIII": {"code": "FS503", "name": "Cloud Native Architecture & Kubernetes", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-IX": {"code": "FS601", "name": "GraphQL API Architecture & Real-Time Systems", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-X": {"code": "FS602", "name": "NoSQL Databases, Redis & Caching Systems", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-XI": {"code": "FS603", "name": "Micro-frontend & Enterprise Web Architecture", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-XII": {"code": "FS701", "name": "Distributed Systems Architecture", "theory": 100, "practical": 50, "internal": 40, "external": 110},
        "DSE-XIII": {"code": "FS702", "name": "Full Stack Web Security & Scalability", "theory": 100, "practical": 50, "internal": 40, "external": 110},
    },
}
