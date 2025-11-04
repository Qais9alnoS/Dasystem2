"""
Script to populate the database with realistic test data
Includes: Students, Teachers, Activities, and Finance Cards
"""

import sys
import os
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from datetime import datetime, date, timedelta
from decimal import Decimal
import random
import json
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.base import Base
from app.models.academic import AcademicYear, Class, Subject
from app.models.students import Student, StudentFinance, StudentPayment
from app.models.teachers import Teacher, TeacherAssignment, TeacherFinance
from app.models.activities import Activity, ActivityParticipant, ActivityRegistration
from app.models.finance import FinanceCard, FinanceCardTransaction, FinanceCategory

# ============================================
# Data Arrays - Realistic Iraqi Names & Data
# ============================================

# Iraqi Male First Names
MALE_FIRST_NAMES = [
    "أحمد", "محمد", "علي", "حسين", "حسن", "عمر", "عباس", "مصطفى", 
    "يوسف", "إبراهيم", "خالد", "عادل", "سامي", "كريم", "فارس", 
    "رائد", "طارق", "وليد", "ماجد", "نبيل", "سعد", "فهد", "زيد",
    "عمار", "باسم", "جاسم", "صادق", "ناصر", "هيثم", "مهدي"
]

# Iraqi Female First Names
FEMALE_FIRST_NAMES = [
    "فاطمة", "زينب", "مريم", "سارة", "نور", "هدى", "رقية", "آية",
    "دعاء", "أمل", "نورا", "ريم", "هند", "لينا", "سلمى", "ياسمين",
    "زهراء", "حوراء", "بتول", "رباب", "شيماء", "إيمان", "سجى", "دانة",
    "ملاك", "جنى", "ليلى", "روان", "هالة", "سلوى"
]

# Iraqi Family Names (Father/Grandfather names)
FAMILY_NAMES = [
    "عبد الله", "محمود", "سعيد", "جابر", "عبد الكريم", "عبد الرحمن",
    "صالح", "حامد", "عبد العزيز", "منصور", "عبد الحميد", "رشيد",
    "طاهر", "محسن", "جميل", "عبد الرزاق", "فاضل", "كاظم",
    "جعفر", "موسى", "عدنان", "عبد الوهاب", "حسام", "قاسم"
]

# Iraqi Female Mother Names
MOTHER_NAMES = [
    "أم علي", "أم أحمد", "فاطمة", "زينب", "سعاد", "نجاة", "سلمى",
    "كريمة", "نجية", "صبيحة", "بدرية", "نعيمة", "لطيفة", "سميرة",
    "عائشة", "خديجة", "آمنة", "حليمة", "رقية", "زهرة"
]

# Iraqi Cities/Places
IRAQI_CITIES = [
    "بغداد", "البصرة", "الموصل", "أربيل", "النجف", "كربلاء",
    "السليمانية", "الأنبار", "ديالى", "صلاح الدين", "ميسان",
    "ذي قار", "القادسية", "بابل", "واسط", "دهوك", "كركوك"
]

# Iraqi Neighborhoods
NEIGHBORHOODS = [
    "الكرادة", "الجادرية", "المنصور", "الكاظمية", "الأعظمية",
    "الدورة", "اليرموك", "العامرية", "الشعلة", "الحرية",
    "الزعفرانية", "الكرخ", "الرصافة", "المشتل", "البياع"
]

# Occupations
OCCUPATIONS = [
    "موظف", "معلم", "طبيب", "مهندس", "محامي", "تاجر", "عامل بناء",
    "سائق", "كهربائي", "نجار", "حداد", "خياط", "مزارع",
    "صيدلي", "ممرض", "محاسب", "مبرمج", "ميكانيكي", "طباخ"
]

# Previous Schools
PREVIOUS_SCHOOLS = [
    "مدرسة النور الابتدائية", "مدرسة الأمل الأهلية", "مدرسة الفرات",
    "مدرسة دجلة", "مدرسة البصائر", "مدرسة المعرفة", "مدرسة الحكمة",
    "مدرسة السلام", "مدرسة التقدم", "مدرسة الرشيد", "مدرسة الفردوس",
    "مدرسة الزهور", "مدرسة النهضة", "لا يوجد"
]

