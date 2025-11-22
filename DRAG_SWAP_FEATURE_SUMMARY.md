# Drag-and-Swap Feature Implementation Summary

## Date: 2024

## Issues Fixed

### 1. ✅ Schedule Deletion 422 Error - Fixed

**Problem:**

- The new `/api/schedules/class-schedule` delete endpoint had `section: int` parameter
- Sections are stored as strings in the database
- This caused 422 validation errors when deleting schedules

**Solution:**

- Changed `section` parameter type from `int` to `str` in the endpoint
- Updated line 1230 in `schedules.py`

**Files Modified:**

- `DAS Backend/backend/app/api/schedules.py` (line 1230)

---

### 2. ✅ Drag-and-Swap Feature - Enhanced with Teacher Availability Validation

**Problem:**

- The drag-and-swap feature existed but was not checking teacher free time availability
- Backend swap endpoint only checked for schedule conflicts (same teacher, two classes at once)
- It did NOT check if teachers actually have free time in the target slots
- This could allow swaps that violate the teacher availability system

**Root Cause Analysis:**
The original swap logic (lines 531-641 in schedules.py) only validated:

1. ✅ Same academic year and session type
2. ✅ No teacher conflicts (teacher not teaching 2 classes at once)
3. ✅ No class conflicts (class not having 2 subjects at once)

But it did NOT check: 4. ❌ **Teacher availability in `free_time_slots` field**

This meant a swap could succeed even if the teacher wasn't free at the new time slot!

**Solution Implemented:**

#### Backend Changes

**1. Enhanced Swap Endpoint** (`schedules.py` lines 662-720)
Added comprehensive teacher availability checking:

```python
# Check if teacher 1 has free time at new slot (schedule2's original slot)
teacher1 = db.query(Teacher).filter(Teacher.id == schedule1.teacher_id).first()
if teacher1 and teacher1.free_time_slots:
    slots_data = json.loads(teacher1.free_time_slots)
    day_idx = original_2['day_of_week'] - 1
    period_idx = original_2['period_number'] - 1
    slot_idx = day_idx * 6 + period_idx

    if 0 <= slot_idx < len(slots_data):
        slot = slots_data[slot_idx]
        # Teacher must have this slot as free or already assigned to current schedule
        is_available = (
            (slot.get('status') == 'free' and slot.get('is_free', False)) or
            (slot.get('status') == 'assigned' and
             slot.get('assignment', {}).get('class_id') == schedule1.class_id and
             slot.get('assignment', {}).get('section') == schedule1.section)
        )

        if not is_available:
            conflicts.append(f"{teacher_name} ليس لديه وقت فراغ في {day_name} الحصة {period}")
```

**Key Logic:**

- Converts schedule day/period to 0-based slot index
- Checks teacher's `free_time_slots` JSON field
- Validates the slot is either:
  - **Free**: `status == 'free' and is_free == True`
  - **Already assigned to this schedule**: Allows internal swaps within same class/section
- Returns detailed Arabic error messages if teacher unavailable

**2. New Validity Check Endpoint** (`schedules.py` lines 480-597)
Created `/api/schedules/check-swap-validity` endpoint for UI feedback:

```python
@router.post("/check-swap-validity", response_model=SwapValidityResponse)
async def check_swap_validity(
    request: SwapValidityCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """
    Check if two schedules can be swapped based on teacher availability.
    This is used for drag-and-drop UI feedback (green/red highlighting).
    """
```

**Response Model:**

```python
class SwapValidityResponse(BaseModel):
    can_swap: bool
    reason: Optional[str] = None
    conflicts: List[str] = []
```

**Purpose:**

- Lightweight validation check without actually performing the swap
- Used for real-time UI feedback during drag-and-drop
- Returns `can_swap: true/false` with detailed conflict messages

#### Frontend Changes

**1. New API Method** (`api.ts` lines 1153-1160)

```typescript
// Check Swap Validity (for drag-and-drop highlighting)
checkSwapValidity: async (schedule1_id: number, schedule2_id: number) => {
  return apiClient.post<{
    can_swap: boolean;
    reason?: string;
    conflicts: string[];
  }>('/schedules/check-swap-validity', { schedule1_id, schedule2_id });
},
```

**2. Enhanced WeeklyScheduleGrid Component** (`WeeklyScheduleGrid.tsx`)

**Added State for Caching:**

```typescript
const [swapValidityCache, setSwapValidityCache] = useState<
  Map<string, boolean>
>(new Map());
```

**Updated Drag Handlers:**

- **`handleDragStart`**: Clears validity cache when starting new drag
- **`handleDragOver`**: Checks validity with caching

  ```typescript
  // Check cache first
  const cacheKey = `${draggedAssignment.id}-${targetAssignment.id}`;
  if (swapValidityCache.has(cacheKey)) {
    const isValid = swapValidityCache.get(cacheKey)!;
    setIsValidDrop(isValid);
    return;
  }

  // Call API if not cached
  const validityResult = await schedulesApi.checkSwapValidity(
    draggedAssignment.id,
    targetAssignment.id
  );

  // Cache the result
  setSwapValidityCache((prev) => new Map(prev).set(cacheKey, canSwap));
  ```

- **`handleDragEnd`**: Clears cache when drag completes

**Performance Optimization:**

- **Caching**: Validity checks are cached per drag session
- **Prevents spam**: Same check won't be made twice during one drag operation
- **Fast feedback**: Cached results show immediately on subsequent hovers

---

## How the Feature Works

### User Experience

1. **User starts dragging a schedule card**

   - The card becomes semi-transparent (opacity-50)
   - Validity cache is cleared

