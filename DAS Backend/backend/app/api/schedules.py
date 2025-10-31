# Simplified Schedule API using existing models
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from ..database import get_db
from ..models.schedules import Schedule, ScheduleConstraint, ScheduleGenerationHistory, ConstraintTemplate
from ..models.academic import Class, Subject
from ..models.teachers import Teacher
from ..models.users import User
from ..core.dependencies import get_current_user, get_school_user, get_director_user

router = APIRouter(tags=["schedules"])

# Simplified schemas for existing models
class ScheduleResponse(BaseModel):
    id: int
    academic_year_id: int
    session_type: str
    class_id: int
    section: Optional[str]
    day_of_week: int
    period_number: int
    subject_id: int
    teacher_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ScheduleCreate(BaseModel):
    academic_year_id: int
    session_type: str
    class_id: int
    section: Optional[str] = None
    day_of_week: int
    period_number: int
    subject_id: int
    teacher_id: int

class ScheduleUpdate(BaseModel):
    session_type: Optional[str] = None
    class_id: Optional[int] = None
    section: Optional[str] = None
    day_of_week: Optional[int] = None
    period_number: Optional[int] = None
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None

# Schedule Constraint Schemas
class ScheduleConstraintBase(BaseModel):
    academic_year_id: int
    constraint_type: str  # forbidden, required, no_consecutive, max_consecutive, min_consecutive
    class_id: Optional[int] = None
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    day_of_week: Optional[int] = None  # 1-7 (Monday-Sunday), None for any day
    period_number: Optional[int] = None  # 1-8, None for any period
    time_range_start: Optional[int] = None  # For range constraints
    time_range_end: Optional[int] = None
    max_consecutive_periods: Optional[int] = None
    min_consecutive_periods: Optional[int] = None
    applies_to_all_sections: bool = False
    session_type: str = "both"  # morning, evening, both
    priority_level: int = 1  # 1=Low, 2=Medium, 3=High, 4=Critical
    description: Optional[str] = None
    is_active: bool = True

class ScheduleConstraintCreate(ScheduleConstraintBase):
    pass

class ScheduleConstraintUpdate(BaseModel):
    constraint_type: Optional[str] = None
    class_id: Optional[int] = None
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    day_of_week: Optional[int] = None
    period_number: Optional[int] = None
    time_range_start: Optional[int] = None
    time_range_end: Optional[int] = None
    max_consecutive_periods: Optional[int] = None
    min_consecutive_periods: Optional[int] = None
    applies_to_all_sections: Optional[bool] = None
    session_type: Optional[str] = None
    priority_level: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ScheduleConstraintResponse(ScheduleConstraintBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Constraint Template Schemas
class ConstraintTemplateBase(BaseModel):
    template_name: str
    template_description: Optional[str] = None
    constraint_config: dict  # Stores constraint configuration
    is_system_template: bool = False

class ConstraintTemplateCreate(ConstraintTemplateBase):
    pass

class ConstraintTemplateUpdate(BaseModel):
    template_name: Optional[str] = None
    template_description: Optional[str] = None
    constraint_config: Optional[dict] = None
    is_system_template: Optional[bool] = None

class ConstraintTemplateResponse(ConstraintTemplateBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Basic Schedule Management
@router.get("/", response_model=List[ScheduleResponse])
async def get_schedules(
    academic_year_id: Optional[int] = Query(None),
    session_type: Optional[str] = Query(None),
    class_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get schedules with optional filtering"""
    query = db.query(Schedule)
    
    if academic_year_id:
        query = query.filter(Schedule.academic_year_id == academic_year_id)
    
    if session_type:
        query = query.filter(Schedule.session_type == session_type)
    
    if class_id:
        query = query.filter(Schedule.class_id == class_id)
    
    if teacher_id:
        query = query.filter(Schedule.teacher_id == teacher_id)
    
    schedules = query.offset(skip).limit(limit).all()
    return schedules

@router.post("/", response_model=ScheduleResponse)
async def create_schedule_entry(
    schedule: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Create a new schedule entry"""
    # Check for conflicts
    existing_schedule = db.query(Schedule).filter(
        and_(
            Schedule.academic_year_id == schedule.academic_year_id,
            Schedule.session_type == schedule.session_type,
            Schedule.class_id == schedule.class_id,
            Schedule.day_of_week == schedule.day_of_week,
            Schedule.period_number == schedule.period_number
        )
    ).first()
    
    if existing_schedule:
        raise HTTPException(
            status_code=400, 
            detail="Schedule entry already exists for this class, day, and period"
        )
    
    # Check teacher availability
    teacher_conflict = db.query(Schedule).filter(
        and_(
            Schedule.academic_year_id == schedule.academic_year_id,
            Schedule.session_type == schedule.session_type,
            Schedule.teacher_id == schedule.teacher_id,
            Schedule.day_of_week == schedule.day_of_week,
            Schedule.period_number == schedule.period_number
        )
    ).first()
    
    if teacher_conflict:
        raise HTTPException(
            status_code=400,
            detail="Teacher is already assigned to another class at this time"
        )
    
    db_schedule = Schedule(**schedule.dict())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get a specific schedule entry by ID"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule entry not found")
    return schedule

@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    schedule_update: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Update a schedule entry"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule entry not found")
    
    update_data = schedule_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)
    
    db.commit()
    db.refresh(schedule)
    return schedule