# Subjects by grade level
SUBJECTS_PRIMARY = [
    ("اللغة العربية", 6), ("الرياضيات", 5), ("العلوم", 4),
    ("التربية الإسلامية", 3), ("التربية الفنية", 2), ("التربية الرياضية", 2)
]

SUBJECTS_INTERMEDIATE = [
    ("اللغة العربية", 5), ("اللغة الإنجليزية", 4), ("الرياضيات", 5),
    ("العلوم", 4), ("التاريخ", 2), ("الجغرافية", 2),
    ("التربية الإسلامية", 2), ("الحاسوب", 2)
]

SUBJECTS_SECONDARY = [
    ("اللغة العربية", 4), ("اللغة الإنجليزية", 4), ("الرياضيات", 5),
    ("الفيزياء", 4), ("الكيمياء", 4), ("الأحياء", 3),
    ("التاريخ", 2), ("الجغرافية", 2), ("الحاسوب", 2)
]

# Teacher Qualifications
TEACHER_QUALIFICATIONS = [
    "بكالوريوس تربية - اللغة العربية",
    "بكالوريوس علوم - الرياضيات",
    "بكالوريوس علوم - الفيزياء",
    "بكالوريوس علوم - الكيمياء",
    "بكالوريوس آداب - اللغة الإنجليزية",
    "بكالوريوس تربية رياضية",
    "دبلوم عالي - تربية فنية",
    "بكالوريوس دراسات إسلامية",
    "بكالوريوس علوم حاسوب",
    "بكالوريوس تاريخ"
]

# Activity Types
ACTIVITY_TYPES = [
    ("academic", "ورشة تقوية الرياضيات", "ورشة لتقوية مهارات الطلاب في الرياضيات"),
    ("sports", "دوري كرة القدم المدرسي", "منافسات رياضية بين الصفوف"),
    ("cultural", "معرض الكتاب المدرسي", "معرض لعرض الكتب والمطبوعات التعليمية"),
    ("social", "رحلة ترفيهية", "رحلة ترفيهية للطلاب إلى حديقة الزوراء"),
    ("trip", "زيارة المتحف الوطني", "زيارة تعليمية للمتحف الوطني العراقي")
]

# Finance Card Categories
FINANCE_CARD_CATEGORIES = [
    ("income", "activity", "رسوم نشاط كرة القدم"),
    ("expense", "custom", "مصاريف صيانة المدرسة"),
    ("income", "student", "رسوم دورات تقوية"),
    ("both", "custom", "مشروع تطوير المختبرات"),
    ("expense", "custom", "مصاريف القرطاسية والكتب")
]

# ============================================
# Helper Functions
# ============================================

def generate_phone():
    """Generate Iraqi phone number"""
    prefixes = ["0750", "0770", "0780", "0790", "0751", "0771", "0781"]
    return f"{random.choice(prefixes)}{random.randint(1000000, 9999999)}"

def generate_landline():
    """Generate Iraqi landline"""
    area_codes = ["021", "030", "040", "050", "060"]  # Baghdad, Basra, etc.
    return f"{random.choice(area_codes)}{random.randint(1000000, 9999999)}"

def generate_address(city=None):
    """Generate Iraqi address"""
    if not city:
        city = random.choice(IRAQI_CITIES)
    neighborhood = random.choice(NEIGHBORHOODS)
    street = random.randint(1, 100)
    house = random.randint(1, 500)
    return f"{city} - {neighborhood} - شارع {street} - دار {house}"

def generate_birth_date(min_age, max_age):
    """Generate birth date based on age range"""
    today = date.today()
    years_ago = random.randint(min_age, max_age)
    days_variation = random.randint(0, 364)
    birth_date = today - timedelta(days=years_ago*365 + days_variation)
    return birth_date