2. **User hovers over other schedule cards**

   - **Green border + wiggle animation**: Swap is valid (both teachers have free time)
   - **Red border + static**: Swap is invalid (teacher availability conflict)
   - **No highlight**: Can't swap with empty cells or same cell

3. **User drops the card**
   - If green (valid): Swap executes, both teachers' schedules updated
   - If red (invalid): Error toast with detailed reason
   - Page refreshes to show new schedule

### Validation Rules

A swap is **VALID** only if:

1. ✅ Both slots have assignments (can't swap with empty)
2. ✅ Different cells (can't swap with itself)
3. ✅ Same academic year and session type
4. ✅ **Teacher 1 has free time at Teacher 2's slot**
5. ✅ **Teacher 2 has free time at Teacher 1's slot**
6. ✅ No other schedule conflicts (double-booking)

A swap is **INVALID** if:

- ❌ Teacher doesn't have free time in target slot
- ❌ Teacher already teaching another class at that time
- ❌ Different academic years or session types
- ❌ Empty slot or same cell

### Visual Feedback

**Green Highlight (Can Swap):**

```css
border-green-500 border-2 bg-green-50
animation: wiggle 0.5s ease-in-out infinite
```

**Red Highlight (Cannot Swap):**

```css
border-red-500 border-2 bg-red-50
```

**Dragging State:**

```css
opacity-50 scale-95
```

---

## Technical Details

### Teacher Availability Slot Structure

```json
{
  "day": 0-4,          // 0=Sunday, 4=Thursday
  "period": 0-5,       // 0=Period 1, 5=Period 6
  "status": "free" | "assigned" | "unavailable",
  "is_free": true | false,
  "assignment": {
    "class_id": 1,
    "section": "1",
    "subject_id": 5,
    "schedule_id": 123
  }
}
```

### Slot Index Calculation

```python
# Convert from 1-based (database) to 0-based (array)
day_idx = day_of_week - 1      # 1-5 becomes 0-4
period_idx = period_number - 1  # 1-6 becomes 0-5

# Calculate slot index in flat array
slot_idx = day_idx * 6 + period_idx  # 0-29 (30 total slots)
```

**Example:**

- Wednesday (day 4), Period 3
- `day_idx = 4 - 1 = 3`
- `period_idx = 3 - 1 = 2`
- `slot_idx = 3 * 6 + 2 = 20`

### API Flow

**Validity Check (Hover):**

```
Frontend Hover
    ↓
API: POST /schedules/check-swap-validity
    ↓
Backend: Check teacher availability in free_time_slots
    ↓
Response: { can_swap: true/false, conflicts: [...] }
    ↓
Frontend: Show green/red border
```

**Actual Swap (Drop):**

```
Frontend Drop
    ↓
API: POST /schedules/swap
    ↓
Backend:
  1. Validate again (double-check)
  2. Swap day/period/subject/teacher
  3. Check conflicts
  4. Commit or rollback
    ↓
Response: { success: true/false, conflicts: [...] }
    ↓
Frontend: Reload page or show error
```

---

## Files Modified

### Backend (Python/FastAPI)

- ✅ `DAS Backend/backend/app/api/schedules.py`
  - Line 1230: Fixed section parameter type
  - Lines 480-597: New `check_swap_validity` endpoint
  - Lines 662-720: Enhanced swap validation with teacher availability

### Frontend (TypeScript/React)

- ✅ `DAS Frontend/src/services/api.ts`

  - Lines 1153-1160: New `checkSwapValidity` API method

- ✅ `DAS Frontend/src/components/schedule/WeeklyScheduleGrid.tsx`
  - Line 86: Added `swapValidityCache` state
  - Lines 125-131: Enhanced `handleDragStart` with cache clearing
  - Lines 133-177: Enhanced `handleDragOver` with API validity check and caching
  - Lines 242-247: Enhanced `handleDragEnd` with cache clearing

---

## Testing Recommendations

### Test Case 1: Valid Swap

1. Find two schedules where both teachers have free time in each other's slots
2. Drag one card to the other
3. **Expected**: Green border + wiggle animation
4. Drop the card
5. **Expected**: Swap succeeds, schedules updated

### Test Case 2: Invalid Swap (Teacher Not Free)

1. Find a schedule where the teacher is NOT free at another time
2. Try to drag that schedule to a time when its teacher is busy
3. **Expected**: Red border, no animation
4. Drop anyway
5. **Expected**: Error message with teacher name and conflict details

### Test Case 3: Caching Performance

1. Start dragging a schedule
2. Hover over another schedule (makes API call)
3. Move away and hover again (uses cache)
4. **Expected**: Second hover shows color instantly without delay

### Test Case 4: Internal Swap (Same Class/Section)

1. Drag a schedule to another schedule in the SAME class and section
2. **Expected**: Green if both teachers free at each other's times
3. This allows rearranging periods within a class without issues

---

## Benefits

1. **Data Integrity**: Teachers can only be scheduled when they're actually free
2. **Real-time Feedback**: Users see immediately if a swap will work
3. **Performance**: Caching prevents excessive API calls during dragging
4. **User Experience**: Clear visual indicators (green=good, red=bad)
5. **Detailed Errors**: Users know exactly why a swap failed
6. **Flexibility**: Internal swaps within same class allowed

---

## Conclusion

The drag-and-swap feature is now fully functional with comprehensive teacher availability validation:

1. ✅ **Delete endpoint fixed** - section parameter type corrected
2. ✅ **Teacher availability checking** - validates free_time_slots before swap
3. ✅ **Real-time validity feedback** - green/red highlighting based on actual availability
4. ✅ **Performance optimized** - caching prevents redundant API calls
5. ✅ **Clear error messages** - users know exactly what went wrong

The feature now respects the teacher availability system and prevents invalid swaps that would break the freetime tracking!
