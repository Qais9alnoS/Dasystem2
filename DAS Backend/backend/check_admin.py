"""
Quick script to check admin user status
"""

import sys
import os
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.users import User
from app.utils.security import get_password_hash, verify_password

def check_admin():
    """Check admin user details"""
    print("="*60)
    print("🔍 فحص حالة المستخدم الإداري")
    print("="*60)
    
    db = SessionLocal()
    try:
        # Find admin user
        admin = db.query(User).filter(User.username == "admin").first()
        
        if not admin:
            print("\n❌ المستخدم الإداري (admin) غير موجود!")
            print("\n📝 إنشاء مستخدم إداري جديد...")
            
            # Create admin user
            admin_data = {
                "username": "admin",
                "password_hash": get_password_hash("admin123"),
                "role": "director",
                "is_active": True
            }
            admin = User(**admin_data)
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("✅ تم إنشاء المستخدم الإداري بنجاح!")
        
        print(f"\n✓ معلومات المستخدم الإداري:")
        print(f"  • ID: {admin.id}")
        print(f"  • اسم المستخدم: {admin.username}")
        print(f"  • الدور: {admin.role}")
        print(f"  • الحالة: {'نشط ✅' if admin.is_active else 'معطل ❌'}")
        print(f"  • آخر تسجيل دخول: {admin.last_login or 'لم يسجل دخول بعد'}")
        
        # Test password
        print(f"\n🔑 اختبار كلمة المرور...")
        is_valid = verify_password("admin123", admin.password_hash)
        if is_valid:
            print("✅ كلمة المرور صحيحة (admin123)")
        else:
            print("❌ كلمة المرور غير صحيحة!")
            print("📝 إعادة تعيين كلمة المرور إلى admin123...")
            admin.password_hash = get_password_hash("admin123")
            db.commit()
            print("✅ تم إعادة تعيين كلمة المرور")
        
        # Ensure admin is active
        if not admin.is_active:
            print(f"\n⚠️ المستخدم معطل. تفعيل الحساب...")
            admin.is_active = True
            db.commit()
            print("✅ تم تفعيل الحساب")
        
        print("\n" + "="*60)
        print("✅ يمكنك الآن تسجيل الدخول:")
        print("   اسم المستخدم: admin")
        print("   كلمة المرور: admin123")
        print("   الصلاحية: مدير المدرسة")
        print("="*60)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ حدث خطأ: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_admin()
