<!-- 3577c24d-7b6b-4ec8-b574-79772527866d 965c8f22-8cad-48ff-aaf9-ee9bfbe87215 -->
# Schedule Management System - Complete Implementation Plan

## Overview

Build a legendary schedule management page that leverages the full backend capabilities to automatically generate conflict-free class schedules with advanced constraint handling, teacher availability integration, and comprehensive export options.

## Core Features

### 1. Backend Enhancements

#### 1.1 Enhanced Genetic Algorithm Service

- **File**: `DAS Backend/backend/app/services/schedule_optimizer.py`
- Enhance existing `GeneticScheduleOptimizer` with:
- Multi-objective fitness function (minimize conflicts, maximize teacher satisfaction, balanced distribution)
- Adaptive mutation rates based on generation progress
- Elitism preservation (keep best 10% of solutions)
- Constraint-aware crossover operations
- Population diversity maintenance

#### 1.2 Teacher Availability Auto-Management

- **Files**: 
- `DAS Backend/backend/app/models/schedules.py` - Add `ScheduleDraft` model
- `DAS Backend/backend/app/services/teacher_availability_service.py` (NEW)
- When schedule saved:
- Automatically update teacher's `free_time_slots` JSON to mark assigned periods
- Store assignment details (subject, class, section) in the occupied slot
- Prevent manual edits to auto-assigned slots
- When schedule deleted:
- Restore slot to "free" status (green background)
- Remove assignment details from `free_time_slots`
- Revalidate dependent schedules

#### 1.3 Soft Constraint System

- **File**: `DAS Backend/backend/app/services/constraint_solver.py`
- Enhance to support priority levels:
- Level 1-2: Soft (warnings only)
- Level 3: Medium (strong warnings, allow override)
- Level 4: Hard (block if violated)
- Return detailed violation reports with:
- Violated constraint details
- Affected entities (teachers, classes, subjects)
- Suggested resolutions
- Priority/severity level

#### 1.4 Draft & Conflict Management

- **Files**:
- `DAS Backend/backend/app/models/schedules.py` - Add `status` field (draft/published)
- `DAS Backend/backend/app/api/schedules.py` - Add draft endpoints
- Features:
- Save schedules as drafts when conflicts exist
- Validate on publish attempt
- Block publishing if conflicts remain
- Auto-save drafts every 30 seconds

#### 1.5 Export Services

- **File**: `DAS Backend/backend/app/services/export_service.py` (NEW)
- Implement exporters:
- **Excel**: Using `openpyxl` - formatted tables with colors, borders, headers
- **PDF**: Using `reportlab` - professional layout with school logo, headers, footers
- **Image**: Using `Pillow` - PNG/JPG with high resolution, suitable for printing
- All exports include:
- School header/logo
- Academic year, session type, class/section info
- Weekly grid with subjects and teacher names
- Generation timestamp

### 2. Backend API Endpoints

#### 2.1 Schedule Generation & Management

- `POST /api/schedules/generate` - Generate schedules with parameters
- `GET /api/schedules/drafts` - Get all draft schedules
- `POST /api/schedules/{id}/publish` - Publish draft (with validation)
- `DELETE /api/schedules/{id}` - Delete + auto-restore teacher availability

#### 2.2 Constraint Management

- `GET /api/schedules/constraints/templates` - Get predefined constraint templates
- `POST /api/schedules/constraints/validate` - Validate constraints before saving
- `GET /api/schedules/constraints/violations` - Get all violations for a schedule

#### 2.3 Export Endpoints

- `GET /api/schedules/{id}/export/excel` - Download Excel file
- `GET /api/schedules/{id}/export/pdf` - Download PDF file
- `GET /api/schedules/{id}/export/image` - Download PNG image
- `POST /api/schedules/bulk-export` - Export multiple schedules

#### 2.4 Validation & Analysis

- `POST /api/schedules/validate` - Validate schedule before generation
- `GET /api/schedules/{id}/conflicts` - Get detailed conflict analysis
- `GET /api/schedules/check-teacher-availability` - Check if teacher has sufficient free slots

### 3. Frontend - Schedule Management Page

#### 3.1 Main Page Structure

- **File**: `DAS Frontend/src/pages/ScheduleManagementPage.tsx` (NEW)
- Multi-step wizard interface:

1. **Selection Step**: Period, Grade Level, Grade, Section
2. **Review Step**: Show selected class info, subjects, teachers, availability status
3. **Constraints Step**: Define/review constraints
4. **Generation Step**: Generate with progress indicator
5. **Review/Edit Step**: View results, resolve conflicts
6. **Export Step**: Choose export format and download

#### 3.2 Dynamic Filtering System