def generate_free_time_slots():
    """Generate free time slots for teachers (5 days x 6 periods)"""
    # Most teachers have 2-4 free periods randomly distributed
    total_slots = 30  # 5 days * 6 periods
    free_count = random.randint(2, 4)
    free_slots = random.sample(range(total_slots), free_count)
    
    slots = []
    for day in range(5):  # Sunday to Thursday
        for period in range(6):
            slot_index = day * 6 + period
            is_free = slot_index in free_slots
            slots.append({
                "day": day,
                "period": period,
                "is_free": is_free
            })
    
    return json.dumps(slots)

def generate_student_data(class_obj, section, index, academic_year_id):
    """Generate complete student data"""
    gender = random.choice(["male", "female"])
    first_name = random.choice(MALE_FIRST_NAMES if gender == "male" else FEMALE_FIRST_NAMES)
    father_name = random.choice(FAMILY_NAMES)
    grandfather_name = random.choice(FAMILY_NAMES)
    full_name = f"{first_name} {father_name} {grandfather_name}"
    
    # Age based on grade
    if class_obj.grade_level == "primary":
        age_min, age_max = 6, 12
    elif class_obj.grade_level == "intermediate":
        age_min, age_max = 12, 15
    else:  # secondary
        age_min, age_max = 15, 18
    
    transportation = random.choice(["walking", "full_bus", "half_bus_to_school", "half_bus_from_school"])
    bus_number = str(random.randint(1, 20)) if "bus" in transportation else None
    
    has_special_needs = random.random() < 0.05  # 5% chance
    
    student_data = {
        "academic_year_id": academic_year_id,
        "class_id": class_obj.id,
        "full_name": full_name,
        "has_special_needs": has_special_needs,
        "special_needs_details": "احتياجات خاصة - متابعة" if has_special_needs else None,
        "father_name": father_name,
        "grandfather_name": grandfather_name,
        "mother_name": random.choice(MOTHER_NAMES),
        "birth_date": generate_birth_date(age_min, age_max),
        "birth_place": random.choice(IRAQI_CITIES),
        "nationality": "عراقي",
        "father_occupation": random.choice(OCCUPATIONS),
        "mother_occupation": random.choice(["ربة منزل"] + OCCUPATIONS[:10]),
        "religion": random.choice(["مسلم", "مسلم", "مسلم", "مسيحي"]),  # 75% Muslim
        "gender": gender,
        "transportation_type": transportation,
        "bus_number": bus_number,
        "landline_phone": generate_landline() if random.random() > 0.3 else None,
        "father_phone": generate_phone(),
        "mother_phone": generate_phone() if random.random() > 0.2 else None,
        "additional_phone": generate_phone() if random.random() > 0.5 else None,
        "detailed_address": generate_address(),
        "previous_school": random.choice(PREVIOUS_SCHOOLS) if class_obj.grade_number > 1 else "لا يوجد",
        "grade_level": class_obj.grade_level,
        "grade_number": class_obj.grade_number,
        "section": section,
        "session_type": "morning",
        "ninth_grade_total": Decimal(str(random.uniform(60, 95))) if class_obj.grade_level == "secondary" and class_obj.grade_number == 1 else None,
        "notes": random.choice([None, "طالب مجتهد", "يحتاج متابعة", "ممتاز في الرياضيات", None, None]),
        "is_active": True
    }
    
    return student_data

def generate_student_finance(student_id, academic_year_id):
    """Generate student financial data"""
    # School fees vary by grade
    base_fee = Decimal(str(random.randint(300000, 800000)))  # 300k to 800k IQD
    
    # Some students get discounts (10-50%)
    has_discount = random.random() < 0.3  # 30% get discounts
    school_discount = Decimal(str(int(float(base_fee) * random.uniform(0.1, 0.5)))) if has_discount else Decimal("0")
    
    # Bus fees
    has_bus = random.random() < 0.6  # 60% use bus
    bus_fee = Decimal(str(random.randint(100000, 300000))) if has_bus else Decimal("0")
    bus_discount = Decimal(str(int(float(bus_fee) * random.uniform(0.1, 0.3)))) if has_bus and random.random() < 0.2 else Decimal("0")
    
    # Other revenues (books, uniforms, etc.)
    other_revenues = Decimal(str(random.randint(50000, 200000)))
    
    return {
        "student_id": student_id,
        "academic_year_id": academic_year_id,
        "school_fee": base_fee,
        "school_fee_discount": school_discount,
        "bus_fee": bus_fee,
        "bus_fee_discount": bus_discount,
        "other_revenues": other_revenues,
        "payment_notes": random.choice([None, "دفع بالتقسيط", "دفع كامل", "متأخر في الدفع", None])
    }

