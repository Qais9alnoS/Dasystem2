from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.utils.security import verify_token
from typing import List

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    username = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Specific role dependencies
def get_director_user(current_user: User = Depends(require_roles(["director"]))):
    return current_user

def get_finance_user(current_user: User = Depends(require_roles(["director", "finance"]))):
    return current_user

def get_school_user(current_user: User = Depends(require_roles(["director", "morning_school", "evening_school"]))):
    return current_user

# Session-based access control for supervisors
def get_morning_supervisor(current_user: User = Depends(require_roles(["director", "morning_supervisor"]))):
    """
    Dependency for morning supervisor access.
    Directors have full access, morning supervisors have morning-only access.
    """
    return current_user

def get_evening_supervisor(current_user: User = Depends(require_roles(["director", "evening_supervisor"]))):
    """
    Dependency for evening supervisor access.
    Directors have full access, evening supervisors have evening-only access.
    """
    return current_user

def get_any_supervisor(current_user: User = Depends(require_roles(["director", "morning_supervisor", "evening_supervisor"]))):
    """
    Dependency for any supervisor (morning or evening) or director.
    """
    return current_user

def check_session_access(session_type: str, current_user: User = Depends(get_current_user)):
    """
    Check if user has access to a specific session (morning/evening).
    
    Rules:
    - Directors have access to all sessions
    - Morning supervisors can only access morning sessions
    - Evening supervisors can only access evening sessions
    
    Args:
        session_type: "morning" or "evening"
        current_user: Currently authenticated user
        
    Returns:
        User if authorized
        
    Raises:
        HTTPException 403 if user doesn't have access to this session
    """
    # Director has access to everything
    if current_user.role == "director":
        return current_user
    
    # Morning supervisor can only access morning session
    if current_user.role == "morning_supervisor" and session_type != "morning":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Morning supervisors can only access morning sessions. Requested: {session_type}"
        )
    
    # Evening supervisor can only access evening session
    if current_user.role == "evening_supervisor" and session_type != "evening":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Evening supervisors can only access evening sessions. Requested: {session_type}"
        )
    
    # If user is not a recognized supervisor role, deny access
    if current_user.role not in ["director", "morning_supervisor", "evening_supervisor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to access schedule management"
        )
    
    return current_user

def get_user_allowed_sessions(current_user: User = Depends(get_current_user)) -> List[str]:
    """
    Get list of sessions that the current user is allowed to access.
    
    Returns:
        List of session types: ["morning"], ["evening"], or ["morning", "evening"]
    """
    if current_user.role == "director":
        return ["morning", "evening"]
    elif current_user.role == "morning_supervisor":
        return ["morning"]
    elif current_user.role == "evening_supervisor":
        return ["evening"]
    else:
        return []