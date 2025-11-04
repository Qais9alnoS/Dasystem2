from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from decimal import Decimal
from typing import Dict, List

from ..models.students import Student, StudentFinance, StudentPayment, HistoricalBalance
from ..models.academic import AcademicYear


class BalanceTransferService:
    """Service for transferring outstanding balances between academic years"""
    
    def __init__(self, db: Session):
        self.db = db
        self.transfer_log = []
    
    def transfer_student_balances(
        self, 
        source_year_id: int, 
        target_year_id: int
    ) -> Dict:
        """
        Transfer outstanding student balances from source year to target year
        
        Args:
            source_year_id: ID of the source academic year
            target_year_id: ID of the target academic year
            
        Returns:
            Dictionary with transfer statistics
        """
        try:
            # Validate academic years
            source_year = self.db.query(AcademicYear).filter(
                AcademicYear.id == source_year_id
            ).first()
            target_year = self.db.query(AcademicYear).filter(
                AcademicYear.id == target_year_id
            ).first()
            
            if not source_year or not target_year:
                raise ValueError("Invalid academic year IDs")
            
            # Get all students from source year with financial records
            students_with_finance = self.db.query(Student, StudentFinance).join(
                StudentFinance, StudentFinance.student_id == Student.id
            ).filter(
                Student.academic_year_id == source_year_id
            ).all()
            
            transferred_count = 0
            total_balance_transferred = Decimal('0.00')
            students_with_balance = []
            
            for student, finance in students_with_finance:
                # Calculate outstanding balance
                total_owed = finance.total_amount
                total_paid = self.db.query(
                    func.sum(StudentPayment.payment_amount)
                ).filter(
                    StudentPayment.student_id == student.id,
                    StudentPayment.academic_year_id == source_year_id,
                    StudentPayment.payment_status == "completed"
                ).scalar() or Decimal('0.00')
                
                balance = total_owed - total_paid
                
                # Only transfer if there's an outstanding balance
                if balance > 0:
                    # Create historical balance record
                    historical_balance = HistoricalBalance(
                        student_id=student.id,
                        academic_year_id=source_year_id,
                        balance_amount=balance,
                        balance_type="receivable",  # المدرسة تستحق هذا المبلغ
                        is_transferred=True,
                        transfer_date=date.today(),
                        notes=f"Transferred from {source_year.year_name} to {target_year.year_name}"
                    )
                    self.db.add(historical_balance)
                    
                    # Check if student exists in target year
                    target_student = self.db.query(Student).filter(
                        Student.id == student.id
                    ).first()
                    
                    if target_student:
                        # Update or create finance record in target year
                        target_finance = self.db.query(StudentFinance).filter(
                            StudentFinance.student_id == student.id,
                            StudentFinance.academic_year_id == target_year_id
                        ).first()
                        
                        if target_finance:
                            # Add to existing previous_years_balance
                            target_finance.previous_years_balance += balance
                        else:
                            # Create new finance record with previous balance
                            target_finance = StudentFinance(
                                student_id=student.id,
                                academic_year_id=target_year_id,
                                previous_years_balance=balance
                            )
                            self.db.add(target_finance)
                    
                    transferred_count += 1
                    total_balance_transferred += balance
                    students_with_balance.append({
                        "student_id": student.id,
                        "student_name": student.full_name,
                        "balance": float(balance)
                    })
                    
                    self.transfer_log.append(
                        f"Transferred {balance} for student {student.full_name} (ID: {student.id})"
                    )
            
            # Commit all changes
            self.db.commit()
            
            return {
                "success": True,
                "source_year": source_year.year_name,
                "target_year": target_year.year_name,
                "transferred_count": transferred_count,
                "total_balance_transferred": float(total_balance_transferred),
                "students_with_balance": students_with_balance,
                "transfer_date": date.today().isoformat()
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "error": str(e),
                "transfer_log": self.transfer_log
            }
    
    def get_historical_balances(
        self, 
        student_id: int
    ) -> List[Dict]:
        """
        Get all historical balances for a student across all academic years
        
        Args:
            student_id: ID of the student
            
        Returns:
            List of historical balance records
        """
        balances = self.db.query(HistoricalBalance, AcademicYear).join(
            AcademicYear, HistoricalBalance.academic_year_id == AcademicYear.id
        ).filter(
            HistoricalBalance.student_id == student_id
        ).order_by(AcademicYear.year_name.desc()).all()
        
        result = []
        for balance, year in balances:
            result.append({
                "id": balance.id,
                "academic_year": year.year_name,
                "academic_year_id": year.id,
                "balance_amount": float(balance.balance_amount),
                "balance_type": balance.balance_type,
                "is_transferred": balance.is_transferred,
                "transfer_date": balance.transfer_date.isoformat() if balance.transfer_date else None,
                "notes": balance.notes,
                "created_at": balance.created_at.isoformat()
            })
        
        return result
    
    def get_total_historical_balance(
        self, 
        student_id: int
    ) -> Decimal:
        """
        Calculate total historical balance for a student
        
        Args:
            student_id: ID of the student
            
        Returns:
            Total historical balance amount
        """
        total = self.db.query(
            func.sum(HistoricalBalance.balance_amount)
        ).filter(
            HistoricalBalance.student_id == student_id,
            HistoricalBalance.balance_type == "receivable"
        ).scalar() or Decimal('0.00')
        
        return total
    
    def get_students_with_outstanding_balances(
        self, 
        academic_year_id: int
    ) -> List[Dict]:
        """
        Get all students with outstanding balances for a specific academic year
        
        Args:
            academic_year_id: ID of the academic year
            
        Returns:
            List of students with their outstanding balances
        """
        students_with_finance = self.db.query(Student, StudentFinance).join(
            StudentFinance, StudentFinance.student_id == Student.id
        ).filter(
            Student.academic_year_id == academic_year_id,
            Student.is_active == True
        ).all()
        
        result = []
        for student, finance in students_with_finance:
            total_owed = finance.total_amount
            total_paid = self.db.query(
                func.sum(StudentPayment.payment_amount)
            ).filter(
                StudentPayment.student_id == student.id,
                StudentPayment.academic_year_id == academic_year_id,
                StudentPayment.payment_status == "completed"
            ).scalar() or Decimal('0.00')
            
            balance = total_owed - total_paid
            
            if balance > 0:
                result.append({
                    "student_id": student.id,
                    "student_name": student.full_name,
                    "father_name": student.father_name,
                    "grade_level": student.grade_level,
                    "grade_number": student.grade_number,
                    "section": student.section,
                    "total_owed": float(total_owed),
                    "total_paid": float(total_paid),
                    "outstanding_balance": float(balance)
                })
        
        return result

