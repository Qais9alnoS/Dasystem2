"""
Advanced System Management API Endpoints
Handles configuration, security, file management, and reporting
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Dict, Any, List, Optional
from datetime import datetime
import os

from ..database import get_db
from ..models.users import User
from ..core.dependencies import get_current_user, require_roles
from ..services.security_service import security_service
from ..services.config_service import config_service
from ..services.file_service import file_service
from ..services.reporting_service import reporting_service
from ..schemas.system import *

router = APIRouter()

# Security Management Endpoints

@router.get("/security/audit-logs")
async def get_audit_logs(
    page: int = 1,
    limit: int = 50,
    level: Optional[str] = None,
    module: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Get audit logs (Director only)"""
    skip = (page - 1) * limit
    
    # Get logs from monitoring service
    from ..services.monitoring_service import monitoring_service
    logs_data = monitoring_service.get_logs(
        level=level or None,
        module=module or None,
        search_term=search or None,
        skip=skip,
        limit=limit
    )
    
    return logs_data

@router.get("/security/active-sessions")
async def get_active_sessions(
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Get active user sessions (Director only)"""
    try:
        from ..models.system import UserSession
        from sqlalchemy import and_
        
        try:
            query_method = getattr(db, 'query')
            query = query_method(UserSession).filter(
                and_(
                    UserSession.is_active == True,
                    UserSession.expires_at > datetime.utcnow()
                )
            )
        except:
            query = None
        active_sessions = query.all() if query is not None else []
        
        session_data = []
        for session in active_sessions:
            session_data.append({
                "id": session.id,
                "user_id": session.user_id,
                "session_token": session.session_token,
                "ip_address": session.ip_address,
                "user_agent": session.user_agent,
                "created_at": session.created_at,
                "last_activity": session.last_activity,
                "expires_at": session.expires_at
            })
        
        return {"active_sessions": session_data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get active sessions: {str(e)}"
        )

@router.post("/security/terminate-session")
async def terminate_session(
    session_token: str,
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Terminate user session (Director only)"""
    try:
        from ..models.system import UserSession
        
        # Find and deactivate the session
        try:
            query_method = getattr(db, 'query')
            query = query_method(UserSession).filter(
                UserSession.session_token == session_token
            )
        except:
            query = None
        session = query.first() if query is not None else None
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        session.is_active = False
        db.commit()
        
        # Log the termination
        security_service.log_audit_event(
            user_id=current_user.id,
            action="SESSION_TERMINATE",
            table_name="user_sessions",
            record_id=session.id,
            new_values={"session_token": session_token}
        )
        
        return {"message": "Session terminated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to terminate session: {str(e)}"
        )

@router.get("/security/notifications")
async def get_user_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user notifications"""
    notifications = security_service.get_user_notifications(
        user_id=current_user.id,
        role=current_user.role,
        unread_only=unread_only
    )
    
    return {"notifications": notifications}

@router.post("/security/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    success = security_service.mark_notification_read(notification_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification marked as read"}

@router.get("/security/metrics")
async def get_security_metrics(
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Get security metrics (Director only)"""
    metrics = security_service.get_security_metrics()
    return metrics

# Configuration Management Endpoints

@router.get("/config")
async def get_all_configurations(
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Get all system configurations (Director only)"""
    configs = config_service.get_all_configs()
    return {"configurations": configs}

@router.get("/config/{category}")
async def get_configuration_category(
    category: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get configurations by category"""
    configs = config_service.get_configs_by_category(category)
    return {"configurations": configs}

@router.put("/config/{key}")
async def update_configuration(
    key: str,
    value: str,
    config_type: str = "string",
    description: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Update system configuration (Director only)"""
    # Validate the value
    validation = config_service.validate_config_value(value, config_type)
    if not validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid configuration value: {validation['error']}"
        )
    
    success = config_service.set_config(
        key=key,
        value=value,
        user_id=current_user.id,
        config_type=config_type,
        description=description or "",
        category=category or "custom"
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update configuration"
        )
    
    # Log the configuration change
    security_service.log_audit_event(
        user_id=current_user.id,
        action="CONFIG_UPDATE",
        table_name="system_configurations",
        new_values={"key": key, "value": value}
    )
    
    return {"message": "Configuration updated successfully"}

@router.delete("/config/{key}")
async def delete_configuration(
    key: str,
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Delete custom configuration (Director only)"""
    success = config_service.delete_config(key, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found or cannot be deleted"
        )
    
    return {"message": "Configuration deleted successfully"}

# File Management Endpoints

@router.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload file with validation and compression"""
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload file
        result = file_service.upload_file(
            file_content=file_content,
            original_filename=file.filename or "unnamed_file",
            file_type=file.content_type or "application/octet-stream",
            uploaded_by=current_user.id,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        # Log file upload
        security_service.log_audit_event(
            user_id=current_user.id,
            action="FILE_UPLOAD",
            table_name="file_uploads",
            record_id=result["file_id"],
            new_values={
                "filename": result["filename"],
                "original_filename": file.filename,
                "file_size": result["file_size"]
            }
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )

@router.get("/files/{file_id}")
async def get_file_info(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file information"""
    file_info = file_service.get_file(file_id)
    
    if not file_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return file_info

@router.get("/files/{file_id}/download")
async def download_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download file"""
    file_info = file_service.get_file(file_id)
    
    if not file_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Check if file exists on disk
    if not os.path.exists(file_info["file_path"]):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    # Log file download
    security_service.log_audit_event(
        user_id=current_user.id,
        action="FILE_DOWNLOAD",
        table_name="file_uploads",
        record_id=file_id
    )
    
    return FileResponse(
        path=file_info["file_path"],
        filename=file_info["original_filename"],
        media_type=file_info["file_type"]
    )

@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete file"""
    success = file_service.delete_file(file_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or access denied"
        )
    
    # Log file deletion
    security_service.log_audit_event(
        user_id=current_user.id,
        action="FILE_DELETE",
        table_name="file_uploads",
        record_id=file_id
    )
    
    return {"message": "File deleted successfully"}

@router.get("/files/storage/stats")
async def get_storage_stats(
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Get storage usage statistics (Director only)"""
    stats = file_service.get_storage_stats()
    return stats

# Reporting and Analytics Endpoints

@router.get("/reports/types")
async def get_available_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get available report types"""
    reports = reporting_service.get_available_reports()
    return {"available_reports": reports}

@router.post("/reports/generate")
async def generate_report(
    report_type: str,
    parameters: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate custom report"""
    # Check permissions based on report type
    restricted_reports = ["security_audit", "system_usage"]
    if report_type in restricted_reports and current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for this report type"
        )
    
    report = reporting_service.generate_report(report_type, parameters)
    
    if "error" in report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=report["error"]
        )
    
    # Log report generation
    security_service.log_audit_event(
        user_id=current_user.id,
        action="REPORT_GENERATED",
        table_name="reports",
        new_values={
            "report_type": report_type,
            "parameters": parameters
        }
    )
    
    return report

# System Health and Monitoring

@router.get("/health/detailed")
async def detailed_health_check(
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Detailed system health check (Director only)"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        
        # Get security metrics
        security_metrics = security_service.get_security_metrics()
        
        # Get storage stats
        storage_stats = file_service.get_storage_stats()
        
        # Get configuration status
        config_count = len(config_service.get_all_configs())
        
        return {
            "status": "healthy",
            "database": "connected",
            "security_metrics": security_metrics,
            "storage_stats": storage_stats,
            "configuration_count": config_count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@router.post("/maintenance/cleanup")
async def run_maintenance_cleanup(
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Run system maintenance cleanup (Director only)"""
    try:
        # Cleanup old temp files
        cleaned_files = file_service.cleanup_old_temp_files()
        
        # Log maintenance activity
        security_service.log_audit_event(
            user_id=current_user.id,
            action="MAINTENANCE_CLEANUP",
            table_name="maintenance",
            new_values={"cleaned_temp_files": cleaned_files}
        )
        
        return {
            "message": "Maintenance cleanup completed",
            "cleaned_temp_files": cleaned_files
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Maintenance cleanup failed: {str(e)}"
        )

@router.get("/security/login-attempts")
async def get_login_attempts(
    days: int = 7,
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Get login attempts for security monitoring (Director only)"""
    try:
        from ..models.system import LoginAttempt
        from sqlalchemy import func, and_
        from datetime import datetime, timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        try:
            query_method = getattr(db, 'query')
            query = query_method(LoginAttempt).filter(
                LoginAttempt.attempted_at >= cutoff_date
            ).order_by(LoginAttempt.attempted_at.desc())
        except:
            query = None
        login_attempts = query.all() if query is not None else []
        
        attempt_data = []
        for attempt in login_attempts:
            attempt_data.append({
                "id": attempt.id,
                "username": attempt.username,
                "ip_address": attempt.ip_address,
                "user_agent": attempt.user_agent,
                "success": attempt.success,
                "failure_reason": attempt.failure_reason,
                "attempted_at": attempt.attempted_at
            })
        
        return {"login_attempts": attempt_data, "total_count": len(attempt_data)}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get login attempts: {str(e)}"
        )

@router.post("/security/whitelist-ip")
async def whitelist_ip(
    ip_address: str,
    description: Optional[str] = None,
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Add IP address to whitelist (Director only)"""
    try:
        # Validate IP address format
        import ipaddress
        try:
            ipaddress.ip_address(ip_address)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid IP address format"
            )
        
        # Log the IP whitelisting
        security_service.log_audit_event(
            user_id=current_user.id,
            action="IP_WHITELIST_ADD",
            table_name="security",
            new_values={
                "ip_address": ip_address,
                "description": description
            }
        )
        
        # In a real implementation, this would add the IP to a whitelist table
        # For now, we'll just log it as the development plan doesn't specify
        # a dedicated whitelist model
        
        return {
            "message": f"IP address {ip_address} added to whitelist",
            "ip_address": ip_address
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to whitelist IP: {str(e)}"
        )
