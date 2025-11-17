"""
Script to add complete data for Primary 1 schedule generation
"""
import sys
import os

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add paths
backend_path = os.path.dirname(os.path.abspath(__file__))
app_path = os.path.join(backend_path, 'backend')
sys.path.insert(0, backend_path)
sys.path.insert(0, app_path)

from app.database import SessionLocal, Base, engine
from app.models.academic import Class, Subject, AcademicYear
from app.models.teachers import Teacher, TeacherAssignment
from datetime import date
import json

def add_primary1_data():
    """Add complete data for Primary 1 schedule generation"""
    # Create tables if they don't exist
    print("Creating database tables if they don't exist...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables ready\n")
    
    db = SessionLocal()
    
    try:
        print("\n=== Adding Data for Primary 1 Schedule Generation ===\n")
        
        # 1. Get or create Academic Year
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_active == True).first()
        if not academic_year:
            academic_year = AcademicYear(
                year_name="2025-2026",
                description="Academic Year 2025-2026",
                is_active=True
            )
            db.add(academic_year)
            db.commit()
            db.refresh(academic_year)
            print(f"✓ Created academic year: {academic_year.year_name}")
        else:
            print(f"✓ Using existing academic year: {academic_year.year_name} (ID: {academic_year.id})")
        
        # 2. Get or create Primary 1 class
        primary1_class = db.query(Class).filter(
            Class.academic_year_id == academic_year.id,
            Class.grade_level == "primary",
            Class.grade_number == 1
        ).first()
        
        if not primary1_class:
            primary1_class = Class(
                academic_year_id=academic_year.id,
                grade_level="primary",
                grade_number=1,
                section_count=1,
                session_type="morning",
                max_students_per_section=30
            )
            db.add(primary1_class)
            db.commit()
            db.refresh(primary1_class)
            print(f"✓ Created class: Primary 1 (ID: {primary1_class.id})")
        else:
            print(f"✓ Using existing class: Primary 1 (ID: {primary1_class.id})")
        
        # 3. Create subjects for Primary 1 (total must be 30 hours: 6 periods × 5 days)
        subjects_data = [
            ("التربية الدينية", 2),
            ("اللغة العربية", 9),
            ("اللغة الإنكليزية", 2),
            ("الرياضيات", 5),
            ("الدراسات الاجتماعية", 1),
            ("علم الأحياء والعلوم العامة", 2),
            ("التربية الموسيقية", 1),
            ("التربية الفنية", 1),
            ("التربية الرياضية", 1),
            ("الأنشطة", 1),
            ("مادة اختيارية", 2),
            ("زراعة القطن", 3),
        ]  # Total: 2+9+2+5+1+2+1+1+1+1+2+3 = 30 hours ✓
        
        created_subjects = []
        for subject_name, weekly_hours in subjects_data:
            # Check if subject already exists
            subject = db.query(Subject).filter(
                Subject.class_id == primary1_class.id,
                Subject.subject_name == subject_name
            ).first()
            
            if not subject:
                subject = Subject(
                    class_id=primary1_class.id,
                    subject_name=subject_name,
                    weekly_hours=weekly_hours,
                    is_active=True
                )
                db.add(subject)
                db.commit()
                db.refresh(subject)
                print(f"✓ Created subject: {subject_name} ({weekly_hours} hours/week)")
            else:
                # Update weekly hours if different
                if subject.weekly_hours != weekly_hours:
                    subject.weekly_hours = weekly_hours
                    db.commit()
                    print(f"✓ Updated subject: {subject_name} ({weekly_hours} hours/week)")
                else:
                    print(f"✓ Using existing subject: {subject_name} ({weekly_hours} hours/week)")
            
            created_subjects.append(subject)
        
        # 4. Create teachers with availability
        # We need teachers for different subject groups
        teachers_data = [
            {
                "full_name": "رياضيات عربي",
                "subjects": ["التربية الدينية", "اللغة العربية", "اللغة الإنكليزية", "الرياضيات"],
                "gender": "male"
            },
            {
                "full_name": "علوم انجليزي",
                "subjects": ["الدراسات الاجتماعية", "علم الأحياء والعلوم العامة", "التربية الموسيقية"],
                "gender": "male"
            },
            {
                "full_name": "تربيات",
                "subjects": ["التربية الفنية", "التربية الرياضية", "الأنشطة", "مادة اختيارية", "زراعة القطن"],
                "gender": "male"
            },
        ]
        
        # Create free time slots structure (5 days x 6 periods, all free initially)
        def create_free_time_slots():
            free_slots = []
            for day in range(1, 6):  # Days 1-5 (Sunday-Thursday)
                for period in range(1, 7):  # Periods 1-6
                    free_slots.append({
                        "day": day,
                        "period": period,
                        "status": "free",
                        "is_free": True,
                        "assignment": None
                    })
            return json.dumps(free_slots, ensure_ascii=False)
        
        created_teachers = []
        for teacher_data in teachers_data:
            teacher = db.query(Teacher).filter(
                Teacher.full_name == teacher_data["full_name"],
                Teacher.academic_year_id == academic_year.id
            ).first()
            
            if not teacher:
                teacher = Teacher(
                    academic_year_id=academic_year.id,
                    session_type="morning",
                    full_name=teacher_data["full_name"],
                    gender=teacher_data["gender"],
                    phone="0500000000",
                    transportation_type="morning",
                    free_time_slots=create_free_time_slots(),
                    is_active=True
                )
                db.add(teacher)
                db.commit()
                db.refresh(teacher)
                print(f"✓ Created teacher: {teacher_data['full_name']} (ID: {teacher.id})")
            else:
                # Update if needed
                if not teacher.free_time_slots:
                    teacher.free_time_slots = create_free_time_slots()
                teacher.is_active = True
                teacher.transportation_type = "morning"
                db.commit()
                print(f"✓ Using existing teacher: {teacher_data['full_name']} (ID: {teacher.id})")
            
            created_teachers.append((teacher, teacher_data["subjects"]))
        
        # 5. Create Teacher Assignments (link teachers to subjects)
        print("\n=== Creating Teacher Assignments ===\n")
        for teacher, subject_names in created_teachers:
            for subject_name in subject_names:
                # Find the subject
                subject = next((s for s in created_subjects if s.subject_name == subject_name), None)
                if not subject:
                    print(f"⚠ Warning: Subject '{subject_name}' not found, skipping assignment")
                    continue
                
                # Check if assignment already exists
                assignment = db.query(TeacherAssignment).filter(
                    TeacherAssignment.teacher_id == teacher.id,
                    TeacherAssignment.subject_id == subject.id,
                    TeacherAssignment.class_id == primary1_class.id
                ).first()
                
                if not assignment:
                    assignment = TeacherAssignment(
                        teacher_id=teacher.id,
                        subject_id=subject.id,
                        class_id=primary1_class.id,
                        section="1"  # Default to section 1
                    )
                    db.add(assignment)
                    print(f"✓ Created assignment: {teacher.full_name} → {subject.subject_name}")
                else:
                    print(f"✓ Using existing assignment: {teacher.full_name} → {subject.subject_name}")
        
        db.commit()
        
        # 6. Summary
        print("\n" + "="*60)
        print("=== Summary ===")
        print(f"Academic Year: {academic_year.year_name} (ID: {academic_year.id})")
        print(f"Class: Primary 1 (ID: {primary1_class.id})")
        print(f"Subjects: {len(created_subjects)}")
        print(f"Teachers: {len(created_teachers)}")
        print(f"Total weekly hours: {sum(s.weekly_hours for s in created_subjects)}")
        print("="*60)
        print("\n✓ Data setup complete! You can now generate schedules for Primary 1.")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_primary1_data()

