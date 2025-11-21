from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.query import Query
from sqlalchemy import and_
from typing import List, Optional, cast

from app.database import get_db
from app.models.academic import AcademicYear, Class, Subject, AcademicSettings
from app.schemas.academic import (
    AcademicYearCreate, AcademicYearUpdate, AcademicYearResponse,
    ClassCreate, ClassResponse,
    SubjectCreate, SubjectResponse,
    AcademicSettingsCreate, AcademicSettingsUpdate, AcademicSettingsResponse
)
from app.core.dependencies import get_current_user, get_director_user, get_school_user
from app.models.users import User
from app.utils.history_helper import log_class_action, log_subject_action, log_academic_year_action
from app.models.system import SystemSetting

router = APIRouter()

# First-time setup endpoint
@router.get("/first-run-check")
async def check_first_run(
    db: Session = Depends(get_db)
):
    """Check if this is the first run of the application"""
    try:
        # Check if any academic years exist
        academic_years_count = db.query(AcademicYear).count()
        
        # Check first run setting
        # Using type: ignore to suppress basedpyright error for working query pattern
        first_run_setting = db.query(SystemSetting).filter(
            SystemSetting.setting_key == "first_run_completed"
        ).first()  
        
        is_first_run = academic_years_count == 0
        
        # Update the setting if needed
        if first_run_setting:
            if is_first_run and first_run_setting.setting_value != "false":
                first_run_setting.setting_value = "false"
                db.commit()
            elif not is_first_run and first_run_setting.setting_value != "true":
                first_run_setting.setting_value = "true"
                db.commit()
        elif academic_years_count > 0:
            # Create the setting if it doesn't exist but years do
            # Using dictionary approach to avoid type errors
            first_run_setting_data = {
                "setting_key": "first_run_completed",
                "setting_value": "true",
                "description": "Indicates if the first run setup has been completed"
            }
            first_run_setting = SystemSetting(**first_run_setting_data)
            db.add(first_run_setting)
            db.commit()
        
        return {
            "is_first_run": is_first_run,
            "message": "First run setup required" if is_first_run else "System already initialized"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check first run status: {str(e)}"
        )

@router.post("/initialize-first-year", response_model=AcademicYearResponse)
async def initialize_first_academic_year(
    year_data: AcademicYearCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Initialize the first academic year (Director, Morning School, Evening School)"""
    try:
        # Check if any academic years already exist
        academic_years_count = db.query(AcademicYear).count()
        if academic_years_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Academic years already exist. Use the regular create endpoint."
            )
        
        # Create the first academic year
        new_year = AcademicYear(**year_data.dict())
        db.add(new_year)
        db.commit()
        db.refresh(new_year)
        
        # Update first run setting
        # Using type: ignore to suppress basedpyright error for working query pattern
        first_run_setting = db.query(SystemSetting).filter(
            SystemSetting.setting_key == "first_run_completed"
        ).first()  
        
        if first_run_setting:
            first_run_setting.setting_value = "true"
            db.commit()
        else:
            # Using dictionary approach to avoid type errors
            first_run_setting_data = {
                "setting_key": "first_run_completed",
                "setting_value": "true",
                "description": "Indicates if the first run setup has been completed"
            }
            first_run_setting = SystemSetting(**first_run_setting_data)
            db.add(first_run_setting)
            db.commit()
        
        return new_year
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize first academic year: {str(e)}"
        )

# Academic Year Management
@router.get("/years", response_model=List[AcademicYearResponse])
async def get_academic_years(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all academic years"""
    # Using type: ignore to suppress basedpyright error for working query pattern
    query_result = db.query(AcademicYear).order_by(AcademicYear.created_at.desc()).all()  
    years = cast(List[AcademicYear], query_result) if query_result is not None else []
    return years

@router.post("/years", response_model=AcademicYearResponse)
async def create_academic_year(
    year_data: AcademicYearCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Create new academic year (Director only)"""
    # Check if year name already exists
    # Using type: ignore to suppress basedpyright error for working query pattern
    existing_year = db.query(AcademicYear).filter(AcademicYear.year_name == year_data.year_name).first()  # type: ignore
    if existing_year:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Academic year with this name already exists"
        )
    
    # If setting as active, deactivate other years
    if year_data.is_active:
        # Using type: ignore to suppress basedpyright error for working query pattern
        db.query(AcademicYear).update({"is_active": False})  
    
    new_year = AcademicYear(**year_data.dict())
    db.add(new_year)
    db.commit()
    db.refresh(new_year)
    
    # Log history
    log_academic_year_action(
        db=db,
        action_type="create",
        year=new_year,
        current_user=current_user,
        new_values=year_data.dict()
    )
    
    return new_year

@router.put("/years/{year_id}", response_model=AcademicYearResponse)
async def update_academic_year(
    year_id: int,
    year_data: AcademicYearUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Update academic year (Director only)"""
    # Using type: ignore to suppress basedpyright error for working query pattern
    year = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()  
    if not year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found"
        )
    
    # Check if year name already exists (excluding current year)
    if year_data.year_name:
        # Using type: ignore to suppress basedpyright error for working query pattern
        existing_year = db.query(AcademicYear).filter(
            AcademicYear.year_name == year_data.year_name,
            AcademicYear.id != year_id
        ).first()  # type: ignore
        if existing_year:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Academic year with this name already exists"
            )
    
    # Store old values for history
    old_values = {field: getattr(year, field) for field in year_data.dict(exclude_unset=True).keys()}
    
    # If setting as active, deactivate other years
    if year_data.is_active:
        # Using type: ignore to suppress basedpyright error for working query pattern
        db.query(AcademicYear).update({"is_active": False})  
    
    for field, value in year_data.dict(exclude_unset=True).items():
        setattr(year, field, value)
    
    db.commit()
    db.refresh(year)
    
    # Log history
    log_academic_year_action(
        db=db,
        action_type="update",
        year=year,
        current_user=current_user,
        old_values=old_values,
        new_values=year_data.dict(exclude_unset=True)
    )
    
    return year

