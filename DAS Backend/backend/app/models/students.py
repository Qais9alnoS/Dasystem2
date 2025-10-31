from sqlalchemy import Column, Integer, String, Text, Boolean, Date, ForeignKey, JSON, Numeric
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Student(BaseModel):
    __tablename__ = "students"
    
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    
    # Personal Information
    full_name = Column(String(200), nullable=False)
    has_special_needs = Column(Boolean, default=False)
    special_needs_details = Column(Text)
    father_name = Column(String(100), nullable=False)
    grandfather_name = Column(String(100), nullable=False)
    mother_name = Column(String(100), nullable=False)
    birth_date = Column(Date, nullable=False)
    birth_place = Column(String(100))
    nationality = Column(String(50))
    father_occupation = Column(String(100))
    mother_occupation = Column(String(100))
    religion = Column(String(50))
    gender = Column(String(10), nullable=False)  # male, female
    
    # Transportation
    transportation_type = Column(String(30), nullable=False)  # walking, full_bus, half_bus_to_school, half_bus_from_school
    bus_number = Column(String(20))
    
    # Contact Information
    landline_phone = Column(String(20))
    father_phone = Column(String(20))
    mother_phone = Column(String(20))
    additional_phone = Column(String(20))
    detailed_address = Column(Text)
    
    # Academic Information
    previous_school = Column(String(200))
    grade_level = Column(String(15), nullable=False)  # primary, intermediate, secondary
    grade_number = Column(Integer, nullable=False)
    section = Column(String(10))
    session_type = Column(String(10), nullable=False)  # morning, evening
    ninth_grade_total = Column(Numeric(5,2))  # Only for secondary students
    
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    academic_year = relationship("AcademicYear")
    class_rel = relationship("Class", foreign_keys=[class_id], back_populates="students")
    finances = relationship("StudentFinance", back_populates="student")
    payments = relationship("StudentPayment", back_populates="student")
    academics = relationship("StudentAcademic", back_populates="student")

class StudentFinance(BaseModel):
    __tablename__ = "student_finances"
    
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    
    # Fees Structure
    school_fee = Column(Numeric(10,2), default=0)
    school_fee_discount = Column(Numeric(10,2), default=0)
    bus_fee = Column(Numeric(10,2), default=0)
    bus_fee_discount = Column(Numeric(10,2), default=0)
    other_revenues = Column(Numeric(10,2), default=0)  # courses, uniforms, etc.
    
    payment_notes = Column(Text)
    
    # Relationships
    student = relationship("Student", back_populates="finances")
    academic_year = relationship("AcademicYear")
    
    @property
    def total_amount(self):
        return (self.school_fee - self.school_fee_discount + 
                self.bus_fee - self.bus_fee_discount + 
                self.other_revenues)

class StudentPayment(BaseModel):
    __tablename__ = "student_payments"
    
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    payment_amount = Column(Numeric(10,2), nullable=False)
    payment_date = Column(Date, nullable=False)
    receipt_number = Column(String(50))
    payment_method = Column(String(50))
    payment_status = Column(String(20), default="pending")  # pending, completed, overdue
    notes = Column(Text)
    
    # Relationships
    student = relationship("Student", back_populates="payments")
    academic_year = relationship("AcademicYear")

class StudentAcademic(BaseModel):
    __tablename__ = "student_academics"
    
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    
    # Grades
    board_grades = Column(Numeric(5,2))
    recitation_grades = Column(Numeric(5,2))
    first_exam_grades = Column(Numeric(5,2))
    midterm_grades = Column(Numeric(5,2))
    second_exam_grades = Column(Numeric(5,2))
    final_exam_grades = Column(Numeric(5,2))
    behavior_grade = Column(Numeric(5,2))
    activity_grade = Column(Numeric(5,2))
    
    # Attendance
    absence_days = Column(Integer, default=0)
    absence_dates = Column(Text)  # JSON array of dates
    
    # Relationships
    student = relationship("Student", back_populates="academics")
    academic_year = relationship("AcademicYear")
    subject = relationship("Subject")