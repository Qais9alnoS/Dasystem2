"""
Script to initialize the database with tables
"""

import sys
import os
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import engine, Base
from app.models import *  # Import all models

def init_db():
    """Initialize database and create all tables"""
    print("="*60)
    print("تهيئة قاعدة البيانات")
    print("="*60)
    
    try:
        # Create all tables
        print("\nإنشاء الجداول...")
        Base.metadata.create_all(bind=engine)
        print("تم إنشاء جميع الجداول بنجاح")
        
        # List created tables
        print("\nالجداول المنشأة:")
        for table_name in Base.metadata.tables.keys():
            print(f"   - {table_name}")
        
        print("\n" + "="*60)
        print("تم إنشاء قاعدة البيانات بنجاح!")
        print("="*60)
        
    except Exception as e:
        print(f"\nحدث خطأ: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    init_db()

