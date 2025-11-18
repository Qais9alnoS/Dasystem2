"""
Script to setup base academic data (year and classes)
"""

import sys
import os
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from datetime import datetime
from app.database import SessionLocal
from app.models.academic import AcademicYear, Class, Subject

def setup_base_data():
    """Setup academic year and classes for morning session"""
    print("="*60)
    print("🔧 إعداد البيانات الأساسية")
    print("="*60)
    
    db = SessionLocal()
    
    try:
        # 1. Create Academic Year
        print("\n1. إنشاء السنة الدراسية...")
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_active == True).first()
        
        if not academic_year:
            current_year = datetime.now().year
            academic_year = AcademicYear(
                year_name=f"{current_year}-{current_year + 1}",
                description=f"السنة الدراسية {current_year}-{current_year + 1}",
                is_active=True
            )
            db.add(academic_year)
            db.commit()
            db.refresh(academic_year)
            print(f"   ✅ تم إنشاء السنة الدراسية: {academic_year.year_name}")
        else:
            print(f"   ℹ️  السنة الدراسية موجودة: {academic_year.year_name}")
        
        # 2. Create Classes for Morning Session
        print("\n2. إنشاء الصفوف الصباحية...")
        
        # Define class structure
        class_structure = [
            # Primary (ابتدائي) - 6 grades
            ("primary", 1, 2),  # Grade 1, 2 sections
            ("primary", 2, 2),
            ("primary", 3, 2),
            ("primary", 4, 2),
            ("primary", 5, 2),
            ("primary", 6, 2),
            
            # Intermediate (إعدادي) - 3 grades
            ("intermediate", 1, 2),  # Grade 1, 2 sections
            ("intermediate", 2, 2),
            ("intermediate", 3, 2),
            
            # Secondary (ثانوي) - 3 grades
            ("secondary", 1, 2),  # Grade 1, 2 sections
            ("secondary", 2, 2),
            ("secondary", 3, 2),
        ]
        
        classes_created = 0
        
        for grade_level, grade_number, section_count in class_structure:
            # Check if class already exists
            existing_class = db.query(Class).filter(
                Class.academic_year_id == academic_year.id,
                Class.session_type == "morning",
                Class.grade_level == grade_level,
                Class.grade_number == grade_number
            ).first()
            
            if not existing_class:
                new_class = Class(
                    academic_year_id=academic_year.id,
                    session_type="morning",
                    grade_level=grade_level,
                    grade_number=grade_number,
                    section_count=section_count,
                    max_students_per_section=30
                )
                db.add(new_class)
                classes_created += 1
                
                # Display in Arabic
                level_ar = {
                    "primary": "ابتدائي",
                    "intermediate": "إعدادي",
                    "secondary": "ثانوي"
                }
                print(f"   ✅ {level_ar[grade_level]} - الصف {grade_number} ({section_count} شعب)")
        
        db.commit()
        
        if classes_created > 0:
            print(f"\n   ✅ تم إنشاء {classes_created} صف دراسي")
        else:
            print("\n   ℹ️  الصفوف الدراسية موجودة مسبقاً")
        
        # 3. Display Summary
        total_classes = db.query(Class).filter(
            Class.academic_year_id == academic_year.id,
            Class.session_type == "morning"
        ).count()
        
        print("\n" + "="*60)
        print("✅ تم إعداد البيانات الأساسية بنجاح!")
        print("="*60)
        print(f"📊 الملخص:")
        print(f"   • السنة الدراسية: {academic_year.year_name}")
        print(f"   • عدد الصفوف الصباحية: {total_classes}")
        
        # Calculate total sections
        total_sections = 0
        for cls in db.query(Class).filter(
            Class.academic_year_id == academic_year.id,
            Class.session_type == "morning"
        ).all():
            total_sections += cls.section_count
        
        print(f"   • إجمالي الشعب: {total_sections}")
        print("="*60)
        
        return academic_year.id
        
    except Exception as e:
        print(f"\n❌ حدث خطأ: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    setup_base_data()

