"""
Advanced Security Service
Handles audit logging, session management, and security monitoring
"""

import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.orm.query import Query
from sqlalchemy import and_, or_, func

from ..database import SessionLocal
from ..utils.security import generate_session_token
from ..models.system import AuditLog, UserSession, LoginAttempt, SystemNotification
from ..models.users import User
from ..config import settings

class SecurityService:
    """Advanced security service for comprehensive security management"""
    
    def __init__(self):
        self.max_login_attempts = 5
        self.lockout_duration = timedelta(minutes=30)
        self.session_timeout = timedelta(hours=24)
    
    def log_audit_event(self, user_id: Optional[int], action: str, table_name: Optional[str] = None,
                       record_id: Optional[int] = None, old_values: Optional[Dict] = None,
                       new_values: Optional[Dict] = None, ip_address: Optional[str] = None,
                       user_agent: Optional[str] = None) -> bool:
        """Log audit event to database"""
        try:
            db = SessionLocal()
            try:
                def ensure_jsonable(value):
                    if isinstance(value, (bytes, bytearray)):
                        return value.decode("utf-8", errors="ignore")
                    if isinstance(value, dict):
                        return {k: ensure_jsonable(v) for k, v in value.items()}
                    if isinstance(value, list):
                        return [ensure_jsonable(v) for v in value]
                    return value

                safe_old = ensure_jsonable(old_values) if old_values is not None else None
                safe_new = ensure_jsonable(new_values) if new_values is not None else None

                # Create audit log using dictionary to avoid type errors
                audit_log_data = {
                    "user_id": user_id,
                    "action": action.upper(),
                    "table_name": table_name,
                    "record_id": record_id,
                    "old_values": safe_old,
                    "new_values": safe_new,
                    "ip_address": ip_address,
                    "user_agent": user_agent,
                    "timestamp": datetime.utcnow()
                }
                audit_log = AuditLog(**audit_log_data)
                
                db.add(audit_log)
                db.commit()
                return True
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to log audit event: {e}")
            return False
    
    def create_user_session(self, user_id: int, session_token: Optional[str] = None, ip_address: str = "",
                           user_agent: str = "") -> bool:
        """Create new user session"""
        try:
            db: Session = SessionLocal()
            try:
                # Deactivate old sessions for this user
                query: Query = db.query(UserSession).filter(
                    and_(
                        UserSession.user_id == user_id,
                        UserSession.is_active == True
                    )
                )
                if query is not None:
                    query.update({"is_active": False})
                
                # Create new session
                if not session_token:
                    session_token = generate_session_token()
                
                # Create session using dictionary to avoid type errors
                session_data = {
                    "user_id": user_id,
                    "session_token": session_token,
                    "ip_address": ip_address,
                    "user_agent": user_agent,
                    "is_active": True,
                    "expires_at": datetime.utcnow() + self.session_timeout,
                    "last_activity": datetime.utcnow()
                }
                session = UserSession(**session_data)
                
                db.add(session)
                db.commit()
                return True
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to create user session: {e}")
            return False
    
    def validate_session(self, session_token: str, ip_address: str = "") -> Optional[Dict[str, Any]]:
        """Validate user session"""
        try:
            db: Session = SessionLocal()
            try:
                query: Query = db.query(UserSession).filter(
                    and_(
                        UserSession.session_token == session_token,
                        UserSession.is_active == True,
                        UserSession.expires_at > datetime.utcnow()
                    )
                )
                session = query.first() if query is not None else None
                
                if not session:
                    return None
                
                # Update last activity
                session.last_activity = datetime.utcnow()
                db.commit()
                
                return {
                    "user_id": session.user_id,
                    "ip_address": session.ip_address,
                    "expires_at": session.expires_at,
                    "last_activity": session.last_activity
                }
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to validate session: {e}")
            return None
    
    def log_login_attempt(self, username: str, ip_address: str, user_agent: str,
                         success: bool, failure_reason: Optional[str] = None) -> bool:
        """Log login attempt"""
        try:
            db = SessionLocal()
            try:
                # Create login attempt using dictionary to avoid type errors
                attempt_data = {
                    "username": username,
                    "ip_address": ip_address,
                    "user_agent": user_agent,
                    "success": success,
                    "failure_reason": failure_reason,
                    "attempted_at": datetime.utcnow()
                }
                attempt = LoginAttempt(**attempt_data)
                
                db.add(attempt)
                db.commit()
                return True
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to log login attempt: {e}")
            return False

    # Backwards-compatibility for tests expecting this method name
    def record_failed_login(self, username: str, ip_address: str, user_agent: str = "",
                            reason: Optional[str] = None) -> bool:
        return self.log_login_attempt(username=username, ip_address=ip_address,
                                      user_agent=user_agent or "unknown", success=False,
                                      failure_reason=reason)
    
    def check_brute_force(self, username: str, ip_address: str) -> Dict[str, Any]:
        """Check for brute force attacks"""
        try:
            db: Session = SessionLocal()
            try:
                cutoff_time = datetime.utcnow() - self.lockout_duration
                
                # Count failed attempts from this IP in the lockout period
                ip_query: Query = db.query(LoginAttempt).filter(
                    and_(
                        LoginAttempt.ip_address == ip_address,
                        LoginAttempt.success == False,
                        LoginAttempt.attempted_at > cutoff_time
                    )
                )
                ip_attempts = ip_query.count() if ip_query is not None else 0
                
                # Count failed attempts for this username in the lockout period
                user_query: Query = db.query(LoginAttempt).filter(
                    and_(
                        LoginAttempt.username == username,
                        LoginAttempt.success == False,
                        LoginAttempt.attempted_at > cutoff_time
                    )
                )
                user_attempts = user_query.count() if user_query is not None else 0
                
                is_blocked = ip_attempts >= self.max_login_attempts or user_attempts >= self.max_login_attempts
                
                return {
                    "is_blocked": is_blocked,
                    "ip_attempts": ip_attempts,
                    "user_attempts": user_attempts,
                    "max_attempts": self.max_login_attempts,
                    "lockout_duration": self.lockout_duration.total_seconds()
                }
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to check brute force: {e}")
            return {"is_blocked": False, "ip_attempts": 0, "user_attempts": 0}

    def is_ip_blocked(self, ip_address: str, username: Optional[str] = None) -> bool:
        """Return True if the IP or username is currently blocked due to failed attempts."""
        try:
            info = self.check_brute_force(username or "", ip_address)
            return bool(info.get("is_blocked", False))
        except Exception:
            return False
    
    def create_system_notification(self, recipient_role: Optional[str], recipient_id: Optional[int],
                                 title: str, message: str, notification_type: str,
                                 expires_at: Optional[datetime] = None) -> bool:
        """Create system notification"""
        try:
            db = SessionLocal()
            try:
                # Create notification using dictionary to avoid type errors
                notification_data = {
                    "recipient_role": recipient_role,
                    "recipient_id": recipient_id,
                    "title": title,
                    "message": message,
                    "notification_type": notification_type.lower(),
                    "expires_at": expires_at or (datetime.utcnow() + timedelta(days=7)),
                    "created_at": datetime.utcnow()
                }
                notification = SystemNotification(**notification_data)
                
                db.add(notification)
                db.commit()
                return True
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to create system notification: {e}")
            return False
    
    def get_user_notifications(self, user_id: int, role: str, unread_only: bool = False) -> List[Dict[str, Any]]:
        """Get notifications for a user"""
        try:
            db: Session = SessionLocal()
            try:
                query: Query = db.query(SystemNotification).filter(
                    and_(
                        or_(
                            SystemNotification.recipient_id == user_id,
                            and_(
                                SystemNotification.recipient_role == role,
                                SystemNotification.recipient_id.is_(None)
                            )
                        ),
                        or_(
                            SystemNotification.expires_at.is_(None),
                            SystemNotification.expires_at > datetime.utcnow()
                        )
                    )
                )
                
                if unread_only:
                    unread_query: Query = query.filter(SystemNotification.is_read == False)
                    query = unread_query if unread_query is not None else query
                
                notifications = query.order_by(SystemNotification.created_at.desc()).all() if query is not None else []
                
                return [{
                    "id": notif.id,
                    "title": notif.title,
                    "message": notif.message,
                    "notification_type": notif.notification_type,
                    "is_read": notif.is_read,
                    "created_at": notif.created_at,
                    "expires_at": notif.expires_at
                } for notif in notifications]
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to get user notifications: {e}")
            return []
    
    def mark_notification_read(self, notification_id: int, user_id: int) -> bool:
        """Mark notification as read"""
        try:
            db: Session = SessionLocal()
            try:
                query: Query = db.query(SystemNotification).filter(
                    and_(
                        SystemNotification.id == notification_id,
                        or_(
                            SystemNotification.recipient_id == user_id,
                            SystemNotification.recipient_id.is_(None)
                        )
                    )
                )
                notification = query.first() if query is not None else None
                
                if notification:
                    notification.is_read = True
                    notification.read_at = datetime.utcnow()
                    db.commit()
                    return True
                
                return False
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to mark notification as read: {e}")
            return False
    
    def get_security_metrics(self) -> Dict[str, Any]:
        """Get security-related metrics"""
        try:
            db: Session = SessionLocal()
            try:
                today = datetime.utcnow().date()
                week_ago = datetime.utcnow() - timedelta(days=7)
                
                # Login attempts today
                login_query: Query = db.query(LoginAttempt).filter(
                    func.date(LoginAttempt.attempted_at) == today
                )
                login_attempts_today = login_query.count() if login_query is not None else 0
                
                # Failed logins today
                failed_query: Query = db.query(LoginAttempt).filter(
                    and_(
                        func.date(LoginAttempt.attempted_at) == today,
                        LoginAttempt.success == False
                    )
                )
                failed_logins_today = failed_query.count() if failed_query is not None else 0
                
                # Active sessions
                active_query: Query = db.query(UserSession).filter(
                    and_(
                        UserSession.is_active == True,
                        UserSession.expires_at > datetime.utcnow()
                    )
                )
                active_sessions = active_query.count() if active_query is not None else 0
                
                # Audit events this week
                audit_query: Query = db.query(AuditLog).filter(
                    AuditLog.timestamp > week_ago
                )
                audit_events_week = audit_query.count() if audit_query is not None else 0
                
                return {
                    "login_attempts_today": login_attempts_today,
                    "failed_logins_today": failed_logins_today,
                    "active_sessions": active_sessions,
                    "audit_events_week": audit_events_week,
                    "success_rate": ((login_attempts_today - failed_logins_today) / max(login_attempts_today, 1)) * 100
                }
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to get security metrics: {e}")
            return {}

# Global security service instance
security_service = SecurityService()