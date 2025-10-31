import psutil
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ..database import SessionLocal, engine
from ..models.system import SystemLog, PerformanceMetric
from ..services.telegram_service import notify_system

logger = logging.getLogger(__name__)

class SystemMonitoringService:
    """System monitoring and logging service"""
    
    def __init__(self):
        self.performance_thresholds = {
            "cpu_usage": 80.0,      # CPU usage percentage
            "memory_usage": 85.0,   # Memory usage percentage
            "disk_usage": 90.0,     # Disk usage percentage
            "response_time": 5.0    # API response time in seconds
        }
        
        self.alert_cooldown = timedelta(minutes=15)  # Minimum time between alerts
        self.last_alerts = {}
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get current system health metrics"""
        try:
            # CPU usage
            cpu_usage = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_usage = (disk.used / disk.total) * 100
            
            # Database connections (approximate)
            db_connections = self._get_db_connections()
            
            # Active users (from recent activity)
            active_users = self._get_active_users()
            
            # Uptime
            boot_time = psutil.boot_time()
            uptime_seconds = datetime.now().timestamp() - boot_time
            uptime_hours = uptime_seconds / 3600
            
            # Last backup info
            last_backup = self._get_last_backup_info()
            
            health_data = {
                "cpu_usage": round(cpu_usage, 2),
                "memory_usage": round(memory_usage, 2),
                "disk_usage": round(disk_usage, 2),
                "database_connections": db_connections,
                "active_users": active_users,
                "last_backup": last_backup,
                "uptime_hours": round(uptime_hours, 2)
            }
            
            # Check for alerts
            self._check_and_send_alerts(health_data)
            
            return health_data
            
        except Exception as e:
            logger.error(f"Failed to get system health: {e}")
            return {
                "error": str(e),
                "cpu_usage": 0,
                "memory_usage": 0,
                "disk_usage": 0,
                "database_connections": 0,
                "active_users": 0,
                "uptime_hours": 0
            }
    
    def log_event(self, level: str, message: str, module: Optional[str] = None,
                  user_id: Optional[int] = None, ip_address: Optional[str] = None,
                  additional_data: Optional[Dict[str, Any]] = None) -> bool:
        """Log system event to database"""
        try:
            db = SessionLocal()
            try:
                # Create log entry using dictionary to avoid type errors
                log_data = {
                    "level": level.upper() if level else "",
                    "message": message,
                    "module": module,
                    "user_id": user_id,
                    "ip_address": ip_address,
                    "additional_data": json.dumps(additional_data) if additional_data else None,
                    "timestamp": datetime.now()
                }
                log_entry = SystemLog(**log_data)
                
                db.add(log_entry)
                db.commit()
                
                # Log to standard logger as well
                getattr(logger, level.lower(), logger.info)(
                    f"[{module or 'SYSTEM'}] {message} - User: {user_id}, IP: {ip_address}"
                )
                
                return True
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to log event: {e}")
            return False
    
    def record_performance_metric(self, metric_name: str, value: float, 
                                unit: str, tags: Optional[Dict[str, str]] = None) -> bool:
        """Record performance metric"""
        try:
            db = SessionLocal()
            try:
                # Create metric using dictionary to avoid type errors
                metric_data = {
                    "metric_name": metric_name,
                    "value": value,
                    "unit": unit,
                    "tags": json.dumps(tags) if tags else None,
                    "timestamp": datetime.now()
                }
                metric = PerformanceMetric(**metric_data)
                
                db.add(metric)
                db.commit()
                
                # Check for performance alerts
                if metric_name in self.performance_thresholds:
                    threshold = self.performance_thresholds[metric_name]
                    if value > threshold:
                        self._send_performance_alert(metric_name, value, threshold)
                
                return True
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to record performance metric: {e}")
            return False
    
    def get_logs(self, level: Optional[str] = None, module: Optional[str] = None,
                start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
                search_term: Optional[str] = None, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
        """Get system logs with filtering"""
        try:
            db = SessionLocal()
            try:
                query = db.query(SystemLog)
                
                # Apply filters
                if level:
                    query = query.filter(SystemLog.level == level.upper())  
                
                if module:
                    query = query.filter(SystemLog.module == module)  
                
                if start_date:
                    query = query.filter(SystemLog.timestamp >= start_date)  
                
                if end_date:
                    query = query.filter(SystemLog.timestamp <= end_date)  
                
                if search_term:
                    query = query.filter(SystemLog.message.contains(search_term))  
                
                # Get total count
                total_count = query.count()
                
                # Apply pagination and ordering
                logs = query.order_by(SystemLog.timestamp.desc()).offset(skip).limit(limit).all()  
                
                # Convert to dict format
                log_data = []
                for log in logs:
                    log_dict = {
                        "timestamp": log.timestamp,
                        "level": log.level,
                        "message": log.message,
                        "module": log.module,
                        "user_id": log.user_id,
                        "ip_address": log.ip_address,
                        "additional_data": json.loads(log.additional_data) if log.additional_data else None
                    }
                    log_data.append(log_dict)
                
                return {
                    "success": True,
                    "logs": log_data,
                    "total_count": total_count,
                    "filtered_count": len(log_data)
                }
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to get logs: {e}")
            return {
                "success": False,
                "error": str(e),
                "logs": [],
                "total_count": 0,
                "filtered_count": 0
            }
    
    def get_performance_metrics(self, metric_name: Optional[str] = None,
                              start_date: Optional[datetime] = None,
                              end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Get performance metrics"""
        try:
            db = SessionLocal()
            try:
                query = db.query(PerformanceMetric)
                
                if metric_name:
                    query = query.filter(PerformanceMetric.metric_name == metric_name)  
                
                if start_date:
                    query = query.filter(PerformanceMetric.timestamp >= start_date)  
                
                if end_date:
                    query = query.filter(PerformanceMetric.timestamp <= end_date)  
                
                metrics = query.order_by(PerformanceMetric.timestamp.desc()).limit(1000).all()  
                
                metric_data = []
                for metric in metrics:
                    metric_dict = {
                        "timestamp": metric.timestamp,
                        "metric_name": metric.metric_name,
                        "value": metric.value,
                        "unit": metric.unit,
                        "tags": json.loads(metric.tags) if metric.tags else None
                    }
                    metric_data.append(metric_dict)
                
                return metric_data
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to get performance metrics: {e}")
            return []
    
    def cleanup_old_logs(self, keep_days: int = 90) -> int:
        """Clean up old log entries"""
        try:
            cutoff_date = datetime.now() - timedelta(days=keep_days)
            
            db = SessionLocal()
            try:
                # Delete old logs
                deleted_logs = db.query(SystemLog).filter(  
                    SystemLog.timestamp < cutoff_date
                ).delete()
                
                # Delete old performance metrics
                deleted_metrics = db.query(PerformanceMetric).filter(  
                    PerformanceMetric.timestamp < cutoff_date
                ).delete()
                
                db.commit()
                
                total_deleted = deleted_logs + deleted_metrics
                
                self.log_event(
                    "INFO",
                    f"Cleaned up {total_deleted} old log entries ({deleted_logs} logs, {deleted_metrics} metrics)",
                    "SYSTEM"
                )
                
                return total_deleted
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to cleanup old logs: {e}")
            return 0
    
    def _get_db_connections(self) -> int:
        """Get approximate number of database connections"""
        try:
            # For SQLite, this is always 1 as it's file-based
            # For production PostgreSQL/MySQL, you'd query the connection pool
            return 1
        except:
            return 0
    
    def _get_active_users(self) -> int:
        """Get number of active users (logged in recently)"""
        try:
            db = SessionLocal()
            try:
                from ..models.users import User
                
                # Count users who logged in within the last 24 hours
                yesterday = datetime.now() - timedelta(hours=24)
                active_count = db.query(User).filter(  
                    and_(
                        User.last_login.isnot(None),
                        User.last_login >= yesterday
                    )
                ).count()
                
                return active_count
                
            finally:
                db.close()
        except:
            return 0
    
    def _get_last_backup_info(self) -> Optional[str]:
        """Get information about the last backup"""
        try:
            db = SessionLocal()
            try:
                from ..models.system import BackupHistory
                
                last_backup = db.query(BackupHistory).order_by(  
                    BackupHistory.created_at.desc()
                ).first()
                
                if last_backup:
                    return last_backup.created_at.strftime("%Y-%m-%d %H:%M:%S")
                
                return None
                
            finally:
                db.close()
        except:
            return None
    
    def _check_and_send_alerts(self, health_data: Dict[str, Any]):
        """Check system health and send alerts if needed"""
        current_time = datetime.now()
        
        for metric, value in health_data.items():
            if metric in self.performance_thresholds:
                threshold = self.performance_thresholds[metric]
                
                if value > threshold:
                    # Check cooldown
                    last_alert_time = self.last_alerts.get(metric)
                    if last_alert_time and (current_time - last_alert_time) < self.alert_cooldown:
                        continue
                    
                    # Send alert
                    alert_msg = f"تحذير: {metric} وصل إلى {value:.1f}% (الحد الأقصى: {threshold}%)"
                    
                    # Use asyncio to run the async function
                    import asyncio
                    try:
                        loop = asyncio.get_event_loop()
                    except RuntimeError:
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                    
                    if loop.is_running():
                        # Create a task for the notification
                        asyncio.create_task(notify_system("تحذير النظام", alert_msg, "warning"))
                    else:
                        # Run the notification
                        loop.run_until_complete(notify_system("تحذير النظام", alert_msg, "warning"))
                    
                    self.last_alerts[metric] = current_time
                    
                    # Log the alert
                    self.log_event(
                        "WARNING",
                        f"System alert: {metric} reached {value:.1f}% (threshold: {threshold}%)",
                        "MONITORING"
                    )
    
    def _send_performance_alert(self, metric_name: str, value: float, threshold: float):
        """Send performance alert"""
        # Similar to system health alerts
        current_time = datetime.now()
        alert_key = f"perf_{metric_name}"
        
        last_alert_time = self.last_alerts.get(alert_key)
        if last_alert_time and (current_time - last_alert_time) < self.alert_cooldown:
            return
        
        alert_msg = f"تحذير أداء: {metric_name} = {value:.2f} (الحد الأقصى: {threshold:.2f})"
        
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        if loop.is_running():
            asyncio.create_task(notify_system("تحذير الأداء", alert_msg, "warning"))
        else:
            loop.run_until_complete(notify_system("تحذير الأداء", alert_msg, "warning"))
        
        self.last_alerts[alert_key] = current_time
    
    def get_available_monitoring_endpoints(self) -> list:
        """Get list of available monitoring endpoints"""
        return [
            {"endpoint": "/monitoring/health", "method": "GET", "description": "System health metrics"},
            {"endpoint": "/monitoring/metrics", "method": "GET", "description": "Performance metrics"},
            {"endpoint": "/monitoring/logs", "method": "GET", "description": "System logs with filtering"},
            {"endpoint": "/monitoring/analytics/dashboard", "method": "GET", "description": "System analytics dashboard"},
            {"endpoint": "/monitoring/analytics/financial", "method": "GET", "description": "Financial analytics"},
            {"endpoint": "/monitoring/analytics/academic", "method": "GET", "description": "Academic performance analytics"},
            {"endpoint": "/monitoring/analytics/usage", "method": "GET", "description": "System usage statistics"}
        ]

# Global monitoring service instance
monitoring_service = SystemMonitoringService()