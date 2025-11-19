from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta

from app.database import get_db
from app.models.users import User
from app.schemas.auth import UserLogin, Token, PasswordChange, PasswordReset, UserResponse, AuthResponse
from app.utils.security import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    reset_password_with_default,
    validate_password_strength,
    generate_session_token
)
from app.core.dependencies import get_current_user
from app.config import settings
from app.services.security_service import security_service
from app.core.rate_limiting import rate_limiter

router = APIRouter()
security = HTTPBearer()

@router.post("/login")
async def login(user_credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """User login endpoint with security monitoring"""
    client_ip = request.client.host if request.client else "unknown"
    
    # Check for brute force attacks
    brute_force_check = security_service.check_brute_force(user_credentials.username, client_ip)
    if brute_force_check["is_blocked"]:
        # Log the blocked attempt
        security_service.log_login_attempt(
            username=user_credentials.username,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent", ""),
            success=False,
            failure_reason="ip_blocked"
        )
        
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed attempts. Try again in {brute_force_check['lockout_duration'] // 60} minutes."
        )
    
    user = db.query(User).filter(User.username == user_credentials.username).first()
    
    if not user:
        # Log failed attempt - user not found
        security_service.log_login_attempt(
            username=user_credentials.username,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent", ""),
            success=False,
            failure_reason="user_not_found"
        )
        rate_limiter.record_failed_attempt(client_ip, user_credentials.username)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not verify_password(user_credentials.password, user.password_hash):
        # Log failed attempt - wrong password
        security_service.log_login_attempt(
            username=user_credentials.username,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent", ""),
            success=False,
            failure_reason="invalid_password"
        )
        rate_limiter.record_failed_attempt(client_ip, user_credentials.username)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        # Log failed attempt - account disabled
        security_service.log_login_attempt(
            username=user_credentials.username,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent", ""),
            success=False,
            failure_reason="account_disabled"
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated"
        )
    
    # Successful login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Log successful login
    security_service.log_login_attempt(
        username=user_credentials.username,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", ""),
        success=True
    )
    
    # Clear failed attempts for this IP
    rate_limiter.record_successful_attempt(client_ip)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    
    # Create user session
    session_token = generate_session_token()
    security_service.create_user_session(
        user_id=user.id,
        session_token=session_token,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", "")
    )
    
    # Log audit event
    security_service.log_audit_event(
        user_id=user.id,
        action="LOGIN",
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", "")
    )
    
    # Return auth response with user data in the format expected by frontend
    auth_response = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "session_type": user.session_type
        }
    }
    
    return {"success": True, "data": auth_response}

@router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh access token"""
    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.username, "role": current_user.role}, 
        expires_delta=access_token_expires
    )
    
    # Return auth response with user data in the same format as login
    auth_response = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
            "is_active": current_user.is_active,
            "session_type": current_user.session_type
        }
    }
    
    return {"success": True, "data": auth_response}

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    validation = validate_password_strength(password_data.new_password)
    if not validation["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Password does not meet requirements", "errors": validation["errors"]}
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    # Log audit event
    security_service.log_audit_event(
        user_id=current_user.id,
        action="PASSWORD_CHANGE",
        ip_address="",
        user_agent=""
    )
    
    return {"message": "Password changed successfully"}

@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordReset,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset password to default (Director only)"""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only directors can reset passwords"
        )
    
    user = db.query(User).filter(
        User.username == reset_data.username,
        User.role == reset_data.role
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Reset password and send notification
    user.password_hash = reset_password_with_default(user.role, user.username)
    db.commit()
    
    # Log audit event
    security_service.log_audit_event(
        user_id=current_user.id,
        action="PASSWORD_RESET",
        ip_address="",
        user_agent=""
    )
    
    return {"message": "Password reset successfully. Notification sent via Telegram."}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.post("/logout")
async def logout(request: Request, current_user: User = Depends(get_current_user)):
    """Logout endpoint with session cleanup"""
    client_ip = request.client.host if request.client else "unknown"
    
    # Deactivate user session
    try:
        db = next(get_db())
        try:
            # Find and deactivate active sessions for this user
            from app.models.system import UserSession
            db.query(UserSession).filter(
                and_(
                    UserSession.user_id == current_user.id,
                    UserSession.is_active == True
                )
            ).update({"is_active": False})
            db.commit()
        finally:
            db.close()
    except Exception as e:
        # Log the error but don't fail the logout
        print(f"Failed to cleanup session: {e}")
    
    # Log audit event
    security_service.log_audit_event(
        user_id=current_user.id,
        action="LOGOUT",
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return {"message": "Logged out successfully"}