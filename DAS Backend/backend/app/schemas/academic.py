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

class GradeSettings(BaseModel):
    max_grade: int
    passing_threshold: float
    threshold_type: str  # 'percentage' or 'absolute'

class AcademicSettingsBase(BaseModel):
    academic_year_id: int
    class_id: int
    subject_id: Optional[int] = None
    board_grades: Optional[GradeSettings] = None
    recitation_grades: Optional[GradeSettings] = None
    first_exam_grades: Optional[GradeSettings] = None
    midterm_grades: Optional[GradeSettings] = None
    second_exam_grades: Optional[GradeSettings] = None
    final_exam_grades: Optional[GradeSettings] = None
    behavior_grade: Optional[GradeSettings] = None
    activity_grade: Optional[GradeSettings] = None
    overall_percentage_threshold: float = 50.0

class AcademicSettingsCreate(AcademicSettingsBase):
    pass

class AcademicSettingsUpdate(BaseModel):
    board_grades: Optional[GradeSettings] = None
    recitation_grades: Optional[GradeSettings] = None
    first_exam_grades: Optional[GradeSettings] = None
    midterm_grades: Optional[GradeSettings] = None
    second_exam_grades: Optional[GradeSettings] = None
    final_exam_grades: Optional[GradeSettings] = None
    behavior_grade: Optional[GradeSettings] = None
    activity_grade: Optional[GradeSettings] = None
    overall_percentage_threshold: Optional[float] = None

class AcademicSettingsResponse(AcademicSettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True