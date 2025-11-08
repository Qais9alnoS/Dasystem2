"""
Quick script to update sections from letters to numbers
No confirmation required - use with caution!
"""
import sys
from pathlib import Path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.students import Student
from app.models.teachers import TeacherAssignment
from app.models.schedules import Schedule
from app.models.activities import ActivityParticipant

# Letter to number mapping
MAPPING = {
    'a': '1', 'A': '1', 'b': '2', 'B': '2', 'c': '3', 'C': '3',
    'd': '4', 'D': '4', 'e': '5', 'E': '5', 'f': '6', 'F': '6',
    'أ': '1', 'ب': '2', 'ج': '3', 'د': '4', 'ه': '5', 'هـ': '5',
    'و': '6', 'ز': '7', 'ح': '8', 'ط': '9', 'ي': '10',
}

def update_all():
    db = SessionLocal()
    total = 0
    
    try:
        # Update students
        for s in db.query(Student).filter(Student.section.in_(MAPPING.keys())).all():
            s.section = MAPPING[s.section]
            total += 1
        
        # Update teacher assignments
        for t in db.query(TeacherAssignment).filter(TeacherAssignment.section.in_(MAPPING.keys())).all():
            t.section = MAPPING[t.section]
            total += 1
        
        # Update schedules
        try:
            for sc in db.query(Schedule).filter(Schedule.section.in_(MAPPING.keys())).all():
                sc.section = MAPPING[sc.section]
                total += 1
        except Exception as e:
            # Direct SQL update if model mismatch
            from sqlalchemy import text
            for old_val, new_val in MAPPING.items():
                result = db.execute(
                    text("UPDATE schedules SET section = :new_val WHERE section = :old_val"),
                    {"new_val": new_val, "old_val": old_val}
                )
                total += result.rowcount
        
        # Update activity participants
        try:
            for a in db.query(ActivityParticipant).filter(ActivityParticipant.section.in_(MAPPING.keys())).all():
                a.section = MAPPING[a.section]
                total += 1
        except:
            pass
        
        db.commit()
        print(f"✅ تم تحديث {total} سجل بنجاح!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ خطأ: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 جاري تحديث الشعب من أحرف إلى أرقام...")
    update_all()

