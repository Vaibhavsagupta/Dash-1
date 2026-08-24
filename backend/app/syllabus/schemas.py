"""
Pydantic Schemas for Syllabus Intelligence Engine API
"""

from pydantic import BaseModel
from typing import List, Optional, Any

class TopicSchema(BaseModel):
    id: str
    unit_id: str
    topic_order: int
    topic_name: str
    keywords: Optional[List[str]] = []
    mapped_co_codes: Optional[List[str]] = []

    class Config:
        from_attributes = True

class UnitSchema(BaseModel):
    id: str
    unit_number: int
    unit_title: str
    teaching_hours: int
    display_order: int
    topics: List[TopicSchema] = []

    class Config:
        from_attributes = True

class CourseOutcomeSchema(BaseModel):
    id: str
    co_code: str
    description: str

    class Config:
        from_attributes = True

class RecommendedBookSchema(BaseModel):
    id: str
    title: str
    author: Optional[str] = None
    publisher: Optional[str] = None

    class Config:
        from_attributes = True

class SyllabusFileOut(BaseModel):
    id: str
    course_id: Optional[str] = None
    source_type: str # OFFICIAL or ADDITIONAL
    file_name: str
    file_path: str
    file_hash: str
    upload_status: str
    parser_confidence: float
    created_at: str

    class Config:
        from_attributes = True

class KnowledgeGraphNode(BaseModel):
    id: str
    label: str
    type: str # PROGRAM, SEMESTER, COURSE, UNIT, TOPIC, CO
    children: Optional[List['KnowledgeGraphNode']] = []

KnowledgeGraphNode.update_forward_refs()

class SyllabusCourseDetailResponse(BaseModel):
    course_id: str
    course_code: str
    course_name: str
    program_code: str
    semester: int
    active_syllabus_file: Optional[SyllabusFileOut] = None
    total_units: int
    total_topics: int
    total_cos: int
    total_books: int
    parser_confidence: float
    units: List[UnitSchema] = []
    outcomes: List[CourseOutcomeSchema] = []
    books: List[RecommendedBookSchema] = []
    knowledge_graph: Optional[KnowledgeGraphNode] = None

class VersionDiffItem(BaseModel):
    category: str # ADDED_TOPIC, REMOVED_TOPIC, CHANGED_UNIT, NEW_CO
    unit_title: str
    item_name: str
    details: str

class VersionDiffSchema(BaseModel):
    old_file_id: str
    new_file_id: str
    old_version_date: str
    new_version_date: str
    added_topics_count: int
    removed_topics_count: int
    changed_units_count: int
    diff_items: List[VersionDiffItem] = []
