# Backend Fixes Required

## Issue 1: Schedule Generation Not Respecting Teacher Free Time

### Problem

The schedule generation is creating assignments even when teachers are not marked as free in their `free_time_slots`. The validation shows teachers have enough total free time, but doesn't check if they're free at specific time slots.

### Location

File: `backend/app/services/schedule_service.py`
Function: `_find_available_teacher_for_subject_and_slot` (lines 1865-1966)

### Current Implementation Issues

1. The function gets teacher availability from `availability_service.get_teacher_availability(teacher.id)`
2. It checks `slot.get('status') == 'free' or slot.get('is_free', False)`
3. However, the availability might not be properly initialized or updated

### Required Fix

1. **Verify availability service is working correctly**: Check that `get_teacher_availability` properly reads from the teacher's `free_time_slots` JSON field
2. **Add better logging**: Add debug prints to show what availability data is being retrieved
3. **Fix slot indexing**: Ensure the day/period to slot_index calculation is correct:

   ```python
   slot_index = slot_day * 6 + slot_period
   ```

   This assumes periods 0-5 and days 0-4 (Sunday-Thursday)

4. **Fallback behavior**: Currently if no teacher is free, it falls back to ANY teacher (lines 804-814). This should be more strict or at least add the assignment to conflicts.

### Test Case

- Create a teacher with specific free time slots (e.g., NOT free on Sunday period 1)
- Try to generate a schedule
- Verify the schedule does NOT assign this teacher to Sunday period 1

---

## Issue 2: "مادة كل يوم" Constraint

### Problem

There may be a hardcoded constraint that requires subjects to appear every day, even when the teacher isn't available.

### Location

File: `backend/app/services/schedule_service.py`
Function: `_distribute_subjects_evenly` (need to locate and check)

### Required Investigation

1. Check if there's a constraint that forces subjects to be distributed across all days
2. This constraint should be optional and configurable
3. Look for any hardcoded logic that says "subject must appear on all working days"

### Required Fix

1. Make this an optional constraint in the `ConstraintManager`
2. Add a database field for this constraint type
3. Only apply it if the user explicitly enables it

---

## Issue 3: Validation Not Catching Missing Teacher Availability

### Problem

The validation in `التحقق` page shows green/valid even when no teacher is free for specific time slots.

### Location

File: `backend/app/services/validation_service.py`
Function: `validate_schedule_prerequisites`

### Required Enhancement

Add a new validation check:

```python
def _check_teacher_timeslot_availability(self, subject_details, class_requirements):
    """
    Check if for each required class period, at least one teacher is free
    """
    for day in working_days:
        for period in periods_per_day:
            # Get all teachers assigned to subjects needed for this class
            # Check if ANY of them are free at this specific day/period
            # If NONE are free, add to missing_timeslots
    return missing_timeslots
```

This should populate the `missing_timeslots` field in the validation response.

---

## Issue 4: Teacher Free Time Calculation

### Problem

When a teacher is assigned to a class in a schedule, their free time requirement should be reduced by the periods they're teaching.

### Location

File: `backend/app/services/schedule_service.py`
Function: Around line 837-851 where `mark_slot_as_assigned` is called

### Current Issue

The `mark_slot_as_assigned` function marks the slot as occupied, but the validation service might not be recalculating the "required free time" correctly.

### Required Fix

1. When validating, check if a teacher already has scheduled classes
2. Subtract those scheduled periods from their "required free time"
3. Only count unscheduled subject requirements toward free time needs

---

## Testing Checklist

After implementing fixes:

- [ ] Create a teacher with limited free time (e.g., only free on Monday/Tuesday)
- [ ] Assign them to teach a subject that needs 5 periods per week
- [ ] Try to generate a schedule
- [ ] Verify schedule ONLY uses Monday/Tuesday for this teacher
- [ ] Verify validation shows warning if impossible to schedule
- [ ] Check that occupied slots appear in teacher management free time grid
- [ ] Verify teacher count in validation shows unique teachers, not subject count