- **Component**: `DAS Frontend/src/components/schedule/ScheduleFilters.tsx` (NEW)
- Cascade filtering:
- Period selection → filters grade levels
- Grade level → filters grades (e.g., Primary shows only grades 1-6)
- Grade + Section → shows subjects and assigned teachers
- Real-time data from database (no hardcoded values)
- Show availability status:
- ✅ Sufficient free slots (green)
- ⚠️ Insufficient free slots (orange with details)
- ❌ No assigned teacher (red)

#### 3.3 Constraint Management Interface

- **Component**: `DAS Frontend/src/components/schedule/ConstraintManager.tsx` (NEW)
- Pop-up dialog with two constraint types:

1. **No consecutive periods**: Select subject → automatically applies
2. **Period placement**: Select subject + select "before/after which subject"

- Constraint list showing:
- Subject name
- Constraint type
- Description
- Priority level (visual indicator)
- Edit/Delete actions
- Dynamic subject dropdown (filtered by selected class)

#### 3.4 Schedule Generation UI

- **Component**: Enhanced `DAS Frontend/src/components/schedule/ScheduleGenerator.tsx`
- Features:
- Real-time progress with 10 detailed steps
- Generation statistics (classes scheduled, conflicts found, etc.)
- Success/warning/error states
- Ability to cancel generation
- Settings panel:
- Algorithm selection (greedy/genetic/hybrid)
- Optimization level (fast/balanced/thorough)
- Max generation time
- Auto-resolve conflicts toggle

#### 3.5 Weekly Schedule Grid

- **Component**: `DAS Frontend/src/components/schedule/WeeklyScheduleGrid.tsx` (NEW)
- Beautiful iOS-style grid:
- Days (columns) × Periods (rows)
- Each cell shows:
- Subject name (bold)
- Teacher name (smaller, below subject)
- Background colors for different subjects
- Interactive cells:
- Click to edit/reassign
- Drag to swap periods
- Color-coded conflicts (red border)
- Break periods shown differently (gray with "استراحة")

#### 3.6 Conflict Resolution Interface

- **Component**: `DAS Frontend/src/components/schedule/ConflictResolver.tsx` (NEW)
- Pop-up dialog when conflicts detected:
- List all conflicts with:
- Type (teacher conflict, constraint violation, etc.)
- Severity (critical/warning/info)
- Affected items (teachers, classes, periods)
- Suggested resolution
- Actions per conflict:
- "Auto-fix" button
- "Manual edit" button
- "Ignore" (for soft constraints)
- Bottom actions:
- "Save as Draft" - exits without resolving
- "Resolve All Auto" - attempts automatic resolution
- "Cancel" - discards changes
- Block "Publish" until all critical conflicts resolved

#### 3.7 Teacher Availability View Integration

- **Component**: `DAS Frontend/src/components/schedule/TeacherAvailabilityPanel.tsx` (NEW)
- Side panel showing teacher availability grid:
- Days × Periods grid
- Color coding:
- Green: Free/available
- Blue: Assigned (shows subject + class + section)
- Gray: Unavailable
- Updates in real-time when schedule saved
- When schedule deleted, blue cells revert to green
- Non-editable for auto-assigned slots

#### 3.8 Export Interface

- **Component**: `DAS Frontend/src/components/schedule/ScheduleExporter.tsx` (NEW)
- Export dialog with options:
- Format selection (Excel/PDF/PNG/JPG)
- Layout options (portrait/landscape for PDF)
- Include options (logo, signatures, notes)
- Single schedule or bulk export
- Preview before download
- Download triggers with proper file naming

### 4. Access Control & Permissions

#### 4.1 Role-Based Access

- **Files**: 
- `DAS Backend/backend/app/core/dependencies.py` - Add session-based auth
- `DAS Frontend/src/components/schedule/ScheduleManagementPage.tsx`
- Permissions by role:
- **Director**: Full access (view all, create, edit, delete)
- **Morning Supervisor**: View all, edit morning session only
- **Evening Supervisor**: View all, edit evening session only
- UI adapts based on role:
- Disable edit buttons for restricted sessions
- Show warning when viewing restricted content
- Filter schedule list by accessible sessions

### 5. Validation & Business Logic

#### 5.1 Pre-Generation Validation

- **Service**: `DAS Backend/backend/app/services/validation_service.py` (NEW)
- Check before generation:
- ✅ All subjects have assigned teachers
- ✅ Teachers have sufficient free time slots (count ≥ required periods)
- ✅ No duplicate subject assignments
- ✅ Class has defined subjects with weekly hours
- ✅ Academic year is active
- Return detailed validation report:
- Missing items list
- Warnings list
- Suggestions for fixing

#### 5.2 Teacher Availability Calculation

