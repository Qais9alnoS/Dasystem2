from sqlalchemy import Column, Integer, String, Text, Date, Boolean, ForeignKey, JSON, Numeric
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Holiday(BaseModel):
    """نموذج أيام العطلة"""
    __tablename__ = "holidays"
    
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    session_type = Column(String(10), nullable=False, default="morning")  # morning, evening - للفصل بين الفترتين
    holiday_date = Column(Date, nullable=False)
    holiday_name = Column(String(200))  # اسم العطلة (اختياري)
    is_for_students = Column(Boolean, default=True)  # عطلة للطلاب
    is_for_teachers = Column(Boolean, default=False)  # عطلة للأساتذة
    notes = Column(Text)
    
    # Relationships
    academic_year = relationship("AcademicYear")

class StudentDailyAttendance(BaseModel):
    """نموذج حضور الطلاب اليومي"""
    __tablename__ = "student_daily_attendances"
    
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    attendance_date = Column(Date, nullable=False)
    is_present = Column(Boolean, default=True)  # افتراضياً حاضر
    notes = Column(Text)
    recorded_by = Column(Integer, ForeignKey("users.id"))  # المسؤول الذي سجل الحضور
    
    # Relationships
    student = relationship("Student")
    academic_year = relationship("AcademicYear")
    recorded_by_user = relationship("User", foreign_keys=[recorded_by])

class TeacherPeriodAttendance(BaseModel):
    """نموذج حضور الأساتذة للحصص"""
    __tablename__ = "teacher_period_attendances"
    
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    attendance_date = Column(Date, nullable=False)
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="SET NULL"), nullable=True)  # الحصة المحددة
    
    # معلومات الحصة
    class_id = Column(Integer, ForeignKey("classes.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    section = Column(String(10))
    period_number = Column(Integer)  # رقم الحصة في اليوم
    day_of_week = Column(Integer)  # 0=الإثنين، 1=الثلاثاء، الخ
    
    is_present = Column(Boolean, default=True)  # افتراضياً حاضر
    notes = Column(Text)
    recorded_by = Column(Integer, ForeignKey("users.id"))  # المسؤول الذي سجل الحضور
    
    # Relationships
    teacher = relationship("Teacher")
    academic_year = relationship("AcademicYear")
    schedule = relationship("Schedule")
    class_rel = relationship("Class")
    subject = relationship("Subject")
    recorded_by_user = relationship("User", foreign_keys=[recorded_by])

class StudentAction(BaseModel):
    """نموذج الإجراءات السريعة على الطلاب"""
    __tablename__ = "student_actions"
    
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    action_date = Column(Date, nullable=False)
    
    # نوع الإجراء
    action_type = Column(String(50), nullable=False)
    # A) بدون مادة: warning (إنذار), parent_call (استدعاء ولي أمر), suspension (فصل)
    # B) مع مادة: misbehavior (مشاغبة), distinguished_participation (مشاركة مميزة), thank_you_card (بطاقة شكر), note (ملاحظة)
    # C) أكاديمي مع مادة: recitation (تسميع), activity (نشاط), quiz (سبر)
    
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)  # للإجراءات التي تتطلب مادة
    
    # التفاصيل
    description = Column(Text, nullable=False)  # السبب أو التفصيل
    
    # للإجراءات الأكاديمية
    grade = Column(Numeric(5,2))  # العلامة (للتسميع، النشاط، السبر)
    max_grade = Column(Numeric(5,2))  # العلامة الكاملة
    
    notes = Column(Text)
    recorded_by = Column(Integer, ForeignKey("users.id"))  # المسؤول الذي سجل الإجراء
    
    # Relationships
    student = relationship("Student")
    academic_year = relationship("AcademicYear")
    subject = relationship("Subject")
    recorded_by_user = relationship("User", foreign_keys=[recorded_by])

class WhatsAppGroupConfig(BaseModel):
    """نموذج حفظ رابط مجموعة الواتساب لكل صف"""
    __tablename__ = "whatsapp_group_configs"
    
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    section = Column(String(10), nullable=False)
    
    group_link = Column(String(500))  # رابط المجموعة
    group_name = Column(String(200))  # اسم المجموعة (اختياري)
    notes = Column(Text)
    
    # Relationships
    academic_year = relationship("AcademicYear")
    class_rel = relationship("Class")
