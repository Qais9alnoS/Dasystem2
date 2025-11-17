"""
Test script for schedule generation
Creates test data and attempts to generate schedules
"""
import sys
import os

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add both paths to handle different import styles
backend_path = os.path.dirname(os.path.abspath(__file__))
app_path = os.path.join(backend_path, 'backend')
sys.path.insert(0, backend_path)
sys.path.insert(0, app_path)

# Now imports should work
from app.database import SessionLocal, Base, engine
from app.models.academic import Class, Subject, AcademicYear
from app.models.teachers import Teacher, TeacherAssignment
from app.models.schedules import Schedule, ScheduleConstraint, ScheduleGenerationHistory
from app.models.users import User
from app.services.schedule_service import ScheduleGenerationService
from app.schemas.schedules import ScheduleGenerationRequest
from datetime import date, timedelta
import json

def create_test_data(db):
    """Create minimal test data for schedule generation"""
    print("\n=== Creating Test Data ===\n")
    
    # Check if data already exists
    academic_year = db.query(AcademicYear).first()
    if not academic_year:
        academic_year = AcademicYear(
            year_name="2024-2025",
            description="Test Academic Year",
            is_active=True
        )
        db.add(academic_year)
        db.commit()
        print(f"[OK] Created academic year: {academic_year.year_name}")
    else:
        print(f"[OK] Using existing academic year: {academic_year.year_name}")
    
    # Create a test class
    test_class = db.query(Class).filter(Class.grade_number == 1).first()
    if not test_class:
        test_class = Class(
            academic_year_id=academic_year.id,
            grade_level="primary",
            grade_number=1,
            section_count=1,
            session_type="morning",
            max_students_per_section=30
        )
        db.add(test_class)
        db.commit()
        print(f"[OK] Created class: Grade 1 Primary")
    else:
        print(f"[OK] Using existing class: Grade {test_class.grade_number} {test_class.grade_level}")
    
    # Create subjects - MUST total exactly 30 hours (6 periods × 5 days = 30)
    subjects_data = [
        ("رياضيات", 6),  # Math - 6 hours/week
        ("لغة عربية", 8),  # Arabic - 8 hours/week  
        ("علوم", 5),  # Science - 5 hours/week
        ("تربية إسلامية", 4),  # Islamic Ed - 4 hours/week
        ("تربية فنية", 2),  # Art - 2 hours/week
        ("تربية بدنية", 3),  # Physical Ed - 3 hours/week
        ("لغة إنجليزية", 2),  # English - 2 hours/week
    ]  # Total: 6+8+5+4+2+3+2 = 30 hours ✓
    
    created_subjects = []
    for subject_name, weekly_hours in subjects_data:
        subject = db.query(Subject).filter(
            Subject.class_id == test_class.id,
            Subject.subject_name == subject_name
        ).first()
        
        if not subject:
            subject = Subject(
                class_id=test_class.id,
                subject_name=subject_name,
                weekly_hours=weekly_hours,
                is_active=True
            )
            db.add(subject)
            created_subjects.append(subject)
            print(f"[OK] Created subject: {subject_name} ({weekly_hours} hours/week)")
        else:
            created_subjects.append(subject)
            print(f"[OK] Using existing subject: {subject_name}")
    
    db.commit()
    
    # Create teachers with free_time_slots - one per subject (7 total)
    teachers_data = [
        "أحمد محمد",  # Math teacher
        "فاطمة أحمد",  # Arabic teacher
        "محمد علي",  # Science teacher
        "نادية حسن",  # Islamic Ed teacher
        "عمر السيد",  # Art teacher
        "سارة إبراهيم",  # Physical Ed teacher
        "خالد أحمد",  # English teacher
    ]
    
    created_teachers = []
    for teacher_name in teachers_data:
        teacher = db.query(Teacher).filter(Teacher.full_name == teacher_name).first()
        
        if not teacher:
            # Initialize all slots as free (5 days x 6 periods = 30 slots)
            free_slots = []
            for day in range(5):  # Sunday-Thursday
                for period in range(6):  # 6 periods per day
                    free_slots.append({
                        "day": day,
                        "period": period,
                        "status": "free",
                        "is_free": True,
                        "assignment": None
                    })
            
            teacher = Teacher(
                academic_year_id=academic_year.id,
                session_type="morning",
                full_name=teacher_name,
                gender="male",
                phone="0500000000",
                free_time_slots=json.dumps(free_slots)
            )
            db.add(teacher)
            created_teachers.append(teacher)
            print(f"[OK] Created teacher: {teacher_name} (30 free slots)")
        else:
            created_teachers.append(teacher)
            print(f"[OK] Using existing teacher: {teacher_name}")
    
    db.commit()
    
    # Create teacher assignments
    for i, subject in enumerate(created_subjects):
        if i < len(created_teachers):
            teacher = created_teachers[i]
            
            assignment = db.query(TeacherAssignment).filter(
                TeacherAssignment.teacher_id == teacher.id,
                TeacherAssignment.subject_id == subject.id,
                TeacherAssignment.class_id == test_class.id
            ).first()
            
            if not assignment:
                assignment = TeacherAssignment(
                    teacher_id=teacher.id,
                    subject_id=subject.id,
                    class_id=test_class.id,
                    section='1'
                )
                db.add(assignment)
                print(f"[OK] Assigned {teacher.full_name} to teach {subject.subject_name}")
    
    db.commit()
    
    print(f"\n[SUCCESS] Test data created successfully!")
    print(f"   - Academic Year: {academic_year.id}")
    print(f"   - Class: {test_class.id}")
    print(f"   - Subjects: {len(created_subjects)}")
    print(f"   - Teachers: {len(created_teachers)}")
    
    return academic_year.id, test_class.id

