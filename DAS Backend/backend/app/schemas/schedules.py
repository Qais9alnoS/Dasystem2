from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from enum import Enum

# Enums for schedule types
class SessionType(str, Enum):
    MORNING = "morning"
    EVENING = "evening"

class DayOfWeek(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

class ScheduleStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"

# Base Schedule Schema
class ScheduleBase(BaseModel):
    academic_year_id: int
    session_type: SessionType
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    is_active: bool = True

    @validator('end_date')
    def validate_end_date(cls, v, values):
        start_date = values.get('start_date')
        if start_date and v < start_date:
            raise ValueError('End date must be after start date')
        return v

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(BaseModel):
    session_type: Optional[SessionType] = None
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class ScheduleResponse(ScheduleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    total_periods: int
    total_conflicts: int

    class Config:
        from_attributes = True

# Time Slot Schema
class TimeSlotBase(BaseModel):
    schedule_id: int
    period_number: int
    start_time: time
    end_time: time
    day_of_week: DayOfWeek
    is_break: bool = False
    break_name: Optional[str] = None

    @validator('end_time')
    def validate_end_time(cls, v, values):
        start_time = values.get('start_time')
        if start_time and v <= start_time:
            raise ValueError('End time must be after start time')
        return v

    @validator('period_number')
    def validate_period_number(cls, v):
        if v < 1 or v > 10:  # Assuming max 10 periods per day
            raise ValueError('Period number must be between 1 and 10')
        return v

class TimeSlotCreate(TimeSlotBase):
    pass

class TimeSlotUpdate(BaseModel):
    period_number: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    day_of_week: Optional[DayOfWeek] = None
    is_break: Optional[bool] = None
    break_name: Optional[str] = None

class TimeSlotResponse(TimeSlotBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schedule Assignment Schema
class ScheduleAssignmentBase(BaseModel):
    schedule_id: int
    time_slot_id: int
    class_id: int
    subject_id: int
    teacher_id: int
    room: Optional[str] = None
    notes: Optional[str] = None

class ScheduleAssignmentCreate(ScheduleAssignmentBase):
    pass

class ScheduleAssignmentUpdate(BaseModel):
    class_id: Optional[int] = None
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    room: Optional[str] = None
    notes: Optional[str] = None

class ScheduleAssignmentResponse(ScheduleAssignmentBase):
    id: int
    class_name: str
    subject_name: str
    teacher_name: str
    day_name: str
    period_time: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schedule Generation Request
class ScheduleGenerationRequest(BaseModel):
    academic_year_id: int
    session_type: SessionType
    name: str
    start_date: date
    end_date: date
    
    # Time slot configuration
    periods_per_day: int = 6
    break_periods: List[int] = [3, 6]  # After which periods to insert breaks
    break_duration: int = 15  # minutes
    
    # Day configuration
    working_days: List[DayOfWeek] = [
        DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, 
        DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY
    ]
    
    # Session times
    session_start_time: time = time(8, 0)  # 8:00 AM for morning, 2:00 PM for evening
    period_duration: int = 45  # minutes per period
    
    # Generation preferences
    auto_assign_teachers: bool = True
    balance_teacher_load: bool = True
    avoid_teacher_conflicts: bool = True
    prefer_subject_continuity: bool = True
    
    @validator('periods_per_day')
    def validate_periods_per_day(cls, v):
        if v < 1 or v > 10:
            raise ValueError('Periods per day must be between 1 and 10')
        return v

    @validator('break_periods')
    def validate_break_periods(cls, v, values):
        periods_per_day = values.get('periods_per_day', 6)
        for period in v:
            if period < 1 or period > periods_per_day:
                raise ValueError(f'Break period {period} must be between 1 and {periods_per_day}')
        return v

# Schedule Generation Response
class ScheduleGenerationResponse(BaseModel):
    schedule_id: int
    generation_status: str
    total_periods_created: int
    total_assignments_created: int
    conflicts_detected: int
    warnings: List[str]
    generation_time: float  # seconds
    summary: Dict[str, Any]

# Schedule Conflict Schema
class ScheduleConflictBase(BaseModel):
    schedule_id: int
    conflict_type: str  # "teacher_double_booking", "room_conflict", "class_overlap"
    severity: str = "medium"  # "low", "medium", "high", "critical"
    description: str
    affected_assignments: List[int]  # Assignment IDs
    resolution_suggestions: List[str]
    is_resolved: bool = False

class ScheduleConflictResponse(ScheduleConflictBase):
    id: int
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schedule Statistics
class ScheduleStatistics(BaseModel):
    total_periods: int
    total_assignments: int
    total_breaks: int
    teacher_utilization: Dict[str, float]  # teacher_name -> utilization percentage
    subject_distribution: Dict[str, int]  # subject_name -> total periods
    class_load: Dict[str, int]  # class_name -> total periods
    daily_distribution: Dict[str, int]  # day_name -> total periods
    conflicts_summary: Dict[str, int]  # conflict_type -> count

# Teacher Availability Schema
class TeacherAvailabilityBase(BaseModel):
    teacher_id: int
    day_of_week: DayOfWeek
    session_type: SessionType
    start_time: time
    end_time: time
    is_available: bool = True
    max_periods_per_day: int = 6
    preferred_subjects: List[int] = []  # Subject IDs
    unavailable_periods: List[int] = []  # Period numbers

class TeacherAvailabilityCreate(TeacherAvailabilityBase):
    pass

class TeacherAvailabilityUpdate(BaseModel):
    day_of_week: Optional[DayOfWeek] = None
    session_type: Optional[SessionType] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_available: Optional[bool] = None
    max_periods_per_day: Optional[int] = None
    preferred_subjects: Optional[List[int]] = None
    unavailable_periods: Optional[List[int]] = None

class TeacherAvailabilityResponse(TeacherAvailabilityBase):
    id: int
    teacher_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schedule Template Schema
class ScheduleTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    session_type: SessionType
    periods_per_day: int
    period_duration: int  # minutes
    break_duration: int  # minutes
    break_periods: List[int]
    working_days: List[DayOfWeek]
    session_start_time: time
    is_default: bool = False

class ScheduleTemplateCreate(ScheduleTemplateBase):
    pass

class ScheduleTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    periods_per_day: Optional[int] = None
    period_duration: Optional[int] = None
    break_duration: Optional[int] = None
    break_periods: Optional[List[int]] = None
    working_days: Optional[List[DayOfWeek]] = None
    session_start_time: Optional[time] = None
    is_default: Optional[bool] = None

class ScheduleTemplateResponse(ScheduleTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Bulk Schedule Operations
class BulkScheduleOperationRequest(BaseModel):
    operation_type: str  # "copy", "delete", "update", "generate"
    source_schedule_id: Optional[int] = None
    target_academic_year_id: Optional[int] = None
    assignment_ids: Optional[List[int]] = None
    update_data: Optional[Dict[str, Any]] = None
    filters: Optional[Dict[str, Any]] = None

class BulkScheduleOperationResponse(BaseModel):
    operation_type: str
    affected_count: int
    success_count: int
    error_count: int
    errors: List[str]
    warnings: List[str]
    execution_time: float

# Schedule Export/Import Schemas
class ScheduleExportRequest(BaseModel):
    schedule_id: int
    export_format: str = "excel"  # "excel", "csv", "json"
    include_assignments: bool = True
    include_conflicts: bool = True
    include_statistics: bool = True

class ScheduleImportRequest(BaseModel):
    academic_year_id: int
    session_type: SessionType
    import_format: str = "excel"
    overwrite_existing: bool = False
    validate_only: bool = False
    file_data: str  # Base64 encoded file content

class ScheduleImportResponse(BaseModel):
    import_status: str
    schedules_imported: int
    assignments_imported: int
    conflicts_detected: int
    validation_errors: List[str]
    warnings: List[str]