from sqlalchemy import Column, Integer, String, Text, Date, Numeric, Boolean, ForeignKey, JSON, Time
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Activity(BaseModel):
    __tablename__ = "activities"
    
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    activity_type = Column(String(20), nullable=False)  # academic, sports, cultural, social, trip
    session_type = Column(String(10), nullable=False)  # morning, evening, mixed
    target_grades = Column(JSON)  # Array of grade levels
    max_participants = Column(Integer)
    cost_per_student = Column(Numeric(10,2), default=0)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    registration_deadline = Column(Date)
    location = Column(String(200))
    instructor_name = Column(String(100))
    requirements = Column(Text)
    is_active = Column(Boolean, default=True)
    participant_count = Column(Integer, default=0)
    images = Column(Text)  # JSON array of image paths
    
    # Relationships
    academic_year = relationship("AcademicYear")
    participants = relationship("ActivityParticipant", back_populates="activity")
    student_participants = relationship("StudentActivityParticipation", back_populates="activity")
    registrations = relationship("ActivityRegistration", back_populates="activity")
    schedules = relationship("ActivitySchedule", back_populates="activity")
    attendance_records = relationship("ActivityAttendance", back_populates="activity")

class ActivityRegistration(BaseModel):
    __tablename__ = "activity_registrations"
    
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    registration_date = Column(Date, nullable=False)
    payment_status = Column(String(20), default="pending")  # pending, paid, cancelled
    payment_amount = Column(Numeric(10,2))
    notes = Column(Text)
    
    # Relationships
    student = relationship("Student")
    activity = relationship("Activity", back_populates="registrations")
    attendance_records = relationship("ActivityAttendance", back_populates="registration")  # Added missing relationship

class ActivitySchedule(BaseModel):
    __tablename__ = "activity_schedules"
    
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    location = Column(String(200))
    instructor_name = Column(String(100))
    notes = Column(Text)
    
    # Relationships
    activity = relationship("Activity", back_populates="schedules")

class ActivityAttendance(BaseModel):
    __tablename__ = "activity_attendances"
    
    registration_id = Column(Integer, ForeignKey("activity_registrations.id"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)  # Added missing foreign key
    attendance_date = Column(Date, nullable=False)
    status = Column(String(20), default="absent")  # present, absent, excused
    notes = Column(Text)
    
    # Relationships
    registration = relationship("ActivityRegistration", back_populates="attendance_records")
    activity = relationship("Activity", back_populates="attendance_records")

class ActivityParticipant(BaseModel):
    __tablename__ = "activity_participants"
    
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    section = Column(String(10))
    is_participating = Column(Boolean, default=False)
    
    # Relationships
    activity = relationship("Activity", back_populates="participants")
    class_ = relationship("Class", back_populates="activity_participants")

class StudentActivityParticipation(BaseModel):
    __tablename__ = "student_activity_participations"
    
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    is_participating = Column(Boolean, default=False)
    
    # Relationships
    student = relationship("Student")
    activity = relationship("Activity", back_populates="student_participants")