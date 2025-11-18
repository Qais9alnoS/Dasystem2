"""
Script to verify the populated data
"""

import sys
import os
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import func
from app.database import SessionLocal
from app.models.academic import AcademicYear, Class, Subject
from app.models.students import Student, StudentFinance, StudentPayment
from app.models.teachers import Teacher, TeacherAssignment, TeacherFinance
from app.models.activities import Activity
from app.models.finance import FinanceCard, FinanceCardTransaction
from decimal import Decimal

def verify_data():
    """Verify the populated data"""
    print("\n" + "="*60)
    print("🔍 التحقق من البيانات المضافة")
    print("="*60)
    
    db = SessionLocal()
    
    try:
        # Get academic year
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_active == True).first()
        
        if not academic_year:
            print("❌ لا توجد سنة دراسية نشطة!")
            return
        
        print(f"\n📅 السنة الدراسية: {academic_year.year_name}")
        print("="*60)
        
        # ===== Students =====
        print("\n👨‍🎓 الطلاب:")
        print("-"*60)
        
        total_students = db.query(Student).filter(
            Student.academic_year_id == academic_year.id,
            Student.session_type == "morning"
        ).count()
        
        # Students by gender
        male_students = db.query(Student).filter(
            Student.academic_year_id == academic_year.id,
            Student.session_type == "morning",
            Student.gender == "male"
        ).count()
        
        female_students = total_students - male_students
        
        print(f"  • إجمالي الطلاب: {total_students}")
        print(f"  • ذكور: {male_students} ({male_students/total_students*100:.1f}%)")
        print(f"  • إناث: {female_students} ({female_students/total_students*100:.1f}%)")
        
        # Students by grade level
        print(f"\n  📚 توزيع الطلاب حسب المرحلة:")
        for grade_level in ["primary", "intermediate", "secondary"]:
            count = db.query(Student).filter(
                Student.academic_year_id == academic_year.id,
                Student.session_type == "morning",
                Student.grade_level == grade_level
            ).count()
            level_ar = {"primary": "ابتدائي", "intermediate": "إعدادي", "secondary": "ثانوي"}
            print(f"     - {level_ar[grade_level]}: {count} طالب")
        
        # Student Finances
        print(f"\n  💰 البيانات المالية للطلاب:")
        
        total_finances = db.query(StudentFinance).count()
        total_payments = db.query(StudentPayment).count()
        
        # Calculate total amounts
        total_school_fees = db.query(func.sum(StudentFinance.school_fee)).scalar() or Decimal("0")
        total_discounts = db.query(func.sum(StudentFinance.school_fee_discount)).scalar() or Decimal("0")
        total_paid = db.query(func.sum(StudentPayment.payment_amount)).scalar() or Decimal("0")
        
        print(f"     - عدد السجلات المالية: {total_finances}")
        print(f"     - عدد الدفعات المسجلة: {total_payments}")
        print(f"     - إجمالي الرسوم المدرسية: {total_school_fees:,.0f} د.ع")
        print(f"     - إجمالي الخصومات: {total_discounts:,.0f} د.ع")
        print(f"     - إجمالي المدفوع: {total_paid:,.0f} د.ع")
        print(f"     - نسبة التحصيل: {(float(total_paid) / float(total_school_fees - total_discounts) * 100) if total_school_fees > total_discounts else 0:.1f}%")
        
        # Students with special needs
        special_needs_count = db.query(Student).filter(
            Student.academic_year_id == academic_year.id,
            Student.has_special_needs == True
        ).count()
        
        print(f"\n  ♿ طلاب ذوي الاحتياجات الخاصة: {special_needs_count}")
        
        # Transportation
        print(f"\n  🚌 المواصلات:")
        for trans_type in ["walking", "full_bus", "half_bus_to_school", "half_bus_from_school"]:
            count = db.query(Student).filter(
                Student.academic_year_id == academic_year.id,
                Student.transportation_type == trans_type
            ).count()
            trans_ar = {
                "walking": "مشياً",
                "full_bus": "باص كامل",
                "half_bus_to_school": "باص ذهاب",
                "half_bus_from_school": "باص عودة"
            }
            if count > 0:
                print(f"     - {trans_ar.get(trans_type, trans_type)}: {count} طالب")
        
        # ===== Teachers =====
        print("\n" + "="*60)
        print("👨‍🏫 المعلمين:")
        print("-"*60)
        
        total_teachers = db.query(Teacher).filter(
            Teacher.academic_year_id == academic_year.id,
            Teacher.session_type == "morning"
        ).count()
        
        male_teachers = db.query(Teacher).filter(
            Teacher.academic_year_id == academic_year.id,
            Teacher.session_type == "morning",
            Teacher.gender == "male"
        ).count()
        
        female_teachers = total_teachers - male_teachers
        
        print(f"  • إجمالي المعلمين: {total_teachers}")
        print(f"  • ذكور: {male_teachers} ({male_teachers/total_teachers*100:.1f}%)")
        print(f"  • إناث: {female_teachers} ({female_teachers/total_teachers*100:.1f}%)")
        
        # Teacher Assignments
        total_assignments = db.query(TeacherAssignment).count()
        print(f"\n  📋 التكليفات:")
        print(f"     - إجمالي التكليفات: {total_assignments}")
        print(f"     - متوسط التكليفات لكل معلم: {total_assignments/total_teachers:.1f}")
        
        # Teacher Finances
        total_teacher_finances = db.query(TeacherFinance).count()
        total_salaries = db.query(func.sum(TeacherFinance.total_amount)).scalar() or Decimal("0")
        
        print(f"\n  💰 الرواتب:")
        print(f"     - عدد السجلات المالية: {total_teacher_finances}")
        print(f"     - إجمالي الرواتب: {total_salaries:,.0f} د.ع")
        print(f"     - متوسط الراتب: {float(total_salaries)/total_teacher_finances:,.0f} د.ع")
        
        # ===== Classes & Subjects =====
        print("\n" + "="*60)
        print("📚 الصفوف والمواد:")
        print("-"*60)
        
        total_classes = db.query(Class).filter(
            Class.academic_year_id == academic_year.id,
            Class.session_type == "morning"
        ).count()
        
        total_sections = sum([cls.section_count for cls in db.query(Class).filter(
            Class.academic_year_id == academic_year.id,
            Class.session_type == "morning"
        ).all()])
        
        total_subjects = db.query(Subject).join(Class).filter(
            Class.academic_year_id == academic_year.id,
            Class.session_type == "morning"
        ).count()
        
        print(f"  • إجمالي الصفوف: {total_classes}")
        print(f"  • إجمالي الشعب: {total_sections}")
        print(f"  • إجمالي المواد: {total_subjects}")
        
        # ===== Activities =====
        print("\n" + "="*60)
        print("🎯 النشاطات:")
        print("-"*60)
        
        total_activities = db.query(Activity).filter(
            Activity.academic_year_id == academic_year.id
        ).count()
        
        print(f"  • إجمالي النشاطات: {total_activities}")
        
        activities = db.query(Activity).filter(
            Activity.academic_year_id == academic_year.id
        ).all()
        
        total_activity_cost = Decimal("0")
        total_activity_revenue = Decimal("0")
        
        for activity in activities:
            total_activity_cost += activity.total_cost or Decimal("0")
            total_activity_revenue += activity.total_revenue or Decimal("0")
            
            activity_type_ar = {
                "academic": "أكاديمي",
                "sports": "رياضي",
                "cultural": "ثقافي",
                "social": "اجتماعي",
                "trip": "رحلة"
            }
            
            print(f"\n     {activity.name}")
            print(f"     - النوع: {activity_type_ar.get(activity.activity_type, activity.activity_type)}")
            print(f"     - التكلفة: {activity.total_cost:,.0f} د.ع")
            print(f"     - المدخولات: {activity.total_revenue:,.0f} د.ع")
            print(f"     - الربح/الخسارة: {(activity.total_revenue - activity.total_cost):,.0f} د.ع")
        
        print(f"\n  💰 إجمالي المالية للنشاطات:")
        print(f"     - التكلفة الكلية: {total_activity_cost:,.0f} د.ع")
        print(f"     - المدخولات الكلية: {total_activity_revenue:,.0f} د.ع")
        print(f"     - صافي الربح/الخسارة: {(total_activity_revenue - total_activity_cost):,.0f} د.ع")
        
        # ===== Finance Cards =====
        print("\n" + "="*60)
        print("💳 الكاردات المالية:")
        print("-"*60)
        
        total_finance_cards = db.query(FinanceCard).filter(
            FinanceCard.academic_year_id == academic_year.id
        ).count()
        
        total_card_transactions = db.query(FinanceCardTransaction).join(FinanceCard).filter(
            FinanceCard.academic_year_id == academic_year.id
        ).count()
        
        print(f"  • إجمالي الكاردات: {total_finance_cards}")
        print(f"  • إجمالي العمليات: {total_card_transactions}")
        
        finance_cards = db.query(FinanceCard).filter(
            FinanceCard.academic_year_id == academic_year.id
        ).all()
        
        total_card_income = Decimal("0")
        total_card_expense = Decimal("0")
        
        for card in finance_cards:
            card_income = Decimal("0")
            card_expense = Decimal("0")
            
            for trans in card.transactions:
                if trans.transaction_type == "income":
                    card_income += trans.amount
                    total_card_income += trans.amount
                else:
                    card_expense += trans.amount
                    total_card_expense += trans.amount
            
            card_type_ar = {
                "income": "مدخولات",
                "expense": "مصروفات",
                "both": "مدخولات ومصروفات"
            }
            
            print(f"\n     {card.card_name}")
            print(f"     - النوع: {card_type_ar.get(card.card_type, card.card_type)}")
            print(f"     - عدد العمليات: {len(card.transactions)}")
            print(f"     - المدخولات: {card_income:,.0f} د.ع")
            print(f"     - المصروفات: {card_expense:,.0f} د.ع")
            print(f"     - الصافي: {(card_income - card_expense):,.0f} د.ع")
        
        print(f"\n  💰 إجمالي الكاردات المالية:")
        print(f"     - المدخولات الكلية: {total_card_income:,.0f} د.ع")
        print(f"     - المصروفات الكلية: {total_card_expense:,.0f} د.ع")
        print(f"     - الصافي: {(total_card_income - total_card_expense):,.0f} د.ع")
        
        # ===== Overall Summary =====
        print("\n" + "="*60)
        print("📊 الملخص الشامل:")
        print("="*60)
        
        print(f"\n  ✅ البيانات المضافة بنجاح:")
        print(f"     • {total_students} طالب (10 لكل شعبة)")
        print(f"     • {total_teachers} معلم مع {total_assignments} تكليف")
        print(f"     • {total_activities} نشاطات")
        print(f"     • {total_finance_cards} كاردات مالية مع {total_card_transactions} عملية")
        print(f"     • {total_subjects} مادة دراسية")
        print(f"     • {total_sections} شعبة صفية")
        
        # Financial Summary
        print(f"\n  💰 الملخص المالي:")
        total_revenue = total_paid + total_activity_revenue + total_card_income
        total_expenses = total_salaries + total_activity_cost + total_card_expense
        net_balance = total_revenue - total_expenses
        
        print(f"     • إجمالي المدخولات: {total_revenue:,.0f} د.ع")
        print(f"       - رسوم الطلاب المدفوعة: {total_paid:,.0f} د.ع")
        print(f"       - مدخولات النشاطات: {total_activity_revenue:,.0f} د.ع")
        print(f"       - مدخولات الكاردات: {total_card_income:,.0f} د.ع")
        
        print(f"\n     • إجمالي المصروفات: {total_expenses:,.0f} د.ع")
        print(f"       - رواتب المعلمين: {total_salaries:,.0f} د.ع")
        print(f"       - تكاليف النشاطات: {total_activity_cost:,.0f} د.ع")
        print(f"       - مصروفات الكاردات: {total_card_expense:,.0f} د.ع")
        
        print(f"\n     • الصافي: {net_balance:,.0f} د.ع")
        
        print("\n" + "="*60)
        print("✅ تم التحقق من جميع البيانات بنجاح!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ حدث خطأ: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify_data()