def generate_student_payments(student_id, academic_year_id, total_amount):
    """Generate payment history for student"""
    payments = []
    paid_so_far = Decimal("0")
    
    # Generate 1-4 payments
    num_payments = random.randint(1, 4)
    
    for i in range(num_payments):
        # Payment between 20% to 60% of remaining amount
        remaining = total_amount - paid_so_far
        if remaining <= 0:
            break
            
        if i == num_payments - 1:  # Last payment
            payment_amount = remaining
        else:
            payment_amount = Decimal(str(int(float(remaining) * random.uniform(0.2, 0.6))))
        
        payment_date = date.today() - timedelta(days=random.randint(1, 180))
        
        payments.append({
            "student_id": student_id,
            "academic_year_id": academic_year_id,
            "payment_amount": payment_amount,
            "payment_date": payment_date,
            "receipt_number": f"REC-{random.randint(10000, 99999)}",
            "payment_method": random.choice(["نقدي", "تحويل بنكي", "شيك"]),
            "payment_status": "completed",
            "notes": random.choice([None, "دفعة أولى", "دفعة ثانية", "دفعة نهائية"])
        })
        
        paid_so_far += payment_amount
    
    return payments

def generate_teacher_data(academic_year_id, index):
    """Generate complete teacher data"""
    gender = random.choice(["male", "female"])
    first_name = random.choice(MALE_FIRST_NAMES if gender == "male" else FEMALE_FIRST_NAMES)
    father_name = random.choice(FAMILY_NAMES)
    grandfather_name = random.choice(FAMILY_NAMES)
    full_name = f"أ. {first_name} {father_name} {grandfather_name}"
    
    qualification = random.choice(TEACHER_QUALIFICATIONS)
    years_exp = random.randint(2, 20)
    
    qualifications_list = [
        {
            "degree": qualification.split(" - ")[0] if " - " in qualification else qualification,
            "specialization": qualification.split(" - ")[1] if " - " in qualification else "تربوي",
            "university": random.choice(["جامعة بغداد", "جامعة البصرة", "جامعة الموصل", "الجامعة المستنصرية"]),
            "year": str(datetime.now().year - years_exp - random.randint(4, 6))
        }
    ]
    
    experience_list = [
        {
            "institution": random.choice(["مدرسة النور", "مدرسة الأمل", "مدرسة الحكمة"]),
            "position": "مدرس",
            "duration": f"{random.randint(1, years_exp)} سنوات"
        }
    ]
    
    transportation = random.choice(["walking", "full_bus", "half_bus_to_school", "half_bus_from_school"])
    
    teacher_data = {
        "academic_year_id": academic_year_id,
        "session_type": "morning",
        "full_name": full_name,
        "father_name": father_name,
        "gender": gender,
        "birth_date": generate_birth_date(25, 55),
        "phone": generate_phone(),
        "nationality": "عراقي",
        "detailed_address": generate_address(),
        "transportation_type": transportation,
        "bus_number": str(random.randint(1, 20)) if "bus" in transportation else None,
        "qualifications": json.dumps(qualifications_list, ensure_ascii=False),
        "experience": json.dumps(experience_list, ensure_ascii=False),
        "free_time_slots": generate_free_time_slots(),
        "notes": random.choice([None, "معلم متميز", "خبرة طويلة", None]),
        "is_active": True
    }
    
    return teacher_data

# ============================================
# Main Population Functions
# ============================================

