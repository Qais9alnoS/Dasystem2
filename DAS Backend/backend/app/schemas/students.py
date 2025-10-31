from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

class StudentBase(BaseModel):
    full_name: str
    has_special_needs: bool = False
    special_needs_details: Optional[str] = None
    father_name: str
    grandfather_name: str
    mother_name: str
    birth_date: date
    birth_place: Optional[str] = None
    nationality: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_occupation: Optional[str] = None
    religion: Optional[str] = None
    gender: str  # male, female
    transportation_type: str
    bus_number: Optional[str] = None
    landline_phone: Optional[str] = None
    father_phone: Optional[str] = None
    mother_phone: Optional[str] = None
    additional_phone: Optional[str] = None
    detailed_address: Optional[str] = None
    previous_school: Optional[str] = None
    grade_level: str  # primary, intermediate, secondary
    grade_number: int
    section: Optional[str] = None
    session_type: str  # morning, evening
    ninth_grade_total: Optional[Decimal] = None
    notes: Optional[str] = None

class StudentCreate(StudentBase):
    academic_year_id: int

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    has_special_needs: Optional[bool] = None
    special_needs_details: Optional[str] = None
    father_name: Optional[str] = None
    grandfather_name: Optional[str] = None
    mother_name: Optional[str] = None
    birth_date: Optional[date] = None
    birth_place: Optional[str] = None
    nationality: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_occupation: Optional[str] = None
    religion: Optional[str] = None
    gender: Optional[str] = None
    transportation_type: Optional[str] = None
    bus_number: Optional[str] = None
    landline_phone: Optional[str] = None
    father_phone: Optional[str] = None
    mother_phone: Optional[str] = None
    additional_phone: Optional[str] = None
    detailed_address: Optional[str] = None
    previous_school: Optional[str] = None
    grade_level: Optional[str] = None
    grade_number: Optional[int] = None
    section: Optional[str] = None
    session_type: Optional[str] = None
    ninth_grade_total: Optional[Decimal] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class StudentResponse(StudentBase):
    id: int
    academic_year_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class StudentFinanceBase(BaseModel):
    school_fee: Decimal = Decimal('0')
    school_fee_discount: Decimal = Decimal('0')
    bus_fee: Decimal = Decimal('0')
    bus_fee_discount: Decimal = Decimal('0')
    other_revenues: Decimal = Decimal('0')
    payment_notes: Optional[str] = None

class StudentFinanceCreate(StudentFinanceBase):
    student_id: int
    academic_year_id: int

class StudentFinanceResponse(StudentFinanceBase):
    id: int
    student_id: int
    academic_year_id: int
    total_amount: Decimal
    created_at: datetime
    
    class Config:
        from_attributes = True

class StudentPaymentBase(BaseModel):
    payment_amount: Decimal
    payment_date: date
    receipt_number: Optional[str] = None
    payment_method: Optional[str] = None
    payment_status: Optional[str] = "pending"  # pending, completed, overdue
    notes: Optional[str] = None

class StudentPaymentCreate(StudentPaymentBase):
    student_id: int
    academic_year_id: int

class StudentPaymentResponse(StudentPaymentBase):
    id: int
    student_id: int
    academic_year_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class StudentAcademicBase(BaseModel):
    board_grades: Optional[Decimal] = None
    recitation_grades: Optional[Decimal] = None
    first_exam_grades: Optional[Decimal] = None
    midterm_grades: Optional[Decimal] = None
    second_exam_grades: Optional[Decimal] = None
    final_exam_grades: Optional[Decimal] = None
    behavior_grade: Optional[Decimal] = None
    activity_grade: Optional[Decimal] = None
    absence_days: int = 0
    absence_dates: Optional[str] = None

class StudentAcademicCreate(StudentAcademicBase):
    student_id: int
    academic_year_id: int
    subject_id: int

class StudentAcademicUpdate(StudentAcademicBase):
    pass

class StudentAcademicResponse(StudentAcademicBase):
    id: int
    student_id: int
    academic_year_id: int
    subject_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
