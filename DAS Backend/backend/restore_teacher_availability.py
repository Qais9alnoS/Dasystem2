import sqlite3
import json

conn = sqlite3.connect('school_management.db')
cursor = conn.cursor()

# Get all teachers
cursor.execute('SELECT id, full_name, free_time_slots FROM teachers')
teachers = cursor.fetchall()

print("Restoring teacher availability after schedule deletion...\n")

for teacher_id, teacher_name, free_time_slots_json in teachers:
    if not free_time_slots_json:
        continue
    
    try:
        slots_data = json.loads(free_time_slots_json)
        modified = False
        
        # Check each slot
        for i, slot in enumerate(slots_data):
            if slot.get('status') == 'assigned':
                assignment = slot.get('assignment', {})
                # If assigned to class 1, section 1 (the deleted schedule)
                if assignment.get('class_id') == 1 and assignment.get('section') == '1':
                    # Restore to free
                    day = slot.get('day', i // 6)
                    period = slot.get('period', i % 6)
                    slots_data[i] = {
                        'day': day,
                        'period': period,
                        'status': 'free',
                        'is_free': True,
                        'assignment': None
                    }
                    modified = True
                    print(f"  ✓ Restored day {day+1}, period {period+1}")
        
        if modified:
            # Update teacher's free_time_slots
            updated_json = json.dumps(slots_data)
            cursor.execute(
                'UPDATE teachers SET free_time_slots = ? WHERE id = ?',
                (updated_json, teacher_id)
            )
            print(f"✓ Updated teacher: {teacher_name} (ID: {teacher_id})")
            print()
    
    except json.JSONDecodeError:
        print(f"⚠ Warning: Could not parse free_time_slots for teacher {teacher_name}")
        continue

conn.commit()
conn.close()

print("\n✅ Teacher availability restored successfully!")
print("You can now add free times to the previously occupied slots.")
