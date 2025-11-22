import sqlite3
import json
from datetime import datetime

conn = sqlite3.connect('school_management.db')
cursor = conn.cursor()

print("Creating test schedule for Class 1, Section 1, Morning...")

# Simple test schedule (10 periods)
test_schedule = [
    # Sunday (day 1)
    (1, 'morning', 1, '1', 1, 1, 1, 1),  # Period 1: Arabic
    (1, 'morning', 1, '1', 1, 2, 2, 2),  # Period 2: Basic
    
    # Monday (day 2)
    (1, 'morning', 1, '1', 2, 1, 1, 1),  # Period 1: Arabic
    (1, 'morning', 1, '1', 2, 2, 3, 3),  # Period 2: Movement
    
    # Tuesday (day 3)
    (1, 'morning', 1, '1', 3, 1, 2, 2),  # Period 1: Basic
    (1, 'morning', 1, '1', 3, 2, 4, 4),  # Period 2: Education
    
    # Wednesday (day 4)
    (1, 'morning', 1, '1', 4, 1, 1, 1),  # Period 1: Arabic
    (1, 'morning', 1, '1', 4, 2, 3, 3),  # Period 2: Movement
    
    # Thursday (day 5)
    (1, 'morning', 1, '1', 5, 1, 2, 2),  # Period 1: Basic
    (1, 'morning', 1, '1', 5, 2, 4, 4),  # Period 2: Education
]

now = datetime.now().isoformat()

for schedule_data in test_schedule:
    cursor.execute('''
        INSERT INTO schedules 
        (academic_year_id, session_type, class_id, section, day_of_week, period_number, subject_id, teacher_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (*schedule_data, now, now))

# Also mark teacher slots as assigned
teachers_to_update = {1, 2, 3, 4}

for teacher_id in teachers_to_update:
    cursor.execute('SELECT free_time_slots FROM teachers WHERE id = ?', (teacher_id,))
    row = cursor.fetchone()
    if row and row[0]:
        slots_data = json.loads(row[0])
        
        # Mark slots as assigned for this schedule
        for schedule_data in test_schedule:
            if schedule_data[7] == teacher_id:  # teacher_id
                day = schedule_data[4] - 1  # day_of_week
                period = schedule_data[5] - 1  # period_number
                slot_idx = day * 6 + period
                
                if 0 <= slot_idx < len(slots_data):
                    slots_data[slot_idx] = {
                        'day': day,
                        'period': period,
                        'status': 'assigned',
                        'is_free': False,
                        'assignment': {
                            'class_id': 1,
                            'section': '1',
                            'subject_id': schedule_data[6]
                        }
                    }
        
        # Update teacher
        cursor.execute(
            'UPDATE teachers SET free_time_slots = ? WHERE id = ?',
            (json.dumps(slots_data), teacher_id)
        )

conn.commit()
conn.close()

print(f"✓ Created {len(test_schedule)} test schedule entries")
print("✓ Updated teacher availability")
print("\nYou can now test the DELETE endpoint!")
