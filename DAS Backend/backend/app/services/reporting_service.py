"""
Advanced Reporting and Analytics Service
Generates comprehensive reports and analytics for the school management system
"""

import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text

from ..database import SessionLocal
from ..models.students import Student, StudentFinance, StudentPayment, StudentAcademic
from ..models.teachers import Teacher, TeacherAttendance, TeacherAssignment
from ..models.finance import FinanceTransaction, FinanceCategory
from ..models.activities import Activity, ActivityParticipant
from ..models.schedules import Schedule, ScheduleGenerationHistory
from ..models.academic import AcademicYear, Class, Subject
from ..models.system import AuditLog, LoginAttempt, SystemLog

class ReportingService:
    """Advanced reporting and analytics service"""
    
    def __init__(self):
        self.report_types = {
            "financial_summary": self.generate_financial_summary,
            "student_analytics": self.generate_student_analytics,
            "teacher_performance": self.generate_teacher_performance,
            "academic_performance": self.generate_academic_performance,
            "attendance_report": self.generate_attendance_report,
            "activity_report": self.generate_activity_report,
            "system_usage": self.generate_system_usage_report,
            "security_audit": self.generate_security_audit_report
        }
    
    def generate_report(self, report_type: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate report based on type and parameters"""
        if report_type not in self.report_types:
            return {"error": f"Unknown report type: {report_type}"}
        
        try:
            return self.report_types[report_type](parameters)
        except Exception as e:
            return {"error": f"Failed to generate report: {str(e)}"}
    
    def generate_financial_summary(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive financial summary report"""
        try:
            db = SessionLocal()
            try:
                academic_year_id = parameters.get("academic_year_id")
                start_date = parameters.get("start_date")
                end_date = parameters.get("end_date")
                
                # Total revenue from student fees
                student_revenue_query = db.query(func.sum(StudentPayment.payment_amount)).filter(
                    StudentPayment.academic_year_id == academic_year_id
                )  
                
                if start_date:
                    student_revenue_query = student_revenue_query.filter(
                        StudentPayment.payment_date >= start_date
                    )
                if end_date:
                    student_revenue_query = student_revenue_query.filter(
                        StudentPayment.payment_date <= end_date
                    )
                
                total_student_revenue = student_revenue_query.scalar() or 0
                
                # Income from other sources
                income_query = db.query(func.sum(FinanceTransaction.amount)).filter(
                    and_(
                        FinanceTransaction.academic_year_id == academic_year_id,
                        FinanceTransaction.transaction_type == "income"
                    )
                )  
                
                if start_date:
                    income_query = income_query.filter(
                        FinanceTransaction.transaction_date >= start_date
                    )
                if end_date:
                    income_query = income_query.filter(
                        FinanceTransaction.transaction_date <= end_date
                    )
                
                other_income = income_query.scalar() or 0
                
                # Total expenses
                expense_query = db.query(func.sum(FinanceTransaction.amount)).filter(
                    and_(
                        FinanceTransaction.academic_year_id == academic_year_id,
                        FinanceTransaction.transaction_type == "expense"
                    )
                )  
                
                if start_date:
                    expense_query = expense_query.filter(
                        FinanceTransaction.transaction_date >= start_date
                    )
                if end_date:
                    expense_query = expense_query.filter(
                        FinanceTransaction.transaction_date <= end_date
                    )
                
                total_expenses = expense_query.scalar() or 0
                
                # Student payment statistics
                total_students = db.query(Student).filter(
                    and_(
                        Student.academic_year_id == academic_year_id,
                        Student.is_active == True
                    )
                ).count()  
                
                students_with_payments = db.query(StudentPayment.student_id).filter(
                    StudentPayment.academic_year_id == academic_year_id
                ).distinct().count()  
                
                # Expected revenue calculation
                expected_revenue_query = db.query(
                    func.sum(
                        StudentFinance.school_fee - StudentFinance.school_fee_discount +
                        StudentFinance.bus_fee - StudentFinance.bus_fee_discount +
                        StudentFinance.other_revenues
                    )
                ).filter(StudentFinance.academic_year_id == academic_year_id)  
                
                expected_revenue = expected_revenue_query.scalar() or 0
                
                # Expense breakdown by category
                expense_breakdown = db.query(
                    FinanceCategory.category_name,
                    func.sum(FinanceTransaction.amount).label("total")
                ).join(
                    FinanceTransaction, FinanceCategory.id == FinanceTransaction.category_id
                ).filter(
                    and_(
                        FinanceTransaction.academic_year_id == academic_year_id,
                        FinanceTransaction.transaction_type == "expense"
                    )
                ).group_by(FinanceCategory.category_name).all()  
                
                total_revenue = total_student_revenue + other_income
                net_profit = total_revenue - total_expenses
                collection_rate = (total_student_revenue / expected_revenue * 100) if expected_revenue > 0 else 0
                
                return {
                    "summary": {
                        "total_revenue": float(total_revenue),
                        "student_revenue": float(total_student_revenue),
                        "other_income": float(other_income),
                        "total_expenses": float(total_expenses),
                        "net_profit": float(net_profit),
                        "expected_revenue": float(expected_revenue),
                        "collection_rate": round(collection_rate, 2)
                    },
                    "student_statistics": {
                        "total_students": total_students,
                        "students_with_payments": students_with_payments,
                        "payment_rate": round((students_with_payments / max(total_students, 1)) * 100, 2)
                    },
                    "expense_breakdown": [
                        {"category": cat, "amount": float(amount)}
                        for cat, amount in expense_breakdown
                    ],
                    "generated_at": datetime.utcnow().isoformat()
                }
                
            finally:
                db.close()
                
        except Exception as e:
            return {"error": f"Failed to generate financial summary: {str(e)}"}
    
    def generate_student_analytics(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate student analytics report"""
        try:
            db = SessionLocal()
            try:
                academic_year_id = parameters.get("academic_year_id")
                
                # Total students by grade level
                students_by_grade = db.query(
                    Student.grade_level,
                    func.count(Student.id).label("count")
                ).filter(
                    and_(
                        Student.academic_year_id == academic_year_id,
                        Student.is_active == True
                    )
                ).group_by(Student.grade_level).all()  
                
                # Students by session type
                students_by_session = db.query(
                    Student.session_type,
                    func.count(Student.id).label("count")
                ).filter(
                    and_(
                        Student.academic_year_id == academic_year_id,
                        Student.is_active == True
                    )
                ).group_by(Student.session_type).all()  
                
                # Students by gender
                students_by_gender = db.query(
                    Student.gender,
                    func.count(Student.id).label("count")
                ).filter(
                    and_(
                        Student.academic_year_id == academic_year_id,
                        Student.is_active == True
                    )
                ).group_by(Student.gender).all()  
                
                # Transportation statistics
                transport_stats = db.query(
                    Student.transportation_type,
                    func.count(Student.id).label("count")
                ).filter(
                    and_(
                        Student.academic_year_id == academic_year_id,
                        Student.is_active == True
                    )
                ).group_by(Student.transportation_type).all()  
                
                # Special needs students
                special_needs_count = db.query(Student).filter(
                    and_(
                        Student.academic_year_id == academic_year_id,
                        Student.has_special_needs == True,
                        Student.is_active == True
                    )
                ).count()  
                
                total_students = db.query(Student).filter(
                    and_(
                        Student.academic_year_id == academic_year_id,
                        Student.is_active == True
                    )
                ).count()  
                
                return {
                    "total_students": total_students,
                    "special_needs_students": special_needs_count,
                    "special_needs_percentage": round((special_needs_count / max(total_students, 1)) * 100, 2),
                    "distribution": {
                        "by_grade": [
                            {"grade_level": grade, "count": count}
                            for grade, count in students_by_grade
                        ],
                        "by_session": [
                            {"session_type": session, "count": count}
                            for session, count in students_by_session
                        ],
                        "by_gender": [
                            {"gender": gender, "count": count}
                            for gender, count in students_by_gender
                        ],
                        "by_transportation": [
                            {"transport_type": transport, "count": count}
                            for transport, count in transport_stats
                        ]
                    },
                    "generated_at": datetime.utcnow().isoformat()
                }
                
            finally:
                db.close()
                
        except Exception as e:
            return {"error": f"Failed to generate student analytics: {str(e)}"}
    
    def generate_academic_performance(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate academic performance report"""
        try:
            db = SessionLocal()
            try:
                academic_year_id = parameters.get("academic_year_id")
                class_id = parameters.get("class_id")
                subject_id = parameters.get("subject_id")
                
                query = db.query(StudentAcademic).filter(
                    StudentAcademic.academic_year_id == academic_year_id
                )  
                
                if class_id:
                    query = query.join(Student).filter(Student.class_id == class_id)
                
                if subject_id:
                    query = query.filter(StudentAcademic.subject_id == subject_id)
                
                academic_records = query.all()
                
                if not academic_records:
                    return {"error": "No academic records found for the specified criteria"}
                
                # Calculate statistics
                final_grades = [record.final_exam_grades for record in academic_records if record.final_exam_grades]
                midterm_grades = [record.midterm_grades for record in academic_records if record.midterm_grades]
                
                def calculate_stats(grades):
                    if not grades:
                        return {"average": 0, "highest": 0, "lowest": 0, "passing_rate": 0}
                    
                    average = sum(grades) / len(grades)
                    highest = max(grades)
                    lowest = min(grades)
                    passing_count = sum(1 for grade in grades if grade >= 50)  # Assuming 50 is passing
                    passing_rate = (passing_count / len(grades)) * 100
                    
                    return {
                        "average": round(average, 2),
                        "highest": float(highest),
                        "lowest": float(lowest),
                        "passing_rate": round(passing_rate, 2),
                        "total_students": len(grades)
                    }
                
                # Attendance statistics
                total_absence_days = sum(record.absence_days or 0 for record in academic_records)
                average_absence = total_absence_days / len(academic_records) if academic_records else 0
                
                return {
                    "final_exam_statistics": calculate_stats(final_grades),
                    "midterm_statistics": calculate_stats(midterm_grades),
                    "attendance": {
                        "total_absence_days": total_absence_days,
                        "average_absence_per_student": round(average_absence, 2)
                    },
                    "generated_at": datetime.utcnow().isoformat()
                }
                
            finally:
                db.close()
                
        except Exception as e:
            return {"error": f"Failed to generate academic performance report: {str(e)}"}
    
    def generate_system_usage_report(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate system usage and activity report"""
        try:
            db = SessionLocal()
            try:
                days = parameters.get("days", 30)
                start_date = datetime.utcnow() - timedelta(days=days)
                
                # Login statistics
                total_logins = db.query(LoginAttempt).filter(
                    and_(
                        LoginAttempt.attempted_at >= start_date,
                        LoginAttempt.success == True
                    )
                ).count()  
                
                failed_logins = db.query(LoginAttempt).filter(
                    and_(
                        LoginAttempt.attempted_at >= start_date,
                        LoginAttempt.success == False
                    )
                ).count()  
                
                # Unique users
                unique_users = db.query(LoginAttempt.username).filter(
                    and_(
                        LoginAttempt.attempted_at >= start_date,
                        LoginAttempt.success == True
                    )
                ).distinct().count()  
                
                # System logs by level
                log_stats = db.query(
                    SystemLog.level,
                    func.count(SystemLog.id).label("count")
                ).filter(
                    SystemLog.timestamp >= start_date
                ).group_by(SystemLog.level).all()  
                
                # Audit activity
                audit_activity = db.query(
                    AuditLog.action,
                    func.count(AuditLog.id).label("count")
                ).filter(
                    AuditLog.timestamp >= start_date
                ).group_by(AuditLog.action).all()  
                
                # Daily login trend
                daily_logins = db.query(
                    func.date(LoginAttempt.attempted_at).label("date"),
                    func.count(LoginAttempt.id).label("count")
                ).filter(
                    and_(
                        LoginAttempt.attempted_at >= start_date,
                        LoginAttempt.success == True
                    )
                ).group_by(func.date(LoginAttempt.attempted_at)).all()  
                
                success_rate = (total_logins / max(total_logins + failed_logins, 1)) * 100
                
                return {
                    "period": f"Last {days} days",
                    "login_statistics": {
                        "total_successful_logins": total_logins,
                        "failed_login_attempts": failed_logins,
                        "success_rate": round(success_rate, 2),
                        "unique_users": unique_users
                    },
                    "system_logs": [
                        {"level": level, "count": count}
                        for level, count in log_stats
                    ],
                    "audit_activity": [
                        {"action": action, "count": count}
                        for action, count in audit_activity
                    ],
                    "daily_login_trend": [
                        {"date": date.isoformat(), "logins": count}
                        for date, count in daily_logins
                    ],
                    "generated_at": datetime.utcnow().isoformat()
                }
                
            finally:
                db.close()
                
        except Exception as e:
            return {"error": f"Failed to generate system usage report: {str(e)}"}
    
    def generate_security_audit_report(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate security audit report"""
        try:
            db = SessionLocal()
            try:
                days = parameters.get("days", 7)
                start_date = datetime.utcnow() - timedelta(days=days)
                
                # Failed login attempts by IP
                failed_by_ip = db.query(
                    LoginAttempt.ip_address,
                    func.count(LoginAttempt.id).label("attempts")
                ).filter(
                    and_(
                        LoginAttempt.attempted_at >= start_date,
                        LoginAttempt.success == False
                    )
                ).group_by(LoginAttempt.ip_address).order_by(
                    func.count(LoginAttempt.id).desc()
                ).limit(10).all()  
                
                # Security-related audit events
                security_events = db.query(AuditLog).filter(
                    and_(
                        AuditLog.timestamp >= start_date,
                        AuditLog.action.in_(["LOGIN", "LOGOUT", "PASSWORD_CHANGE", "FAILED_LOGIN", "RATE_LIMIT_EXCEEDED"])
                    )
                ).count()  
                
                # Error events that might indicate security issues
                error_events = db.query(SystemLog).filter(
                    and_(
                        SystemLog.timestamp >= start_date,
                        SystemLog.level.in_(["ERROR", "CRITICAL"])
                    )
                ).count()  
                
                # Suspicious activity indicators
                suspicious_ips = db.query(LoginAttempt.ip_address).filter(
                    and_(
                        LoginAttempt.attempted_at >= start_date,
                        LoginAttempt.success == False
                    )
                ).group_by(LoginAttempt.ip_address).having(
                    func.count(LoginAttempt.id) >= 10  # 10+ failed attempts
                ).all()  
                
                return {
                    "audit_period": f"Last {days} days",
                    "security_summary": {
                        "total_security_events": security_events,
                        "error_events": error_events,
                        "suspicious_ips_count": len(suspicious_ips)
                    },
                    "failed_attempts_by_ip": [
                        {"ip_address": ip, "failed_attempts": attempts}
                        for ip, attempts in failed_by_ip
                    ],
                    "suspicious_ips": [ip[0] for ip in suspicious_ips],
                    "recommendations": self._generate_security_recommendations(failed_by_ip, suspicious_ips),
                    "generated_at": datetime.utcnow().isoformat()
                }
                
            finally:
                db.close()
                
        except Exception as e:
            return {"error": f"Failed to generate security audit report: {str(e)}"}
    
    def _generate_security_recommendations(self, failed_by_ip, suspicious_ips) -> List[str]:
        """Generate security recommendations based on audit data"""
        recommendations = []
        
        if len(suspicious_ips) > 0:
            recommendations.append("Consider implementing IP blocking for addresses with excessive failed login attempts")
        
        if failed_by_ip and failed_by_ip[0][1] > 20:
            recommendations.append("High number of failed login attempts detected - review and strengthen password policies")
        
        if len(failed_by_ip) > 5:
            recommendations.append("Multiple IPs with failed login attempts - consider implementing CAPTCHA for login")
        
        recommendations.append("Regularly review and update user access permissions")
        recommendations.append("Enable two-factor authentication for administrative accounts")
        recommendations.append("Monitor system logs for unusual patterns")
        
        return recommendations
    
    def _calculate_teacher_performance_rating(self, teacher, assignments, attendance_records):
        """Calculate a performance rating for a teacher based on various factors"""
        # Base score
        score = 50
        
        # Add points for experience
        if teacher.experience:
            try:
                exp_years = int(teacher.experience.split()[0]) if teacher.experience.split() else 0
                score += min(exp_years, 10)  # Max 10 points for experience
            except:
                pass
        
        # Add points for assignments
        assignment_count = len(assignments)
        score += min(assignment_count * 2, 20)  # Max 20 points for assignments
        
        # Add points for good attendance
        if attendance_records:
            total_days = len(attendance_records)
            present_days = sum(1 for record in attendance_records if getattr(record, 'status', 'present') == 'present')
            if total_days > 0:
                attendance_rate = present_days / total_days
                score += attendance_rate * 20  # Max 20 points for attendance
        
        # Cap at 100
        return min(score, 100)
    
    def _calculate_student_attendance_statistics(self, student_attendance_stats):
        """Calculate overall statistics for student attendance"""
        if not student_attendance_stats:
            return {}
        
        total_students = len(student_attendance_stats)
        total_absences = sum(s["total_absence_days"] for s in student_attendance_stats)
        avg_absences = total_absences / total_students if total_students > 0 else 0
        
        # Initialize variables to avoid "possibly unbound" errors
        std_dev = 0
        mean_absences = 0
        
        # Find students with high absences (more than 2 standard deviations above mean)
        if total_students > 1:
            import statistics
            absences = [s["total_absence_days"] for s in student_attendance_stats]
            std_dev = statistics.stdev(absences) if len(absences) > 1 else 0
            mean_absences = statistics.mean(absences)
            high_absence_students = [s for s in student_attendance_stats if s["total_absence_days"] > (mean_absences + 2 * std_dev)]
        else:
            high_absence_students = []
        
        # Use default values when variables might be unbound
        high_absence_threshold = round(mean_absences + 2 * std_dev, 2) if total_students > 1 else 0
        
        return {
            "average_absences_per_student": round(avg_absences, 2),
            "students_with_high_absences": len(high_absence_students),
            "high_absence_threshold": high_absence_threshold
        }
    
    def _calculate_teacher_attendance_statistics(self, teacher_attendance_stats):
        """Calculate overall statistics for teacher attendance"""
        if not teacher_attendance_stats:
            return {}
        
        total_teachers = len(teacher_attendance_stats)
        if total_teachers == 0:
            return {}
        
        total_attendance_rates = [t["attendance_rate"] for t in teacher_attendance_stats]
        avg_attendance_rate = sum(total_attendance_rates) / total_teachers
        
        # Find teachers with low attendance (below 80%)
        low_attendance_teachers = [t for t in teacher_attendance_stats if t["attendance_rate"] < 80]
        
        return {
            "average_attendance_rate": round(avg_attendance_rate, 2),
            "teachers_with_low_attendance": len(low_attendance_teachers),
            "low_attendance_threshold": 80
        }
    
    def generate_teacher_performance(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate teacher performance report"""
        try:
            db = SessionLocal()
            try:
                academic_year_id = parameters.get("academic_year_id")
                teacher_id = parameters.get("teacher_id")
                
                query = db.query(Teacher)
                
                if academic_year_id:
                    query = query.filter(Teacher.academic_year_id == academic_year_id)
                
                if teacher_id:
                    query = query.filter(Teacher.id == teacher_id)
                
                teachers = query.all()
                
                if not teachers:
                    return {"error": "No teachers found for the specified criteria"}
                
                teacher_performance_data = []
                
                for teacher in teachers:
                    # Get teacher assignments
                    assignments = db.query(TeacherAssignment).filter(
                        TeacherAssignment.teacher_id == teacher.id
                    ).all()
                    
                    # Get teacher attendance
                    attendance_records = db.query(TeacherAttendance).filter(
                        TeacherAttendance.teacher_id == teacher.id
                    ).all()
                    
                    # Calculate attendance statistics
                    total_days = len(attendance_records)
                    present_days = sum(1 for record in attendance_records if getattr(record, 'status', 'present') == 'present')
                    late_days = sum(1 for record in attendance_records if getattr(record, 'status', '') == 'late')
                    absent_days = total_days - present_days - late_days
                    
                    attendance_rate = (present_days / max(total_days, 1)) * 100 if total_days > 0 else 0
                    
                    # Calculate class load
                    class_count = len(assignments)
                    
                    # Get subjects taught
                    subject_ids = [assignment.subject_id for assignment in assignments]
                    subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).all()
                    subject_names = [subject.subject_name for subject in subjects]
                    
                    # Calculate workload (simplified)
                    workload_score = min(100, class_count * 10)  # Simple workload calculation
                    
                    teacher_performance_data.append({
                        "teacher_id": teacher.id,
                        "teacher_name": teacher.full_name,
                        "qualifications": teacher.qualifications,
                        "experience": teacher.experience,
                        "classes_taught": class_count,
                        "subjects_taught": subject_names,
                        "attendance_rate": round(attendance_rate, 2),
                        "present_days": present_days,
                        "late_days": late_days,
                        "absent_days": absent_days,
                        "total_working_days": total_days,
                        "workload_score": workload_score,
                        "performance_rating": self._calculate_teacher_performance_rating(teacher, assignments, attendance_records)
                    })
                
                # Sort by performance rating
                teacher_performance_data.sort(key=lambda x: x["performance_rating"], reverse=True)
                
                return {
                    "report_type": "teacher_performance",
                    "academic_year_id": academic_year_id,
                    "total_teachers": len(teacher_performance_data),
                    "teacher_performance_data": teacher_performance_data,
                    "generated_at": datetime.utcnow().isoformat()
                }
                
            finally:
                db.close()
                
        except Exception as e:
            return {"error": f"Failed to generate teacher performance report: {str(e)}"}
    
    def generate_attendance_report(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate attendance report"""
        try:
            db = SessionLocal()
            try:
                academic_year_id = parameters.get("academic_year_id")
                report_type = parameters.get("report_type", "both")  # student, teacher, both
                start_date = parameters.get("start_date")
                end_date = parameters.get("end_date")
                
                report_data = {}
                
                # Student attendance report
                if report_type in ["student", "both"]:
                    student_query = db.query(Student)
                    if academic_year_id:
                        student_query = student_query.filter(Student.academic_year_id == academic_year_id)
                    
                    students = student_query.all()
                    
                    student_attendance_stats = []
                    total_student_absences = 0
                    total_student_records = 0
                    
                    for student in students:
                        # Get student academic records for attendance
                        academic_records = db.query(StudentAcademic).filter(
                            StudentAcademic.student_id == student.id
                        )
                        
                        if academic_year_id:
                            academic_records = academic_records.filter(
                                StudentAcademic.academic_year_id == academic_year_id
                            )
                        
                        academic_records = academic_records.all()
                        
                        total_absence_days = sum(record.absence_days or 0 for record in academic_records)
                        avg_absence_days = total_absence_days / max(len(academic_records), 1) if academic_records else 0
                        
                        total_student_absences += total_absence_days
                        total_student_records += len(academic_records)
                        
                        student_attendance_stats.append({
                            "student_id": student.id,
                            "student_name": student.full_name,
                            "grade": f"{student.grade_level} {student.grade_number}",
                            "total_absence_days": total_absence_days,
                            "average_absence_days": round(avg_absence_days, 2),
                            "attendance_rate": round(100 - (avg_absence_days * 2), 2)  # Simplified calculation
                        })
                    
                    # Sort by absence days (highest first)
                    student_attendance_stats.sort(key=lambda x: x["total_absence_days"], reverse=True)
                    
                    report_data["student_attendance"] = {
                        "total_students": len(student_attendance_stats),
                        "total_absence_days": total_student_absences,
                        "average_absence_days_per_student": round(total_student_absences / max(len(student_attendance_stats), 1), 2),
                        "top_absent_students": student_attendance_stats[:10],  # Top 10 absent students
                        "attendance_statistics": self._calculate_student_attendance_statistics(student_attendance_stats)
                    }
                
                # Teacher attendance report
                if report_type in ["teacher", "both"]:
                    teacher_query = db.query(Teacher)
                    if academic_year_id:
                        teacher_query = teacher_query.filter(Teacher.academic_year_id == academic_year_id)
                    
                    teachers = teacher_query.all()
                    
                    teacher_attendance_stats = []
                    total_teacher_present_days = 0
                    total_teacher_records = 0
                    
                    for teacher in teachers:
                        # Get teacher attendance records
                        attendance_query = db.query(TeacherAttendance).filter(
                            TeacherAttendance.teacher_id == teacher.id
                        )
                        
                        if start_date:
                            attendance_query = attendance_query.filter(
                                TeacherAttendance.attendance_date >= start_date
                            )
                        
                        if end_date:
                            attendance_query = attendance_query.filter(
                                TeacherAttendance.attendance_date <= end_date
                            )
                        
                        attendance_records = attendance_query.all()
                        
                        total_days = len(attendance_records)
                        present_days = sum(1 for record in attendance_records if getattr(record, 'status', 'present') == 'present')
                        late_days = sum(1 for record in attendance_records if getattr(record, 'status', '') == 'late')
                        absent_days = total_days - present_days - late_days
                        
                        total_teacher_present_days += present_days
                        total_teacher_records += total_days
                        
                        attendance_rate = (present_days / max(total_days, 1)) * 100 if total_days > 0 else 0
                        
                        teacher_attendance_stats.append({
                            "teacher_id": teacher.id,
                            "teacher_name": teacher.full_name,
                            "total_days": total_days,
                            "present_days": present_days,
                            "late_days": late_days,
                            "absent_days": absent_days,
                            "attendance_rate": round(attendance_rate, 2)
                        })
                    
                    # Sort by attendance rate (lowest first)
                    teacher_attendance_stats.sort(key=lambda x: x["attendance_rate"])
                    
                    report_data["teacher_attendance"] = {
                        "total_teachers": len(teacher_attendance_stats),
                        "average_attendance_rate": round((total_teacher_present_days / max(total_teacher_records, 1)) * 100, 2),
                        "lowest_attendance_teachers": teacher_attendance_stats[:10],  # Top 10 lowest attendance
                        "attendance_statistics": self._calculate_teacher_attendance_statistics(teacher_attendance_stats)
                    }
                
                return {
                    "report_type": "attendance_report",
                    "report_scope": report_type,
                    "academic_year_id": academic_year_id,
                    "date_range": {
                        "start_date": start_date.isoformat() if start_date else None,
                        "end_date": end_date.isoformat() if end_date else None
                    },
                    "data": report_data,
                    "generated_at": datetime.utcnow().isoformat()
                }
                
            finally:
                db.close()
                
        except Exception as e:
            return {"error": f"Failed to generate attendance report: {str(e)}"}
    
    def generate_activity_report(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate activity report"""
        try:
            db = SessionLocal()
            try:
                academic_year_id = parameters.get("academic_year_id")
                activity_type = parameters.get("activity_type")
                start_date = parameters.get("start_date")
                end_date = parameters.get("end_date")
                
                # Query activities
                query = db.query(Activity)
                
                if academic_year_id:
                    query = query.filter(Activity.academic_year_id == academic_year_id)
                
                if activity_type:
                    query = query.filter(Activity.activity_type == activity_type)
                
                if start_date:
                    query = query.filter(Activity.start_date >= start_date)
                
                if end_date:
                    query = query.filter(Activity.end_date <= end_date)
                
                activities = query.all()
                
                if not activities:
                    return {"error": "No activities found for the specified criteria"}
                
                # Calculate activity statistics
                total_activities = len(activities)
                total_participants = sum(activity.participant_count or 0 for activity in activities)
                total_cost = sum(float(activity.cost or 0) for activity in activities)
                total_revenue = sum(float(activity.revenue or 0) for activity in activities)
                net_profit = total_revenue - total_cost
                
                # Activity type distribution
                activity_type_distribution = {}
                for activity in activities:
                    activity_type = getattr(activity, 'activity_type', 'Unknown')
                    if activity_type in activity_type_distribution:
                        activity_type_distribution[activity_type] += 1
                    else:
                        activity_type_distribution[activity_type] = 1
                
                # Top activities by participation
                activities_by_participation = sorted(activities, key=lambda x: x.participant_count or 0, reverse=True)
                top_activities = [
                    {
                        "activity_id": activity.id,
                        "activity_name": activity.activity_name,
                        "activity_date": activity.activity_date.isoformat() if activity.activity_date else None,
                        "participant_count": activity.participant_count or 0,
                        "cost": float(activity.cost or 0),
                        "revenue": float(activity.revenue or 0)
                    }
                    for activity in activities_by_participation[:10]  # Top 10 activities
                ]
                
                # Session type distribution
                session_type_distribution = {}
                for activity in activities:
                    session_type = getattr(activity, 'session_type', 'Unknown')
                    if session_type in session_type_distribution:
                        session_type_distribution[session_type] += 1
                    else:
                        session_type_distribution[session_type] = 1
                
                return {
                    "report_type": "activity_report",
                    "academic_year_id": academic_year_id,
                    "total_activities": total_activities,
                    "total_participants": total_participants,
                    "total_cost": total_cost,
                    "total_revenue": total_revenue,
                    "net_profit": net_profit,
                    "activity_type_distribution": activity_type_distribution,
                    "session_type_distribution": session_type_distribution,
                    "top_activities_by_participation": top_activities,
                    "average_participants_per_activity": round(total_participants / max(total_activities, 1), 2),
                    "profitability_rate": round((net_profit / max(total_cost, 1)) * 100, 2) if total_cost > 0 else 0,
                    "generated_at": datetime.utcnow().isoformat()
                }
                
            finally:
                db.close()
                
        except Exception as e:
            return {"error": f"Failed to generate activity report: {str(e)}"}
    
    def get_available_reports(self) -> List[Dict[str, str]]:
        """Get list of available report types"""
        return [
            {"type": "financial_summary", "name": "Financial Summary", "description": "Comprehensive financial overview"},
            {"type": "student_analytics", "name": "Student Analytics", "description": "Student demographics and statistics"},
            {"type": "academic_performance", "name": "Academic Performance", "description": "Academic results and performance metrics"},
            {"type": "system_usage", "name": "System Usage", "description": "System activity and usage statistics"},
            {"type": "security_audit", "name": "Security Audit", "description": "Security events and audit trail"},
            {"type": "teacher_performance", "name": "Teacher Performance", "description": "Teacher workload and performance metrics"},
            {"type": "attendance_report", "name": "Attendance Report", "description": "Student and teacher attendance analysis"},
            {"type": "activity_report", "name": "Activity Report", "description": "School activities and participation analysis"}
        ]

# Global reporting service instance
reporting_service = ReportingService()