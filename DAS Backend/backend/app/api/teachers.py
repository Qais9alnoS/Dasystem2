from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal

from ..database import get_db
from ..models.teachers import Teacher, TeacherAssignment, TeacherAttendance, TeacherFinance
from ..models.academic import Class, Subject
from ..models.users import User
from ..schemas.teachers import (
    TeacherCreate, TeacherUpdate, TeacherResponse,
    TeacherFinanceCreate, TeacherFinanceUpdate, TeacherFinanceResponse,
    TeacherAttendanceCreate, TeacherAttendanceUpdate, TeacherAttendanceResponse
)
from ..core.dependencies import get_current_user, get_school_user, get_director_user, get_finance_user

router = APIRouter(tags=["teachers"])

# Teacher CRUD Operations
@router.get("/", response_model=List[TeacherResponse])
async def get_teachers(
    academic_year_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get all teachers with optional filtering"""
    query = db.query(Teacher)
    
    if academic_year_id is not None:
        query = query.filter(Teacher.academic_year_id == academic_year_id)
    
    if is_active is not None:
        query = query.filter(Teacher.is_active == is_active)
    
    teachers = query.offset(skip).limit(limit).all()
    return teachers

@router.post("/", response_model=TeacherResponse)
async def create_teacher(
    teacher: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Create a new teacher"""
    # Check if teacher with same name already exists in the same academic year
    existing_teacher = db.query(Teacher).filter(
        and_(
            Teacher.full_name == (teacher.first_name + " " + teacher.last_name),
            Teacher.academic_year_id == teacher.academic_year_id
        )
    ).first()
    
    if existing_teacher:
        raise HTTPException(status_code=400, detail="Teacher with this name already exists in this academic year")
    
    # Create full_name from first_name and last_name
    teacher_data = teacher.dict()
    teacher_data['full_name'] = teacher.first_name + " " + teacher.last_name
    db_teacher = Teacher(**teacher_data)
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@router.get("/{teacher_id}", response_model=TeacherResponse)
async def get_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get a specific teacher by ID"""
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@router.put("/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(
    teacher_id: int,
    teacher_update: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Update a teacher"""
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    update_data = teacher_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(teacher, field, value)
    
    teacher.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(teacher)
    return teacher

@router.delete("/{teacher_id}")
async def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Delete a teacher (soft delete by setting is_active to False)"""
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    teacher.is_active = False
    db.commit()
    return {"message": "Teacher deactivated successfully"}

# Teacher Subject Assignments
@router.get("/{teacher_id}/assignments", response_model=List[dict])
async def get_teacher_assignments(
    teacher_id: int,
    academic_year_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get all subject assignments for a teacher"""
    # Verify teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    query = db.query(TeacherAssignment).filter(TeacherAssignment.teacher_id == teacher_id)
    
    if academic_year_id is not None:
        query = query.join(Teacher).filter(Teacher.academic_year_id == academic_year_id)
    
    assignments = query.all()
    
    # Enrich with class and subject information
    result = []
    for assignment in assignments:
        class_info = db.query(Class).filter(Class.id == assignment.class_id).first()
        subject_info = db.query(Subject).filter(Subject.id == assignment.subject_id).first()
        
        class_name = "Unknown"
        if class_info is not None:
            class_name = f"{class_info.grade_level} {class_info.grade_number}"
            
        subject_name = "Unknown"
        if subject_info is not None:
            subject_name = subject_info.subject_name
        
        result.append({
            "id": assignment.id,
            "teacher_id": assignment.teacher_id,
            "class_id": assignment.class_id,
            "class_name": class_name,
            "subject_id": assignment.subject_id,
            "subject_name": subject_name,
            "section": assignment.section,
            "created_at": assignment.created_at,
            "updated_at": assignment.updated_at
        })
    
    return result

@router.post("/{teacher_id}/assignments", response_model=dict)
async def assign_teacher_subject(
    teacher_id: int,
    assignment_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Assign a subject to a teacher"""
    # Verify teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Verify class and subject exist
    class_id = assignment_data.get("class_id")
    subject_id = assignment_data.get("subject_id")
    section = assignment_data.get("section")
    
    if not class_id or not subject_id:
        raise HTTPException(status_code=400, detail="Class ID and Subject ID are required")
    
    class_obj = db.query(Class).filter(Class.id == class_id).first()
    subject_obj = db.query(Subject).filter(Subject.id == subject_id).first()
    
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
        
    if not subject_obj:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Check if assignment already exists
    existing_assignment = db.query(TeacherAssignment).filter(
        and_(
            TeacherAssignment.teacher_id == teacher_id,
            TeacherAssignment.class_id == class_id,
            TeacherAssignment.subject_id == subject_id,
            TeacherAssignment.section == section
        )
    ).first()
    
    if existing_assignment:
        raise HTTPException(status_code=400, detail="This assignment already exists")
    
    # Create assignment using dict unpacking to avoid Pyright issues
    assignment_dict = {
        "teacher_id": teacher_id,
        "class_id": class_id,
        "subject_id": subject_id,
        "section": section
    }
    assignment = TeacherAssignment(**assignment_dict)
    
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    class_name = "Unknown"
    if class_obj is not None:
        class_name = f"{class_obj.grade_level} {class_obj.grade_number}"
        
    subject_name = "Unknown"
    if subject_obj is not None:
        subject_name = subject_obj.subject_name
    
    return {
        "id": assignment.id,
        "teacher_id": assignment.teacher_id,
        "class_id": assignment.class_id,
        "class_name": class_name,
        "subject_id": assignment.subject_id,
        "subject_name": subject_name,
        "section": assignment.section,
        "message": "Subject assigned successfully"
    }

@router.delete("/assignments/{assignment_id}")
async def remove_teacher_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Remove a teacher assignment"""
    assignment = db.query(TeacherAssignment).filter(TeacherAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment removed successfully"}

# Teacher Attendance
@router.get("/{teacher_id}/attendance", response_model=List[TeacherAttendanceResponse])
async def get_teacher_attendance(
    teacher_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get attendance records for a teacher"""
    # Verify teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    query = db.query(TeacherAttendance).filter(TeacherAttendance.teacher_id == teacher_id)
    
    if start_date:
        query = query.filter(TeacherAttendance.attendance_date >= start_date)
    
    if end_date:
        query = query.filter(TeacherAttendance.attendance_date <= end_date)
    
    attendance_records = query.order_by(TeacherAttendance.attendance_date.desc()).all()
    return attendance_records

@router.post("/{teacher_id}/attendance", response_model=TeacherAttendanceResponse)
async def record_teacher_attendance(
    teacher_id: int,
    attendance: TeacherAttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Record attendance for a teacher"""
    # Verify teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Check if attendance already recorded for this date
    existing_attendance = db.query(TeacherAttendance).filter(
        and_(
            TeacherAttendance.teacher_id == teacher_id,
            TeacherAttendance.attendance_date == attendance.date
        )
    ).first()
    
    if existing_attendance:
        raise HTTPException(status_code=400, detail="Attendance already recorded for this date")
    
    # Create attendance record
    attendance_data = attendance.dict()
    attendance_data["teacher_id"] = teacher_id
    attendance_data["attendance_date"] = attendance_data.pop("date")  # Rename date to attendance_date
    
    db_attendance = TeacherAttendance(**attendance_data)
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.put("/attendance/{attendance_id}", response_model=TeacherAttendanceResponse)
async def update_teacher_attendance(
    attendance_id: int,
    attendance_update: TeacherAttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Update a teacher attendance record"""
    attendance = db.query(TeacherAttendance).filter(TeacherAttendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    update_data = attendance_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attendance, field, value)
    
    attendance.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(attendance)
    return attendance

# Teacher Finance
@router.get("/{teacher_id}/finance", response_model=List[TeacherFinanceResponse])
async def get_teacher_finance_records(
    teacher_id: int,
    academic_year_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_finance_user)
):
    """Get finance records for a teacher"""
    # Verify teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    query = db.query(TeacherFinance).filter(TeacherFinance.teacher_id == teacher_id)
    
    if academic_year_id is not None:
        query = query.filter(TeacherFinance.academic_year_id == academic_year_id)
    
    finance_records = query.order_by(TeacherFinance.created_at.desc()).all()
    return finance_records

@router.post("/{teacher_id}/finance", response_model=TeacherFinanceResponse)
async def create_teacher_finance_record(
    teacher_id: int,
    finance_record: TeacherFinanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_finance_user)
):
    """Create a finance record for a teacher"""
    # Verify teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Check if record already exists for this month/year
    existing_record = db.query(TeacherFinance).filter(
        and_(
            TeacherFinance.teacher_id == teacher_id,
            TeacherFinance.academic_year_id == finance_record.academic_year_id,
            TeacherFinance.month == finance_record.month,
            TeacherFinance.year == finance_record.year
        )
    ).first()
    
    if existing_record:
        raise HTTPException(status_code=400, detail="Finance record already exists for this month/year")
    
    # Create finance record
    finance_data = finance_record.dict()
    finance_data["teacher_id"] = teacher_id
    
    # Calculate total amount if not provided
    if not finance_data.get("total_amount"):
        base_salary = Decimal(finance_data.get("base_salary", 0))
        bonuses = Decimal(finance_data.get("bonuses", 0))
        deductions = Decimal(finance_data.get("deductions", 0))
        finance_data["total_amount"] = base_salary + bonuses - deductions
    
    db_finance = TeacherFinance(**finance_data)
    db.add(db_finance)
    db.commit()
    db.refresh(db_finance)
    return db_finance

@router.put("/finance/{finance_id}", response_model=TeacherFinanceResponse)
async def update_teacher_finance_record(
    finance_id: int,
    finance_update: TeacherFinanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_finance_user)
):
    """Update a teacher finance record"""
    finance_record = db.query(TeacherFinance).filter(TeacherFinance.id == finance_id).first()
    if not finance_record:
        raise HTTPException(status_code=404, detail="Finance record not found")
    
    update_data = finance_update.dict(exclude_unset=True)
    
    # Recalculate total amount if base salary, bonuses, or deductions are updated
    if any(field in update_data for field in ["base_salary", "bonuses", "deductions"]):
        base_salary = Decimal(update_data.get("base_salary", finance_record.base_salary or 0))
        bonuses = Decimal(update_data.get("bonuses", finance_record.bonuses or 0))
        deductions = Decimal(update_data.get("deductions", finance_record.deductions or 0))
        update_data["total_amount"] = base_salary + bonuses - deductions
    
    for field, value in update_data.items():
        setattr(finance_record, field, value)
    
    finance_record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(finance_record)
    return finance_record

@router.get("/{teacher_id}/schedule")
async def get_teacher_schedule(
    teacher_id: int,
    academic_year_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get schedule for a teacher"""
    # Verify teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Get teacher assignments
    assignment_query = db.query(TeacherAssignment).filter(TeacherAssignment.teacher_id == teacher_id)
    if academic_year_id is not None:
        assignment_query = assignment_query.join(Teacher).filter(Teacher.academic_year_id == academic_year_id)
    
    assignments = assignment_query.all()
    
    # Get schedule information for each assignment
    schedule_info = []
    for assignment in assignments:
        class_info = db.query(Class).filter(Class.id == assignment.class_id).first()
        subject_info = db.query(Subject).filter(Subject.id == assignment.subject_id).first()
        
        # Get schedule entries for this assignment
        from ..models.schedules import Schedule
        schedule_entries = db.query(Schedule).filter(
            and_(
                Schedule.teacher_id == teacher_id,
                Schedule.class_id == assignment.class_id,
                Schedule.subject_id == assignment.subject_id
            )
        ).all()
        
        class_name = "Unknown"
        if class_info is not None:
            class_name = f"{class_info.grade_level} {class_info.grade_number}"
            
        subject_name = "Unknown"
        if subject_info is not None:
            subject_name = subject_info.subject_name
        
        schedule_info.append({
            "assignment_id": assignment.id,
            "class": class_name,
            "subject": subject_name,
            "section": assignment.section,
            "schedule_entries": [
                {
                    "day_of_week": entry.day_of_week if entry.day_of_week is not None else 0,
                    "period_number": entry.period_number if entry.period_number is not None else 0,
                    "session_type": entry.session_type if entry.session_type is not None else ""
                }
                for entry in schedule_entries
            ]
        })
    
    return {
        "teacher_id": teacher_id,
        "teacher_name": teacher.full_name if teacher is not None else "Unknown",
        "assignments": schedule_info
    }

# Search Teachers
@router.get("/search/", response_model=List[TeacherResponse])
async def search_teachers(
    q: str = Query(..., min_length=1),
    academic_year_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Search teachers by name, phone, or nationality"""
    query = db.query(Teacher).filter(Teacher.is_active == True)
    
    if academic_year_id is not None:
        query = query.filter(Teacher.academic_year_id == academic_year_id)
    
    # Search in multiple fields
    search_filter = (
        Teacher.full_name.ilike(f"%{q}%") |
        Teacher.phone.ilike(f"%{q}%") |
        Teacher.nationality.ilike(f"%{q}%") |
        Teacher.qualifications.ilike(f"%{q}%")
    )
    
    query = query.filter(search_filter)
    teachers = query.offset(skip).limit(limit).all()
    return teachers