def populate_students(db: Session, classes, academic_year_id, students_per_section=10):
    """Populate students for each class section"""
    print("\n" + "="*60)
    print("إضافة الطلاب...")
    print("="*60)
    
    total_students = 0
    
    for class_obj in classes:
        if class_obj.session_type != "morning":
            continue
            
        print(f"\nالصف: {class_obj.grade_level} - المستوى {class_obj.grade_number}")
        
        # Generate sections (A, B, C, etc.)
        sections = [chr(65 + i) for i in range(class_obj.section_count)]  # A, B, C...
        
        for section in sections:
            print(f"  الشعبة {section}: ", end="")
            
            for i in range(students_per_section):
                # Generate student
                student_data = generate_student_data(class_obj, section, i, academic_year_id)
                student = Student(**student_data)
                db.add(student)
                db.flush()  # Get student ID
                
                # Generate financial data
                finance_data = generate_student_finance(student.id, academic_year_id)
                student_finance = StudentFinance(**finance_data)
                db.add(student_finance)
                
                # Generate payments
                total_amount = (finance_data["school_fee"] - finance_data["school_fee_discount"] +
                              finance_data["bus_fee"] - finance_data["bus_fee_discount"] +
                              finance_data["other_revenues"])
                
                payments = generate_student_payments(student.id, academic_year_id, total_amount)
                for payment_data in payments:
                    payment = StudentPayment(**payment_data)
                    db.add(payment)
                
                total_students += 1
            
            db.commit()
            print(f"✓ تم إضافة {students_per_section} طالب")
    
    print(f"\n✅ تم إضافة {total_students} طالب بنجاح")
    return total_students

def populate_teachers(db: Session, classes, subjects_map, academic_year_id, total_teachers=30):
    """Populate teachers and assign them to subjects"""
    print("\n" + "="*60)
    print("إضافة المعلمين...")
    print("="*60)
    
    teachers = []
    
    # Create teachers
    for i in range(total_teachers):
        teacher_data = generate_teacher_data(academic_year_id, i)
        teacher = Teacher(**teacher_data)
        db.add(teacher)
        db.flush()
        teachers.append(teacher)
        
        # Generate salary/finance
        base_salary = Decimal(str(random.randint(800000, 1500000)))  # 800k to 1.5M IQD
        bonuses = Decimal(str(random.randint(0, 300000)))
        deductions = Decimal(str(random.randint(0, 100000)))
        total_amount = base_salary + bonuses - deductions
        
        teacher_finance = TeacherFinance(
            teacher_id=teacher.id,
            academic_year_id=academic_year_id,
            base_salary=base_salary,
            bonuses=bonuses,
            deductions=deductions,
            total_amount=total_amount,
            payment_status=random.choice(["paid", "paid", "pending"]),
            payment_date=date.today() - timedelta(days=random.randint(1, 30)) if random.random() > 0.3 else None,
            notes=None
        )
        db.add(teacher_finance)
        
        if (i + 1) % 10 == 0:
            print(f"  ✓ تم إضافة {i + 1} معلم")
    
    db.commit()
    print(f"✅ تم إضافة {len(teachers)} معلم بنجاح")
    
    # Assign teachers to subjects (no conflicts)
    print("\nتوزيع المعلمين على المواد...")
    assignment_count = 0
    
    teacher_idx = 0
    for class_obj in classes:
        if class_obj.session_type != "morning":
            continue
            
        class_subjects = subjects_map.get(class_obj.id, [])
        sections = [chr(65 + i) for i in range(class_obj.section_count)]
        
        for section in sections:
            for subject in class_subjects:
                # Assign a teacher (round-robin to distribute evenly)
                teacher = teachers[teacher_idx % len(teachers)]
                teacher_idx += 1
                
                assignment = TeacherAssignment(
                    teacher_id=teacher.id,
                    class_id=class_obj.id,
                    subject_id=subject.id,
                    section=section
                )
                db.add(assignment)
                assignment_count += 1
    
    db.commit()
    print(f"✅ تم إضافة {assignment_count} تكليف للمعلمين")
    
    return len(teachers)