@router.delete("/years/{year_id}")
async def delete_academic_year(
    year_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Delete academic year (Director only)"""
    # Using type: ignore to suppress basedpyright error for working query pattern
    year = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()  
    if not year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found"
        )
    
    # Log history before deletion
    log_academic_year_action(
        db=db,
        action_type="delete",
        year=year,
        current_user=current_user
    )
    
    # Delete the academic year (no restrictions)
    db.delete(year)
    db.commit()
    
    return {"message": "Academic year deleted successfully"}

# Class Management
@router.get("/classes", response_model=List[ClassResponse])
async def get_classes(
    academic_year_id: Optional[int] = None,
    session_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all classes for academic year"""
    # Using type: ignore to suppress basedpyright error for working query pattern
    query = db.query(Class)  
    if academic_year_id is not None:
        # Using type: ignore to suppress basedpyright error for working query pattern
        query = query.filter(Class.academic_year_id == academic_year_id)  
    if session_type is not None:
        # Using type: ignore to suppress basedpyright error for working query pattern
        query = query.filter(Class.session_type == session_type)  
    
    query_result = query.all()
    classes = cast(List[Class], query_result) if query_result is not None else []
    return classes

@router.get("/classes/{class_id}", response_model=ClassResponse)
async def get_class_by_id(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single class by ID"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    return cls

@router.post("/classes", response_model=ClassResponse)
async def create_class(
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new class"""
    new_class = Class(**class_data.dict())
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    
    # Log history
    log_class_action(
        db=db,
        action_type="create",
        class_obj=new_class,
        current_user=current_user,
        new_values=class_data.dict()
    )
    
    return new_class

@router.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: int,
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update class"""
    # Using type: ignore to suppress basedpyright error for working query pattern
    cls = db.query(Class).filter(Class.id == class_id).first()  
    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Store old values for history
    old_values = {field: getattr(cls, field) for field in class_data.dict(exclude_unset=True).keys()}
    
    for field, value in class_data.dict(exclude_unset=True).items():
        setattr(cls, field, value)
    
    db.commit()
    db.refresh(cls)
    
    # Log history
    log_class_action(
        db=db,
        action_type="update",
        class_obj=cls,
        current_user=current_user,
        old_values=old_values,
        new_values=class_data.dict(exclude_unset=True)
    )
    
    return cls

@router.delete("/classes/{class_id}")
async def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete class"""
    # Using type: ignore to suppress basedpyright error for working query pattern
    cls = db.query(Class).filter(Class.id == class_id).first()  
    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )
    
    # Log history before deletion
    log_class_action(
        db=db,
        action_type="delete",
        class_obj=cls,
        current_user=current_user
    )
    
    db.delete(cls)
    db.commit()
    
    return {"message": "Class deleted successfully"}

# Subject Management
@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects(
    class_id: Optional[int] = None,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all subjects for class"""
    # Using type: ignore to suppress basedpyright error for working query pattern
    query = db.query(Subject)  
    
    # Apply filters based on what's provided
    if class_id is not None or academic_year_id is not None:
        # Join with Class table if we need to filter by academic_year_id
        if academic_year_id is not None:
            # Using type: ignore to suppress basedpyright error for working query pattern
            query = query.join(Class)
            # Using type: ignore to suppress basedpyright error for working query pattern
            query = query.filter(Class.academic_year_id == academic_year_id)
        
        # Filter by class_id if provided
        if class_id is not None:
            # Using type: ignore to suppress basedpyright error for working query pattern
            query = query.filter(Subject.class_id == class_id)
    
    query_result = query.all()
    subjects = cast(List[Subject], query_result) if query_result is not None else []
    return subjects

@router.post("/subjects", response_model=SubjectResponse)
async def create_subject(
    subject_data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new subject"""
    # Check if a subject with the same name already exists for this class
    existing_subject = db.query(Subject).filter(
        and_(
            Subject.class_id == subject_data.class_id,
            Subject.subject_name == subject_data.subject_name,
            Subject.is_active == True
        )
    ).first()
    
    if existing_subject:
        raise HTTPException(
            status_code=400,
            detail=f"يوجد بالفعل مادة باسم '{subject_data.subject_name}' في هذا الصف. يرجى اختيار اسم آخر."
        )
    
    new_subject = Subject(**subject_data.dict())
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
    # Log history
    log_subject_action(
        db=db,
        action_type="create",
        subject=new_subject,
        current_user=current_user,
        new_values=subject_data.dict()
    )
    
    return new_subject

@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: int,
    subject_data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update subject"""
    # Using type: ignore to suppress basedpyright error for working query pattern
    subject = db.query(Subject).filter(Subject.id == subject_id).first()  
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Check if updating to a name that already exists for another subject in the same class
    if subject_data.subject_name and subject_data.subject_name != subject.subject_name:
        existing_subject = db.query(Subject).filter(
            and_(
                Subject.class_id == subject_data.class_id,
                Subject.subject_name == subject_data.subject_name,
                Subject.id != subject_id,  # Exclude the current subject
                Subject.is_active == True
            )
        ).first()
        
        if existing_subject:
            raise HTTPException(
                status_code=400,
                detail=f"يوجد بالفعل مادة باسم '{subject_data.subject_name}' في هذا الصف. يرجى اختيار اسم آخر."
            )
    
    # Store old values for history
    old_values = {field: getattr(subject, field) for field in subject_data.dict(exclude_unset=True).keys()}
    
    for field, value in subject_data.dict(exclude_unset=True).items():
        setattr(subject, field, value)
    
    db.commit()
    db.refresh(subject)
    
    # Log history
    log_subject_action(
        db=db,
        action_type="update",
        subject=subject,
        current_user=current_user,
        old_values=old_values,
        new_values=subject_data.dict(exclude_unset=True)
    )
    
    return subject

@router.delete("/subjects/{subject_id}")
async def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete subject - only if it has no teacher assignments"""
    # Using type: ignore to suppress basedpyright error for working query pattern
    subject = db.query(Subject).filter(Subject.id == subject_id).first()  
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Check if subject has any teacher assignments
    from app.models.teachers import TeacherAssignment
    assignments = db.query(TeacherAssignment).filter(
        TeacherAssignment.subject_id == subject_id
    ).first()
    
    if assignments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"لا يمكن حذف المادة '{subject.subject_name}' لأنها مرتبطة بتوزيعات للأساتذة. يرجى إزالة التوزيعات أولاً أو تعطيل المادة بدلاً من حذفها."
        )
    
    # Log history before deletion
    log_subject_action(
        db=db,
        action_type="delete",
        subject=subject,
        current_user=current_user
    )
    
    db.delete(subject)
    db.commit()
    
    return {"message": "Subject deleted successfully"}

# Academic Settings Management
@router.post("/settings", response_model=AcademicSettingsResponse)
async def save_academic_settings(
    settings_data: AcademicSettingsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save or update academic settings for a class/subject"""
    # Check if settings already exist for this combination
    existing_settings = db.query(AcademicSettings).filter(
        and_(
            AcademicSettings.academic_year_id == settings_data.academic_year_id,
            AcademicSettings.class_id == settings_data.class_id,
            AcademicSettings.subject_id == settings_data.subject_id
        )
    ).first()
    
    if existing_settings:
        # Update existing settings
        for field, value in settings_data.dict(exclude_unset=True).items():
            if value is not None:
                setattr(existing_settings, field, value.dict() if hasattr(value, 'dict') else value)
        
        db.commit()
        db.refresh(existing_settings)
        return existing_settings
    else:
        # Create new settings
        settings_dict = settings_data.dict()
        # Convert Pydantic models to dicts for JSON fields
        for key in ['board_grades', 'recitation_grades', 'first_exam_grades', 'midterm_grades', 
                    'second_exam_grades', 'final_exam_grades', 'behavior_grade', 'activity_grade']:
            if settings_dict.get(key) is not None:
                settings_dict[key] = settings_dict[key]
        
        new_settings = AcademicSettings(**settings_dict)
        db.add(new_settings)
        db.commit()
        db.refresh(new_settings)
        return new_settings

@router.get("/settings", response_model=Optional[AcademicSettingsResponse])
async def get_academic_settings(
    academic_year_id: int,
    class_id: int,
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get academic settings for a specific class/subject"""
    settings = db.query(AcademicSettings).filter(
        and_(
            AcademicSettings.academic_year_id == academic_year_id,
            AcademicSettings.class_id == class_id,
            AcademicSettings.subject_id == subject_id
        )
    ).first()
    
    return settings