from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date, time
from decimal import Decimal

# Activity Base Schema
class ActivityBase(BaseModel):
    name: str
    description: Optional[str] = None
    activity_type: str  # "academic", "sports", "cultural", "social", "trip"
    session_type: str  # "morning", "evening", "both"
    target_grades: List[str]  # ["grade_1", "grade_2", etc.]
    max_participants: Optional[int] = None
    cost_per_student: Decimal = Decimal('0.00')
    start_date: date
    end_date: date
    registration_deadline: Optional[date] = None
    location: Optional[str] = None
    instructor_name: Optional[str] = None
    requirements: Optional[str] = None
    is_active: bool = True

    @validator('activity_type')
    def validate_activity_type(cls, v):
        if v not in ['academic', 'sports', 'cultural', 'social', 'trip']:
            raise ValueError('Activity type must be academic, sports, cultural, social, or trip')
        return v

    @validator('session_type')
    def validate_session_type(cls, v):
        if v not in ['morning', 'evening', 'both']:
            raise ValueError('Session type must be morning, evening, or both')
        return v

    @validator('end_date')
    def validate_end_date(cls, v, values):
        start_date = values.get('start_date')
        if start_date and v < start_date:
            raise ValueError('End date must be after start date')
        return v

    @validator('registration_deadline')
    def validate_registration_deadline(cls, v, values):
        start_date = values.get('start_date')
        if v and start_date and v > start_date:
            raise ValueError('Registration deadline must be before start date')
        return v

class ActivityCreate(ActivityBase):
    academic_year_id: int

class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    activity_type: Optional[str] = None
    session_type: Optional[str] = None
    target_grades: Optional[List[str]] = None
    max_participants: Optional[int] = None
    cost_per_student: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    registration_deadline: Optional[date] = None
    location: Optional[str] = None
    instructor_name: Optional[str] = None
    requirements: Optional[str] = None
    is_active: Optional[bool] = None

    @validator('activity_type')
    def validate_activity_type(cls, v):
        if v is not None and v not in ['academic', 'sports', 'cultural', 'social', 'trip']:
            raise ValueError('Activity type must be academic, sports, cultural, social, or trip')
        return v

    @validator('session_type')
    def validate_session_type(cls, v):
        if v is not None and v not in ['morning', 'evening', 'both']:
            raise ValueError('Session type must be morning, evening, or both')
        return v

class ActivityResponse(ActivityBase):
    id: int
    academic_year_id: int
    current_participants: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Activity Registration Schemas
class ActivityRegistrationBase(BaseModel):
    student_id: int
    activity_id: int
    registration_date: date
    payment_status: str = "pending"  # "pending", "paid", "cancelled"
    payment_amount: Decimal
    notes: Optional[str] = None

    @validator('payment_status')
    def validate_payment_status(cls, v):
        if v not in ['pending', 'paid', 'cancelled']:
            raise ValueError('Payment status must be pending, paid, or cancelled')
        return v

class ActivityRegistrationCreate(ActivityRegistrationBase):
    pass

class ActivityRegistrationUpdate(BaseModel):
    payment_status: Optional[str] = None
    payment_amount: Optional[Decimal] = None
    notes: Optional[str] = None

    @validator('payment_status')
    def validate_payment_status(cls, v):
        if v is not None and v not in ['pending', 'paid', 'cancelled']:
            raise ValueError('Payment status must be pending, paid, or cancelled')
        return v

class ActivityRegistrationResponse(ActivityRegistrationBase):
    id: int
    student_name: str
    activity_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Activity Schedule Schemas
class ActivityScheduleBase(BaseModel):
    activity_id: int
    day_of_week: int  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    start_time: time
    end_time: time
    location: Optional[str] = None
    instructor_name: Optional[str] = None
    notes: Optional[str] = None

    @validator('day_of_week')
    def validate_day_of_week(cls, v):
        if v < 0 or v > 6:
            raise ValueError('Day of week must be between 0 (Monday) and 6 (Sunday)')
        return v

    @validator('end_time')
    def validate_end_time(cls, v, values):
        start_time = values.get('start_time')
        if start_time and v <= start_time:
            raise ValueError('End time must be after start time')
        return v

class ActivityScheduleCreate(ActivityScheduleBase):
    pass

class ActivityScheduleUpdate(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    instructor_name: Optional[str] = None
    notes: Optional[str] = None

    @validator('day_of_week')
    def validate_day_of_week(cls, v):
        if v is not None and (v < 0 or v > 6):
            raise ValueError('Day of week must be between 0 (Monday) and 6 (Sunday)')
        return v

class ActivityScheduleResponse(ActivityScheduleBase):
    id: int
    activity_name: str
    day_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Activity Attendance Schemas
class ActivityAttendanceBase(BaseModel):
    registration_id: int
    attendance_date: date
    status: str = "absent"  # "present", "absent", "excused"
    notes: Optional[str] = None

    @validator('status')
    def validate_status(cls, v):
        if v not in ['present', 'absent', 'excused']:
            raise ValueError('Status must be present, absent, or excused')
        return v

class ActivityAttendanceCreate(ActivityAttendanceBase):
    pass

class ActivityAttendanceUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

    @validator('status')
    def validate_status(cls, v):
        if v is not None and v not in ['present', 'absent', 'excused']:
            raise ValueError('Status must be present, absent, or excused')
        return v

class ActivityAttendanceResponse(ActivityAttendanceBase):
    id: int
    student_name: str
    activity_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Activity Report Schemas
class ActivityParticipationReport(BaseModel):
    activity_id: int
    activity_name: str
    activity_type: str
    total_registered: int
    total_paid: int
    total_attendance: int
    attendance_rate: float
    revenue_generated: Decimal

class StudentActivityReport(BaseModel):
    student_id: int
    student_name: str
    total_activities: int
    total_attendance: int
    attendance_rate: float
    total_fees_paid: Decimal
    activities: List[dict]

class ActivitySummaryReport(BaseModel):
    academic_year_id: int
    total_activities: int
    total_participants: int
    total_revenue: Decimal
    by_type: List[dict]
    by_session: List[dict]
    most_popular_activities: List[dict]

# Bulk Participant Change Schemas
class ClassChange(BaseModel):
    grade_number: str
    session: str
    student_count: int

class StudentChange(BaseModel):
    student_id: int
    name: str

class PaymentUpdate(BaseModel):
    paid_count: int
    pending_count: int

class BulkParticipantChange(BaseModel):
    added_classes: Optional[List[ClassChange]] = []
    removed_classes: Optional[List[ClassChange]] = []
    added_students: Optional[List[StudentChange]] = []
    removed_students: Optional[List[StudentChange]] = []
    payment_updates: Optional[PaymentUpdate] = None