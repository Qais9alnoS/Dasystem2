"""
History API Endpoints
Provides endpoints for retrieving and managing history logs
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.users import User
from app.core.dependencies import get_current_user
from app.services.history_service import history_service
from app.schemas.history import (
    HistoryLogResponse,
    HistoryListResponse,
    HistoryStatistics,
    HistoryDetailResponse
)

router = APIRouter()


@router.get("", response_model=HistoryListResponse)
async def get_history_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    action_category: Optional[str] = None,
    action_type: Optional[str] = None,
    entity_type: Optional[str] = None,
    severity: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search_query: Optional[str] = None,
    academic_year_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get history logs with role-based filtering and pagination
    
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    - **action_category**: Filter by category (morning, evening, finance, etc.)
    - **action_type**: Filter by action type (create, update, delete, etc.)
    - **entity_type**: Filter by entity type (student, class, etc.)
    - **severity**: Filter by severity (info, warning, critical)
    - **start_date**: Filter by start date (ISO format)
    - **end_date**: Filter by end date (ISO format)
    - **search_query**: Search in description, entity name, user name
    - **academic_year_id**: Filter by academic year
    """
    try:
        # Parse dates if provided
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00')) if start_date else None
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00')) if end_date else None
        
        # Get history logs with role-based filtering
        logs, total_count = history_service.get_history(
            db=db,
            user_role=current_user.role,
            session_type=current_user.session_type,
            skip=skip,
            limit=limit,
            action_category=action_category,
            action_type=action_type,
            entity_type=entity_type,
            severity=severity,
            start_date=start_dt,
            end_date=end_dt,
            search_query=search_query,
            academic_year_id=academic_year_id
        )
        
        return {
            "items": logs,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + limit) < total_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")


@router.get("/statistics", response_model=HistoryStatistics)
async def get_history_statistics(
    academic_year_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get history statistics for dashboard display
    
    Returns counts for today, this week, this month, and most active user
    """
    try:
        stats = history_service.get_statistics(
            db=db,
            user_role=current_user.role,
            session_type=current_user.session_type,
            academic_year_id=academic_year_id
        )
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving statistics: {str(e)}")


@router.get("/{history_id}", response_model=HistoryDetailResponse)
async def get_history_detail(
    history_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific history entry
    """
    from app.models.system import HistoryLog
    
    try:
        history_log = db.query(HistoryLog).filter(HistoryLog.id == history_id).first()
        
        if not history_log:
            raise HTTPException(status_code=404, detail="History entry not found")
        
        # Check if user has permission to view this entry
        if current_user.role != "director":
            if current_user.role == "finance" and history_log.action_category not in ["finance"]:
                raise HTTPException(status_code=403, detail="Access denied")
            elif current_user.role == "morning_school" and history_log.action_category not in ["morning", "activity"]:
                raise HTTPException(status_code=403, detail="Access denied")
            elif current_user.role == "evening_school" and history_log.action_category not in ["evening", "activity"]:
                raise HTTPException(status_code=403, detail="Access denied")
        
        return history_service.format_log_detail(history_log)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history detail: {str(e)}")


@router.delete("/{history_id}")
async def delete_history_entry(
    history_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a history entry (Director only)
    """
    from app.models.system import HistoryLog
    
    if current_user.role != "director":
        raise HTTPException(status_code=403, detail="Only directors can delete history entries")
    
    try:
        history_log = db.query(HistoryLog).filter(HistoryLog.id == history_id).first()
        
        if not history_log:
            raise HTTPException(status_code=404, detail="History entry not found")
        
        db.delete(history_log)
        db.commit()
        
        return {"success": True, "message": "تم حذف السجل بنجاح"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting history entry: {str(e)}")
