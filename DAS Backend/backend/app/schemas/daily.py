from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from decimal import Decimal

# ==================== Holiday Schemas ====================

class HolidayBase(BaseModel):
    holiday_date: date
    holiday_name: Optional[str] = None
    is_for_students: bool = True
    is_for_teachers: bool = False
    notes: Optional[str] = None

class HolidayCreate(HolidayBase):
    academic_year_id: int
    session_type: str = "morning"  # morning, evening

class HolidayUpdate(BaseModel):
    holiday_name: Optional[str] = None
    is_for_students: Optional[bool] = None
    is_for_teachers: Optional[bool] = None
    notes: Optional[str] = None

class HolidayResponse(HolidayBase):
    id: int
    academic_year_id: int
    session_type: str
    
    class Config:
        from_attributes = True

# ==================== Student Daily Attendance Schemas ====================

class StudentDailyAttendanceBase(BaseModel):
    student_id: int
    attendance_date: date
    is_present: bool = True
    notes: Optional[str] = None

class StudentDailyAttendanceCreate(StudentDailyAttendanceBase):
    academic_year_id: int

class StudentDailyAttendanceUpdate(BaseModel):
    is_present: Optional[bool] = None
    notes: Optional[str] = None

class StudentDailyAttendanceResponse(StudentDailyAttendanceBase):
    id: int
    academic_year_id: int
    recorded_by: Optional[int] = None
    
    class Config:
        from_attributes = True

class StudentDailyAttendanceBulk(BaseModel):
    """للإدخال الجماعي لحضور الطلاب"""
    academic_year_id: int
    attendance_date: date
    class_id: int
    section: str
    absent_student_ids: List[int] = []  # فقط الطلاب الغائبين
    notes: Optional[str] = None

# ==================== Teacher Period Attendance Schemas ====================

class TeacherPeriodAttendanceBase(BaseModel):
    teacher_id: int
    attendance_date: date
    schedule_id: Optional[int] = None
    class_id: Optional[int] = None
    subject_id: Optional[int] = None
    section: Optional[str] = None
    period_number: Optional[int] = None
    day_of_week: Optional[int] = None
    is_present: bool = True
    notes: Optional[str] = None

class TeacherPeriodAttendanceCreate(TeacherPeriodAttendanceBase):
    academic_year_id: int

class TeacherPeriodAttendanceUpdate(BaseModel):
    is_present: Optional[bool] = None
    notes: Optional[str] = None

class TeacherPeriodAttendanceResponse(TeacherPeriodAttendanceBase):
    id: int
    academic_year_id: int
    recorded_by: Optional[int] = None
    
    class Config:
        from_attributes = True

class TeacherScheduleInfo(BaseModel):
    """معلومات جدول الأستاذ لليوم"""
    teacher_id: int
    teacher_name: str
    periods: List[dict]  # قائمة الحصص مع التفاصيل

class TeacherPeriodAttendanceBulk(BaseModel):
    """للإدخال الجماعي لحضور الأساتذة"""
    academic_year_id: int
    attendance_date: date
    teacher_id: int
    absent_period_ids: List[int] = []  # فقط الحصص الغائبة
    notes: Optional[str] = None

# ==================== Student Action Schemas ====================

class StudentActionBase(BaseModel):
    student_id: int
    action_date: date
    action_type: str = Field(..., description="""
        A) بدون مادة: warning, parent_call, suspension
        B) مع مادة: misbehavior, distinguished_participation, thank_you_card, note
        C) أكاديمي مع مادة: recitation, activity, quiz
    """)
    subject_id: Optional[int] = None
    description: str
    grade: Optional[Decimal] = None
    max_grade: Optional[Decimal] = None
    notes: Optional[str] = None

class StudentActionCreate(StudentActionBase):
    academic_year_id: int

class StudentActionUpdate(BaseModel):
    action_type: Optional[str] = None
    subject_id: Optional[int] = None
    description: Optional[str] = None
    grade: Optional[Decimal] = None
    max_grade: Optional[Decimal] = None
    notes: Optional[str] = None

class StudentActionResponse(StudentActionBase):
    id: int
    academic_year_id: int
    recorded_by: Optional[int] = None
    
    class Config:
        from_attributes = True

class StudentActionBulk(BaseModel):
    """للإدخال الجماعي للإجراءات"""
    academic_year_id: int
    action_date: date
    class_id: int
    section: str
    actions: List[dict]  # قائمة الإجراءات لكل طالب

# ==================== WhatsApp Group Config Schemas ====================

class WhatsAppGroupConfigBase(BaseModel):
    class_id: int
    section: str
    group_link: Optional[str] = None
    group_name: Optional[str] = None
    notes: Optional[str] = None

class WhatsAppGroupConfigCreate(WhatsAppGroupConfigBase):
    academic_year_id: int

class WhatsAppGroupConfigUpdate(BaseModel):
    group_link: Optional[str] = None
    group_name: Optional[str] = None
    notes: Optional[str] = None

class WhatsAppGroupConfigResponse(WhatsAppGroupConfigBase):
    id: int
    academic_year_id: int
    
    class Config:
        from_attributes = True

# ==================== Daily Page Summary Schemas ====================

class DailyPageSummary(BaseModel):
    """ملخص الصفحة اليومية"""
    date: date
    session_type: str  # morning or evening
    
    # إحصائيات الحضور
    total_students: int
    present_students: int
    absent_students: int
    
    total_teachers: int
    total_periods: int
    attended_periods: int
    absent_periods: int
    
    # إحصائيات الإجراءات
    total_actions: int
    warnings: int
    parent_calls: int
    academic_actions: int

class WhatsAppMessage(BaseModel):
    """رسالة الواتساب"""
    class_id: int
    section: str
    date: date
    message_content: str
    group_link: Optional[str] = None