@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Delete a schedule entry"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule entry not found")
    
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule entry deleted successfully"}

# Schedule Constraint Management
@router.get("/constraints/", response_model=List[ScheduleConstraintResponse])
async def get_schedule_constraints(
    academic_year_id: Optional[int] = Query(None),
    constraint_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get schedule constraints with optional filtering"""
    query = db.query(ScheduleConstraint)
    
    if academic_year_id:
        query = query.filter(ScheduleConstraint.academic_year_id == academic_year_id)
    
    if constraint_type:
        query = query.filter(ScheduleConstraint.constraint_type == constraint_type)
    
    if is_active is not None:
        query = query.filter(ScheduleConstraint.is_active == is_active)
    
    constraints = query.offset(skip).limit(limit).all()
    return constraints

@router.post("/constraints/", response_model=ScheduleConstraintResponse)
async def create_schedule_constraint(
    constraint: ScheduleConstraintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Create a new schedule constraint"""
    # Validate constraint type
    valid_constraint_types = ["forbidden", "required", "no_consecutive", "max_consecutive", "min_consecutive"]
    if constraint.constraint_type not in valid_constraint_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid constraint type. Must be one of: {', '.join(valid_constraint_types)}"
        )
    
    # Validate session type
    valid_session_types = ["morning", "evening", "both"]
    if constraint.session_type not in valid_session_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid session type. Must be one of: {', '.join(valid_session_types)}"
        )
    
    # Validate priority level
    if constraint.priority_level < 1 or constraint.priority_level > 4:
        raise HTTPException(
            status_code=400,
            detail="Priority level must be between 1 and 4"
        )
    
    # Validate time range if provided
    if constraint.time_range_start is not None and constraint.time_range_end is not None:
        if constraint.time_range_start >= constraint.time_range_end:
            raise HTTPException(
                status_code=400,
                detail="time_range_start must be less than time_range_end"
            )
    
    # Validate consecutive periods if provided
    if constraint.max_consecutive_periods is not None and constraint.max_consecutive_periods < 1:
        raise HTTPException(
            status_code=400,
            detail="max_consecutive_periods must be at least 1"
        )
    
    if constraint.min_consecutive_periods is not None and constraint.min_consecutive_periods < 1:
        raise HTTPException(
            status_code=400,
            detail="min_consecutive_periods must be at least 1"
        )
    
    db_constraint = ScheduleConstraint(**constraint.dict())
    db.add(db_constraint)
    db.commit()
    db.refresh(db_constraint)
    return db_constraint

@router.get("/constraints/{constraint_id}", response_model=ScheduleConstraintResponse)
async def get_schedule_constraint(
    constraint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get a specific schedule constraint by ID"""
    constraint = db.query(ScheduleConstraint).filter(ScheduleConstraint.id == constraint_id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="Schedule constraint not found")
    return constraint

@router.put("/constraints/{constraint_id}", response_model=ScheduleConstraintResponse)
async def update_schedule_constraint(
    constraint_id: int,
    constraint_update: ScheduleConstraintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Update a schedule constraint"""
    constraint = db.query(ScheduleConstraint).filter(ScheduleConstraint.id == constraint_id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="Schedule constraint not found")
    
    update_data = constraint_update.dict(exclude_unset=True)
    
    # Validate constraint type if being updated
    if "constraint_type" in update_data:
        valid_constraint_types = ["forbidden", "required", "no_consecutive", "max_consecutive", "min_consecutive"]
        if update_data["constraint_type"] not in valid_constraint_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid constraint type. Must be one of: {', '.join(valid_constraint_types)}"
            )
    
    # Validate session type if being updated
    if "session_type" in update_data:
        valid_session_types = ["morning", "evening", "both"]
        if update_data["session_type"] not in valid_session_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid session type. Must be one of: {', '.join(valid_session_types)}"
            )
    
    # Validate priority level if being updated
    if "priority_level" in update_data:
        if update_data["priority_level"] < 1 or update_data["priority_level"] > 4:
            raise HTTPException(
                status_code=400,
                detail="Priority level must be between 1 and 4"
            )
    
    # Validate time range if being updated
    if "time_range_start" in update_data and "time_range_end" in update_data:
        if update_data["time_range_start"] is not None and update_data["time_range_end"] is not None:
            if update_data["time_range_start"] >= update_data["time_range_end"]:
                raise HTTPException(
                    status_code=400,
                    detail="time_range_start must be less than time_range_end"
                )
    
    # Validate consecutive periods if being updated
    if "max_consecutive_periods" in update_data:
        if update_data["max_consecutive_periods"] is not None and update_data["max_consecutive_periods"] < 1:
            raise HTTPException(
                status_code=400,
                detail="max_consecutive_periods must be at least 1"
            )
    
    if "min_consecutive_periods" in update_data:
        if update_data["min_consecutive_periods"] is not None and update_data["min_consecutive_periods"] < 1:
            raise HTTPException(
                status_code=400,
                detail="min_consecutive_periods must be at least 1"
            )
    
    for field, value in update_data.items():
        setattr(constraint, field, value)
    
    db.commit()
    db.refresh(constraint)
    return constraint

