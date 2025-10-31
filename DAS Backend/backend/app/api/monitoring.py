from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models.users import User
from ..core.dependencies import get_current_user, require_roles
from ..services.monitoring_service import monitoring_service
from ..services.reporting_service import reporting_service

router = APIRouter(tags=["monitoring"])

@router.get("/health")
async def get_system_health(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get system health metrics"""
    health_data = monitoring_service.get_system_health()
    return health_data

@router.get("/metrics")
async def get_performance_metrics(
    metric_name: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Get performance metrics"""
    metrics = monitoring_service.get_performance_metrics(
        metric_name=metric_name,
        start_date=start_date,
        end_date=end_date
    )
    return {"metrics": metrics}

@router.get("/logs")
async def get_system_logs(
    level: Optional[str] = None,
    module: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search_term: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Get system logs with filtering"""
    logs_data = monitoring_service.get_logs(
        level=level,
        module=module,
        start_date=start_date,
        end_date=end_date,
        search_term=search_term,
        skip=skip,
        limit=limit
    )
    return logs_data

@router.post("/logs/cleanup")
async def cleanup_old_logs(
    keep_days: int = 90,
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Clean up old log entries"""
    deleted_count = monitoring_service.cleanup_old_logs(keep_days)
    return {
        "message": f"Cleaned up {deleted_count} old log entries",
        "deleted_count": deleted_count
    }

@router.get("/analytics/dashboard")
async def get_system_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get system analytics dashboard data"""
    # Get system health metrics
    health_data = monitoring_service.get_system_health()
    
    # Get recent logs
    recent_logs = monitoring_service.get_logs(limit=10)
    
    # Get security metrics
    from ..services.security_service import security_service
    security_metrics = security_service.get_security_metrics()
    
    # Get recent audit logs
    try:
        from ..models.system import AuditLog
        recent_audits = db.query(AuditLog).order_by(
            AuditLog.timestamp.desc()
        ).limit(10).all()
        
        audit_data = []
        for audit in recent_audits:
            audit_data.append({
                "timestamp": audit.timestamp,
                "action": audit.action,
                "user_id": audit.user_id,
                "table_name": audit.table_name,
                "ip_address": audit.ip_address
            })
    except:
        audit_data = []
    
    return {
        "system_health": health_data,
        "recent_logs": recent_logs,
        "security_metrics": security_metrics,
        "recent_audits": audit_data,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/analytics/financial")
async def get_financial_analytics(
    academic_year_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get financial analytics"""
    parameters = {
        "academic_year_id": academic_year_id,
        "start_date": start_date,
        "end_date": end_date
    }
    
    financial_report = reporting_service.generate_financial_summary(parameters)
    return financial_report

@router.get("/analytics/academic")
async def get_academic_analytics(
    academic_year_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get academic performance analytics"""
    parameters = {
        "academic_year_id": academic_year_id
    }
    
    academic_report = reporting_service.generate_academic_performance(parameters)
    return academic_report

@router.get("/analytics/usage")
async def get_system_usage_stats(
    days: int = 30,
    current_user: User = Depends(require_roles(["director"])),
    db: Session = Depends(get_db)
):
    """Get system usage statistics"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get login attempts
        from ..models.system import LoginAttempt
        login_stats = db.query(
            func.date(LoginAttempt.attempted_at).label("date"),
            func.count(LoginAttempt.id).label("attempts"),
            func.sum(func.case((LoginAttempt.success == True, 1), else_=0)).label("successful"),
            func.sum(func.case((LoginAttempt.success == False, 1), else_=0)).label("failed")
        ).filter(
            LoginAttempt.attempted_at.between(start_date, end_date)
        ).group_by(
            func.date(LoginAttempt.attempted_at)
        ).order_by(
            func.date(LoginAttempt.attempted_at)
        ).all()
        
        # Get active users
        from ..models.users import User
        active_users = db.query(User).filter(
            User.last_login >= start_date
        ).count()
        
        # Get total users
        total_users = db.query(User).count()
        
        usage_data = []
        for stat in login_stats:
            usage_data.append({
                "date": stat.date.isoformat() if hasattr(stat.date, 'isoformat') else str(stat.date),
                "total_attempts": stat.attempts,
                "successful_logins": int(stat.successful) if stat.successful else 0,
                "failed_logins": int(stat.failed) if stat.failed else 0,
                "success_rate": round((stat.successful / stat.attempts * 100) if stat.attempts > 0 else 0, 2)
            })
        
        return {
            "usage_statistics": usage_data,
            "user_stats": {
                "active_users": active_users,
                "total_users": total_users,
                "active_percentage": round((active_users / total_users * 100) if total_users > 0 else 0, 2)
            },
            "period_days": days
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get usage statistics: {str(e)}"
        )

@router.post("/events/log")
async def log_custom_event(
    level: str,
    message: str,
    module: Optional[str] = None,
    additional_data: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log custom system event"""
    success = monitoring_service.log_event(
        level=level,
        message=message,
        module=module,
        user_id=current_user.id,
        additional_data=additional_data
    )
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to log event"
        )
    
    return {"message": "Event logged successfully"}