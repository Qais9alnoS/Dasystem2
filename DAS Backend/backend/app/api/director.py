"""
Director Dashboard API Endpoints
Provides comprehensive dashboard statistics and overview for director users
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, date

from ..database import get_db
from ..models.users import User
from ..models.academic import AcademicYear, Class, Subject
from ..models.students import Student
from ..models.teachers import Teacher
from ..models.activities import Activity
from ..models.finance import FinanceTransaction, FinanceCategory
from ..models.director import DirectorNote, Reward, AssistanceRecord
from ..core.dependencies import get_director_user
from ..utils.history_helper import log_director_action
from ..schemas.director import (
    DirectorNoteCreate, DirectorNoteUpdate, DirectorNoteResponse, DirectorNoteListItem,
    CategorySummary, NoteSearchRequest, NoteSearchResult,
    RewardCreate, RewardUpdate, RewardResponse,
    AssistanceRecordCreate, AssistanceRecordUpdate, AssistanceRecordResponse
)
from ..services.director_notes_service import director_notes_service

router = APIRouter(tags=["Director Dashboard"])

@router.get("/dashboard")
async def get_director_dashboard(
    academic_year_id: Optional[int] = None,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard statistics for director"""
    try:
        # If academic_year_id is not provided, get the active academic year
        current_academic_year = None
        if academic_year_id is None:
            current_academic_year = db.query(AcademicYear).filter(
                AcademicYear.is_active == True
            ).first()
            
            # If there's an active year, use its ID
            if current_academic_year:
                academic_year_id = current_academic_year.id
        
        # Student Statistics
        student_query = db.query(Student)
        if academic_year_id is not None:
            student_query = student_query.filter(
                Student.academic_year_id == academic_year_id
            )
        total_students = student_query.count()
        
        # Teacher Statistics
        teacher_query = db.query(Teacher)
        if academic_year_id is not None:
            teacher_query = teacher_query.filter(
                Teacher.academic_year_id == academic_year_id
            )
        total_teachers = teacher_query.count()
        
        # Class Statistics
        class_query = db.query(Class)
        if academic_year_id is not None:
            class_query = class_query.filter(
                Class.academic_year_id == academic_year_id
            )
        total_classes = class_query.count()
        
        # Subject Statistics (need to join with Class since Subject doesn't have academic_year_id directly)
        # Use func.count() instead of .count() to avoid issues with column selection
        subject_query = db.query(func.count(Subject.id))
        if academic_year_id is not None:
            subject_query = subject_query.join(Class).filter(
                Class.academic_year_id == academic_year_id
            )
        total_subjects = subject_query.scalar()
        
        # Activity Statistics
        activity_query = db.query(Activity)
        if academic_year_id is not None:
            activity_query = activity_query.filter(
                and_(
                    Activity.academic_year_id == academic_year_id,
                    Activity.is_active == True
                )
            )
        active_activities = activity_query.count()
        
        # Financial Statistics (Monthly Revenue)
        monthly_revenue = 0
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        revenue_query = db.query(func.sum(FinanceTransaction.amount))
        revenue_filters = [
            FinanceTransaction.transaction_type == "income",
            FinanceTransaction.transaction_date >= thirty_days_ago
        ]
        
        if academic_year_id is not None:
            revenue_filters.append(FinanceTransaction.academic_year_id == academic_year_id)
            
        revenue_query = revenue_query.filter(and_(*revenue_filters))
        revenue_result = revenue_query.scalar()
        monthly_revenue = float(revenue_result) if revenue_result else 0
        
        # Rewards and Assistance (Placeholder - would need director_notes table)
        total_rewards = 0
        total_assistance = 0
        
        # Recent activities (Placeholder)
        recent_activities = []
        
        # Get all academic years for dropdown/selection
        all_academic_years = db.query(AcademicYear).order_by(AcademicYear.created_at.desc()).all()
        
        return {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_classes": total_classes,
            "total_subjects": total_subjects,
            "monthly_revenue": monthly_revenue,
            "active_activities": active_activities,
            "total_rewards": total_rewards,
            "total_assistance": total_assistance,
            "recent_activities": recent_activities,
            "academic_years": [{
                "id": year.id,
                "year_name": year.year_name,
                "is_active": year.is_active
            } for year in all_academic_years],
            "selected_year_id": academic_year_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dashboard statistics: {str(e)}"
        )


