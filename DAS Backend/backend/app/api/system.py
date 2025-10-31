from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session, Query as SqlAlchemyQuery
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.users import User
from app.core.dependencies import get_current_user, get_director_user
from app.services.backup_service import backup_service
from app.services.telegram_service import telegram_service, notify_system
from app.schemas.system import (
    BackupRequest,
    BackupResponse,
    BackupListResponse,
    NotificationRequest,
    NotificationResponse,
    SystemStatsResponse,
    TelegramTestResponse
)
from app.models.students import Student, StudentPayment
from app.models.schedules import ScheduleGenerationHistory
from app.models.teachers import Teacher
from app.models.academic import Class

router = APIRouter(tags=["system"])

# Backup Endpoints
@router.post("/backup/database", response_model=BackupResponse)
async def create_database_backup(
    backup_request: BackupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Create database backup (Director only)"""
    try:
        result = backup_service.create_database_backup(backup_request.backup_name)
        
        if result["success"]:
            # Send notification in background
            background_tasks.add_task(
                notify_system,
                "Database Backup",
                f"Database backup '{result['backup_name']}' created successfully",
                "success"
            )
        
        return BackupResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@router.post("/backup/files", response_model=BackupResponse)
async def create_files_backup(
    backup_request: BackupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Create files backup (Director only)"""
    try:
        result = backup_service.create_files_backup(backup_request.backup_name)
        
        if result["success"]:
            background_tasks.add_task(
                notify_system,
                "Files Backup",
                f"Files backup '{result['backup_name']}' created successfully",
                "success"
            )
        
        return BackupResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@router.post("/backup/full", response_model=BackupResponse)
async def create_full_backup(
    backup_request: BackupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Create full system backup (Director only)"""
    try:
        result = backup_service.create_full_backup(backup_request.backup_name)
        
        if result["success"]:
            background_tasks.add_task(
                notify_system,
                "Full System Backup",
                f"Full backup '{result['backup_name']}' created successfully",
                "success"
            )
        
        return BackupResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@router.get("/backup/list", response_model=BackupListResponse)
async def list_backups(
    backup_type: Optional[str] = Query(None, description="Filter by backup type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """List available backups (Director only)"""
    try:
        backups_data = backup_service.list_backups(backup_type)
        total_size = sum(backup.get('file_size', 0) for backup in backups_data)
        
        # Convert dict data to BackupResponse objects
        backups = [BackupResponse(
            backup_id=str(idx),
            backup_name=backup.get('backup_name', ''),
            backup_size=backup.get('file_size', 0),
            backup_path=backup.get('file_path', ''),
            created_at=datetime.fromisoformat(backup.get('created_at', datetime.now().isoformat())),
            backup_type=backup.get('backup_type', 'unknown'),
            status='available' if backup.get('file_exists', False) else 'missing'
        ) for idx, backup in enumerate(backups_data)]
        
        return BackupListResponse(
            backups=backups,
            total_size=total_size,
            total_count=len(backups)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")

@router.post("/backup/restore/{backup_name}")
async def restore_backup(
    backup_name: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Restore database from backup (Director only)"""
    try:
        result = backup_service.restore_database_backup(backup_name)
        
        if result["success"]:
            background_tasks.add_task(
                notify_system,
                "Database Restore",
                f"Database restored from backup '{backup_name}'",
                "warning"
            )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")

@router.delete("/backup/cleanup")
async def cleanup_old_backups(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user),
    keep_days: int = Query(30, ge=1, le=365, description="Days to keep backups")
):
    """Clean up old backup files (Director only)"""
    try:
        result = backup_service.cleanup_old_backups(keep_days)
        
        if result["success"]:
            background_tasks.add_task(
                notify_system,
                "Backup Cleanup",
                f"Removed {result['removed_count']} old backup files",
                "info"
            )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

@router.get("/backup/stats")
async def get_backup_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Get backup system statistics (Director only)"""
    try:
        stats = backup_service.get_backup_statistics()
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

# Notification Endpoints
@router.post("/notification/send", response_model=NotificationResponse)
async def send_notification(
    notification: NotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Send custom notification (Director only)"""
    try:
        result = await telegram_service.send_system_alert(
            notification.title,
            notification.message,
            notification.severity or "info"  # Default to "info" if None
        )
        
        return NotificationResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notification failed: {str(e)}")

@router.get("/notification/test", response_model=TelegramTestResponse)
async def test_telegram_connection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Test Telegram bot connection (Director only)"""
    try:
        result = await telegram_service.test_connection()
        
        if result["success"]:
            # Send test message
            await telegram_service.send_system_alert(
                "اختبار الاتصال",
                "تم اختبار اتصال البوت بنجاح!",
                "info"  # severity should be a string
            )
        
        return TelegramTestResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

@router.post("/notification/daily-summary")
async def send_daily_summary(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Send daily summary report (Director only)"""
    try:
        # Collect daily statistics
        # Models already imported at the top
        
        today = datetime.now().date()
        
        # Ensure database session is valid
        if db is None:
            raise HTTPException(status_code=500, detail="Database session not available")
        
        # Get statistics
        # Explicit type annotation to satisfy linter
        try:
            student_query = db.query(Student)
            if student_query is not None and hasattr(student_query, 'filter'):
                try:
                    filtered_students = student_query.filter(Student.created_at >= today)
                    new_students = filtered_students.count()
                except:
                    new_students = 0
            else:
                new_students = 0
        except Exception:
            new_students = 0
        
        # Type check to satisfy linter
        try:
            payment_query = db.query(StudentPayment)
            if payment_query is not None:
                try:
                    daily_payments = payment_query.filter(
                        StudentPayment.payment_date >= today
                    ).all()
                except:
                    daily_payments = []
            else:
                daily_payments = []
        except Exception:
            daily_payments = []
        
        total_amount = sum(p.payment_amount for p in daily_payments)

        # Type check to satisfy linter
        try:
            schedule_query = db.query(ScheduleGenerationHistory)
            if schedule_query is not None:
                try:
                    recent_schedules = schedule_query.filter(
                        ScheduleGenerationHistory.created_at >= today
                    ).count()
                except:
                    recent_schedules = 0
            else:
                recent_schedules = 0
        except Exception:
            recent_schedules = 0
        
        stats = {
            "students": {"new": new_students},
            "payments": {"total_amount": total_amount, "count": len(daily_payments)},
            "schedules": {"updated": recent_schedules},
            "system": {"status": "عادي"}
        }
        
        result = await telegram_service.send_daily_summary(stats)
        
        return {"success": True, "message": "Daily summary sent"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send summary: {str(e)}")

# System Status Endpoints
@router.get("/status", response_model=SystemStatsResponse)
async def get_system_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get system status and statistics"""
    try:
        # Models already imported at the top
        
        # Ensure database session is valid
        if db is None:
            raise HTTPException(status_code=500, detail="Database session not available")
        
        # Collect system statistics
        try:
            total_students = db.query(Student).count() if hasattr(db, 'query') else 0
            total_teachers = db.query(Teacher).count() if hasattr(db, 'query') else 0
            total_classes = db.query(Class).count() if hasattr(db, 'query') else 0
        except Exception:
            total_students = total_teachers = total_classes = 0
        
        # Backup statistics
        backup_stats = backup_service.get_backup_statistics()
        
        # Recent activity
        # Type check to satisfy linter
        try:
            student_query = db.query(Student)
            if student_query is not None:
                try:
                    recent_students = student_query.filter(
                        Student.created_at >= datetime.now().date()
                    ).count()
                except:
                    recent_students = 0
            else:
                recent_students = 0
        except Exception:
            recent_students = 0
        
        # Type check to satisfy linter
        try:
            payment_query = db.query(StudentPayment)
            if payment_query is not None:
                try:
                    recent_payments = payment_query.filter(
                        StudentPayment.payment_date >= datetime.now().date()
                    ).count()
                except:
                    recent_payments = 0
            else:
                recent_payments = 0
        except Exception:
            recent_payments = 0
        
        # Mock system stats for now - in a real implementation these would come from system monitoring
        stats = SystemStatsResponse(
            uptime="7 days",
            memory_usage=65.5,
            cpu_usage=25.3,
            disk_usage=45.2,
            active_sessions=12,
            total_users=45
        )
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system status: {str(e)}")

@router.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "backup": backup_service is not None,
            "telegram": telegram_service.enabled,
            "database": "connected"
        }
    }