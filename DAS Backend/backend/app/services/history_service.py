"""
History Service - Comprehensive logging for all system actions
Tracks all CRUD operations and provides role-based history retrieval
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from app.models.system import HistoryLog
from app.models.users import User


class HistoryService:
    """Service for logging and retrieving system history"""
    
    @staticmethod
    def log_action(
        db: Session,
        action_type: str,
        action_category: str,
        entity_type: str,
        entity_id: Optional[int],
        entity_name: str,
        description: str,
        user_id: Optional[int] = None,
        user_name: Optional[str] = None,
        user_role: Optional[str] = None,
        academic_year_id: Optional[int] = None,
        session_type: Optional[str] = None,
        severity: str = "info",
        meta_data: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        ip_address: Optional[str] = None
    ) -> HistoryLog:
        """
        Log an action to history
        
        Args:
            action_type: create, update, delete, activate, etc.
            action_category: morning, evening, finance, director, system, activity
            entity_type: student, class, transaction, etc.
            entity_id: ID of affected entity
            entity_name: Display name
            description: Human-readable Arabic description
            user_id: User who performed action
            user_name: Username (cached)
            user_role: User role (cached)
            academic_year_id: Related academic year
            session_type: morning, evening, both, null
            severity: info, warning, critical
            meta_data: Additional data (before/after values, etc.)
            tags: Array of tags
            ip_address: Client IP
        """
        try:
            # Auto-determine category from session_type if not provided
            if not action_category and session_type:
                if session_type == "morning":
                    action_category = "morning"
                elif session_type == "evening":
                    action_category = "evening"
            
            # Auto-determine severity for critical actions
            if action_type == "delete":
                severity = "critical"
            elif action_type in ["deactivate", "suspend"]:
                severity = "warning"
            
            # Create history log entry
            history_log = HistoryLog(
                academic_year_id=academic_year_id,
                timestamp=datetime.utcnow(),
                action_type=action_type,
                action_category=action_category,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_name=entity_name,
                user_id=user_id,
                user_name=user_name,
                user_role=user_role,
                description=description,
                meta_data=meta_data or {},
                session_type=session_type,
                severity=severity,
                is_visible=True,
                tags=tags or [],
                ip_address=ip_address
            )
            
            db.add(history_log)
            db.commit()
            db.refresh(history_log)
            
            return history_log
        except Exception as e:
            db.rollback()
            print(f"Error logging history: {e}")
            return None
    
    @staticmethod
    def get_history(
        db: Session,
        user_role: str,
        session_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        action_category: Optional[str] = None,
        action_type: Optional[str] = None,
        entity_type: Optional[str] = None,
        severity: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search_query: Optional[str] = None,
        academic_year_id: Optional[int] = None
    ) -> tuple[List[HistoryLog], int]:
        """
        Get history logs with role-based filtering
        
        Returns: (logs, total_count)
        """
        query = db.query(HistoryLog).filter(HistoryLog.is_visible == True)
        
        # Role-based filtering
        if user_role == "director":
            # Director sees everything
            pass
        elif user_role == "finance":
            # Finance sees finance actions + student payments
            query = query.filter(
                or_(
                    HistoryLog.action_category == "finance",
                    and_(
                        HistoryLog.entity_type == "student_payment",
                        HistoryLog.action_category.in_(["morning", "evening"])
                    )
                )
            )
        elif user_role == "morning_school":
            # Morning staff sees only morning + activities
            query = query.filter(
                or_(
                    HistoryLog.action_category == "morning",
                    and_(
                        HistoryLog.action_category == "activity",
                        HistoryLog.session_type == "morning"
                    )
                )
            )
        elif user_role == "evening_school":
            # Evening staff sees only evening + activities
            query = query.filter(
                or_(
                    HistoryLog.action_category == "evening",
                    and_(
                        HistoryLog.action_category == "activity",
                        HistoryLog.session_type == "evening"
                    )
                )
            )
        
        # Additional filters
        if action_category:
            query = query.filter(HistoryLog.action_category == action_category)
        
        if action_type:
            query = query.filter(HistoryLog.action_type == action_type)
        
        if entity_type:
            query = query.filter(HistoryLog.entity_type == entity_type)
        
        if severity:
            query = query.filter(HistoryLog.severity == severity)
        
        if academic_year_id:
            query = query.filter(HistoryLog.academic_year_id == academic_year_id)
        
        if start_date:
            query = query.filter(HistoryLog.timestamp >= start_date)
        
        if end_date:
            query = query.filter(HistoryLog.timestamp <= end_date)
        
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                or_(
                    HistoryLog.description.ilike(search_pattern),
                    HistoryLog.entity_name.ilike(search_pattern),
                    HistoryLog.user_name.ilike(search_pattern)
                )
            )
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply ordering and pagination
        logs = query.order_by(desc(HistoryLog.timestamp)).offset(skip).limit(limit).all()
        
        return logs, total_count
    
    @staticmethod
    def get_statistics(
        db: Session,
        user_role: str,
        session_type: Optional[str] = None,
        academic_year_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get history statistics for dashboard display"""
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=now.weekday())
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Base query with role filtering
        base_query = db.query(HistoryLog).filter(HistoryLog.is_visible == True)
        
        # Apply role-based filtering (same as get_history)
        if user_role == "director":
            pass
        elif user_role == "finance":
            base_query = base_query.filter(
                or_(
                    HistoryLog.action_category == "finance",
                    and_(
                        HistoryLog.entity_type == "student_payment",
                        HistoryLog.action_category.in_(["morning", "evening"])
                    )
                )
            )
        elif user_role == "morning_school":
            base_query = base_query.filter(
                or_(
                    HistoryLog.action_category == "morning",
                    and_(
                        HistoryLog.action_category == "activity",
                        HistoryLog.session_type == "morning"
                    )
                )
            )
        elif user_role == "evening_school":
            base_query = base_query.filter(
                or_(
                    HistoryLog.action_category == "evening",
                    and_(
                        HistoryLog.action_category == "activity",
                        HistoryLog.session_type == "evening"
                    )
                )
            )
        
        if academic_year_id:
            base_query = base_query.filter(HistoryLog.academic_year_id == academic_year_id)
        
        # Count actions
        actions_today = base_query.filter(HistoryLog.timestamp >= today_start).count()
        actions_week = base_query.filter(HistoryLog.timestamp >= week_start).count()
        actions_month = base_query.filter(HistoryLog.timestamp >= month_start).count()
        
        # Get most active user today
        most_active = db.query(
            HistoryLog.user_name,
            func.count(HistoryLog.id).label('count')
        ).filter(
            and_(
                HistoryLog.timestamp >= today_start,
                HistoryLog.user_name.isnot(None)
            )
        ).group_by(HistoryLog.user_name).order_by(desc('count')).first()
        
        # Get last action
        last_action = base_query.order_by(desc(HistoryLog.timestamp)).first()
        
        # Get action breakdown by type
        action_breakdown = db.query(
            HistoryLog.action_type,
            func.count(HistoryLog.id).label('count')
        ).filter(
            HistoryLog.timestamp >= today_start
        ).group_by(HistoryLog.action_type).all()
        
        return {
            "actions_today": actions_today,
            "actions_week": actions_week,
            "actions_month": actions_month,
            "most_active_user": most_active[0] if most_active else None,
            "most_active_user_count": most_active[1] if most_active else 0,
            "last_action_time": last_action.timestamp.isoformat() if last_action else None,
            "action_breakdown": {ab[0]: ab[1] for ab in action_breakdown}
        }
    
    @staticmethod
    def format_log_detail(history_log: HistoryLog) -> Dict[str, Any]:
        """Format a history log for detailed view"""
        return {
            "id": history_log.id,
            "timestamp": history_log.timestamp.isoformat(),
            "action_type": history_log.action_type,
            "action_category": history_log.action_category,
            "entity_type": history_log.entity_type,
            "entity_id": history_log.entity_id,
            "entity_name": history_log.entity_name,
            "user_name": history_log.user_name,
            "user_role": history_log.user_role,
            "description": history_log.description,
            "meta_data": history_log.meta_data,
            "session_type": history_log.session_type,
            "severity": history_log.severity,
            "tags": history_log.tags,
            "created_at": history_log.created_at.isoformat() if hasattr(history_log, 'created_at') and history_log.created_at else None
        }


# Global instance
history_service = HistoryService()
