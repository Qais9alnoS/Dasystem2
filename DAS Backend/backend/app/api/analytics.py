"""
Analytics API Endpoints
Provides comprehensive analytics for all roles
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import date

from app.services.analytics_service import AnalyticsService
from app.services.financial_analytics import FinancialAnalytics
from app.api.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# Initialize services
analytics_service = AnalyticsService()
financial_analytics = FinancialAnalytics()


@router.get("/overview")
async def get_overview_stats(
    academic_year_id: int = Query(..., description="Academic year ID"),
    session_type: Optional[str] = Query(None, description="morning or evening"),
    current_user = Depends(get_current_user)
):
    """
    Get high-level overview statistics
    Role-based filtering applied automatically
    """
    try:
        # Apply role-based filtering
        if current_user.role in ["morning_school", "evening_school"]:
            session_type = "morning" if current_user.role == "morning_school" else "evening"
        
        stats = analytics_service.get_overview_stats(
            academic_year_id=academic_year_id,
            session_type=session_type,
            user_role=current_user.role
        )
        
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students/distribution")
async def get_student_distribution(
    academic_year_id: int = Query(..., description="Academic year ID"),
    session_type: Optional[str] = Query(None, description="morning or evening"),
    current_user = Depends(get_current_user)
):
    """
    Get student distribution by grade, gender, transportation, and section
    """
    try:
        # Apply role-based filtering
        if current_user.role in ["morning_school", "evening_school"]:
            session_type = "morning" if current_user.role == "morning_school" else "evening"
        
        distribution = analytics_service.get_student_distribution(
            academic_year_id=academic_year_id,
            session_type=session_type
        )
        
        return {
            "success": True,
            "data": distribution
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/academic/performance")
async def get_academic_performance(
    academic_year_id: int = Query(..., description="Academic year ID"),
    session_type: Optional[str] = Query(None, description="morning or evening"),
    class_id: Optional[int] = Query(None, description="Specific class ID"),
    current_user = Depends(get_current_user)
):
    """
    Get academic performance statistics including exam grades and subject performance
    """
    try:
        # Apply role-based filtering
        if current_user.role in ["morning_school", "evening_school"]:
            session_type = "morning" if current_user.role == "morning_school" else "evening"
        
        performance = analytics_service.get_academic_performance(
            academic_year_id=academic_year_id,
            session_type=session_type,
            class_id=class_id
        )
        
        return {
            "success": True,
            "data": performance
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/attendance")
async def get_attendance_analytics(
    academic_year_id: int = Query(..., description="Academic year ID"),
    period_type: str = Query("monthly", description="daily, weekly, monthly, yearly"),
    session_type: Optional[str] = Query(None, description="morning or evening"),
    current_user = Depends(get_current_user)
):
    """
    Get attendance analytics for students and teachers
    """
    try:
        # Apply role-based filtering
        if current_user.role in ["morning_school", "evening_school"]:
            session_type = "morning" if current_user.role == "morning_school" else "evening"
        
        attendance = analytics_service.get_attendance_analytics(
            academic_year_id=academic_year_id,
            period_type=period_type,
            session_type=session_type
        )
        
        return {
            "success": True,
            "data": attendance
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# FINANCIAL ENDPOINTS
# =========================

@router.get("/finance/overview")
async def get_financial_overview(
    academic_year_id: int = Query(..., description="Academic year ID"),
    period_type: str = Query("monthly", description="daily, weekly, monthly, yearly"),
    current_user = Depends(get_current_user)
):
    """
    Get comprehensive financial overview
    Only accessible to finance and director roles
    """
    try:
        if current_user.role not in ["finance", "director", "admin"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        overview = financial_analytics.get_financial_overview(
            academic_year_id=academic_year_id,
            period_type=period_type
        )
        
        return {
            "success": True,
            "data": overview
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/finance/income-trends")
async def get_income_trends(
    academic_year_id: int = Query(..., description="Academic year ID"),
    period_type: str = Query("monthly", description="daily, weekly, monthly, yearly"),
    current_user = Depends(get_current_user)
):
    """
    Get income trends over time with category breakdown
    """
    try:
        if current_user.role not in ["finance", "director", "admin"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        trends = financial_analytics.get_income_trends(
            academic_year_id=academic_year_id,
            period_type=period_type
        )
        
        return {
            "success": True,
            "data": trends
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/finance/expense-trends")
async def get_expense_trends(
    academic_year_id: int = Query(..., description="Academic year ID"),
    period_type: str = Query("monthly", description="daily, weekly, monthly, yearly"),
    current_user = Depends(get_current_user)
):
    """
    Get expense trends over time with category breakdown and budget analysis
    """
    try:
        if current_user.role not in ["finance", "director", "admin"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        trends = financial_analytics.get_expense_trends(
            academic_year_id=academic_year_id,
            period_type=period_type
        )
        
        return {
            "success": True,
            "data": trends
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/finance/outstanding-payments")
async def get_outstanding_payments(
    academic_year_id: int = Query(..., description="Academic year ID"),
    limit: int = Query(50, description="Maximum number of records to return"),
    current_user = Depends(get_current_user)
):
    """
    Get list of students with outstanding payments
    """
    try:
        if current_user.role not in ["finance", "director", "admin"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        outstanding = financial_analytics.get_outstanding_payments(
            academic_year_id=academic_year_id,
            limit=limit
        )
        
        return {
            "success": True,
            "data": outstanding
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/finance/activity-analysis")
async def get_activity_financial_analysis(
    academic_year_id: int = Query(..., description="Academic year ID"),
    current_user = Depends(get_current_user)
):
    """
    Get financial analysis of activities
    """
    try:
        if current_user.role not in ["finance", "director", "admin"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        analysis = financial_analytics.get_activity_financial_analysis(
            academic_year_id=academic_year_id
        )
        
        return {
            "success": True,
            "data": analysis
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# COMPARISON ENDPOINTS
# =========================

@router.get("/comparison/year-over-year")
async def compare_year_over_year(
    current_year_id: int = Query(..., description="Current academic year ID"),
    previous_year_id: int = Query(..., description="Previous academic year ID"),
    metric_type: str = Query(..., description="students, finance, attendance, academic"),
    current_user = Depends(get_current_user)
):
    """
    Compare metrics between two academic years
    """
    try:
        # This will be implemented based on metric_type
        comparison_data = {
            "current_year": current_year_id,
            "previous_year": previous_year_id,
            "metric_type": metric_type,
            "comparison": {
                "current": {},
                "previous": {},
                "change_percentage": 0,
                "trend": "increasing"
            }
        }
        
        if metric_type == "students":
            current_stats = analytics_service.get_overview_stats(current_year_id)
            previous_stats = analytics_service.get_overview_stats(previous_year_id)
            
            comparison_data["comparison"]["current"] = current_stats
            comparison_data["comparison"]["previous"] = previous_stats
            
            if previous_stats.get("total_students", 0) > 0:
                change = ((current_stats.get("total_students", 0) - previous_stats.get("total_students", 0)) /
                         previous_stats.get("total_students", 0) * 100)
                comparison_data["comparison"]["change_percentage"] = round(change, 2)
                comparison_data["comparison"]["trend"] = "increasing" if change > 0 else "decreasing"
        
        return {
            "success": True,
            "data": comparison_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/comparison/session-comparison")
async def compare_sessions(
    academic_year_id: int = Query(..., description="Academic year ID"),
    metric_type: str = Query(..., description="students, finance, attendance, academic"),
    current_user = Depends(get_current_user)
):
    """
    Compare metrics between morning and evening sessions
    """
    try:
        # Get stats for both sessions
        morning_stats = {}
        evening_stats = {}
        
        if metric_type == "students":
            morning_stats = analytics_service.get_overview_stats(academic_year_id, session_type="morning")
            evening_stats = analytics_service.get_overview_stats(academic_year_id, session_type="evening")
        
        elif metric_type == "attendance":
            morning_stats = analytics_service.get_attendance_analytics(academic_year_id, session_type="morning")
            evening_stats = analytics_service.get_attendance_analytics(academic_year_id, session_type="evening")
        
        return {
            "success": True,
            "data": {
                "morning": morning_stats,
                "evening": evening_stats,
                "comparison": {
                    "total_difference": {},
                    "percentage_difference": {}
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/grades/school-wide")
async def get_school_wide_grades(
    academic_year_id: int = Query(..., description="Academic year ID"),
    subject: Optional[str] = Query(None, description="Filter by subject name"),
    current_user = Depends(get_current_user)
):
    """
    Get school-wide grade averages for quizzes and exams by session
    Returns average grades for morning and evening sessions for each assignment
    """
    try:
        grades = analytics_service.get_school_wide_grades(
            academic_year_id=academic_year_id,
            subject_filter=subject
        )
        
        return {
            "success": True,
            "data": grades
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students/{student_id}/attendance-trend")
async def get_student_attendance_trend(
    student_id: int,
    academic_year_id: int = Query(..., description="Academic year ID"),
    period_type: str = Query("weekly", description="weekly or monthly"),
    current_user = Depends(get_current_user)
):
    """
    Get student attendance trend by week or month
    Returns attendance rate (percentage) for each period
    """
    try:
        trend_data = analytics_service.get_student_attendance_trend(
            student_id=student_id,
            academic_year_id=academic_year_id,
            period_type=period_type
        )
        
        return {
            "success": True,
            "data": trend_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students/{student_id}/grades-timeline")
async def get_student_grades_timeline(
    student_id: int,
    academic_year_id: int = Query(..., description="Academic year ID"),
    current_user = Depends(get_current_user)
):
    """
    Get student's average grades timeline across all subjects
    Timeline order depends on class quizzes_count (2 or 4)
    """
    try:
        timeline_data = analytics_service.get_student_grades_timeline(
            student_id=student_id,
            academic_year_id=academic_year_id
        )
        
        return {
            "success": True,
            "data": timeline_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students/{student_id}/grades-by-subject")
async def get_student_grades_by_subject(
    student_id: int,
    academic_year_id: int = Query(..., description="Academic year ID"),
    current_user = Depends(get_current_user)
):
    """
    Get student's average grades by subject
    Shows average of all assessments for each subject
    """
    try:
        subject_data = analytics_service.get_student_grades_by_subject(
            student_id=student_id,
            academic_year_id=academic_year_id
        )
        
        return {
            "success": True,
            "data": subject_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students/{student_id}/financial-summary")
async def get_student_financial_summary(
    student_id: int,
    academic_year_id: int = Query(..., description="Academic year ID"),
    current_user = Depends(get_current_user)
):
    """
    Get student's financial summary (paid vs remaining balance)
    Returns data for pie chart display
    """
    try:
        financial_data = analytics_service.get_student_financial_summary(
            student_id=student_id,
            academic_year_id=academic_year_id
        )
        
        return {
            "success": True,
            "data": financial_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students/{student_id}/behavior-records")
async def get_student_behavior_records(
    student_id: int,
    academic_year_id: int = Query(..., description="Academic year ID"),
    current_user = Depends(get_current_user)
):
    """
    Get student's behavior records
    Returns all behavior records sorted by date (most recent first)
    """
    try:
        records = analytics_service.get_student_behavior_records(
            student_id=student_id,
            academic_year_id=academic_year_id
        )
        
        return {
            "success": True,
            "data": records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cache/clear")
async def clear_analytics_cache(
    current_user = Depends(get_current_user)
):
    """
    Clear analytics cache (admin only)
    """
    try:
        if current_user.role not in ["admin", "director"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        from app.services.analytics_service import CacheManager
        CacheManager.clear()
        
        return {
            "success": True,
            "message": "Analytics cache cleared successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
