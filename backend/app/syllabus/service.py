"""
Syllabus Intelligence Engine Service Layer
"""

import os
import hashlib
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from .models import SyllabusFile, CourseUnit, CourseTopic, CourseOutcome, TopicCOMapping, RecommendedBook
from ..curriculum.models import Course, Program
from .parser import extract_text_from_file, parse_syllabus_structure
from .schemas import (
    SyllabusFileOut, UnitSchema, TopicSchema, CourseOutcomeSchema,
    RecommendedBookSchema, KnowledgeGraphNode, SyllabusCourseDetailResponse,
    VersionDiffItem, VersionDiffSchema
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "syllabus")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class SyllabusService:

    @staticmethod
    def calculate_file_hash(file_bytes: bytes) -> str:
        return hashlib.sha256(file_bytes).hexdigest()

    @staticmethod
    def process_syllabus_upload(
        db: Session,
        file_bytes: bytes,
        filename: str,
        course_id: Optional[str] = None,
        source_type: str = "OFFICIAL"
    ) -> Dict[str, Any]:
        
        file_hash = SyllabusService.calculate_file_hash(file_bytes)

        # Check duplicate
        existing = db.query(SyllabusFile).filter(SyllabusFile.file_hash == file_hash).first()
        if existing:
            return {
                "status": "DUPLICATE",
                "message": f"File '{filename}' already exists in database.",
                "file_id": existing.id,
                "confidence": float(existing.parser_confidence)
            }

        # Save to disk
        safe_filename = f"{file_hash[:10]}_{filename}"
        dest_path = os.path.join(UPLOAD_DIR, safe_filename)
        with open(dest_path, "wb") as f:
            f.write(file_bytes)

        # Extract text & parse structure
        raw_text = extract_text_from_file(dest_path, filename)
        parsed = parse_syllabus_structure(raw_text, filename)

        # Create SyllabusFile record
        s_file = SyllabusFile(
            course_id=course_id,
            source_type=source_type.upper(),
            file_name=filename,
            file_path=dest_path,
            file_hash=file_hash,
            upload_status="PROCESSED",
            parser_confidence=parsed["parser_confidence"]
        )
        db.add(s_file)
        db.flush()

        # Insert Outcomes
        co_obj_map = {}
        for co in parsed["outcomes"]:
            outcome = CourseOutcome(
                syllabus_file_id=s_file.id,
                co_code=co["co_code"],
                description=co["description"]
            )
            db.add(outcome)
            db.flush()
            co_obj_map[co["co_code"]] = outcome.id

        # Insert Units & Topics
        for u_data in parsed["units"]:
            unit = CourseUnit(
                syllabus_file_id=s_file.id,
                unit_number=u_data["unit_number"],
                unit_title=u_data["unit_title"],
                teaching_hours=u_data["teaching_hours"],
                display_order=u_data["display_order"]
            )
            db.add(unit)
            db.flush()

            for t_data in u_data["topics"]:
                kw_str = ",".join(t_data["keywords"]) if t_data["keywords"] else None
                topic = CourseTopic(
                    unit_id=unit.id,
                    topic_order=t_data["topic_order"],
                    topic_name=t_data["topic_name"],
                    keywords=kw_str,
                    embedding=f"vector_emb_{t_data['topic_name'][:20]}"
                )
                db.add(topic)
                db.flush()

                # Map COs
                for co_code in t_data.get("mapped_co_codes", []):
                    if co_code in co_obj_map:
                        db.add(TopicCOMapping(topic_id=topic.id, outcome_id=co_obj_map[co_code]))

        # Insert Books
        for b_data in parsed["books"]:
            db.add(RecommendedBook(
                syllabus_file_id=s_file.id,
                title=b_data["title"],
                author=b_data.get("author"),
                publisher=b_data.get("publisher")
            ))

        db.commit()

        return {
            "status": "SUCCESS",
            "message": f"Successfully parsed and mapped '{filename}'.",
            "file_id": s_file.id,
            "confidence": parsed["parser_confidence"],
            "total_units": len(parsed["units"]),
            "total_outcomes": len(parsed["outcomes"])
        }

    @staticmethod
    def get_course_syllabus_details(db: Session, course_id: str) -> SyllabusCourseDetailResponse:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise ValueError(f"Course ID '{course_id}' not found.")

        # Find latest active syllabus file for course
        s_file = db.query(SyllabusFile).filter(
            SyllabusFile.course_id == course_id
        ).order_by(SyllabusFile.created_at.desc()).first()

        if not s_file:
            # Auto-generate virtual master syllabus for default course view if none uploaded yet
            virtual_hash = hashlib.sha256(f"virtual_{course.id}".encode()).hexdigest()
            s_file = db.query(SyllabusFile).filter(SyllabusFile.file_hash == virtual_hash).first()
            if not s_file:
                sample_bytes = f"Master Syllabus for {course.course_code}\nUnit I: Core Fundamentals\nUnit II: Architecture\nUnit III: Implementation\nUnit IV: Optimization\nUnit V: Applications".encode()
                SyllabusService.process_syllabus_upload(db, sample_bytes, f"{course.course_code}_master.pdf", course_id=course.id, source_type="OFFICIAL")
                s_file = db.query(SyllabusFile).filter(SyllabusFile.course_id == course_id).first()

        units_out = []
        for u in s_file.units:
            topics_out = []
            for t in u.topics:
                kw_list = t.keywords.split(",") if t.keywords else []
                mapped_cos = [co.co_code for co in t.outcomes]
                topics_out.append(TopicSchema(
                    id=t.id,
                    unit_id=t.unit_id,
                    topic_order=t.topic_order,
                    topic_name=t.topic_name,
                    keywords=kw_list,
                    mapped_co_codes=mapped_cos
                ))
            units_out.append(UnitSchema(
                id=u.id,
                unit_number=u.unit_number,
                unit_title=u.unit_title,
                teaching_hours=u.teaching_hours,
                display_order=u.display_order,
                topics=topics_out
            ))

        cos_out = [CourseOutcomeSchema(id=c.id, co_code=c.co_code, description=c.description) for c in s_file.outcomes]
        books_out = [RecommendedBookSchema(id=b.id, title=b.title, author=b.author, publisher=b.publisher) for b in s_file.books]

        # Construct Knowledge Graph Tree
        kg_units = []
        for u in units_out:
            kg_topics = []
            for t in u.topics:
                kg_cos = [KnowledgeGraphNode(id=f"co-{co_c}", label=f"CO Target ({co_c})", type="CO", children=[]) for co_c in t.mapped_co_codes]
                kg_topics.append(KnowledgeGraphNode(id=f"t-{t.id}", label=t.topic_name, type="TOPIC", children=kg_cos))
            kg_units.append(KnowledgeGraphNode(id=f"u-{u.id}", label=f"Unit {u.unit_number}: {u.unit_title}", type="UNIT", children=kg_topics))

        kg_root = KnowledgeGraphNode(
            id=f"course-{course.id}",
            label=f"{course.program.code if course.program else 'DEGREE'} Sem {course.semester} → {course.course_code}: {course.course_name}",
            type="COURSE",
            children=kg_units
        )

        s_file_out = SyllabusFileOut(
            id=s_file.id,
            course_id=s_file.course_id,
            source_type=s_file.source_type,
            file_name=s_file.file_name,
            file_path=s_file.file_path,
            file_hash=s_file.file_hash,
            upload_status=s_file.upload_status,
            parser_confidence=float(s_file.parser_confidence),
            created_at=s_file.created_at.strftime("%Y-%m-%d %H:%M")
        )

        tot_topics = sum(len(u.topics) for u in units_out)

        return SyllabusCourseDetailResponse(
            course_id=course.id,
            course_code=course.course_code,
            course_name=course.course_name,
            program_code=course.program.code if course.program else "CSE",
            semester=course.semester,
            active_syllabus_file=s_file_out,
            total_units=len(units_out),
            total_topics=tot_topics,
            total_cos=len(cos_out),
            total_books=len(books_out),
            parser_confidence=float(s_file.parser_confidence),
            units=units_out,
            outcomes=cos_out,
            books=books_out,
            knowledge_graph=kg_root
        )

    @staticmethod
    def compare_syllabus_versions(db: Session, old_file_id: str, new_file_id: str) -> VersionDiffSchema:
        old_file = db.query(SyllabusFile).filter(SyllabusFile.id == old_file_id).first()
        new_file = db.query(SyllabusFile).filter(SyllabusFile.id == new_file_id).first()

        if not old_file or not new_file:
            raise ValueError("Syllabus version files for comparison not found.")

        old_topics = {t.topic_name for u in old_file.units for t in u.topics}
        new_topics = {t.topic_name for u in new_file.units for t in u.topics}

        added = new_topics - old_topics
        removed = old_topics - new_topics

        diff_items = []
        for t_name in added:
            diff_items.append(VersionDiffItem(
                category="ADDED_TOPIC",
                unit_title="New Syllabus Addition",
                item_name=t_name,
                details="Newly introduced topic in updated curriculum version."
            ))

        for t_name in removed:
            diff_items.append(VersionDiffItem(
                category="REMOVED_TOPIC",
                unit_title="Legacy Syllabus Removal",
                item_name=t_name,
                details="Deprecating topic removed in new version."
            ))

        return VersionDiffSchema(
            old_file_id=old_file.id,
            new_file_id=new_file.id,
            old_version_date=old_file.created_at.strftime("%Y-%m-%d"),
            new_version_date=new_file.created_at.strftime("%Y-%m-%d"),
            added_topics_count=len(added),
            removed_topics_count=len(removed),
            changed_units_count=abs(len(new_file.units) - len(old_file.units)),
            diff_items=diff_items
        )
