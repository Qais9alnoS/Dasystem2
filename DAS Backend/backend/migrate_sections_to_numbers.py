"""
Script to migrate section names from letters (a, b, c or أ, ب, ج) to numbers (1, 2, 3)
This script updates all existing records in the database to use numeric section names.
"""
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database import SessionLocal
from app.models.students import Student
from app.models.teachers import TeacherAssignment
from app.models.schedules import Schedule
from app.models.activities import ActivityParticipant

# Mapping from letter-based sections to number-based sections
SECTION_MAPPING = {
    # English letters (lowercase and uppercase)
    'a': '1', 'A': '1',
    'b': '2', 'B': '2',
    'c': '3', 'C': '3',
    'd': '4', 'D': '4',
    'e': '5', 'E': '5',
    'f': '6', 'F': '6',
    'g': '7', 'G': '7',
    'h': '8', 'H': '8',
    'i': '9', 'I': '9',
    'j': '10', 'J': '10',
    
    # Arabic letters
    'أ': '1',
    'ب': '2',
    'ج': '3',
    'د': '4',
    'ه': '5', 'هـ': '5',
    'و': '6',
    'ز': '7',
    'ح': '8',
    'ط': '9',
    'ي': '10',
}

def migrate_sections():
    """Migrate all section fields from letters to numbers"""
    
    # Create database session
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("بدء تحديث أسماء الشعب من الأحرف إلى الأرقام")
        print("=" * 60)
        
        # Track statistics
        stats = {
            'students': 0,
            'teacher_assignments': 0,
            'schedules': 0,
            'activity_participants': 0,
        }
        
        # 1. Update Students
        print("\n1. تحديث جدول الطلاب (students)...")
        students = db.query(Student).filter(Student.section.isnot(None)).all()
        for student in students:
            old_section = student.section
            if old_section in SECTION_MAPPING:
                student.section = SECTION_MAPPING[old_section]
                stats['students'] += 1
                print(f"   - الطالب: {student.full_name} | الشعبة: {old_section} → {student.section}")
        
        # 2. Update Teacher Assignments
        print("\n2. تحديث جدول تعيينات المعلمين (teacher_assignments)...")
        assignments = db.query(TeacherAssignment).filter(TeacherAssignment.section.isnot(None)).all()
        for assignment in assignments:
            old_section = assignment.section
            if old_section in SECTION_MAPPING:
                assignment.section = SECTION_MAPPING[old_section]
                stats['teacher_assignments'] += 1
                teacher_name = assignment.teacher.full_name if assignment.teacher else "غير معروف"
                print(f"   - المعلم: {teacher_name} | الشعبة: {old_section} → {assignment.section}")
        
        # 3. Update Schedules
        print("\n3. تحديث جدول الجداول الدراسية (schedules)...")
        try:
            schedules = db.query(Schedule).filter(Schedule.section.isnot(None)).all()
            for schedule in schedules:
                old_section = schedule.section
                if old_section in SECTION_MAPPING:
                    schedule.section = SECTION_MAPPING[old_section]
                    stats['schedules'] += 1
                    print(f"   - جدول ID: {schedule.id} | الشعبة: {old_section} → {schedule.section}")
        except Exception as e:
            # If schedules table has schema mismatch, update directly with SQL
            print(f"   ⚠️ تحذير: خطأ في الوصول للجدول بالطريقة العادية، محاولة التحديث المباشر...")
            try:
                from sqlalchemy import text
                for old_val, new_val in SECTION_MAPPING.items():
                    result = db.execute(
                        text("UPDATE schedules SET section = :new_val WHERE section = :old_val"),
                        {"new_val": new_val, "old_val": old_val}
                    )
                    if result.rowcount > 0:
                        stats['schedules'] += result.rowcount
                        print(f"   - تم تحديث {result.rowcount} سجل من الشعبة {old_val} → {new_val}")
            except Exception as e2:
                print(f"   ⚠️ تحذير: لم يتم تحديث جدول schedules: {e2}")
        
        # 4. Update Activity Participants
        print("\n4. تحديث جدول المشاركين في الأنشطة (activity_participants)...")
        try:
            participants = db.query(ActivityParticipant).filter(ActivityParticipant.section.isnot(None)).all()
            for participant in participants:
                old_section = participant.section
                if old_section in SECTION_MAPPING:
                    participant.section = SECTION_MAPPING[old_section]
                    stats['activity_participants'] += 1
                    print(f"   - مشارك ID: {participant.id} | الشعبة: {old_section} → {participant.section}")
        except Exception as e:
            print(f"   ⚠️ تحذير: لم يتم العثور على جدول activity_participants أو حدث خطأ: {e}")
        
        # Commit all changes
        db.commit()
        
        # Print summary
        print("\n" + "=" * 60)
        print("✅ تم التحديث بنجاح!")
        print("=" * 60)
        print(f"\nملخص التحديثات:")
        print(f"  • الطلاب: {stats['students']} سجل")
        print(f"  • تعيينات المعلمين: {stats['teacher_assignments']} سجل")
        print(f"  • الجداول الدراسية: {stats['schedules']} سجل")
        print(f"  • المشاركين في الأنشطة: {stats['activity_participants']} سجل")
        print(f"\n📊 إجمالي السجلات المحدثة: {sum(stats.values())}")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ حدث خطأ أثناء التحديث: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("\n⚠️  تحذير: هذا السكريبت سيقوم بتحديث جميع أسماء الشعب في قاعدة البيانات")
    print("   من الأحرف (a, b, c أو أ, ب, ج) إلى الأرقام (1, 2, 3)")
    print("\nهل أنت متأكد من المتابعة؟ (yes/no): ", end="")
    
    confirmation = input().strip().lower()
    if confirmation in ['yes', 'y', 'نعم']:
        migrate_sections()
    else:
        print("\n❌ تم إلغاء العملية.")

