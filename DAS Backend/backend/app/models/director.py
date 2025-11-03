from sqlalchemy import Column, Integer, String, Text, Date, Numeric, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class DirectorNote(BaseModel):
    __tablename__ = "director_notes"
    
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    folder_type = Column(String(20), nullable=False)  # goals, projects, blogs, educational_admin
    title = Column(String(200), nullable=False)
    content = Column(Text)  # Markdown content for files, null for folders
    note_date = Column(Date, nullable=False)
    
    # New fields for file/folder management
    file_path = Column(String(500))  # Relative path from category root (e.g., "subfolder/note.md")
    parent_folder_id = Column(Integer, ForeignKey("director_notes.id", ondelete="CASCADE"))  # Self-referencing for folder hierarchy
    is_folder = Column(Boolean, default=False, nullable=False)  # True for folders, False for files
    
    # Relationships
    academic_year = relationship("AcademicYear")
    parent_folder = relationship("DirectorNote", remote_side="DirectorNote.id", backref="children")

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