def test_schedule_generation():
    """Test the schedule generation"""
    # Drop and recreate all database tables for fresh start
    print("=== Creating Database Tables (Fresh Start) ===\n")
    try:
        Base.metadata.drop_all(bind=engine)
        print("[OK] Dropped existing tables\n")
        Base.metadata.create_all(bind=engine)
        print("[OK] Database tables created successfully\n")
    except Exception as e:
        print(f"Error creating tables: {e}\n")
    
    db = SessionLocal()
    
    try:
        # Create test data
        academic_year_id, class_id = create_test_data(db)
        
        # Initialize schedule service
        print("\n=== Testing Schedule Generation ===\n")
        schedule_service = ScheduleGenerationService(db)
        
        # Create generation request
        request = ScheduleGenerationRequest(
            academic_year_id=academic_year_id,
            session_type="morning",
            class_id=class_id,
            section='1',
            periods_per_day=6,
            working_days=['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
            name="Test Schedule Generation",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=180)
        )
        
        print(f"Generating schedule for:")
        print(f"  - Academic Year ID: {academic_year_id}")
        print(f"  - Class ID: {class_id}")
        print(f"  - Session: morning")
        print(f"  - Periods per day: 6")
        print(f"  - Working days: 5 (Sunday-Thursday)")
        print(f"  - Expected total periods: 30\n")
        
        # Generate schedule
        result = schedule_service.generate_schedule(request)
        
        print("\n=== Generation Result ===")
        print(f"Status: {result.generation_status}")
        print(f"Schedule ID: {result.schedule_id}")
        print(f"Periods Created: {result.total_periods_created}")
        print(f"Assignments Created: {result.total_assignments_created}")
        print(f"Conflicts Detected: {result.conflicts_detected}")
        print(f"Generation Time: {result.generation_time:.2f}s")
        
        if result.warnings:
            print(f"\nWarnings ({len(result.warnings)}):")
            for warning in result.warnings:
                print(f"  - {warning}")
        
        print(f"\nSummary:")
        for key, value in result.summary.items():
            print(f"  {key}: {value}")
        
        # Check for generated markdown files
        print("\n=== Checking Generated Files ===")
        import os
        if os.path.exists("generated_schedules"):
            files = os.listdir("generated_schedules")
            if files:
                print(f"[OK] Found {len(files)} generated schedule file(s):")
                for file in files:
                    print(f"  - {file}")
                    # Read and display a preview
                    with open(f"generated_schedules/{file}", 'r', encoding='utf-8') as f:
                        content = f.read()
                        print(f"\nPreview of {file}:")
                        print("="*80)
                        print(content[:500] + "..." if len(content) > 500 else content)
                        print("="*80)
            else:
                print("[WARN] No files in generated_schedules directory")
        else:
            print("[WARN] generated_schedules directory not found")
        
    except Exception as e:
        print(f"\nError during testing: {str(e)}")
        import traceback
        print(traceback.format_exc())
    finally:
        db.close()

def test_batch_generation():
    """Test batch schedule generation for multiple classes"""
    print("\n" + "="*80)
    print("=== Testing Batch Schedule Generation ===")
    print("="*80 + "\n")
    
    db = SessionLocal()
    
    try:
        # Get academic year
        academic_year = db.query(AcademicYear).first()
        if not academic_year:
            print("[SKIP] No academic year found - run regular test first")
            return
        
        # Initialize schedule service
        schedule_service = ScheduleGenerationService(db)
        
        print(f"\n[TEST] Generating schedules for all classes...")
        print(f"Academic Year: {academic_year.year_name}")
        
        # Call batch generation
        result = schedule_service.generate_schedules_for_all_classes(
            academic_year_id=academic_year.id,
            session_type="morning",
            periods_per_day=6,
            working_days=['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
        )
        
        print(f"\n[RESULT] Batch Generation Status: {result.get('status', 'unknown')}")
        print(f"Classes Processed: {result.get('classes_processed', 0)}")
        print(f"Successful: {result.get('successful', 0)}")
        print(f"Failed: {result.get('failed', 0)}")
        
        if result.get('results'):
            print(f"\nDetails:")
            for class_result in result['results']:
                status_icon = "✅" if class_result['status'] == 'completed' else "❌"
                print(f"  {status_icon} Class {class_result.get('class_id')} - {class_result['status']}")
        
        print(f"\n{'='*80}\n")
        
    except Exception as e:
        print(f"\n[ERROR] Batch generation failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    # Run regular test
    test_schedule_generation()
    
    # Run batch generation test
    test_batch_generation()

