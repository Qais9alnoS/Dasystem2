from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta

from app.database import get_db
from app.models.users import User
from app.schemas.auth import UserLogin, Token, PasswordChange, PasswordReset, UserResponse, AuthResponse, UserCreate, UsernameUpdate
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

router = APIRouter()
security = HTTPBearer()

@router.post("/login")
async def login(user_credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """User login endpoint with security monitoring and role validation"""
    client_ip = request.client.host if request.client else "unknown"
    
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
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة"
        )
    
    # Validate that the provided role matches the user's actual role
    if user_credentials.role and user.role != user_credentials.role:
        # Log failed attempt - role mismatch
        security_service.log_login_attempt(
            username=user_credentials.username,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent", ""),
            success=False,
            failure_reason="role_mismatch"
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="الصلاحية المحددة لا تتطابق مع بيانات المستخدم"
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
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة"
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
            detail="حساب المستخدم معطل"
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
        error_message = " - ".join(validation["errors"]) if validation["errors"] else "كلمة المرور لا تلبي المتطلبات"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
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

@router.post("/create-user")
async def create_user(
    user_data: UserCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new user (Director only)"""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only directors can create new users"
        )
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="اسم المستخدم موجود مسبقاً"
        )
    
    # Validate password strength
    validation = validate_password_strength(user_data.password)
    if not validation["is_valid"]:
        error_message = " - ".join(validation["errors"]) if validation["errors"] else "كلمة المرور لا تلبي المتطلبات"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Create new user
    new_user = User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        session_type=user_data.session_type if hasattr(user_data, 'session_type') else None,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log audit event
    client_ip = request.client.host if request.client else "unknown"
    security_service.log_audit_event(
        user_id=current_user.id,
        action="CREATE_USER",
        table_name="users",
        record_id=new_user.id,
        new_values={"username": new_user.username, "role": new_user.role},
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return {
        "success": True,
        "message": "تم إنشاء المستخدم بنجاح",
        "data": {
            "id": new_user.id,
            "username": new_user.username,
            "role": new_user.role,
            "is_active": new_user.is_active
        }
    }

@router.get("/users")
async def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users (Director only)"""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only directors can view all users"
        )
    
    users = db.query(User).all()
    
    return {
        "success": True,
        "data": [
            {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "session_type": user.session_type,
                "is_active": user.is_active,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None
            }
            for user in users
        ]
    }

@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: dict,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user properties (Director only)"""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only directors can update users"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المستخدم غير موجود"
        )
    
    # Store old values for audit
    old_values = {
        "username": user.username,
        "role": user.role,
        "session_type": user.session_type,
        "is_active": user.is_active
    }
    
    # Check if new username conflicts with another user
    if user_data.get("username") and user_data["username"] != user.username:
        existing = db.query(User).filter(
            User.username == user_data["username"],
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="اسم المستخدم موجود مسبقاً"
            )
    
    # Update user properties
    if "username" in user_data:
        user.username = user_data["username"]
    if "role" in user_data:
        user.role = user_data["role"]
    if "session_type" in user_data:
        user.session_type = user_data["session_type"]
    if "is_active" in user_data:
        user.is_active = user_data["is_active"]
    
    # Update password if provided and not empty
    if user_data.get("password") and len(user_data["password"]) > 0:
        validation = validate_password_strength(user_data["password"])
        if not validation["is_valid"]:
            error_message = " - ".join(validation["errors"]) if validation["errors"] else "كلمة المرور لا تلبي المتطلبات"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        user.password_hash = get_password_hash(user_data["password"])
    
    db.commit()
    db.refresh(user)
    
    # Log audit event
    client_ip = request.client.host if request.client else "unknown"
    security_service.log_audit_event(
        user_id=current_user.id,
        action="UPDATE_USER",
        table_name="users",
        record_id=user_id,
        old_values=old_values,
        new_values={
            "username": user.username,
            "role": user.role,
            "session_type": user.session_type,
            "is_active": user.is_active
        },
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return {
        "success": True,
        "message": "تم تحديث المستخدم بنجاح",
        "data": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "session_type": user.session_type,
            "is_active": user.is_active
        }
    }

@router.put("/update-username")
async def update_username(
    username_data: UsernameUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's username"""
    # Check if new username already exists
    existing_user = db.query(User).filter(
        User.username == username_data.new_username,
        User.id != current_user.id
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="اسم المستخدم موجود مسبقاً"
        )
    
    old_username = current_user.username
    current_user.username = username_data.new_username
    db.commit()
    
    # Log audit event
    client_ip = request.client.host if request.client else "unknown"
    security_service.log_audit_event(
        user_id=current_user.id,
        action="USERNAME_CHANGE",
        table_name="users",
        record_id=current_user.id,
        old_values={"username": old_username},
        new_values={"username": username_data.new_username},
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return {"success": True, "message": "تم تغيير اسم المستخدم بنجاح"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user (Director only)"""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only directors can delete users"
        )
    
    # Prevent director from deleting themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لا يمكن حذف حسابك الخاص"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المستخدم غير موجود"
        )
    
    username = user.username
    user_role = user.role
    
    try:
        db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        # If foreign key constraint, deactivate instead of delete
        if "foreign key" in str(e).lower() or "constraint" in str(e).lower():
            user.is_active = False
            db.commit()
            return {"success": True, "message": "تم تعطيل المستخدم بنجاح (لا يمكن الحذف بسبب بيانات مرتبطة)"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"فشل حذف المستخدم: {str(e)}"
            )
    
    # Log audit event
    client_ip = request.client.host if request.client else "unknown"
    security_service.log_audit_event(
        user_id=current_user.id,
        action="DELETE_USER",
        table_name="users",
        record_id=user_id,
        old_values={"username": username, "role": user_role},
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", "")
    )
    
    return {"success": True, "message": "تم حذف المستخدم بنجاح"}