"""
Script to remove old demo users except admin
"""

import sys
import os
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.users import User

def cleanup_demo_users():
    """Deactivate old demo users except admin"""
    print("="*60)
    print("🧹 تعطيل المستخدمين التجريبيين")
    print("="*60)
    
    db = SessionLocal()
    try:
        # List of demo users to deactivate
        demo_usernames = ["director", "finance", "morning", "evening"]
        
        deactivated_count = 0
        for username in demo_usernames:
            user = db.query(User).filter(User.username == username).first()
            if user:
                user.is_active = False
                print(f"  ⏸️  تعطيل المستخدم: {username} (الدور: {user.role})")
                deactivated_count += 1
            else:
                print(f"  ℹ️  المستخدم {username} غير موجود")
        
        db.commit()
        
        print(f"\n✅ تم تعطيل {deactivated_count} مستخدم تجريبي")
        
        # Verify admin user exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            print(f"\n✓ المستخدم الإداري موجود:")
            print(f"  - اسم المستخدم: admin")
            print(f"  - الدور: {admin_user.role}")
            print(f"  - الحالة: {'نشط' if admin_user.is_active else 'معطل'}")
        else:
            print("\n⚠️  تحذير: المستخدم الإداري (admin) غير موجود!")
        
        # List all remaining users
        all_users = db.query(User).all()
        print(f"\n📋 المستخدمون المتبقون في النظام ({len(all_users)}):")
        for user in all_users:
            print(f"  • {user.username} ({user.role})")
        
        print("\n" + "="*60)
        print("✅ تم تنظيف قاعدة البيانات بنجاح!")
        print("="*60)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ حدث خطأ: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_demo_users()
