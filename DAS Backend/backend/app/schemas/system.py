"""
System Management Schemas
Pydantic models for advanced system features
"""

from pydantic import BaseModel, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

# Security Schemas

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    table_name: Optional[str]
    record_id: Optional[int]
    old_values: Optional[Dict[str, Any]]
    new_values: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True

class SystemNotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class UserSessionResponse(BaseModel):
    id: int
    user_id: int
    ip_address: Optional[str]
    is_active: bool
    expires_at: datetime
    last_activity: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class SecurityMetricsResponse(BaseModel):
    login_attempts_today: int
    failed_logins_today: int
    active_sessions: int
    audit_events_week: int
    success_rate: float

# Configuration Schemas

class SystemConfigurationResponse(BaseModel):
    config_key: str
    config_value: str
    config_type: str
    description: Optional[str]
    category: Optional[str]
    is_system: bool
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ConfigurationUpdate(BaseModel):
    value: str
    config_type: str = "string"
    description: Optional[str] = None
    category: Optional[str] = None
    
    @validator('config_type')
    def validate_config_type(cls, v):
        allowed_types = ['string', 'integer', 'float', 'boolean', 'json']
        if v not in allowed_types:
            raise ValueError(f'Config type must be one of: {allowed_types}')
        return v

class ConfigurationValidation(BaseModel):
    valid: bool
    converted_value: Optional[Any] = None
    error: Optional[str] = None

# Backup Schemas

class BackupRequest(BaseModel):
    backup_name: Optional[str] = None
    include_files: bool = True
    include_database: bool = True
    backup_type: Optional[str] = "full"  # full, database, files

class BackupResponse(BaseModel):
    backup_id: str
    backup_name: str
    backup_size: int
    backup_path: str
    created_at: datetime
    backup_type: str
    status: str
    
class BackupListResponse(BaseModel):
    backups: List[BackupResponse]
    total_size: int
    total_count: int

# File Management Schemas

class FileUploadResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_size: int
    file_type: str
    uploaded_by: int
    related_entity_type: Optional[str]
    related_entity_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True

class StorageStatsResponse(BaseModel):
    total_files: int
    image_files: int
    document_files: int
    total_size_bytes: int
    total_size_mb: float
    available_space_bytes: int
    available_space_gb: float

# Reporting Schemas

class ReportType(BaseModel):
    type: str
    name: str
    description: str

class ReportParameters(BaseModel):
    academic_year_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    class_id: Optional[int] = None
    subject_id: Optional[int] = None
    days: Optional[int] = 30

class FinancialSummaryReport(BaseModel):
    summary: Dict[str, float]
    student_statistics: Dict[str, Any]
    expense_breakdown: List[Dict[str, Any]]
    generated_at: str

class StudentAnalyticsReport(BaseModel):
    total_students: int
    special_needs_students: int
    special_needs_percentage: float
    distribution: Dict[str, List[Dict[str, Any]]]
    generated_at: str

class AcademicPerformanceReport(BaseModel):
    final_exam_statistics: Dict[str, Any]
    midterm_statistics: Dict[str, Any]
    attendance: Dict[str, Any]
    generated_at: str

class SystemUsageReport(BaseModel):
    period: str
    login_statistics: Dict[str, Any]
    system_logs: List[Dict[str, Any]]
    audit_activity: List[Dict[str, Any]]
    daily_login_trend: List[Dict[str, Any]]
    generated_at: str

class SecurityAuditReport(BaseModel):
    audit_period: str
    security_summary: Dict[str, Any]
    failed_attempts_by_ip: List[Dict[str, Any]]
    suspicious_ips: List[str]
    recommendations: List[str]
    generated_at: str

# System Health Schemas

class SystemHealthResponse(BaseModel):
    status: str
    database: str
    security_metrics: Optional[SecurityMetricsResponse]
    storage_stats: Optional[StorageStatsResponse]
    configuration_count: Optional[int]
    timestamp: str

class MaintenanceCleanupResponse(BaseModel):
    message: str
    cleaned_temp_files: int

# Rate Limiting Schemas

class RateLimitInfo(BaseModel):
    is_blocked: bool
    remaining_attempts: int
    reset_time: Optional[datetime]

# Login Attempt Schemas

class LoginAttemptResponse(BaseModel):
    id: int
    username: str
    ip_address: str
    success: bool
    failure_reason: Optional[str]
    attempted_at: datetime
    
    class Config:
        from_attributes = True

# Notification Types Enum

class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"

class NotificationCreate(BaseModel):
    recipient_role: Optional[str] = None
    recipient_id: Optional[int] = None
    title: str
    message: str
    notification_type: NotificationType
    expires_at: Optional[datetime] = None

class NotificationRequest(BaseModel):
    title: str
    message: str
    severity: Optional[str] = "info"

class NotificationResponse(BaseModel):
    success: bool
    message: str
    sent_at: Optional[datetime] = None

class SystemStatsResponse(BaseModel):
    uptime: str
    memory_usage: float
    cpu_usage: float
    disk_usage: float
    active_sessions: int
    total_users: int

class TelegramTestResponse(BaseModel):
    success: bool
    message: str
    bot_info: Optional[Dict[str, Any]] = None
    test_time: Optional[datetime] = None

# Advanced Search Schemas

class SystemSearchRequest(BaseModel):
    query: str
    search_type: Optional[str] = "all"  # all, users, logs, configs, files
    limit: Optional[int] = 50

class SystemSearchResult(BaseModel):
    type: str
    id: int
    title: str
    description: str
    match_score: float
    created_at: Optional[datetime]

class SystemSearchResponse(BaseModel):
    results: List[SystemSearchResult]
    total_found: int
    search_time_ms: float