"""
Director Dashboard API Endpoints
Provides comprehensive dashboard statistics and overview for director users
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models.users import User
from ..models.academic import AcademicYear, Class, Subject
from ..models.students import Student
from ..models.teachers import Teacher
from ..models.activities import Activity
from ..models.finance import FinanceTransaction, FinanceCategory
from ..core.dependencies import get_director_user

router = APIRouter(tags=["Director Dashboard"])

@router.get("/dashboard")
async def get_director_dashboard(
    academic_year_id: Optional[int] = None,
    current_user: User = Depends(get_director_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard statistics for director"""
    try:
        # If academic_year_id is not provided, get the active academic year
        current_academic_year = None
        if academic_year_id is None:
            current_academic_year = db.query(AcademicYear).filter(
                AcademicYear.is_active == True
            ).first()
            
            # If there's an active year, use its ID
            if current_academic_year:
                academic_year_id = current_academic_year.id
        
        # Student Statistics
        student_query = db.query(Student)
        if academic_year_id is not None:
            student_query = student_query.filter(
                Student.academic_year_id == academic_year_id
            )
        total_students = student_query.count()
        
        # Teacher Statistics
        teacher_query = db.query(Teacher)
        if academic_year_id is not None:
            teacher_query = teacher_query.filter(
                Teacher.academic_year_id == academic_year_id
            )
        total_teachers = teacher_query.count()
        
        # Class Statistics
        class_query = db.query(Class)
        if academic_year_id is not None:
            class_query = class_query.filter(
                Class.academic_year_id == academic_year_id
            )
        total_classes = class_query.count()
        
        # Subject Statistics (need to join with Class since Subject doesn't have academic_year_id directly)
        # Use func.count() instead of .count() to avoid issues with column selection
        subject_query = db.query(func.count(Subject.id))
        if academic_year_id is not None:
            subject_query = subject_query.join(Class).filter(
                Class.academic_year_id == academic_year_id
            )
        total_subjects = subject_query.scalar()
        
        # Activity Statistics
        activity_query = db.query(Activity)
        if academic_year_id is not None:
            activity_query = activity_query.filter(
                and_(
                    Activity.academic_year_id == academic_year_id,
                    Activity.is_active == True
                )
            )
        active_activities = activity_query.count()
        
        # Financial Statistics (Monthly Revenue)
        monthly_revenue = 0
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        revenue_query = db.query(func.sum(FinanceTransaction.amount))
        revenue_filters = [
            FinanceTransaction.transaction_type == "income",
            FinanceTransaction.transaction_date >= thirty_days_ago
        ]
        
        if academic_year_id is not None:
            revenue_filters.append(FinanceTransaction.academic_year_id == academic_year_id)
            
        revenue_query = revenue_query.filter(and_(*revenue_filters))
        revenue_result = revenue_query.scalar()
        monthly_revenue = float(revenue_result) if revenue_result else 0
        
        # Rewards and Assistance (Placeholder - would need director_notes table)
        total_rewards = 0
        total_assistance = 0
        
        # Recent activities (Placeholder)
        recent_activities = []
        
        # Get all academic years for dropdown/selection
        all_academic_years = db.query(AcademicYear).order_by(AcademicYear.created_at.desc()).all()
        
        return {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_classes": total_classes,
            "total_subjects": total_subjects,
            "monthly_revenue": monthly_revenue,
            "active_activities": active_activities,
            "total_rewards": total_rewards,
            "total_assistance": total_assistance,
            "recent_activities": recent_activities,
            "academic_years": [{
                "id": year.id,
                "year_name": year.year_name,
                "is_active": year.is_active
            } for year in all_academic_years],
            "selected_year_id": academic_year_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dashboard statistics: {str(e)}"
        )

# Additional director endpoints for notes, rewards, assistance, etc.
# These would be implemented based on the director_notes, director_rewards, etc. tables