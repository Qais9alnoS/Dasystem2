from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from datetime import datetime

class SystemSetting(BaseModel):
    __tablename__ = "system_settings"
    
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(Text)
    description = Column(Text)

class BackupHistory(BaseModel):
    __tablename__ = "backup_history"
    
    backup_type = Column(String(50), nullable=False)  # database, files, full
    backup_name = Column(String(200), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    backup_metadata = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemLog(BaseModel):
    __tablename__ = "system_logs"
    
    level = Column(String(20), nullable=False)  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    message = Column(Text, nullable=False)
    module = Column(String(100))
    user_id = Column(Integer)
    ip_address = Column(String(45))
    additional_data = Column(Text)  # JSON string
    timestamp = Column(DateTime, default=datetime.utcnow)

class PerformanceMetric(BaseModel):
    __tablename__ = "performance_metrics"
    
    metric_name = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    tags = Column(Text)  # JSON string
    timestamp = Column(DateTime, default=datetime.utcnow)

class AuditLog(BaseModel):
    __tablename__ = "audit_logs"
    
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    table_name = Column(String(100))
    record_id = Column(Integer)
    old_values = Column(JSON)  # Previous values for UPDATE operations
    new_values = Column(JSON)  # New values for CREATE/UPDATE operations
    ip_address = Column(String(45))
    user_agent = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])

class SystemNotification(BaseModel):
    __tablename__ = "system_notifications"
    
    recipient_role = Column(String(50))  # director, finance, etc.
    recipient_id = Column(Integer, ForeignKey("users.id"))  # Specific user or NULL for all in role
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(20), nullable=False)  # info, warning, error, success
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    recipient = relationship("User", foreign_keys=[recipient_id])

class FileUpload(BaseModel):
    __tablename__ = "file_uploads"
    
    filename = Column(String(255), nullable=False)  # Unique filename on disk
    original_filename = Column(String(255), nullable=False)  # Original filename from user
    file_path = Column(String(500), nullable=False)  # Full path to file
    file_size = Column(Integer, nullable=False)  # File size in bytes
    file_type = Column(String(100), nullable=False)  # MIME type
    file_hash = Column(String(64))  # SHA-256 hash for integrity
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    related_entity_type = Column(String(50))  # student, teacher, activity, etc.
    related_entity_id = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    uploader = relationship("User", foreign_keys=[uploaded_by])

class SystemConfiguration(BaseModel):
    __tablename__ = "system_configurations"
    
    config_key = Column(String(100), unique=True, nullable=False)
    config_value = Column(Text)
    config_type = Column(String(20), nullable=False)  # string, integer, boolean, json, float
    description = Column(Text)
    category = Column(String(50))  # academic, financial, security, etc.
    is_system = Column(Boolean, default=False)  # System configs can't be deleted
    is_encrypted = Column(Boolean, default=False)  # For sensitive values
    updated_by = Column(Integer, ForeignKey("users.id"))
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    updated_by_user = relationship("User", foreign_keys=[updated_by])

class UserSession(BaseModel):
    __tablename__ = "user_sessions"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=False)
    last_activity = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])

class LoginAttempt(BaseModel):
    __tablename__ = "login_attempts"
    
    username = Column(String(100), nullable=False)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(Text)
    success = Column(Boolean, nullable=False)
    failure_reason = Column(String(100))  # invalid_password, user_not_found, account_disabled
    attempted_at = Column(DateTime, default=datetime.utcnow)