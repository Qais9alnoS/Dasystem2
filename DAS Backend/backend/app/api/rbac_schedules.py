"""
RBAC-Protected Schedule Endpoints
Demonstrates session-based access control for supervisors
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from ..models.schedules import Schedule
from ..models.users import User
from ..core.dependencies import (
    get_morning_supervisor,
    get_evening_supervisor,
    get_any_supervisor,
    check_session_access,
    get_user_allowed_sessions
)

router = APIRouter(prefix="/rbac-schedules", tags=["RBAC Schedules"])

class AllowedSessionsResponse(BaseModel):
    user_role: str
    allowed_sessions: List[str]
    full_name: Optional[str]

class ScheduleAccessResponse(BaseModel):
    schedule_id: int
    session_type: str
    has_access: bool
    message: str

# === Public Endpoints (for any authenticated supervisor) ===

@router.get("/allowed-sessions", response_model=AllowedSessionsResponse)
def get_allowed_sessions(
    current_user: User = Depends(get_any_supervisor)
):
    """
    Get the sessions that the current user is allowed to access.
    
    Returns:
    - Directors: ["morning", "evening"]
    - Morning Supervisors: ["morning"]
    - Evening Supervisors: ["evening"]
    """
    allowed = []
    
    if current_user.role == "director":
        allowed = ["morning", "evening"]
    elif current_user.role == "morning_supervisor":
        allowed = ["morning"]
    elif current_user.role == "evening_supervisor":
        allowed = ["evening"]
    
    return AllowedSessionsResponse(
        user_role=current_user.role,
        allowed_sessions=allowed,
        full_name=current_user.full_name if hasattr(current_user, 'full_name') else None
    )

@router.get("/check-access/{schedule_id}", response_model=ScheduleAccessResponse)
def check_schedule_access(
    schedule_id: int,
    current_user: User = Depends(get_any_supervisor),
    db: Session = Depends(get_db)
):
    """
    Check if the current user has access to a specific schedule.
    
    This endpoint verifies both:
    1. The schedule exists
    2. The user's role allows access to the schedule's session type
    """
    # Get the schedule
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Check if user has access to this session type
    session_type = schedule.session_type
    has_access = False
    message = ""
    
    if current_user.role == "director":
        has_access = True
        message = "المدير لديه وصول كامل لجميع الجداول"
    elif current_user.role == "morning_supervisor" and session_type == "morning":
        has_access = True
        message = "لديك وصول لجداول الفترة الصباحية"
    elif current_user.role == "evening_supervisor" and session_type == "evening":
        has_access = True
        message = "لديك وصول لجداول الفترة المسائية"
    else:
        has_access = False
        if current_user.role == "morning_supervisor":
            message = "مشرفو الفترة الصباحية يمكنهم فقط الوصول إلى جداول الفترة الصباحية"
        elif current_user.role == "evening_supervisor":
            message = "مشرفو الفترة المسائية يمكنهم فقط الوصول إلى جداول الفترة المسائية"
    
    return ScheduleAccessResponse(
        schedule_id=schedule_id,
        session_type=session_type,
        has_access=has_access,
        message=message
    )

# === Morning Session Endpoints (morning supervisors & directors only) ===

@router.get("/morning")
def get_morning_schedules(
    current_user: User = Depends(get_morning_supervisor),
    db: Session = Depends(get_db)
):
    """
    Get all morning session schedules.
    
    Access: Morning supervisors and directors only.
    """
    schedules = db.query(Schedule).filter(Schedule.session_type == "morning").all()
    
    return {
        "session_type": "morning",
        "schedules": [
            {
                "id": s.id,
                "class_id": s.class_id,
                "section": s.section,
                "status": s.status if hasattr(s, 'status') else "active"
            } for s in schedules
        ],
        "count": len(schedules),
        "accessed_by": current_user.role
    }

# === Evening Session Endpoints (evening supervisors & directors only) ===

@router.get("/evening")
def get_evening_schedules(
    current_user: User = Depends(get_evening_supervisor),
    db: Session = Depends(get_db)
):
    """
    Get all evening session schedules.
    
    Access: Evening supervisors and directors only.
    """
    schedules = db.query(Schedule).filter(Schedule.session_type == "evening").all()
    
    return {
        "session_type": "evening",
        "schedules": [
            {
                "id": s.id,
                "class_id": s.class_id,
                "section": s.section,
                "status": s.status if hasattr(s, 'status') else "active"
            } for s in schedules
        ],
        "count": len(schedules),
        "accessed_by": current_user.role
    }

# === Dynamic Session Access (validates session at runtime) ===

@router.get("/by-session/{session_type}")
def get_schedules_by_session(
    session_type: str,
    current_user: User = Depends(get_any_supervisor),
    db: Session = Depends(get_db)
):
    """
    Get schedules for a specific session with runtime access validation.
    
    This endpoint validates that the user has access to the requested session
    before returning data.
    
    Access Rules:
    - Directors: Can access both morning and evening
    - Morning Supervisors: Can only access morning
    - Evening Supervisors: Can only access evening
    """
    # Validate session type
    if session_type not in ["morning", "evening"]:
        raise HTTPException(status_code=400, detail="Invalid session type. Must be 'morning' or 'evening'")
    
    # Check access using the RBAC dependency
    try:
        check_session_access(session_type, current_user)
    except HTTPException as e:
        # Re-raise with more context
        raise HTTPException(
            status_code=e.status_code,
            detail=f"Access denied: {e.detail}"
        )
    
    # User has access - fetch schedules
    schedules = db.query(Schedule).filter(Schedule.session_type == session_type).all()
    
    return {
        "session_type": session_type,
        "schedules": [
            {
                "id": s.id,
                "class_id": s.class_id,
                "section": s.section,
                "academic_year_id": s.academic_year_id,
                "status": s.status if hasattr(s, 'status') else "active"
            } for s in schedules
        ],
        "count": len(schedules),
        "accessed_by": {
            "username": current_user.username,
            "role": current_user.role
        }
    }

# === User Info Endpoint ===

@router.get("/my-info")
def get_my_schedule_info(
    current_user: User = Depends(get_any_supervisor)
):
    """
    Get current user's information and schedule access permissions.
    """
    allowed_sessions = []
    
    if current_user.role == "director":
        allowed_sessions = ["morning", "evening"]
    elif current_user.role == "morning_supervisor":
        allowed_sessions = ["morning"]
    elif current_user.role == "evening_supervisor":
        allowed_sessions = ["evening"]
    
    return {
        "username": current_user.username,
        "role": current_user.role,
        "full_name": current_user.full_name if hasattr(current_user, 'full_name') else None,
        "allowed_sessions": allowed_sessions,
        "permissions": {
            "can_view_morning": "morning" in allowed_sessions,
            "can_view_evening": "evening" in allowed_sessions,
            "can_edit_schedules": True,  # All supervisors can edit within their session
            "can_export_schedules": True,
            "can_create_templates": current_user.role == "director"  # Only directors can create public templates
        }
    }

