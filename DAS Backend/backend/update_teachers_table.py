"""
Script to update teachers table with new columns
Run this script to add the new columns to the existing database
"""
import sqlite3
import os

# Get database path
db_path = os.path.join(os.path.dirname(__file__), 'school_management.db')

print(f"Updating database: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if columns exist
    cursor.execute("PRAGMA table_info(teachers)")
    columns = [column[1] for column in cursor.fetchall()]
    print(f"Existing columns: {columns}")
    
    # Add session_type column if it doesn't exist
    if 'session_type' not in columns:
        print("Adding session_type column...")
        cursor.execute("""
            ALTER TABLE teachers 
            ADD COLUMN session_type VARCHAR(10) DEFAULT 'morning' NOT NULL
        """)
        print("✅ session_type column added")
    else:
        print("✅ session_type column already exists")
    
    # Add father_name column if it doesn't exist
    if 'father_name' not in columns:
        print("Adding father_name column...")
        cursor.execute("""
            ALTER TABLE teachers 
            ADD COLUMN father_name VARCHAR(100)
        """)
        print("✅ father_name column added")
    else:
        print("✅ father_name column already exists")
    
    # Add bus_number column if it doesn't exist
    if 'bus_number' not in columns:
        print("Adding bus_number column...")
        cursor.execute("""
            ALTER TABLE teachers 
            ADD COLUMN bus_number VARCHAR(20)
        """)
        print("✅ bus_number column added")
    else:
        print("✅ bus_number column already exists")
    
    # Commit changes
    conn.commit()
    print("\n✅ Database updated successfully!")
    
    # Show updated columns
    cursor.execute("PRAGMA table_info(teachers)")
    columns = [column[1] for column in cursor.fetchall()]
    print(f"Updated columns: {columns}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    conn.close()

print("\nDone! You can now restart the backend server.")

