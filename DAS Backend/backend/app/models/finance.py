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

class FinanceCard(BaseModel):
    __tablename__ = "finance_cards"
    
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    card_name = Column(String(200), nullable=False)
    card_type = Column(String(20), nullable=False)  # income, expense, both
    category = Column(String(50), nullable=False)  # activity, student, custom
    reference_id = Column(Integer)  # ID of activity or other reference
    reference_type = Column(String(50))  # 'activity', 'custom', etc.
    is_default = Column(Boolean, default=False)  # افتراضي (نشاطات/طلاب) أم مخصص
    created_date = Column(Date, nullable=False)
    description = Column(Text)
    status = Column(String(20), default="open")  # open, closed, partial
    
    # Relationships
    academic_year = relationship("AcademicYear")
    transactions = relationship("FinanceCardTransaction", back_populates="card", cascade="all, delete-orphan")

class FinanceCardTransaction(BaseModel):
    __tablename__ = "finance_card_transactions"
    
    card_id = Column(Integer, ForeignKey("finance_cards.id", ondelete="CASCADE"), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # income, expense
    amount = Column(Numeric(10,2), nullable=False)
    payer_name = Column(String(200))  # اسم الدافع/المستلم
    responsible_person = Column(String(200))  # المسؤول عن العملية
    transaction_date = Column(Date, nullable=False)
    is_completed = Column(Boolean, default=False)  # هل اكتملت الدفعة 100%
    completion_percentage = Column(Numeric(5,2), default=100)  # نسبة الإنجاز
    notes = Column(Text)
    
    # Relationships
    card = relationship("FinanceCard", back_populates="transactions")