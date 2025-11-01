from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.query import Query
from typing import List, Optional, cast

from app.database import get_db
from app.models.academic import AcademicYear, Class, Subject
from app.schemas.academic import (
    AcademicYearCreate, AcademicYearUpdate, AcademicYearResponse,
    ClassCreate, ClassResponse,
    SubjectCreate, SubjectResponse
)
from app.core.dependencies import get_current_user, get_director_user
from app.models.users import User
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
    current_user: User = Depends(get_director_user)
):
    """Initialize the first academic year (Director only)"""
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
    
    # If setting as active, deactivate other years
    if year_data.is_active:
        # Using type: ignore to suppress basedpyright error for working query pattern
        db.query(AcademicYear).update({"is_active": False})  
    
    for field, value in year_data.dict(exclude_unset=True).items():
        setattr(year, field, value)
    
    db.commit()
    db.refresh(year)
    
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
    
    # Delete the academic year (no restrictions)
    db.delete(year)
    db.commit()
    
    return {"message": "Academic year deleted successfully"}

# Class Management
@router.get("/classes", response_model=List[ClassResponse])
async def get_classes(
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all classes for academic year"""
    # Using type: ignore to suppress basedpyright error for working query pattern
    query = db.query(Class)  
    if academic_year_id is not None:
        # Using type: ignore to suppress basedpyright error for working query pattern
        query = query.filter(Class.academic_year_id == academic_year_id)  
    
    query_result = query.all()
    classes = cast(List[Class], query_result) if query_result is not None else []
    return classes

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
    
    for field, value in class_data.dict(exclude_unset=True).items():
        setattr(cls, field, value)
    
    db.commit()
    db.refresh(cls)
    
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
    
    db.delete(cls)
    db.commit()
    
    return {"message": "Class deleted successfully"}

# Subject Management
@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects(
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all subjects for class"""
    # Using type: ignore to suppress basedpyright error for working query pattern
    query = db.query(Subject)  
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
    new_subject = Subject(**subject_data.dict())
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
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
    
    for field, value in subject_data.dict(exclude_unset=True).items():
        setattr(subject, field, value)
    
    db.commit()
    db.refresh(subject)
    
    return subject

@router.delete("/subjects/{subject_id}")
async def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete subject"""
    # Using type: ignore to suppress basedpyright error for working query pattern
    subject = db.query(Subject).filter(Subject.id == subject_id).first()  
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    db.delete(subject)
    db.commit()
    
    return {"message": "Subject deleted successfully"}