from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

# Finance Transaction Base Schema
class FinanceTransactionBase(BaseModel):
    academic_year_id: int
    transaction_type: str  # "income", "expense"
    category: str
    amount: Decimal
    description: str
    transaction_date: date
    payment_method: str  # "cash", "bank_transfer", "check"
    reference_number: Optional[str] = None
    notes: Optional[str] = None

    @validator('transaction_type')
    def validate_transaction_type(cls, v):
        if v not in ['income', 'expense']:
            raise ValueError('Transaction type must be income or expense')
        return v

    @validator('payment_method')
    def validate_payment_method(cls, v):
        if v not in ['cash', 'bank_transfer', 'check']:
            raise ValueError('Payment method must be cash, bank_transfer, or check')
        return v

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v

class FinanceTransactionCreate(FinanceTransactionBase):
    pass

class FinanceTransactionUpdate(BaseModel):
    transaction_type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None

    @validator('transaction_type')
    def validate_transaction_type(cls, v):
        if v is not None and v not in ['income', 'expense']:
            raise ValueError('Transaction type must be income or expense')
        return v

    @validator('payment_method')
    def validate_payment_method(cls, v):
        if v is not None and v not in ['cash', 'bank_transfer', 'check']:
            raise ValueError('Payment method must be cash, bank_transfer, or check')
        return v

    @validator('amount')
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v

class FinanceTransactionResponse(FinanceTransactionBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Budget Schemas
class BudgetBase(BaseModel):
    academic_year_id: int
    category: str
    budgeted_amount: Decimal
    period_type: str  # "annual", "monthly", "quarterly"
    period_value: Optional[int] = None  # month number, quarter number, etc.
    description: Optional[str] = None

    @validator('period_type')
    def validate_period_type(cls, v):
        if v not in ['annual', 'monthly', 'quarterly']:
            raise ValueError('Period type must be annual, monthly, or quarterly')
        return v

    @validator('budgeted_amount')
    def validate_budgeted_amount(cls, v):
        if v <= 0:
            raise ValueError('Budgeted amount must be greater than 0')
        return v

    @validator('period_value')
    def validate_period_value(cls, v, values):
        period_type = values.get('period_type')
        if period_type == 'monthly' and v is not None:
            if v < 1 or v > 12:
                raise ValueError('For monthly period, value must be between 1 and 12')
        elif period_type == 'quarterly' and v is not None:
            if v < 1 or v > 4:
                raise ValueError('For quarterly period, value must be between 1 and 4')
        return v

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    budgeted_amount: Optional[Decimal] = None
    period_type: Optional[str] = None
    period_value: Optional[int] = None
    description: Optional[str] = None

    @validator('period_type')
    def validate_period_type(cls, v):
        if v is not None and v not in ['annual', 'monthly', 'quarterly']:
            raise ValueError('Period type must be annual, monthly, or quarterly')
        return v

    @validator('budgeted_amount')
    def validate_budgeted_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Budgeted amount must be greater than 0')
        return v

class BudgetResponse(BudgetBase):
    id: int
    spent_amount: Decimal
    remaining_amount: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Financial Report Schemas
class FinancialSummary(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    net_balance: Decimal
    student_fees_collected: Decimal
    teacher_salaries_paid: Decimal
    pending_payments: Decimal

class MonthlyFinancialReport(BaseModel):
    year: int
    month: int
    summary: FinancialSummary
    top_expense_categories: List[dict]
    income_breakdown: List[dict]

class AnnualFinancialReport(BaseModel):
    academic_year_id: int
    year: int
    summary: FinancialSummary
    monthly_summaries: List[MonthlyFinancialReport]
    budget_vs_actual: List[dict]

# Expense Category Schemas
class ExpenseCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass

class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ExpenseCategoryResponse(ExpenseCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Income Category Schemas
class IncomeCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class IncomeCategoryCreate(IncomeCategoryBase):
    pass

class IncomeCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class IncomeCategoryResponse(IncomeCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Payment Method Schemas
class PaymentMethodBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PaymentMethodResponse(PaymentMethodBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Finance Card Schemas
class FinanceCardBase(BaseModel):
    academic_year_id: int
    card_name: str
    card_type: str  # "income", "expense", "both"
    category: str  # "activity", "student", "custom"
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    is_default: bool = False
    created_date: date
    description: Optional[str] = None
    status: str = "open"  # "open", "closed", "partial"

    @validator('card_type')
    def validate_card_type(cls, v):
        if v not in ['income', 'expense', 'both']:
            raise ValueError('Card type must be income, expense, or both')
        return v

    @validator('category')
    def validate_category(cls, v):
        if v not in ['activity', 'student', 'custom']:
            raise ValueError('Category must be activity, student, or custom')
        return v

    @validator('status')
    def validate_status(cls, v):
        if v not in ['open', 'closed', 'partial']:
            raise ValueError('Status must be open, closed, or partial')
        return v

class FinanceCardCreate(FinanceCardBase):
    pass

class FinanceCardUpdate(BaseModel):
    card_name: Optional[str] = None
    card_type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

    @validator('card_type')
    def validate_card_type(cls, v):
        if v is not None and v not in ['income', 'expense', 'both']:
            raise ValueError('Card type must be income, expense, or both')
        return v

    @validator('status')
    def validate_status(cls, v):
        if v is not None and v not in ['open', 'closed', 'partial']:
            raise ValueError('Status must be open, closed, or partial')
        return v

class FinanceCardResponse(FinanceCardBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Finance Card Transaction Schemas
class FinanceCardTransactionBase(BaseModel):
    card_id: int
    transaction_type: str  # "income", "expense"
    amount: Decimal
    payer_name: Optional[str] = None
    responsible_person: Optional[str] = None
    transaction_date: date
    is_completed: bool = False
    completion_percentage: Decimal = 100
    notes: Optional[str] = None

    @validator('transaction_type')
    def validate_transaction_type(cls, v):
        if v not in ['income', 'expense']:
            raise ValueError('Transaction type must be income or expense')
        return v

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v

    @validator('completion_percentage')
    def validate_completion_percentage(cls, v):
        if v < 0 or v > 100:
            raise ValueError('Completion percentage must be between 0 and 100')
        return v

class FinanceCardTransactionCreate(FinanceCardTransactionBase):
    pass

class FinanceCardTransactionUpdate(BaseModel):
    transaction_type: Optional[str] = None
    amount: Optional[Decimal] = None
    payer_name: Optional[str] = None
    responsible_person: Optional[str] = None
    transaction_date: Optional[date] = None
    is_completed: Optional[bool] = None
    completion_percentage: Optional[Decimal] = None
    notes: Optional[str] = None

    @validator('transaction_type')
    def validate_transaction_type(cls, v):
        if v is not None and v not in ['income', 'expense']:
            raise ValueError('Transaction type must be income or expense')
        return v

    @validator('amount')
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v

    @validator('completion_percentage')
    def validate_completion_percentage(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Completion percentage must be between 0 and 100')
        return v

class FinanceCardTransactionResponse(FinanceCardTransactionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Finance Card Summary Schema
class FinanceCardSummary(BaseModel):
    card_id: int
    card_name: str
    card_type: str
    total_income: Decimal
    total_expenses: Decimal
    net_amount: Decimal
    incomplete_transactions_count: int
    status: str

# Finance Card Detailed Schema - with transactions
class FinanceCardDetailedSummary(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    net_amount: Decimal
    completed_transactions_count: int
    incomplete_transactions_count: int

class FinanceCardDetailed(BaseModel):
    card: FinanceCardResponse
    transactions: List[FinanceCardTransactionResponse]
    summary: FinanceCardDetailedSummary