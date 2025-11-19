from datetime import datetime, timedelta
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

# Apply bcrypt compatibility patch
try:
    from app.utils.bcrypt_patch import *
except ImportError:
    pass
import secrets
import string
import re

# Updated to handle bcrypt version compatibility
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception as e:
    # Fallback for bcrypt compatibility issues
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", 
                              bcrypt__backends=["builtin"])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    if not token or not isinstance(token, str):
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # Normalize expected fields
        if "sub" not in payload and "username" in payload:
            payload["sub"] = payload["username"]
        return payload
    except JWTError:
        return None

def generate_default_password() -> str:
    """Generate a secure random default password"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(12))

def reset_password_with_default(user_role: str, username: str) -> str:
    """Reset password to default and notify director via Telegram"""
    from app.utils.telegram import send_telegram_notification_sync
    
    default_password = generate_default_password()
    
    # Send notification to director
    message = f"🔐 Password Reset Alert\n\n"
    message += f"Role: {user_role}\n"
    message += f"Username: {username}\n"
    message += f"New Default Password: {default_password}\n\n"
    message += f"⚠️ Please change this password immediately after login."
    
    # Send notification asynchronously
    try:
        send_telegram_notification_sync(message)
    except Exception as e:
        print(f"Failed to send Telegram notification: {e}")
    
    return get_password_hash(default_password)

def validate_password_strength(password: str) -> dict:
    """Validate password strength requirements"""
    errors = []
    
    # Only require minimum length - make it simple for Arabic users
    if len(password) < 8:
        errors.append("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "strength_score": max(0, 100 - len(errors) * 20)
    }

def generate_session_token() -> str:
    """Generate secure session token"""
    return secrets.token_urlsafe(32)

def hash_ip_address(ip_address: str) -> str:
    """Hash IP address for privacy"""
    import hashlib
    return hashlib.sha256(f"{ip_address}{settings.SECRET_KEY}".encode()).hexdigest()[:16]

def create_secure_filename(original_filename: str) -> str:
    """Create secure filename"""
    import uuid
    from pathlib import Path
    
    # Get file extension
    extension = Path(original_filename).suffix.lower()
    
    # Generate unique filename
    return f"{uuid.uuid4().hex}{extension}"

# Add a function to handle bcrypt version compatibility issues
def _get_bcrypt_version():
    """Get bcrypt version or handle compatibility issues"""
    try:
        import bcrypt
        # Try to get version - this might fail in some environments
        try:
            return getattr(bcrypt, '__about__', {}).get('__version__', 'unknown')
        except:
            # Fallback if __about__ is not available
            return getattr(bcrypt, '__version__', 'unknown')
    except ImportError:
        return None