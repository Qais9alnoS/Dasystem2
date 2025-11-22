import sqlite3

conn = sqlite3.connect('school_management.db')
cursor = conn.cursor()

# Delete all schedules for class 1, section 1, morning session
cursor.execute('''
    DELETE FROM schedules 
    WHERE academic_year_id = 1 
    AND session_type = 'morning' 
    AND class_id = 1 
    AND section = '1'
''')

deleted_count = cursor.rowcount
conn.commit()
conn.close()

print(f"✓ Successfully deleted {deleted_count} schedule entries")
print("The schedule has been removed from the database.")