@router.delete("/constraints/{constraint_id}")
async def delete_schedule_constraint(
    constraint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Delete a schedule constraint"""
    constraint = db.query(ScheduleConstraint).filter(ScheduleConstraint.id == constraint_id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="Schedule constraint not found")
    
    db.delete(constraint)
    db.commit()
    return {"message": "Schedule constraint deleted successfully"}

# Constraint Template Management
@router.get("/constraint-templates/", response_model=List[ConstraintTemplateResponse])
async def get_constraint_templates(
    is_system_template: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get constraint templates with optional filtering"""
    query = db.query(ConstraintTemplate)
    
    if is_system_template is not None:
        query = query.filter(ConstraintTemplate.is_system_template == is_system_template)
    
    templates = query.offset(skip).limit(limit).all()
    return templates

@router.post("/constraint-templates/", response_model=ConstraintTemplateResponse)
async def create_constraint_template(
    template: ConstraintTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Create a new constraint template"""
    db_template = ConstraintTemplate(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("/constraint-templates/{template_id}", response_model=ConstraintTemplateResponse)
async def get_constraint_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get a specific constraint template by ID"""
    template = db.query(ConstraintTemplate).filter(ConstraintTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Constraint template not found")
    return template

@router.put("/constraint-templates/{template_id}", response_model=ConstraintTemplateResponse)
async def update_constraint_template(
    template_id: int,
    template_update: ConstraintTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Update a constraint template"""
    template = db.query(ConstraintTemplate).filter(ConstraintTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Constraint template not found")
    
    update_data = template_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    return template

@router.delete("/constraint-templates/{template_id}")
async def delete_constraint_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Delete a constraint template"""
    template = db.query(ConstraintTemplate).filter(ConstraintTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Constraint template not found")
    
    db.delete(template)
    db.commit()
    return {"message": "Constraint template deleted successfully"}

@router.get("/weekly-view")
async def get_weekly_schedule_view(
    academic_year_id: int,
    session_type: str,
    class_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get weekly schedule view"""
    query = db.query(Schedule).filter(
        and_(
            Schedule.academic_year_id == academic_year_id,
            Schedule.session_type == session_type
        )
    )
    
    if class_id:
        query = query.filter(Schedule.class_id == class_id)
    
    if teacher_id:
        query = query.filter(Schedule.teacher_id == teacher_id)
    
    schedules = query.all()
    
    # Organize by day and period
    weekly_view = {}
    
    for schedule in schedules:
        day = schedule.day_of_week
        period = schedule.period_number
        
        if day not in weekly_view:
            weekly_view[day] = {}
        
        weekly_view[day][period] = {
            "schedule_id": schedule.id,
            "class_id": schedule.class_id,
            "subject_id": schedule.subject_id,
            "teacher_id": schedule.teacher_id,
            "section": schedule.section
        }
    
    return {
        "academic_year_id": academic_year_id,
        "session_type": session_type,
        "view_type": "weekly",
        "data": weekly_view
    }

@router.get("/analysis/conflicts")
async def analyze_schedule_conflicts(
    academic_year_id: int,
    session_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Analyze schedule for conflicts"""
    schedules = db.query(Schedule).filter(
        and_(
            Schedule.academic_year_id == academic_year_id,
            Schedule.session_type == session_type
        )
    ).all()
    
    conflicts = []
    
    # Check for teacher conflicts
    teacher_schedule = {}
    for schedule in schedules:
        key = (schedule.teacher_id, schedule.day_of_week, schedule.period_number)
        if key in teacher_schedule:
            conflicts.append({
                "type": "teacher_conflict",
                "teacher_id": schedule.teacher_id,
                "day_of_week": schedule.day_of_week,
                "period_number": schedule.period_number,
                "conflicting_schedules": [teacher_schedule[key], schedule.id]
            })
        else:
            teacher_schedule[key] = schedule.id
    
    return {
        "academic_year_id": academic_year_id,
        "session_type": session_type,
        "total_conflicts": len(conflicts),
        "conflicts": conflicts
    }