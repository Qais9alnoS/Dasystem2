from sqlalchemy import Column, Integer, String, Text, Boolean, Date, Numeric, ForeignKey, extract
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class FinanceCategory(BaseModel):
    __tablename__ = "finance_categories"
    
    category_name = Column(String(100), nullable=False)
    category_type = Column(String(10), nullable=False)  # income, expense
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

class FinanceTransaction(BaseModel):
    __tablename__ = "finance_transactions"
    
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("finance_categories.id"), nullable=False)
    transaction_type = Column(String(10), nullable=False)  # income, expense
    amount = Column(Numeric(10,2), nullable=False)
    transaction_date = Column(Date, nullable=False)
    description = Column(Text)
    reference_id = Column(Integer)  # Links to students, teachers, activities etc.
    reference_type = Column(String(50))  # 'student', 'teacher', 'activity', etc.
    receipt_number = Column(String(50))
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    academic_year = relationship("AcademicYear")
    category = relationship("FinanceCategory")
    user = relationship("User")

class Budget(BaseModel):
    __tablename__ = "budgets"
    
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    budgeted_amount = Column(Numeric(10,2), nullable=False)
    period_type = Column(String(20), nullable=False)  # annual, monthly, quarterly
    period_value = Column(Integer)  # month number, quarter number, etc.
    description = Column(Text)
    
    # Relationships
    academic_year = relationship("AcademicYear")

class ExpenseCategory(BaseModel):
    __tablename__ = "expense_categories"
    
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

class IncomeCategory(BaseModel):
    __tablename__ = "income_categories"
    
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

class PaymentMethod(BaseModel):
    __tablename__ = "payment_methods"
    
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)