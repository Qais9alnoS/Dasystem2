from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import date, datetime, timedelta
from app.database import get_db
from app.models import (
    Holiday, StudentDailyAttendance, TeacherPeriodAttendance,
    StudentAction, WhatsAppGroupConfig, Student, Teacher, 
    Class, Schedule, AcademicYear, Subject, User
)
from app.schemas.daily import (
    HolidayCreate, HolidayUpdate, HolidayResponse,
    StudentDailyAttendanceCreate, StudentDailyAttendanceUpdate, 
    StudentDailyAttendanceResponse, StudentDailyAttendanceBulk,
    TeacherPeriodAttendanceCreate, TeacherPeriodAttendanceUpdate,
    TeacherPeriodAttendanceResponse, TeacherPeriodAttendanceBulk,
    StudentActionCreate, StudentActionUpdate, StudentActionResponse,
    WhatsAppGroupConfigCreate, WhatsAppGroupConfigUpdate, WhatsAppGroupConfigResponse,
    DailyPageSummary, WhatsAppMessage, TeacherScheduleInfo
)
from app.core.dependencies import get_current_user

router = APIRouter()

# ==================== Holiday Management ====================

@router.post("/holidays", response_model=HolidayResponse)
def create_holiday(
    holiday: HolidayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """إنشاء يوم عطلة جديد"""
    # تحقق من أن اليوم غير موجود مسبقاً لنفس الفترة
    existing = db.query(Holiday).filter(
        and_(
            Holiday.holiday_date == holiday.holiday_date,
            Holiday.session_type == holiday.session_type,
            Holiday.academic_year_id == holiday.academic_year_id
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Holiday already exists for this date and session"
        )
    
    db_holiday = Holiday(**holiday.dict())
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@router.get("/holidays", response_model=List[HolidayResponse])
def get_holidays(
    academic_year_id: int,
    session_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على قائمة أيام العطل"""
    query = db.query(Holiday).filter(
        Holiday.academic_year_id == academic_year_id
    )
    
    if session_type:
        query = query.filter(Holiday.session_type == session_type)
    
    if start_date:
        query = query.filter(Holiday.holiday_date >= start_date)
    if end_date:
        query = query.filter(Holiday.holiday_date <= end_date)
    
    return query.order_by(Holiday.holiday_date).all()

@router.get("/holidays/{holiday_id}", response_model=HolidayResponse)
def get_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على تفاصيل يوم عطلة معين"""
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return holiday

@router.put("/holidays/{holiday_id}", response_model=HolidayResponse)
def update_holiday(
    holiday_id: int,
    holiday_update: HolidayUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """تحديث يوم عطلة"""
    db_holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    
    for key, value in holiday_update.dict(exclude_unset=True).items():
        setattr(db_holiday, key, value)
    
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@router.delete("/holidays/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """حذف يوم عطلة"""
    db_holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    
    db.delete(db_holiday)
    db.commit()
    return {"message": "Holiday deleted successfully"}

@router.get("/holidays/check/{check_date}")
def check_holiday(
    check_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """التحقق من أن يوم معين هو عطلة"""
    # تحقق من أيام الجمعة والسبت
    weekday = check_date.weekday()
    if weekday in [4, 5]:  # Friday = 4, Saturday = 5
        return {
            "is_holiday": True,
            "is_weekend": True,
            "is_for_students": True,
            "is_for_teachers": True,
            "holiday_name": "عطلة نهاية الأسبوع"
        }
    
    # تحقق من العطل المسجلة
    holiday = db.query(Holiday).filter(Holiday.holiday_date == check_date).first()
    if holiday:
        return {
            "is_holiday": True,
            "is_weekend": False,
            "is_for_students": holiday.is_for_students,
            "is_for_teachers": holiday.is_for_teachers,
            "holiday_name": holiday.holiday_name
        }
    
    return {
        "is_holiday": False,
        "is_weekend": False
    }

# ==================== Student Daily Attendance ====================

@router.post("/attendance/students/bulk", response_model=List[StudentDailyAttendanceResponse])
def create_student_attendance_bulk(
    attendance_bulk: StudentDailyAttendanceBulk,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """إدخال جماعي لحضور الطلاب - يتم تحديد الغائبين فقط"""
    # احصل على جميع طلاب الصف والشعبة
    students = db.query(Student).filter(
        and_(
            Student.class_id == attendance_bulk.class_id,
            Student.section == attendance_bulk.section,
            Student.is_active == True
        )
    ).all()
    
    if not students:
        raise HTTPException(status_code=404, detail="No students found")
    
    # احذف السجلات السابقة لنفس اليوم
    db.query(StudentDailyAttendance).filter(
        and_(
            StudentDailyAttendance.attendance_date == attendance_bulk.attendance_date,
            StudentDailyAttendance.student_id.in_([s.id for s in students])
        )
    ).delete(synchronize_session=False)
    
    # أنشئ سجلات جديدة
    attendance_records = []
    for student in students:
        is_present = student.id not in attendance_bulk.absent_student_ids
        
        attendance = StudentDailyAttendance(
            student_id=student.id,
            academic_year_id=attendance_bulk.academic_year_id,
            attendance_date=attendance_bulk.attendance_date,
            is_present=is_present,
            notes=attendance_bulk.notes,
            recorded_by=current_user.id
        )
        db.add(attendance)
        attendance_records.append(attendance)
    
    db.commit()
    for record in attendance_records:
        db.refresh(record)
    
    return attendance_records

@router.get("/attendance/students", response_model=List[StudentDailyAttendanceResponse])
def get_student_attendance(
    class_id: int,
    section: str,
    attendance_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على حضور طلاب صف معين في يوم محدد"""
    students = db.query(Student).filter(
        and_(
            Student.class_id == class_id,
            Student.section == section,
            Student.is_active == True
        )
    ).all()
    
    student_ids = [s.id for s in students]
    
    attendance_records = db.query(StudentDailyAttendance).filter(
        and_(
            StudentDailyAttendance.student_id.in_(student_ids),
            StudentDailyAttendance.attendance_date == attendance_date
        )
    ).all()
    
    return attendance_records

# ==================== Teacher Period Attendance ====================

@router.get("/attendance/teachers/schedule/{teacher_id}/{attendance_date}")
def get_teacher_schedule_for_day(
    teacher_id: int,
    attendance_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على جدول الأستاذ ليوم محدد"""
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # احسب يوم الأسبوع
    day_of_week = attendance_date.weekday()
    
    # احصل على الحصص المجدولة
    schedules = db.query(Schedule).filter(
        and_(
            Schedule.teacher_id == teacher_id,
            Schedule.day_of_week == day_of_week
        )
    ).all()
    
    periods = []
    for schedule in schedules:
        # تحقق من الحضور
        attendance = db.query(TeacherPeriodAttendance).filter(
            and_(
                TeacherPeriodAttendance.schedule_id == schedule.id,
                TeacherPeriodAttendance.attendance_date == attendance_date
            )
        ).first()
        
        periods.append({
            "schedule_id": schedule.id,
            "period_number": schedule.period_number,
            "class_id": schedule.class_id,
            "subject_id": schedule.subject_id,
            "section": schedule.section,
            "is_present": attendance.is_present if attendance else True,
            "attendance_id": attendance.id if attendance else None
        })
    
    return {
        "teacher_id": teacher.id,
        "teacher_name": teacher.full_name,
        "attendance_date": attendance_date,
        "day_of_week": day_of_week,
        "periods": periods
    }

@router.post("/attendance/teachers/bulk", response_model=List[TeacherPeriodAttendanceResponse])
def create_teacher_attendance_bulk(
    attendance_bulk: TeacherPeriodAttendanceBulk,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """إدخال جماعي لحضور الأستاذ - يتم تحديد الحصص الغائبة فقط"""
    teacher = db.query(Teacher).filter(Teacher.id == attendance_bulk.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    day_of_week = attendance_bulk.attendance_date.weekday()
    
    # احصل على جميع حصص الأستاذ لهذا اليوم
    schedules = db.query(Schedule).filter(
        and_(
            Schedule.teacher_id == attendance_bulk.teacher_id,
            Schedule.day_of_week == day_of_week
        )
    ).all()
    
    # احذف السجلات السابقة
    db.query(TeacherPeriodAttendance).filter(
        and_(
            TeacherPeriodAttendance.teacher_id == attendance_bulk.teacher_id,
            TeacherPeriodAttendance.attendance_date == attendance_bulk.attendance_date
        )
    ).delete(synchronize_session=False)
    
    # أنشئ سجلات جديدة
    attendance_records = []
    for schedule in schedules:
        is_present = schedule.id not in attendance_bulk.absent_period_ids
        
        attendance = TeacherPeriodAttendance(
            teacher_id=teacher.id,
            academic_year_id=attendance_bulk.academic_year_id,
            attendance_date=attendance_bulk.attendance_date,
            schedule_id=schedule.id,
            class_id=schedule.class_id,
            subject_id=schedule.subject_id,
            section=schedule.section,
            period_number=schedule.period_number,
            day_of_week=day_of_week,
            is_present=is_present,
            notes=attendance_bulk.notes,
            recorded_by=current_user.id
        )
        db.add(attendance)
        attendance_records.append(attendance)
    
    db.commit()
    for record in attendance_records:
        db.refresh(record)
    
    return attendance_records

# ==================== Student Actions ====================

@router.post("/actions/students", response_model=StudentActionResponse)
def create_student_action(
    action: StudentActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """إضافة إجراء لطالب"""
    # تحقق من أن الطالب موجود
    student = db.query(Student).filter(Student.id == action.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # تحقق من أن المادة موجودة إذا كانت مطلوبة
    if action.subject_id:
        subject = db.query(Subject).filter(Subject.id == action.subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
    
    db_action = StudentAction(
        **action.dict(),
        recorded_by=current_user.id
    )
    db.add(db_action)
    db.commit()
    db.refresh(db_action)
    
    return db_action

@router.get("/actions/students", response_model=List[StudentActionResponse])
def get_student_actions(
    student_id: Optional[int] = None,
    class_id: Optional[int] = None,
    section: Optional[str] = None,
    action_date: Optional[date] = None,
    action_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على قائمة إجراءات الطلاب"""
    query = db.query(StudentAction)
    
    if student_id:
        query = query.filter(StudentAction.student_id == student_id)
    
    if class_id and section:
        students = db.query(Student).filter(
            and_(
                Student.class_id == class_id,
                Student.section == section
            )
        ).all()
        student_ids = [s.id for s in students]
        query = query.filter(StudentAction.student_id.in_(student_ids))
    
    if action_date:
        query = query.filter(StudentAction.action_date == action_date)
    
    if action_type:
        query = query.filter(StudentAction.action_type == action_type)
    
    return query.order_by(StudentAction.action_date.desc()).all()

# ==================== WhatsApp Group Configuration ====================

@router.post("/whatsapp/config", response_model=WhatsAppGroupConfigResponse)
def create_whatsapp_config(
    config: WhatsAppGroupConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """إنشاء أو تحديث إعدادات مجموعة الواتساب"""
    # تحقق من وجود إعداد سابق
    existing = db.query(WhatsAppGroupConfig).filter(
        and_(
            WhatsAppGroupConfig.class_id == config.class_id,
            WhatsAppGroupConfig.section == config.section,
            WhatsAppGroupConfig.academic_year_id == config.academic_year_id
        )
    ).first()
    
    if existing:
        # تحديث
        for key, value in config.dict(exclude_unset=True).items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # إنشاء جديد
        db_config = WhatsAppGroupConfig(**config.dict())
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config

@router.get("/whatsapp/config/{class_id}/{section}", response_model=WhatsAppGroupConfigResponse)
def get_whatsapp_config(
    class_id: int,
    section: str,
    academic_year_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على إعدادات مجموعة الواتساب"""
    config = db.query(WhatsAppGroupConfig).filter(
        and_(
            WhatsAppGroupConfig.class_id == class_id,
            WhatsAppGroupConfig.section == section,
            WhatsAppGroupConfig.academic_year_id == academic_year_id
        )
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="WhatsApp config not found")
    
    return config

# ==================== Daily Page Summary ====================

@router.get("/summary/{attendance_date}", response_model=DailyPageSummary)
def get_daily_summary(
    attendance_date: date,
    session_type: str,
    academic_year_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """الحصول على ملخص الصفحة اليومية"""
    # إحصائيات الطلاب
    students = db.query(Student).filter(
        and_(
            Student.academic_year_id == academic_year_id,
            Student.session_type == session_type,
            Student.is_active == True
        )
    ).all()
    
    total_students = len(students)
    student_ids = [s.id for s in students]
    
    attendances = db.query(StudentDailyAttendance).filter(
        and_(
            StudentDailyAttendance.student_id.in_(student_ids),
            StudentDailyAttendance.attendance_date == attendance_date
        )
    ).all()
    
    present_students = sum(1 for a in attendances if a.is_present)
    absent_students = sum(1 for a in attendances if not a.is_present)
    
    # إحصائيات المعلمين
    teachers = db.query(Teacher).filter(
        and_(
            Teacher.academic_year_id == academic_year_id,
            Teacher.session_type == session_type,
            Teacher.is_active == True
        )
    ).all()
    
    total_teachers = len(teachers)
    
    day_of_week = attendance_date.weekday()
    teacher_ids = [t.id for t in teachers]
    
    period_attendances = db.query(TeacherPeriodAttendance).filter(
        and_(
            TeacherPeriodAttendance.teacher_id.in_(teacher_ids),
            TeacherPeriodAttendance.attendance_date == attendance_date
        )
    ).all()
    
    total_periods = len(period_attendances)
    attended_periods = sum(1 for p in period_attendances if p.is_present)
    absent_periods = sum(1 for p in period_attendances if not p.is_present)
    
    # إحصائيات الإجراءات
    actions = db.query(StudentAction).filter(
        and_(
            StudentAction.student_id.in_(student_ids),
            StudentAction.action_date == attendance_date
        )
    ).all()
    
    total_actions = len(actions)
    warnings = sum(1 for a in actions if a.action_type == 'warning')
    parent_calls = sum(1 for a in actions if a.action_type == 'parent_call')
    academic_actions = sum(1 for a in actions if a.action_type in ['recitation', 'activity', 'quiz'])
    
    return DailyPageSummary(
        date=attendance_date,
        session_type=session_type,
        total_students=total_students,
        present_students=present_students,
        absent_students=absent_students,
        total_teachers=total_teachers,
        total_periods=total_periods,
        attended_periods=attended_periods,
        absent_periods=absent_periods,
        total_actions=total_actions,
        warnings=warnings,
        parent_calls=parent_calls,
        academic_actions=academic_actions
    )

@router.get("/whatsapp/message/{class_id}/{section}/{attendance_date}")
def generate_whatsapp_message(
    class_id: int,
    section: str,
    attendance_date: date,
    academic_year_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """توليد رسالة الواتساب للأهل"""
    # احصل على الطلاب
    students = db.query(Student).filter(
        and_(
            Student.class_id == class_id,
            Student.section == section,
            Student.is_active == True
        )
    ).all()
    
    student_ids = [s.id for s in students]
    
    # احصل على الغيابات
    absences = db.query(StudentDailyAttendance).filter(
        and_(
            StudentDailyAttendance.student_id.in_(student_ids),
            StudentDailyAttendance.attendance_date == attendance_date,
            StudentDailyAttendance.is_present == False
        )
    ).all()
    
    # احصل على الإجراءات
    actions = db.query(StudentAction).filter(
        and_(
            StudentAction.student_id.in_(student_ids),
            StudentAction.action_date == attendance_date
        )
    ).all()
    
    # احصل على رابط المجموعة
    config = db.query(WhatsAppGroupConfig).filter(
        and_(
            WhatsAppGroupConfig.class_id == class_id,
            WhatsAppGroupConfig.section == section,
            WhatsAppGroupConfig.academic_year_id == academic_year_id
        )
    ).first()
    
    # إنشاء الرسالة
    message = f"📅 تقرير يومي - {attendance_date.strftime('%Y-%m-%d')}\n"
    message += f"الصف: {class_id} - الشعبة: {section}\n\n"
    
    if absences:
        message += "⚠️ *الغيابات:*\n"
        for absence in absences:
            student = db.query(Student).filter(Student.id == absence.student_id).first()
            message += f"- {student.full_name}\n"
        message += "\n"
    
    if actions:
        message += "📋 *الإجراءات والملاحظات:*\n"
        for action in actions:
            student = db.query(Student).filter(Student.id == action.student_id).first()
            action_names = {
                'warning': '⚠️ إنذار',
                'parent_call': '📞 استدعاء ولي أمر',
                'suspension': '🚫 فصل',
                'misbehavior': '😠 مشاغبة',
                'distinguished_participation': '⭐ مشاركة مميزة',
                'thank_you_card': '🎉 بطاقة شكر',
                'recitation': '📖 تسميع',
                'activity': '✏️ نشاط',
                'quiz': '📝 سبر',
                'note': '📝 ملاحظة'
            }
            action_name = action_names.get(action.action_type, action.action_type)
            message += f"- {student.full_name}: {action_name}"
            if action.grade:
                message += f" ({action.grade}/{action.max_grade})"
            message += f"\n  {action.description}\n"
        message += "\n"
    
    message += "شكراً لمتابعتكم 🌟"
    
    return WhatsAppMessage(
        class_id=class_id,
        section=section,
        date=attendance_date,
        message_content=message,
        group_link=config.group_link if config else None
    )
