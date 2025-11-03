from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

# Teacher Base Schema
class TeacherBase(BaseModel):
    full_name: str
    father_name: Optional[str] = None
    gender: str  # "male", "female"
    birth_date: Optional[str] = None  # Using string for date to avoid serialization issues
    phone: Optional[str] = None
    nationality: Optional[str] = None
    detailed_address: Optional[str] = None
    transportation_type: Optional[str] = None  # "walking", "full_bus", "half_bus_to_school", "half_bus_from_school"
    bus_number: Optional[str] = None
    qualifications: Optional[str] = None  # JSON string for array of qualifications
    experience: Optional[str] = None  # JSON string for array of experiences
    free_time_slots: Optional[str] = None  # JSON string for free time grid
    notes: Optional[str] = None
    session_type: str  # "morning", "evening"
    academic_year_id: int
    is_active: bool = True

    @validator('session_type')
    def validate_session_type(cls, v):
        if v not in ['morning', 'evening']:
            raise ValueError('Session type must be morning or evening')
        return v
    
    @validator('gender')
    def validate_gender(cls, v):
        if v not in ['male', 'female']:
            raise ValueError('Gender must be male or female')
        return v
    
    @validator('transportation_type')
    def validate_transportation(cls, v):
        if v is not None and v not in ['walking', 'full_bus', 'half_bus_to_school', 'half_bus_from_school']:
            raise ValueError('Invalid transportation type')
        return v

class TeacherCreate(TeacherBase):
    pass

class TeacherUpdate(BaseModel):
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[str] = None
    phone: Optional[str] = None
    nationality: Optional[str] = None
    detailed_address: Optional[str] = None
    transportation_type: Optional[str] = None
    bus_number: Optional[str] = None
    qualifications: Optional[str] = None
    experience: Optional[str] = None
    free_time_slots: Optional[str] = None
    notes: Optional[str] = None
    session_type: Optional[str] = None
    academic_year_id: Optional[int] = None
    is_active: Optional[bool] = None

    @validator('session_type')
    def validate_session_type(cls, v):
        if v is not None and v not in ['morning', 'evening']:
            raise ValueError('Session type must be morning or evening')
        return v
    
    @validator('gender')
    def validate_gender(cls, v):
        if v is not None and v not in ['male', 'female']:
            raise ValueError('Gender must be male or female')
        return v

class TeacherResponse(TeacherBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            date: lambda v: v.strftime('%Y-%m-%d') if v else None
        }

# Teacher Subject Assignment Schemas
class TeacherSubjectBase(BaseModel):
    teacher_id: int
    subject_name: str
    grade_level: str
    academic_year_id: int

class TeacherSubjectCreate(TeacherSubjectBase):
    pass

class TeacherSubjectResponse(TeacherSubjectBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Teacher Finance Schemas
class TeacherFinanceBase(BaseModel):
    teacher_id: int
    academic_year_id: int
    month: int
    year: int
    base_salary: Decimal
    bonuses: Decimal = Decimal('0.00')
    deductions: Decimal = Decimal('0.00')
    total_amount: Decimal
    payment_status: str = "pending"  # "pending", "paid", "overdue"
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None

    @validator('month')
    def validate_month(cls, v):
        if v < 1 or v > 12:
            raise ValueError('Month must be between 1 and 12')
        return v

    @validator('payment_status')
    def validate_payment_status(cls, v):
        if v not in ['pending', 'paid', 'overdue']:
            raise ValueError('Payment status must be pending, paid, or overdue')
        return v

class TeacherFinanceCreate(TeacherFinanceBase):
    pass

class TeacherFinanceUpdate(BaseModel):
    base_salary: Optional[Decimal] = None
    bonuses: Optional[Decimal] = None
    deductions: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    payment_status: Optional[str] = None
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None

    @validator('payment_status')
    def validate_payment_status(cls, v):
        if v is not None and v not in ['pending', 'paid', 'overdue']:
            raise ValueError('Payment status must be pending, paid, or overdue')
        return v

class TeacherFinanceResponse(TeacherFinanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Teacher Attendance Schemas
class TeacherAttendanceBase(BaseModel):
    teacher_id: int
    date: date
    session_type: str  # "morning", "evening"
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    status: str = "absent"  # "present", "absent", "late", "excused"
    notes: Optional[str] = None

    @validator('session_type')
    def validate_session_type(cls, v):
        if v not in ['morning', 'evening']:
            raise ValueError('Session type must be morning or evening')
        return v

    @validator('status')
    def validate_status(cls, v):
        if v not in ['present', 'absent', 'late', 'excused']:
            raise ValueError('Status must be present, absent, late, or excused')
        return v

class TeacherAttendanceCreate(TeacherAttendanceBase):
    pass

class TeacherAttendanceUpdate(BaseModel):
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None

    @validator('status')
    def validate_status(cls, v):
        if v is not None and v not in ['present', 'absent', 'late', 'excused']:
            raise ValueError('Status must be present, absent, late, or excused')
        return v

class TeacherAttendanceResponse(TeacherAttendanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True