"""
Analytics Service - Comprehensive data analytics with smart caching
Provides analytics for students, teachers, finance, and activities
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta, date
from sqlalchemy import func, and_, or_, extract, case
from sqlalchemy.orm import Session
import json
import hashlib
from functools import wraps

from app.database import SessionLocal
from app.models.students import Student, StudentAcademic, StudentFinance, StudentPayment
from app.models.teachers import Teacher, TeacherAssignment, TeacherAttendance, TeacherFinance
from app.models.academic import AcademicYear, Class, Subject
from app.models.finance import FinanceTransaction, FinanceCategory, Budget
from app.models.activities import Activity, ActivityRegistration, ActivityAttendance
from app.models.daily import StudentDailyAttendance, TeacherPeriodAttendance


class CacheManager:
    """Simple in-memory cache manager (will use Redis in production)"""
    _cache = {}
    _ttl = {}
    
    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        if key in cls._cache:
            if datetime.now() < cls._ttl.get(key, datetime.min):
                return cls._cache[key]
            else:
                del cls._cache[key]
                del cls._ttl[key]
        return None
    
    @classmethod
    def set(cls, key: str, value: Any, ttl_seconds: int = 300):
        cls._cache[key] = value
        cls._ttl[key] = datetime.now() + timedelta(seconds=ttl_seconds)
    
    @classmethod
    def clear(cls):
        cls._cache.clear()
        cls._ttl.clear()


def cache_result(ttl_seconds: int = 300):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{hashlib.md5(str(args).encode() + str(kwargs).encode()).hexdigest()}"
            
            # Try to get from cache
            cached = CacheManager.get(cache_key)
            if cached is not None:
                return cached
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            CacheManager.set(cache_key, result, ttl_seconds)
            return result
        return wrapper
    return decorator


class TimePeriodHelper:
    """Helper class for time period calculations"""
    
    @staticmethod
    def get_date_range(period_type: str, custom_start: Optional[date] = None, 
                       custom_end: Optional[date] = None) -> Tuple[date, date]:
        """Get start and end dates for a given period type"""
        today = date.today()
        
        if period_type == "daily":
            # Last 30 days
            return today - timedelta(days=30), today
        
        elif period_type == "weekly":
            # Last 12 weeks, starting from Sunday
            days_since_sunday = (today.weekday() + 1) % 7
            last_sunday = today - timedelta(days=days_since_sunday)
            start_date = last_sunday - timedelta(weeks=12)
            return start_date, today
        
        elif period_type == "monthly":
            # Last 12 months
            start_date = today - timedelta(days=365)
            return start_date, today
        
        elif period_type == "yearly":
            # Last 5 academic years
            current_year = today.year
            if today.month < 9:  # Before September, still in previous academic year
                current_year -= 1
            start_year = current_year - 5
            return date(start_year, 9, 1), today
        
        elif period_type == "custom" and custom_start and custom_end:
            return custom_start, custom_end
        
        else:
            return today - timedelta(days=30), today
    
    @staticmethod
    def group_by_period(period_type: str) -> str:
        """Get SQL grouping expression for period type"""
        if period_type == "daily":
            return "day"
        elif period_type == "weekly":
            return "week"
        elif period_type == "monthly":
            return "month"
        elif period_type == "yearly":
            return "year"
        return "day"


class AnalyticsService:
    """Main analytics service"""
    
    def __init__(self):
        self.time_helper = TimePeriodHelper()
    
    # =========================
    # OVERVIEW ANALYTICS
    # =========================
    
    @cache_result(ttl_seconds=300)
    def get_overview_stats(self, academic_year_id: int, session_type: Optional[str] = None,
                           user_role: Optional[str] = None) -> Dict[str, Any]:
        """Get high-level overview statistics"""
        db = SessionLocal()
        try:
            stats = {}
            
            # Student counts - get morning, evening, and total
            morning_students = db.query(func.count(Student.id)).filter(
                Student.academic_year_id == academic_year_id,
                Student.is_active == True,
                Student.session_type == "morning"
            ).scalar() or 0
            
            evening_students = db.query(func.count(Student.id)).filter(
                Student.academic_year_id == academic_year_id,
                Student.is_active == True,
                Student.session_type == "evening"
            ).scalar() or 0
            
            stats["morning_students"] = morning_students
            stats["evening_students"] = evening_students
            stats["total_students"] = morning_students + evening_students
            
            # Teacher counts - get morning, evening, and total
            morning_teachers = db.query(func.count(Teacher.id)).filter(
                Teacher.academic_year_id == academic_year_id,
                Teacher.is_active == True,
                Teacher.session_type == "morning"
            ).scalar() or 0
            
            evening_teachers = db.query(func.count(Teacher.id)).filter(
                Teacher.academic_year_id == academic_year_id,
                Teacher.is_active == True,
                Teacher.session_type == "evening"
            ).scalar() or 0
            
            stats["morning_teachers"] = morning_teachers
            stats["evening_teachers"] = evening_teachers
            stats["total_teachers"] = morning_teachers + evening_teachers
            
            # Class counts - get morning, evening, and total
            morning_classes = db.query(func.count(Class.id)).filter(
                Class.academic_year_id == academic_year_id,
                Class.session_type == "morning"
            ).scalar() or 0
            
            evening_classes = db.query(func.count(Class.id)).filter(
                Class.academic_year_id == academic_year_id,
                Class.session_type == "evening"
            ).scalar() or 0
            
            stats["morning_classes"] = morning_classes
            stats["evening_classes"] = evening_classes
            stats["total_classes"] = morning_classes + evening_classes
            
            # Activity count (not session-specific for total)
            activity_query = db.query(func.count(Activity.id)).filter(
                Activity.academic_year_id == academic_year_id,
                Activity.is_active == True
            )
            if session_type and session_type in ["morning", "evening"]:
                activity_query = activity_query.filter(
                    or_(Activity.session_type == session_type, Activity.session_type == "mixed")
                )
            stats["total_activities"] = activity_query.scalar() or 0
            
            return stats
            
        finally:
            db.close()
    
    # =========================
    # STUDENT ANALYTICS
    # =========================
    
    @cache_result(ttl_seconds=300)
    def get_student_distribution(self, academic_year_id: int, 
                                session_type: Optional[str] = None) -> Dict[str, Any]:
        """Get student distribution by various categories"""
        db = SessionLocal()
        try:
            base_query = db.query(Student).filter(
                Student.academic_year_id == academic_year_id,
                Student.is_active == True
            )
            if session_type:
                base_query = base_query.filter(Student.session_type == session_type)
            
            # By grade level
            grade_distribution = db.query(
                Student.grade_level,
                Student.grade_number,
                func.count(Student.id).label("count")
            ).filter(
                Student.academic_year_id == academic_year_id,
                Student.is_active == True
            )
            if session_type:
                grade_distribution = grade_distribution.filter(Student.session_type == session_type)
            grade_distribution = grade_distribution.group_by(
                Student.grade_level, Student.grade_number
            ).all()
            
            # By gender
            gender_distribution = db.query(
                Student.gender,
                func.count(Student.id).label("count")
            ).filter(
                Student.academic_year_id == academic_year_id,
                Student.is_active == True
            )
            if session_type:
                gender_distribution = gender_distribution.filter(Student.session_type == session_type)
            gender_distribution = gender_distribution.group_by(Student.gender).all()
            
            # By transportation
            transport_distribution = db.query(
                Student.transportation_type,
                func.count(Student.id).label("count")
            ).filter(
                Student.academic_year_id == academic_year_id,
                Student.is_active == True
            )
            if session_type:
                transport_distribution = transport_distribution.filter(Student.session_type == session_type)
            transport_distribution = transport_distribution.group_by(Student.transportation_type).all()
            
            # By section (class distribution)
            section_distribution = db.query(
                Student.grade_level,
                Student.grade_number,
                Student.section,
                func.count(Student.id).label("count")
            ).filter(
                Student.academic_year_id == academic_year_id,
                Student.is_active == True
            )
            if session_type:
                section_distribution = section_distribution.filter(Student.session_type == session_type)
            section_distribution = section_distribution.group_by(
                Student.grade_level, Student.grade_number, Student.section
            ).all()
            
            return {
                "by_grade": [
                    {
                        "grade_level": level,
                        "grade_number": number,
                        "count": count,
                        "label": f"{level} - {number}"
                    }
                    for level, number, count in grade_distribution
                ],
                "by_gender": [
                    {"gender": gender, "count": count}
                    for gender, count in gender_distribution
                ],
                "by_transportation": [
                    {"type": transport, "count": count}
                    for transport, count in transport_distribution
                ],
                "by_section": [
                    {
                        "grade_level": level,
                        "grade_number": number,
                        "section": section,
                        "count": count,
                        "label": f"{level} {number} - {section}"
                    }
                    for level, number, section, count in section_distribution
                ]
            }
            
        finally:
            db.close()
    
    @cache_result(ttl_seconds=300)
    def get_academic_performance(self, academic_year_id: int, session_type: Optional[str] = None,
                                 class_id: Optional[int] = None) -> Dict[str, Any]:
        """Get academic performance statistics"""
        db = SessionLocal()
        try:
            # Base query for student academics
            academic_query = db.query(StudentAcademic).filter(
                StudentAcademic.academic_year_id == academic_year_id
            )
            
            if class_id:
                academic_query = academic_query.join(Student).filter(Student.class_id == class_id)
            elif session_type:
                academic_query = academic_query.join(Student).filter(Student.session_type == session_type)
            
            records = academic_query.all()
            
            if not records:
                return {"error": "No academic records found"}
            
            # Calculate statistics for each exam type
            def calc_stats(values):
                if not values:
                    return {"average": 0, "highest": 0, "lowest": 0, "count": 0}
                return {
                    "average": round(sum(values) / len(values), 2),
                    "highest": round(max(values), 2),
                    "lowest": round(min(values), 2),
                    "count": len(values)
                }
            
            # Collect grades by type
            board_grades = [r.board_grades for r in records if r.board_grades is not None]
            recitation_grades = [r.recitation_grades for r in records if r.recitation_grades is not None]
            first_exam = [r.first_exam_grades for r in records if r.first_exam_grades is not None]
            midterm = [r.midterm_grades for r in records if r.midterm_grades is not None]
            second_exam = [r.second_exam_grades for r in records if r.second_exam_grades is not None]
            final_exam = [r.final_exam_grades for r in records if r.final_exam_grades is not None]
            behavior = [r.behavior_grade for r in records if r.behavior_grade is not None]
            activity = [r.activity_grade for r in records if r.activity_grade is not None]
            
            # Performance by subject
            subject_performance = db.query(
                Subject.subject_name,
                func.avg(StudentAcademic.final_exam_grades).label("avg_grade"),
                func.count(StudentAcademic.id).label("student_count")
            ).join(StudentAcademic, Subject.id == StudentAcademic.subject_id).filter(
                StudentAcademic.academic_year_id == academic_year_id
            )
            
            if class_id:
                subject_performance = subject_performance.join(Student).filter(Student.class_id == class_id)
            elif session_type:
                subject_performance = subject_performance.join(Student).filter(Student.session_type == session_type)
            
            subject_performance = subject_performance.group_by(Subject.subject_name).all()
            
            return {
                "exam_statistics": {
                    "board_grades": calc_stats(board_grades),
                    "recitation": calc_stats(recitation_grades),
                    "first_exam": calc_stats(first_exam),
                    "midterm": calc_stats(midterm),
                    "second_exam": calc_stats(second_exam),
                    "final_exam": calc_stats(final_exam),
                    "behavior": calc_stats(behavior),
                    "activity": calc_stats(activity)
                },
                "subject_performance": [
                    {
                        "subject": subj,
                        "average": round(float(avg), 2) if avg else 0,
                        "student_count": count
                    }
                    for subj, avg, count in subject_performance
                ],
                "total_records": len(records)
            }
            
        finally:
            db.close()
    
    @cache_result(ttl_seconds=300)
    def get_attendance_analytics(self, academic_year_id: int, period_type: str = "monthly",
                                session_type: Optional[str] = None) -> Dict[str, Any]:
        """Get attendance analytics for students and teachers"""
        db = SessionLocal()
        try:
            start_date, end_date = self.time_helper.get_date_range(period_type)
            
            # Student attendance
            student_attendance = db.query(
                StudentDailyAttendance.attendance_date,
                func.count(StudentDailyAttendance.id).label("total_records"),
                func.sum(case((StudentDailyAttendance.is_present == True, 1), else_=0)).label("present_count"),
                func.sum(case((StudentDailyAttendance.is_present == False, 1), else_=0)).label("absent_count")
            ).filter(
                StudentDailyAttendance.academic_year_id == academic_year_id,
                StudentDailyAttendance.attendance_date.between(start_date, end_date)
            )
            
            if session_type:
                student_attendance = student_attendance.join(Student).filter(
                    Student.session_type == session_type
                )
            
            student_attendance = student_attendance.group_by(
                StudentDailyAttendance.attendance_date
            ).order_by(StudentDailyAttendance.attendance_date).all()
            
            # Teacher attendance
            teacher_attendance = db.query(
                TeacherPeriodAttendance.attendance_date,
                func.count(TeacherPeriodAttendance.id).label("total_records"),
                func.sum(case((TeacherPeriodAttendance.is_present == True, 1), else_=0)).label("present_count"),
                func.sum(case((TeacherPeriodAttendance.is_present == False, 1), else_=0)).label("absent_count")
            ).filter(
                TeacherPeriodAttendance.academic_year_id == academic_year_id,
                TeacherPeriodAttendance.attendance_date.between(start_date, end_date)
            )
            
            if session_type:
                teacher_attendance = teacher_attendance.join(Teacher).filter(
                    Teacher.session_type == session_type
                )
            
            teacher_attendance = teacher_attendance.group_by(
                TeacherPeriodAttendance.attendance_date
            ).order_by(TeacherPeriodAttendance.attendance_date).all()
            
            # Top absent students
            top_absent_students = db.query(
                Student.id,
                Student.full_name,
                func.count(StudentDailyAttendance.id).label("absence_count")
            ).join(StudentDailyAttendance).filter(
                Student.academic_year_id == academic_year_id,
                StudentDailyAttendance.is_present == False,
                StudentDailyAttendance.attendance_date.between(start_date, end_date)
            )
            
            if session_type:
                top_absent_students = top_absent_students.filter(Student.session_type == session_type)
            
            top_absent_students = top_absent_students.group_by(
                Student.id, Student.full_name
            ).order_by(func.count(StudentDailyAttendance.id).desc()).limit(10).all()
            
            return {
                "student_attendance": [
                    {
                        "date": att_date.isoformat(),
                        "total": total,
                        "present": present,
                        "absent": absent,
                        "attendance_rate": round((present / total * 100) if total > 0 else 0, 2)
                    }
                    for att_date, total, present, absent in student_attendance
                ],
                "teacher_attendance": [
                    {
                        "date": att_date.isoformat(),
                        "total": total,
                        "present": present,
                        "absent": absent,
                        "attendance_rate": round((present / total * 100) if total > 0 else 0, 2)
                    }
                    for att_date, total, present, absent in teacher_attendance
                ],
                "top_absent_students": [
                    {
                        "student_id": sid,
                        "student_name": name,
                        "absence_count": count
                    }
                    for sid, name, count in top_absent_students
                ]
            }
            
        finally:
            db.close()
