from sqlalchemy import Column, Integer, String, Text, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class DirectorNote(BaseModel):
    __tablename__ = "director_notes"
    
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    folder_type = Column(String(20), nullable=False)  # goals, projects, blogs, notes, educational_admin
    title = Column(String(200), nullable=False)
    content = Column(Text)
    note_date = Column(Date, nullable=False)
    
    # Relationships
    academic_year = relationship("AcademicYear")

class Reward(BaseModel):
    __tablename__ = "rewards"
    
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    reward_date = Column(Date, nullable=False)
    recipient_name = Column(String(200), nullable=False)
    recipient_type = Column(String(10), nullable=False)  # student, teacher, other
    amount = Column(Numeric(10,2), nullable=False)
    description = Column(Text)
    
    # Relationships
    academic_year = relationship("AcademicYear")

class AssistanceRecord(BaseModel):
    __tablename__ = "assistance_records"
    
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    assistance_date = Column(Date, nullable=False)
    organization = Column(String(200), nullable=False)
    amount = Column(Numeric(10,2), nullable=False)
    description = Column(Text)
    
    # Relationships
    academic_year = relationship("AcademicYear")