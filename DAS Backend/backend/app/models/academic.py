from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import BaseModel

class AcademicYear(BaseModel):
    __tablename__ = "academic_years"
    
    # Academic year attributes
    year_name = Column(String(20), nullable=False)  # e.g., "2025-2026"
    description = Column(Text)
    is_active = Column(Boolean, default=False)

class Class(BaseModel):
    __tablename__ = "classes"
    
    # Class attributes
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    session_type = Column(String(10), nullable=False)  # morning, evening
    grade_level = Column(String(15), nullable=False)  # primary, intermediate, secondary
    grade_number = Column(Integer, nullable=False)  # 1-6 for primary, 1-3 for others
    section_count = Column(Integer, default=1)
    max_students_per_section = Column(Integer)
    
    # Relationships
    academic_year = relationship("AcademicYear", back_populates="classes")
    subjects = relationship("Subject", back_populates="class_rel", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="class_rel")
    schedules = relationship("Schedule", back_populates="class_rel", cascade="all, delete-orphan")
    activity_participants = relationship("ActivityParticipant", back_populates="class_", cascade="all, delete-orphan")
    teacher_assignments = relationship("TeacherAssignment", back_populates="class_rel", cascade="all, delete-orphan")

# Add relationship to AcademicYear
AcademicYear.classes = relationship("Class", back_populates="academic_year", cascade="all, delete-orphan")

class Subject(BaseModel):
    __tablename__ = "subjects"
    
    # Subject attributes
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_name = Column(String(100), nullable=False)
    weekly_hours = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    class_rel = relationship("Class", back_populates="subjects")