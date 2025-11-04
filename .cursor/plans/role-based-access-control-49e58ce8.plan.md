<!-- 49e58ce8-0450-407c-8faf-010039d91bec a2778db6-532c-4396-b2ba-91ff8bf2fffc -->
# Role-Based Access Control & Data Filtering

## Overview

Configure page access and data filtering based on user roles (director, finance, morning_school, evening_school).

## Implementation Steps

### 1. Create Session Filtering Utility Hook

**File**: `DAS Frontend/src/hooks/useSessionFilter.ts` (NEW)

Create a custom hook that:

- Returns the user's session type based on their role
- `morning_school` → `'morning'`
- `evening_school` → `'evening'`
- `director` → `null` (can access both)
- `finance` → `null` (context-dependent)

### 2. Update Sidebar Navigation

**File**: `DAS Frontend/src/components/layout/Sidebar.tsx`

Current state:

- Dashboard: all roles ✓
- Academic Years: all roles ✓
- School Info: all roles ✓
- Director Notes: director only ✓
- Students: director, morning_school, evening_school ✓
- Activities: **director only** (needs update)

Changes needed:

- Update Activities `allowedRoles` from `['director']` to `['director', 'finance', 'morning_school', 'evening_school']`

### 3. Update SchoolInfoManagementPage

**File**: `DAS Frontend/src/pages/SchoolInfoManagementPage.tsx`

Add automatic session filtering:

- Import `useAuth` and get user role
- Import the new `useSessionFilter` hook
- Filter classes by session_type in `loadClasses()` function (line 67-86)
- When displaying classes, only show classes matching the user's session
- For director: show all classes
- For morning_school: only show classes where `session_type === 'morning'`
- For evening_school: only show classes where `session_type === 'evening'`

### 4. Update Student Pages with Session Filtering

#### StudentPersonalInfoPage

**File**: `DAS Frontend/src/pages/StudentPersonalInfoPage.tsx`

Add automatic filtering:

- Use `useSessionFilter` hook to get session type
- When fetching students via `studentsApi.getAll()`, add `session_type` parameter
- Filter students automatically based on user role

#### StudentAcademicInfoPage

**File**: `DAS Frontend/src/pages/StudentAcademicInfoPage.tsx`

Same changes as StudentPersonalInfoPage:

- Add session filtering to student queries
- Ensure classes dropdown only shows relevant session classes

### 5. Update ActivitiesManagementPage - Major Refactor

**File**: `DAS Frontend/src/pages/ActivitiesManagementPage.tsx`

Current state: Director-only access

Changes needed:

1. **Access Control**: Remove director-only restriction, allow all 4 roles
2. **Add role-based UI sections**:

   - **Morning/Evening School roles**:
     - Can see activities for their session only
     - Can add/edit activities for their session
     - Can manage participants (students from their session)
     - Can view attendance
     - **Cannot see financial data**
   - **Finance role**:
     - Can see all activities (both sessions)
     - **Cannot edit activity details**
     - **Can only view and manage**:
       - Cost per student
       - Payment tracking
       - Financial summaries
       - Total revenue per activity
     - Show a "Finance View" with payment-focused UI
   - **Director role**:
     - Full access to everything
     - Can see and edit all activities
     - Can manage all participants
     - Can see all financial data

3. **Implementation approach**:

   - Add conditional rendering based on `useAuth().state.user?.role`
   - Filter activities by session_type for morning/evening roles
   - Hide/show action buttons based on role
   - For finance role, create a separate "Finance Dashboard" view within the page

### 6. Update App.tsx Routes

**File**: `DAS Frontend/src/App.tsx`

Update Activities route (line 191-199):

```typescript
// Before:
<ProtectedRoute allowedRoles={['director']} fallback={<AccessDenied />}>
  <ActivitiesManagementPage />
</ProtectedRoute>

// After:
<ProtectedRoute allowedRoles={['director', 'finance', 'morning_school', 'evening_school']} fallback={<AccessDenied />}>
  <ActivitiesManagementPage />
</ProtectedRoute>
```

## Role Permissions Summary

| Page | Director | Finance | Morning School | Evening School |

|------|----------|---------|----------------|----------------|

| Dashboard | ✓ All data | ✓ Financial data | ✓ Morning data | ✓ Evening data |

| Year Management | ✓ Full access | ✓ View only | ✓ View only | ✓ View only |

| School Info | ✓ All sessions | ✓ All sessions | ✓ Morning only | ✓ Evening only |

| Students | ✓ All sessions | ✗ No access | ✓ Morning only | ✓ Evening only |

| Activities | ✓ Full access | ✓ Finance only | ✓ Morning only | ✓ Evening only |

| Director Notes | ✓ Full access | ✗ No access | ✗ No access | ✗ No access |

## Testing Checklist

After implementation, test with each role:

- [ ] Morning school user can only see morning classes
- [ ] Morning school user can only see morning students
- [ ] Morning school user can only see/manage morning activities
- [ ] Evening school user sees only evening data
- [ ] Finance user can access activities but only manage financial aspects
- [ ] Finance user cannot see student pages
- [ ] Director can see all data across all sessions
- [ ] Navigation menu shows/hides appropriate items per role

### To-dos

- [ ] Create useSessionFilter hook to return session type based on user role
- [ ] Update Sidebar to allow all roles to access Activities page
- [ ] Add session filtering to SchoolInfoManagementPage for classes
- [ ] Add session filtering to StudentPersonalInfoPage
- [ ] Add session filtering to StudentAcademicInfoPage
- [ ] Refactor ActivitiesManagementPage with role-based UI and permissions (morning/evening/finance/director)
- [ ] Update App.tsx routes to allow all roles to access Activities page
- [ ] Test all role permissions to ensure proper filtering and access control