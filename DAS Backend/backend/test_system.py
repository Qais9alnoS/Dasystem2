"""
Test script to verify all fixes
"""

import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.users import User
from app.utils.security import verify_password

def test_system():
    print("="*60)
    print("🧪 اختبار النظام")
    print("="*60)
    
    db = SessionLocal()
    try:
        # Test 1: Check admin user
        print("\n1️⃣ اختبار المستخدم الإداري...")
        admin = db.query(User).filter(User.username == "admin").first()
        if admin and verify_password("admin123", admin.password_hash):
            print("   ✅ المستخدم الإداري جاهز")
            print(f"   - اسم المستخدم: admin")
            print(f"   - الدور: {admin.role}")
            print(f"   - الحالة: {'نشط' if admin.is_active else 'معطل'}")
        else:
            print("   ❌ خطأ في المستخدم الإداري")
        
        # Test 2: Count all users
        print("\n2️⃣ إحصائيات المستخدمين...")
        all_users = db.query(User).all()
        active_users = [u for u in all_users if u.is_active]
        inactive_users = [u for u in all_users if not u.is_active]
        
        print(f"   📊 إجمالي المستخدمين: {len(all_users)}")
        print(f"   ✅ مستخدمون نشطون: {len(active_users)}")
        print(f"   ⏸️  مستخدمون معطلون: {len(inactive_users)}")
        
        # Test 3: List all active users
        if active_users:
            print("\n3️⃣ المستخدمون النشطون:")
            for user in active_users:
                print(f"   • {user.username} ({user.role})")
        
        print("\n" + "="*60)
        print("✅ جميع الاختبارات اكتملت!")
        print("="*60)
        
        print("\n📝 معلومات تسجيل الدخول:")
        print("   🔑 اسم المستخدم: admin")
        print("   🔑 كلمة المرور: admin123")
        print("   🔑 الصلاحية: مدير المدرسة")
        print("   🌐 الرابط: http://localhost:5173")
        print("\n" + "="*60)
        
    except Exception as e:
        print(f"\n❌ حدث خطأ: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_system()