def populate_activities(db: Session, academic_year_id, num_activities=3):
    """Populate activities with financial data"""
    print("\n" + "="*60)
    print("إضافة النشاطات...")
    print("="*60)
    
    activities_created = []
    
    for i in range(num_activities):
        activity_type, name, description = random.choice(ACTIVITY_TYPES)
        
        start_date = date.today() + timedelta(days=random.randint(10, 60))
        end_date = start_date + timedelta(days=random.randint(1, 14))
        registration_deadline = start_date - timedelta(days=7)
        
        cost_per_student = Decimal(str(random.randint(10000, 50000)))
        max_participants = random.randint(20, 100)
        
        activity = Activity(
            academic_year_id=academic_year_id,
            name=name,
            description=description,
            activity_type=activity_type,
            session_type="morning",
            target_grades=json.dumps(["primary", "intermediate", "secondary"]),
            max_participants=max_participants,
            cost_per_student=cost_per_student,
            start_date=start_date,
            end_date=end_date,
            registration_deadline=registration_deadline,
            location=random.choice(["قاعة المدرسة", "الملعب الرياضي", "حديقة الزوراء", "المتحف الوطني"]),
            instructor_name=f"أ. {random.choice(MALE_FIRST_NAMES)} {random.choice(FAMILY_NAMES)}",
            requirements=random.choice(["لا يوجد", "إحضار قرطاسية", "رسوم مسبقة", "موافقة ولي الأمر"]),
            is_active=True,
            participant_count=random.randint(15, max_participants),
            images=None,
            total_cost=Decimal(str(random.randint(1000000, 5000000))),
            total_revenue=Decimal(str(random.randint(500000, 3000000))),
            additional_expenses=json.dumps([
                {"item": "مواد خام", "amount": random.randint(100000, 500000)},
                {"item": "نقل", "amount": random.randint(50000, 200000)}
            ]),
            additional_revenues=json.dumps([
                {"item": "رسوم مشاركة", "amount": random.randint(300000, 1000000)}
            ]),
            financial_status=random.choice(["profitable", "pending", "loss"])
        )
        
        db.add(activity)
        db.flush()
        activities_created.append(activity)
        
        print(f"  ✓ تم إضافة نشاط: {name}")
    
    db.commit()
    print(f"✅ تم إضافة {len(activities_created)} نشاط بنجاح")
    
    return len(activities_created)

def populate_finance_cards(db: Session, academic_year_id, num_cards=5):
    """Populate finance cards with transactions"""
    print("\n" + "="*60)
    print("إضافة الكاردات المالية...")
    print("="*60)
    
    cards_created = []
    
    for i in range(num_cards):
        card_type, category, card_name = random.choice(FINANCE_CARD_CATEGORIES)
        
        created_date = date.today() - timedelta(days=random.randint(30, 180))
        
        card = FinanceCard(
            academic_year_id=academic_year_id,
            card_name=card_name,
            card_type=card_type,
            category=category,
            reference_id=None,
            reference_type=category if category in ["activity", "student"] else None,
            is_default=False,
            created_date=created_date,
            description=f"تفاصيل الكارد المالي: {card_name}",
            status=random.choice(["open", "open", "closed", "partial"])
        )
        
        db.add(card)
        db.flush()
        
        # Add transactions to this card
        num_transactions = random.randint(3, 10)
        total_income = Decimal("0")
        total_expense = Decimal("0")
        
        for j in range(num_transactions):
            trans_type = random.choice(["income", "expense"]) if card_type == "both" else card_type
            amount = Decimal(str(random.randint(100000, 2000000)))
            
            if trans_type == "income":
                total_income += amount
            else:
                total_expense += amount
            
            transaction_date = created_date + timedelta(days=random.randint(0, 150))
            
            transaction = FinanceCardTransaction(
                card_id=card.id,
                transaction_type=trans_type,
                amount=amount,
                payer_name=f"{random.choice(MALE_FIRST_NAMES + FEMALE_FIRST_NAMES)} {random.choice(FAMILY_NAMES)}",
                responsible_person=f"أ. {random.choice(MALE_FIRST_NAMES)} {random.choice(FAMILY_NAMES)}",
                transaction_date=transaction_date,
                is_completed=random.choice([True, True, False]),
                completion_percentage=Decimal(str(random.choice([100, 100, 100, 50, 75]))),
                notes=random.choice([None, "تم بنجاح", "قيد المعالجة", "دفعة جزئية"])
            )
            
            db.add(transaction)
        
        cards_created.append(card)
        print(f"  ✓ تم إضافة كارد: {card_name} ({num_transactions} عملية)")
    
    db.commit()
    print(f"✅ تم إضافة {len(cards_created)} كارد مالي بنجاح")
    
    return len(cards_created)

