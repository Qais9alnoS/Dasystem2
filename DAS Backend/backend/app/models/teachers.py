from sqlalchemy import Column, Integer, String, Text, Boolean, Date, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Teacher(BaseModel):
    __tablename__ = "teachers"
    
    # Teacher attributes
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    
    # Personal Information
    full_name = Column(String(200), nullable=False)
    gender = Column(String(10), nullable=False)  # male, female
    birth_date = Column(Date)
    phone = Column(String(20))
    nationality = Column(String(50))
    detailed_address = Column(Text)
    
    # Transportation
    transportation_type = Column(String(30))  # walking, full_bus, half_bus_to_school, half_bus_from_school
    
    # Professional Information
    qualifications = Column(Text)
    experience = Column(Text)
    free_time_slots = Column(Text)  # JSON format for scheduling
    
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    academic_year = relationship("AcademicYear")
    assignments = relationship("TeacherAssignment", back_populates="teacher")
    attendance = relationship("TeacherAttendance", back_populates="teacher")

class TeacherAssignment(BaseModel):
    __tablename__ = "teacher_assignments"
    
    # Teacher assignment attributes
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    section = Column(String(10))
    
    # Relationships
    teacher = relationship("Teacher", back_populates="assignments")
    class_rel = relationship("Class", back_populates="teacher_assignments")
    subject = relationship("Subject")

class TeacherAttendance(BaseModel):
    __tablename__ = "teacher_attendances"
    
    # Teacher attendance attributes
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    attendance_date = Column(Date, nullable=False)
    classes_attended = Column(Integer, default=0)
    extra_classes = Column(Integer, default=0)
    notes = Column(Text)
    
    # Relationships
    teacher = relationship("Teacher", back_populates="attendance")

class TeacherFinance(BaseModel):
    __tablename__ = "teacher_finances"
    
    # Teacher finance attributes
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    month = Column(Integer)  # Add missing month column
    year = Column(Integer)   # Add missing year column
    base_salary = Column(Numeric(10,2), default=0)
    bonuses = Column(Numeric(10,2), default=0)
    deductions = Column(Numeric(10,2), default=0)
    total_amount = Column(Numeric(10,2), default=0)
    payment_status = Column(String(20), default="pending")  # pending, paid, overdue
    payment_date = Column(Date)
    notes = Column(Text)
    
    # Relationships
    teacher = relationship("Teacher")
    academic_year = relationship("AcademicYear")