# ===== Director Notes Endpoints =====

@router.get("/notes/categories", response_model=List[CategorySummary])
async def get_categories_summary(
    academic_year_id: int = Query(..., description="Academic year ID"),
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Get summary of all note categories"""
    result = director_notes_service.get_category_summary(db, academic_year_id)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result["data"]["categories"]


@router.get("/notes/folders", response_model=Dict[str, Any])
async def list_folder_contents(
    academic_year_id: int = Query(..., description="Academic year ID"),
    category: str = Query(..., description="Category: goals, projects, blogs, educational_admin"),
    parent_folder_id: Optional[int] = Query(None, description="Parent folder ID (null for root)"),
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """List all files and folders in a directory"""
    result = director_notes_service.list_items(db, academic_year_id, category, parent_folder_id)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/notes/folders")
async def create_folder(
    academic_year_id: int = Query(..., description="Academic year ID"),
    category: str = Query(..., description="Category"),
    folder_name: str = Query(..., description="Folder name"),
    parent_folder_id: Optional[int] = Query(None, description="Parent folder ID"),
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Create a new folder"""
    result = director_notes_service.create_folder(
        db, academic_year_id, category, folder_name, parent_folder_id
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.put("/notes/folders/{folder_id}")
async def rename_folder(
    folder_id: int,
    new_name: str = Query(..., description="New folder name"),
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Rename a folder"""
    result = director_notes_service.rename_item(db, folder_id, new_name)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.delete("/notes/folders/{folder_id}")
async def delete_folder(
    folder_id: int,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Delete a folder and all its contents"""
    result = director_notes_service.delete_item(db, folder_id)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/notes/files/{file_id}")
async def get_file(
    file_id: int,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Get file content"""
    result = director_notes_service.read_file(db, file_id)
    
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


@router.post("/notes/files")
async def create_file(
    academic_year_id: int = Query(..., description="Academic year ID"),
    category: str = Query(..., description="Category"),
    file_name: str = Query(..., description="File name"),
    content: str = Query("", description="Markdown content"),
    note_date: date = Query(..., description="Note date"),
    parent_folder_id: Optional[int] = Query(None, description="Parent folder ID"),
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Create a new note file"""
    result = director_notes_service.create_file(
        db, academic_year_id, category, file_name, content, note_date, parent_folder_id
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.put("/notes/files/{file_id}")
async def update_file(
    file_id: int,
    title: Optional[str] = Query(None, description="New title"),
    content: Optional[str] = Query(None, description="New content"),
    note_date: Optional[date] = Query(None, description="New date"),
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Update a note file (supports auto-save)"""
    result = director_notes_service.update_file(db, file_id, title, content, note_date)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.delete("/notes/files/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Delete a note file"""
    result = director_notes_service.delete_item(db, file_id)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/notes/search")
async def search_notes(
    query: str = Query(..., min_length=1, description="Search query"),
    academic_year_id: Optional[int] = Query(None, description="Academic year ID"),
    category: Optional[str] = Query(None, description="Category filter"),
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Search notes by title and content"""
    result = director_notes_service.search_notes(db, query, academic_year_id, category)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


# ===== Rewards Endpoints =====

@router.get("/rewards", response_model=List[RewardResponse])
async def get_rewards(
    academic_year_id: Optional[int] = Query(None, description="Filter by academic year"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Get all rewards"""
    query = db.query(Reward)
    
    if academic_year_id:
        query = query.filter(Reward.academic_year_id == academic_year_id)
    
    rewards = query.order_by(Reward.reward_date.desc()).offset(skip).limit(limit).all()
    return rewards


@router.post("/rewards", response_model=RewardResponse)
async def create_reward(
    reward_data: RewardCreate,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Create a new reward"""
    reward = Reward(**reward_data.dict())
    db.add(reward)
    db.commit()
    db.refresh(reward)
    
    # Log history
    log_director_action(
        db=db,
        action_type="create",
        entity_type="reward",
        entity_id=reward.id,
        entity_name=f"مكافأة - {reward.recipient_name}",
        description=f"تم إضافة مكافأة جديدة",
        current_user=current_user,
        academic_year_id=reward.academic_year_id,
        new_values=reward_data.dict()
    )
    
    return reward


@router.get("/rewards/{reward_id}", response_model=RewardResponse)
async def get_reward(
    reward_id: int,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Get a specific reward"""
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    return reward


@router.put("/rewards/{reward_id}", response_model=RewardResponse)
async def update_reward(
    reward_id: int,
    reward_data: RewardUpdate,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Update a reward"""
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    # Store old values
    old_values = {field: getattr(reward, field) for field in reward_data.dict(exclude_unset=True).keys()}
    
    # Update fields
    for field, value in reward_data.dict(exclude_unset=True).items():
        setattr(reward, field, value)
    
    reward.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(reward)
    
    # Log history
    log_director_action(
        db=db,
        action_type="update",
        entity_type="reward",
        entity_id=reward.id,
        entity_name=f"مكافأة - {reward.recipient_name}",
        description=f"تم تعديل مكافأة",
        current_user=current_user,
        old_values=old_values,
        new_values=reward_data.dict(exclude_unset=True)
    )
    
    return reward


@router.delete("/rewards/{reward_id}")
async def delete_reward(
    reward_id: int,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Delete a reward"""
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    # Log history before deletion
    log_director_action(
        db=db,
        action_type="delete",
        entity_type="reward",
        entity_id=reward.id,
        entity_name=f"مكافأة - {reward.recipient_name}",
        description=f"تم حذف مكافأة",
        current_user=current_user
    )
    
    db.delete(reward)
    db.commit()
    return {"message": "Reward deleted successfully"}


# ===== Assistance Records Endpoints =====

@router.get("/assistance", response_model=List[AssistanceRecordResponse])
async def get_assistance_records(
    academic_year_id: Optional[int] = Query(None, description="Filter by academic year"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Get all assistance records"""
    query = db.query(AssistanceRecord)
    
    if academic_year_id:
        query = query.filter(AssistanceRecord.academic_year_id == academic_year_id)
    
    records = query.order_by(AssistanceRecord.assistance_date.desc()).offset(skip).limit(limit).all()
    return records


@router.post("/assistance", response_model=AssistanceRecordResponse)
async def create_assistance_record(
    assistance_data: AssistanceRecordCreate,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Create a new assistance record"""
    record = AssistanceRecord(**assistance_data.dict())
    db.add(record)
    db.commit()
    db.refresh(record)
    
    # Log history
    log_director_action(
        db=db,
        action_type="create",
        entity_type="assistance",
        entity_id=record.id,
        entity_name=f"مساعدة - {record.organization}",
        description=f"تم إضافة سجل مساعدة جديد",
        current_user=current_user,
        academic_year_id=record.academic_year_id,
        new_values=assistance_data.dict()
    )
    
    return record


@router.get("/assistance/{record_id}", response_model=AssistanceRecordResponse)
async def get_assistance_record(
    record_id: int,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Get a specific assistance record"""
    record = db.query(AssistanceRecord).filter(AssistanceRecord.id == record_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Assistance record not found")
    
    return record


@router.put("/assistance/{record_id}", response_model=AssistanceRecordResponse)
async def update_assistance_record(
    record_id: int,
    assistance_data: AssistanceRecordUpdate,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Update an assistance record"""
    record = db.query(AssistanceRecord).filter(AssistanceRecord.id == record_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Assistance record not found")
    
    # Store old values
    old_values = {field: getattr(record, field) for field in assistance_data.dict(exclude_unset=True).keys()}
    
    # Update fields
    for field, value in assistance_data.dict(exclude_unset=True).items():
        setattr(record, field, value)
    
    record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    
    # Log history
    log_director_action(
        db=db,
        action_type="update",
        entity_type="assistance",
        entity_id=record.id,
        entity_name=f"مساعدة - {record.organization}",
        description=f"تم تعديل سجل مساعدة",
        current_user=current_user,
        old_values=old_values,
        new_values=assistance_data.dict(exclude_unset=True)
    )
    
    return record


@router.delete("/assistance/{record_id}")
async def delete_assistance_record(
    record_id: int,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Delete an assistance record"""
    record = db.query(AssistanceRecord).filter(AssistanceRecord.id == record_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Assistance record not found")
    
    # Log history before deletion
    log_director_action(
        db=db,
        action_type="delete",
        entity_type="assistance",
        entity_id=record.id,
        entity_name=f"مساعدة - {record.organization}",
        description=f"تم حذف سجل مساعدة",
        current_user=current_user
    )
    
    db.delete(record)
    db.commit()
    return {"message": "Assistance record deleted successfully"}