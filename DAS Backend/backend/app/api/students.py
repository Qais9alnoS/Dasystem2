from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.students import Student, StudentFinance, StudentPayment, StudentAcademic
from app.schemas.students import (
    StudentCreate, StudentUpdate, StudentResponse,
    StudentFinanceCreate, StudentFinanceResponse,
    StudentPaymentCreate, StudentPaymentResponse,
    StudentAcademicCreate, StudentAcademicUpdate, StudentAcademicResponse
)
from app.core.dependencies import get_current_user, get_school_user
from app.models.users import User

router = APIRouter()

# Student Management
@router.get("/", response_model=List[StudentResponse])
async def get_students(
    academic_year_id: Optional[int] = Query(None),
    session_type: Optional[str] = Query(None),
    grade_level: Optional[str] = Query(None),
    grade_number: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get students with filters"""
    query = db.query(Student)
    
    if academic_year_id:
        query = query.filter(Student.academic_year_id == academic_year_id)
    if session_type:
        query = query.filter(Student.session_type == session_type)
    if grade_level:
        query = query.filter(Student.grade_level == grade_level)
    if grade_number:
        query = query.filter(Student.grade_number == grade_number)
    if is_active is not None:
        query = query.filter(Student.is_active == is_active)
    
    students = query.offset(skip).limit(limit).all()
    return students

@router.post("/", response_model=StudentResponse)
async def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Create new student"""
    new_student = Student(**student_data.dict())
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    return new_student

@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get student by ID"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    return student

@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Update student information"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    for field, value in student_data.dict(exclude_unset=True).items():
        setattr(student, field, value)
    
    db.commit()
    db.refresh(student)
    
    return student

@router.delete("/{student_id}")
async def deactivate_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Deactivate student (soft delete)"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    student.is_active = False
    db.commit()
    
    return {"message": "Student deactivated successfully"}

# Student Finance Management
@router.get("/{student_id}/finances", response_model=StudentFinanceResponse)
async def get_student_finances(
    student_id: int,
    academic_year_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get student financial information"""
    query = db.query(StudentFinance).filter(StudentFinance.student_id == student_id)
    
    if academic_year_id:
        query = query.filter(StudentFinance.academic_year_id == academic_year_id)
    else:
        # Get the most recent record
        query = query.order_by(StudentFinance.created_at.desc())
    
    finance = query.first()
    if not finance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student financial record not found"
        )
    
    return finance

@router.post("/{student_id}/finances", response_model=StudentFinanceResponse)
async def create_student_finance(
    student_id: int,
    finance_data: StudentFinanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create student financial record"""
    finance_data.student_id = student_id
    new_finance = StudentFinance(**finance_data.dict())
    db.add(new_finance)
    db.commit()
    db.refresh(new_finance)
    
    return new_finance

# Student Payment Management
@router.get("/{student_id}/payments", response_model=List[StudentPaymentResponse])
async def get_student_payments(
    student_id: int,
    academic_year_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get student payment history"""
    query = db.query(StudentPayment).filter(StudentPayment.student_id == student_id)
    
    if academic_year_id:
        query = query.filter(StudentPayment.academic_year_id == academic_year_id)
    
    payments = query.order_by(StudentPayment.payment_date.desc()).all()
    return payments

@router.post("/{student_id}/payments", response_model=StudentPaymentResponse)
async def record_student_payment(
    student_id: int,
    payment_data: StudentPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record new student payment"""
    payment_data.student_id = student_id
    new_payment = StudentPayment(**payment_data.dict())
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    
    return new_payment

# Student Academic Records
@router.get("/{student_id}/academics", response_model=List[StudentAcademicResponse])
async def get_student_academics(
    student_id: int,
    academic_year_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get student academic records"""
    query = db.query(StudentAcademic).filter(StudentAcademic.student_id == student_id)
    
    if academic_year_id:
        query = query.filter(StudentAcademic.academic_year_id == academic_year_id)
    if subject_id:
        query = query.filter(StudentAcademic.subject_id == subject_id)
    
    academics = query.all()
    return academics

@router.post("/{student_id}/academics", response_model=StudentAcademicResponse)
async def create_student_academic(
    student_id: int,
    academic_data: StudentAcademicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Create student academic record"""
    academic_data.student_id = student_id
    new_academic = StudentAcademic(**academic_data.dict())
    db.add(new_academic)
    db.commit()
    db.refresh(new_academic)
    
    return new_academic

@router.put("/{student_id}/academics/{academic_id}", response_model=StudentAcademicResponse)
async def update_student_academic(
    student_id: int,
    academic_id: int,
    academic_data: StudentAcademicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Update student academic record"""
    academic = db.query(StudentAcademic).filter(
        StudentAcademic.id == academic_id,
        StudentAcademic.student_id == student_id
    ).first()
    
    if not academic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic record not found"
        )
    
    for field, value in academic_data.dict(exclude_unset=True).items():
        setattr(academic, field, value)
    
    db.commit()
    db.refresh(academic)
    
    return academic

# Search functionality
@router.get("/search/", response_model=List[StudentResponse])
async def search_students(
    q: str = Query(..., min_length=1, description="Search query (minimum 1 character)"),
    academic_year_id: Optional[int] = Query(None),
    session_type: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Search students by name"""
    from sqlalchemy import or_, func
    
    # Normalize search query for better Arabic text matching
    search_pattern = f"%{q.lower()}%"
    
    query = db.query(Student).filter(
        or_(
            func.lower(Student.full_name).like(search_pattern),
            func.lower(Student.father_name).like(search_pattern),
            func.lower(Student.mother_name).like(search_pattern)
        )
    )
    
    if academic_year_id:
        query = query.filter(Student.academic_year_id == academic_year_id)
    if session_type:
        query = query.filter(Student.session_type == session_type)
    
    students = query.limit(limit).all()
    return students