# ============================================
# Main Execution
# ============================================

def main():
    """Main function to populate all test data"""
    print("\n" + "="*60)
    print("🎯 بدء تعبئة قاعدة البيانات ببيانات وهمية")
    print("="*60)
    
    db = SessionLocal()
    
    try:
        # 1. Get active academic year
        print("\n1. التحقق من السنة الدراسية...")
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_active == True).first()
        
        if not academic_year:
            print("❌ لا توجد سنة دراسية نشطة!")
            print("يرجى إنشاء سنة دراسية نشطة أولاً.")
            return
        
        print(f"✅ السنة الدراسية: {academic_year.year_name}")
        
        # 2. Get morning classes
        print("\n2. التحقق من الصفوف الصباحية...")
        classes = db.query(Class).filter(
            Class.academic_year_id == academic_year.id,
            Class.session_type == "morning"
        ).all()
        
        if not classes:
            print("❌ لا توجد صفوف صباحية!")
            print("يرجى إنشاء صفوف صباحية أولاً.")
            return
        
        print(f"✅ عدد الصفوف الصباحية: {len(classes)}")
        for cls in classes:
            print(f"   - {cls.grade_level} {cls.grade_number} ({cls.section_count} شعب)")
        
        # 3. Get or create subjects for each class
        print("\n3. التحقق من المواد الدراسية...")
        subjects_map = {}
        
        for class_obj in classes:
            existing_subjects = db.query(Subject).filter(Subject.class_id == class_obj.id).all()
            
            if not existing_subjects:
                # Create subjects based on grade level
                if class_obj.grade_level == "primary":
                    subject_list = SUBJECTS_PRIMARY
                elif class_obj.grade_level == "intermediate":
                    subject_list = SUBJECTS_INTERMEDIATE
                else:
                    subject_list = SUBJECTS_SECONDARY
                
                created_subjects = []
                for subject_name, weekly_hours in subject_list:
                    subject = Subject(
                        class_id=class_obj.id,
                        subject_name=subject_name,
                        weekly_hours=weekly_hours,
                        is_active=True
                    )
                    db.add(subject)
                    created_subjects.append(subject)
                
                db.commit()
                subjects_map[class_obj.id] = created_subjects
                print(f"   ✓ تم إنشاء {len(created_subjects)} مادة للصف {class_obj.grade_level} {class_obj.grade_number}")
            else:
                subjects_map[class_obj.id] = existing_subjects
                print(f"   ✓ يوجد {len(existing_subjects)} مادة للصف {class_obj.grade_level} {class_obj.grade_number}")
        
        # 4. Populate Students
        total_students = populate_students(db, classes, academic_year.id, students_per_section=10)
        
        # 5. Populate Teachers
        total_teachers = populate_teachers(db, classes, subjects_map, academic_year.id, total_teachers=30)
        
        # 6. Populate Activities
        total_activities = populate_activities(db, academic_year.id, num_activities=3)
        
        # 7. Populate Finance Cards
        total_cards = populate_finance_cards(db, academic_year.id, num_cards=5)
        
        # Final Summary
        print("\n" + "="*60)
        print("✅ تم الانتهاء من تعبئة قاعدة البيانات بنجاح!")
        print("="*60)
        print(f"📊 إجمالي البيانات المضافة:")
        print(f"   • الطلاب: {total_students}")
        print(f"   • المعلمين: {total_teachers}")
        print(f"   • النشاطات: {total_activities}")
        print(f"   • الكاردات المالية: {total_cards}")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ حدث خطأ: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()