- For each teacher assigned to class/subject:
- Count subject's weekly_hours requirement
- Count teacher's available slots in free_time_slots JSON
- Display comparison:
- "Required: X periods/week"
- "Available: Y free slots"
- Status: Sufficient ✅ / Insufficient ⚠️

### 6. Additional Features

#### 6.1 Schedule Templates

- Save successful schedules as templates
- Apply templates to similar classes
- Template includes constraints and patterns

#### 6.2 History & Versioning

- Track all schedule changes
- Show generation history with timestamps
- Ability to rollback to previous version
- Compare two schedule versions

#### 6.3 Analytics Dashboard

- Statistics:
- Total schedules generated
- Average conflicts per schedule
- Teacher workload distribution
- Subject distribution across days/periods
- Generation success rate

#### 6.4 Notifications

- Real-time notifications for:
- Schedule generation complete
- Conflicts detected
- Draft saved
- Schedule published
- Teacher availability changes

## Implementation Order

1. **Backend Core** (Priority: Critical)

- Teacher availability service
- Draft model and endpoints
- Enhanced constraint solver
- Validation service

2. **Backend Export** (Priority: High)

- Excel export service
- PDF export service
- Image export service
- Export API endpoints

3. **Backend Optimization** (Priority: High)

- Enhanced genetic algorithm
- Conflict detection improvements
- Auto-resolution strategies

4. **Frontend Core UI** (Priority: Critical)

- Main schedule management page
- Dynamic filters
- Weekly schedule grid
- Constraint manager

5. **Frontend Advanced** (Priority: High)

- Conflict resolver
- Teacher availability panel
- Export interface
- Validation feedback

6. **Integration & Testing** (Priority: Critical)

- Connect all components
- Test role-based access
- Test teacher availability auto-update
- Test export functionality
- Test conflict resolution flow

7. **Polish & Enhancement** (Priority: Medium)

- Templates system
- History/versioning
- Analytics dashboard
- Performance optimization

## Technical Stack

**Backend**:

- `openpyxl` - Excel generation
- `reportlab` - PDF generation
- `Pillow` - Image generation
- Enhanced SQLAlchemy models

**Frontend**:

- React with TypeScript
- iOS-style components (from IOS-Style-example.tsx)
- Tanstack Query for data fetching
- React Hook Form for forms
- Zustand for state management

## Success Metrics

- ✅ Generate conflict-free schedules in < 30 seconds
- ✅ Export in all formats (Excel, PDF, PNG/JPG)
- ✅ Teacher availability automatically updates
- ✅ Soft constraints with warnings
- ✅ Save as draft when conflicts exist
- ✅ Role-based access working correctly
- ✅ Dynamic filtering based on database
- ✅ Beautiful, consistent iOS-style UI

### To-dos

- [x] Create TeacherAvailabilityService to auto-update free_time_slots when schedules are saved/deleted
- [x] Add status field to Schedule model and create draft management endpoints
- [x] Enhance ConstraintSolver to support priority levels (1-4) with detailed violation reports
- [x] Create ValidationService to check teacher availability sufficiency and schedule prerequisites
- [x] Implement Excel export using openpyxl with formatted tables and styling
- [x] Implement PDF export using reportlab with professional layout
- [x] Implement PNG/JPG export using Pillow for printable schedules
- [x] Create API endpoints for all export formats and bulk export
- [ ] Enhance GeneticScheduleOptimizer with multi-objective fitness and adaptive mutations
- [ ] Add session-based access control for morning/evening supervisors in dependencies.py
- [ ] Create ScheduleManagementPage with multi-step wizard interface
- [ ] Create ScheduleFilters component with cascade filtering (Period→Grade Level→Grade→Section)
- [ ] Create WeeklyScheduleGrid component with iOS-style design, showing subjects and teachers
- [ ] Create ConstraintManager pop-up for defining no-consecutive and placement constraints
- [ ] Create ConflictResolver dialog with list of conflicts and resolution options
- [ ] Create TeacherAvailabilityPanel showing color-coded grid that updates with schedule changes
- [ ] Create ScheduleExporter dialog with format selection and preview
- [ ] Enhance ScheduleGenerator with real-time progress, settings, and statistics
- [ ] Add validation feedback UI showing teacher availability status and missing requirements
- [ ] Connect frontend components to backend API endpoints with proper error handling
- [ ] Implement and test role-based access control for Director and Supervisors
- [ ] Test teacher availability auto-update when schedules saved/deleted
- [ ] Test complete workflow: conflict detection → save as draft → resolve → publish
- [ ] Add schedule templates feature to save and reuse successful schedules
- [ ] Add schedule history, versioning, and rollback functionality