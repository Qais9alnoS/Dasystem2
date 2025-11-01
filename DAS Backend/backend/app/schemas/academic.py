from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AcademicYearBase(BaseModel):
    year_name: str
    description: Optional[str] = None
    is_active: bool = False

class AcademicYearCreate(AcademicYearBase):
    pass

class AcademicYearUpdate(BaseModel):
    year_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class AcademicYearResponse(AcademicYearBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ClassBase(BaseModel):
    academic_year_id: int
    session_type: str
    grade_level: str
    grade_number: int
    section_count: int = 1
    max_students_per_section: Optional[int] = None

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubjectBase(BaseModel):
    class_id: int
    subject_name: str
    weekly_hours: int
    is_active: bool = True

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True