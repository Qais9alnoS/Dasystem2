"""
Financial Analytics Module - Part of Analytics Service
Handles all financial-related analytics
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, date
from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.students import Student, StudentFinance, StudentPayment
from app.models.teachers import Teacher, TeacherFinance
from app.models.finance import FinanceTransaction, FinanceCategory, Budget
from app.models.activities import Activity
from app.services.analytics_service import cache_result, TimePeriodHelper


class FinancialAnalytics:
    """Financial analytics methods"""
    
    def __init__(self):
        self.time_helper = TimePeriodHelper()
    
    @cache_result(ttl_seconds=300)
    def get_financial_overview(self, academic_year_id: int, period_type: str = "monthly") -> Dict[str, Any]:
        """Get comprehensive financial analytics"""
        db = SessionLocal()
        try:
            start_date, end_date = self.time_helper.get_date_range(period_type)
            
            # Total student payments
            total_student_payments = db.query(
                func.sum(StudentPayment.payment_amount)
            ).filter(
                StudentPayment.academic_year_id == academic_year_id,
                StudentPayment.payment_date.between(start_date, end_date)
            ).scalar() or 0
            
            # Total other income
            total_other_income = db.query(
                func.sum(FinanceTransaction.amount)
            ).filter(
                FinanceTransaction.academic_year_id == academic_year_id,
                FinanceTransaction.transaction_type == "income",
                FinanceTransaction.transaction_date.between(start_date, end_date)
            ).scalar() or 0
            
            # Total expenses
            total_expenses = db.query(
                func.sum(FinanceTransaction.amount)
            ).filter(
                FinanceTransaction.academic_year_id == academic_year_id,
                FinanceTransaction.transaction_type == "expense",
                FinanceTransaction.transaction_date.between(start_date, end_date)
            ).scalar() or 0
            
            # Collection metrics
            expected_revenue = db.query(
                func.sum(
                    StudentFinance.school_fee - StudentFinance.school_fee_discount +
                    StudentFinance.bus_fee - StudentFinance.bus_fee_discount +
                    StudentFinance.other_revenues
                )
            ).filter(StudentFinance.academic_year_id == academic_year_id).scalar() or 0
            
            collection_rate = (total_student_payments / expected_revenue * 100) if expected_revenue > 0 else 0
            
            total_income = total_student_payments + total_other_income
            net_profit = total_income - total_expenses
            
            return {
                "summary": {
                    "total_income": float(total_income),
                    "student_payments": float(total_student_payments),
                    "other_income": float(total_other_income),
                    "total_expenses": float(total_expenses),
                    "net_profit": float(net_profit),
                    "profit_margin": round((net_profit / total_income * 100) if total_income > 0 else 0, 2)
                },
                "collection": {
                    "expected_revenue": float(expected_revenue),
                    "collected": float(total_student_payments),
                    "collection_rate": round(collection_rate, 2),
                    "outstanding": float(expected_revenue - total_student_payments)
                }
            }
            
        finally:
            db.close()
    
    @cache_result(ttl_seconds=300)
    def get_income_trends(self, academic_year_id: int, period_type: str = "monthly") -> Dict[str, Any]:
        """Get income trends over time"""
        db = SessionLocal()
        try:
            start_date, end_date = self.time_helper.get_date_range(period_type)
            
            # Get SQLite-compatible date format
            if period_type == "daily":
                date_format = '%Y-%m-%d'
            elif period_type == "weekly":
                date_format = '%Y-%W'
            elif period_type == "yearly":
                date_format = '%Y'
            else:  # monthly
                date_format = '%Y-%m'
            
            # Student payments over time
            student_payments = db.query(
                func.strftime(date_format, StudentPayment.payment_date).label("period"),
                func.sum(StudentPayment.payment_amount).label("amount"),
                func.count(StudentPayment.id).label("transaction_count")
            ).filter(
                StudentPayment.academic_year_id == academic_year_id,
                StudentPayment.payment_date.between(start_date, end_date)
            ).group_by("period").order_by("period").all()
            
            # Other income over time
            other_income = db.query(
                func.strftime(date_format, FinanceTransaction.transaction_date).label("period"),
                func.sum(FinanceTransaction.amount).label("amount"),
                func.count(FinanceTransaction.id).label("transaction_count")
            ).filter(
                FinanceTransaction.academic_year_id == academic_year_id,
                FinanceTransaction.transaction_type == "income",
                FinanceTransaction.transaction_date.between(start_date, end_date)
            ).group_by("period").order_by("period").all()
            
            # Income by category
            income_by_category = db.query(
                FinanceCategory.category_name,
                func.sum(FinanceTransaction.amount).label("total"),
                func.count(FinanceTransaction.id).label("count")
            ).join(FinanceTransaction).filter(
                FinanceTransaction.academic_year_id == academic_year_id,
                FinanceTransaction.transaction_type == "income",
                FinanceTransaction.transaction_date.between(start_date, end_date)
            ).group_by(FinanceCategory.category_name).all()
            
            return {
                "student_payments": [
                    {
                        "period": p if p else None,
                        "amount": float(amt) if amt else 0,
                        "transaction_count": count
                    }
                    for p, amt, count in student_payments
                ],
                "other_income": [
                    {
                        "period": p if p else None,
                        "amount": float(amt) if amt else 0,
                        "transaction_count": count
                    }
                    for p, amt, count in other_income
                ],
                "by_category": [
                    {
                        "category": cat,
                        "total": float(total),
                        "count": count
                    }
                    for cat, total, count in income_by_category
                ]
            }
            
        finally:
            db.close()
    
    @cache_result(ttl_seconds=300)
    def get_expense_trends(self, academic_year_id: int, period_type: str = "monthly") -> Dict[str, Any]:
        """Get expense trends over time"""
        db = SessionLocal()
        try:
            start_date, end_date = self.time_helper.get_date_range(period_type)
            
            # Get SQLite-compatible date format
            if period_type == "daily":
                date_format = '%Y-%m-%d'
            elif period_type == "weekly":
                date_format = '%Y-%W'
            elif period_type == "yearly":
                date_format = '%Y'
            else:  # monthly
                date_format = '%Y-%m'
            
            # Expenses over time
            expenses_trend = db.query(
                func.strftime(date_format, FinanceTransaction.transaction_date).label("period"),
                func.sum(FinanceTransaction.amount).label("amount"),
                func.count(FinanceTransaction.id).label("transaction_count")
            ).filter(
                FinanceTransaction.academic_year_id == academic_year_id,
                FinanceTransaction.transaction_type == "expense",
                FinanceTransaction.transaction_date.between(start_date, end_date)
            ).group_by("period").order_by("period").all()
            
            # Expense by category
            expense_by_category = db.query(
                FinanceCategory.category_name,
                func.sum(FinanceTransaction.amount).label("total"),
                func.count(FinanceTransaction.id).label("count")
            ).join(FinanceTransaction).filter(
                FinanceTransaction.academic_year_id == academic_year_id,
                FinanceTransaction.transaction_type == "expense",
                FinanceTransaction.transaction_date.between(start_date, end_date)
            ).group_by(FinanceCategory.category_name).all()
            
            # Budget vs actual
            budgets = db.query(Budget).filter(
                Budget.academic_year_id == academic_year_id
            ).all()
            
            budget_analysis = []
            for budget in budgets:
                actual = db.query(
                    func.sum(FinanceTransaction.amount)
                ).join(FinanceCategory).filter(
                    FinanceTransaction.academic_year_id == academic_year_id,
                    FinanceTransaction.transaction_type == "expense",
                    FinanceCategory.category_name == budget.category
                ).scalar() or 0
                
                budget_analysis.append({
                    "category": budget.category,
                    "budgeted": float(budget.budgeted_amount),
                    "actual": float(actual),
                    "variance": float(budget.budgeted_amount - actual),
                    "utilization_rate": round((actual / budget.budgeted_amount * 100) if budget.budgeted_amount > 0 else 0, 2)
                })
            
            return {
                "expense_trend": [
                    {
                        "period": p if p else None,
                        "amount": float(amt) if amt else 0,
                        "transaction_count": count
                    }
                    for p, amt, count in expenses_trend
                ],
                "by_category": [
                    {
                        "category": cat,
                        "total": float(total),
                        "count": count
                    }
                    for cat, total, count in expense_by_category
                ],
                "budget_analysis": budget_analysis
            }
            
        finally:
            db.close()
    
    @cache_result(ttl_seconds=300)
    def get_outstanding_payments(self, academic_year_id: int, limit: int = 50) -> Dict[str, Any]:
        """Get list of students with outstanding payments"""
        db = SessionLocal()
        try:
            # Query students with their financial data
            students_data = db.query(
                Student.id,
                Student.full_name,
                Student.session_type,
                Student.grade_level,
                Student.grade_number,
                StudentFinance.school_fee,
                StudentFinance.school_fee_discount,
                StudentFinance.bus_fee,
                StudentFinance.bus_fee_discount,
                StudentFinance.other_revenues,
                func.coalesce(func.sum(StudentPayment.payment_amount), 0).label("total_paid")
            ).join(StudentFinance).outerjoin(StudentPayment).filter(
                Student.academic_year_id == academic_year_id,
                Student.is_active == True
            ).group_by(
                Student.id, Student.full_name, Student.session_type,
                Student.grade_level, Student.grade_number,
                StudentFinance.school_fee, StudentFinance.school_fee_discount,
                StudentFinance.bus_fee, StudentFinance.bus_fee_discount,
                StudentFinance.other_revenues
            ).all()
            
            outstanding_list = []
            total_outstanding = 0
            
            for row in students_data:
                total_due = (row.school_fee - row.school_fee_discount +
                            row.bus_fee - row.bus_fee_discount +
                            row.other_revenues)
                balance = total_due - row.total_paid
                
                if balance > 0:
                    outstanding_list.append({
                        "student_id": row.id,
                        "student_name": row.full_name,
                        "session_type": row.session_type,
                        "grade": f"{row.grade_level} {row.grade_number}",
                        "total_due": float(total_due),
                        "total_paid": float(row.total_paid),
                        "balance": float(balance),
                        "payment_percentage": round((row.total_paid / total_due * 100) if total_due > 0 else 0, 2)
                    })
                    total_outstanding += balance
            
            # Sort by balance descending
            outstanding_list.sort(key=lambda x: x["balance"], reverse=True)
            
            return {
                "total_outstanding": float(total_outstanding),
                "student_count": len(outstanding_list),
                "outstanding_payments": outstanding_list[:limit],
                "summary_by_session": self._summarize_by_session(outstanding_list)
            }
            
        finally:
            db.close()
    
    def _summarize_by_session(self, outstanding_list: List[Dict]) -> Dict[str, Any]:
        """Helper to summarize outstanding by session"""
        morning_total = sum(item["balance"] for item in outstanding_list if item["session_type"] == "morning")
        evening_total = sum(item["balance"] for item in outstanding_list if item["session_type"] == "evening")
        morning_count = len([item for item in outstanding_list if item["session_type"] == "morning"])
        evening_count = len([item for item in outstanding_list if item["session_type"] == "evening"])
        
        return {
            "morning": {
                "total": float(morning_total),
                "count": morning_count
            },
            "evening": {
                "total": float(evening_total),
                "count": evening_count
            }
        }
    
    @cache_result(ttl_seconds=300)
    def get_activity_financial_analysis(self, academic_year_id: int) -> Dict[str, Any]:
        """Analyze financial performance of activities"""
        db = SessionLocal()
        try:
            activities = db.query(Activity).filter(
                Activity.academic_year_id == academic_year_id
            ).all()
            
            activity_analysis = []
            total_activity_revenue = 0
            total_activity_cost = 0
            
            for activity in activities:
                # Calculate revenue from registrations
                registration_revenue = db.query(
                    func.sum(ActivityRegistration.payment_amount)
                ).filter(
                    ActivityRegistration.activity_id == activity.id,
                    ActivityRegistration.payment_status == "paid"
                ).scalar() or 0
                
                total_revenue = float(activity.total_revenue or 0) + float(registration_revenue)
                total_cost = float(activity.total_cost or 0)
                net_profit = total_revenue - total_cost
                roi = (net_profit / total_cost * 100) if total_cost > 0 else 0
                
                total_activity_revenue += total_revenue
                total_activity_cost += total_cost
                
                activity_analysis.append({
                    "activity_id": activity.id,
                    "activity_name": activity.name,
                    "activity_type": activity.activity_type,
                    "participants": activity.participant_count,
                    "total_revenue": total_revenue,
                    "total_cost": total_cost,
                    "net_profit": net_profit,
                    "roi": round(roi, 2),
                    "status": activity.financial_status
                })
            
            # Sort by net profit
            activity_analysis.sort(key=lambda x: x["net_profit"], reverse=True)
            
            return {
                "summary": {
                    "total_revenue": total_activity_revenue,
                    "total_cost": total_activity_cost,
                    "net_profit": total_activity_revenue - total_activity_cost,
                    "activity_count": len(activities)
                },
                "activities": activity_analysis,
                "profitable_activities": [a for a in activity_analysis if a["net_profit"] > 0],
                "loss_making_activities": [a for a in activity_analysis if a["net_profit"] < 0]
            }
            
        finally:
            db.close()
