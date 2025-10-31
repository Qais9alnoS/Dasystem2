# Database Schema - School Management System

## Overview
SQLite database schema for a comprehensive school management system with financial tracking, student management, teacher management, and administrative features.

## Core Tables Structure

### 1. Academic Years (academic_years)
```sql
CREATE TABLE academic_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year_name VARCHAR(20) NOT NULL, -- e.g., "2025-2026"
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Users & Authentication (users)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('director', 'finance', 'morning_school', 'evening_school') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. School Information (school_info)
```sql
CREATE TABLE school_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER,
    session_type ENUM('morning', 'evening') NOT NULL,
    total_capacity INTEGER,
    total_teachers INTEGER,
    total_facilities INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

### 4. Classes & Sections (classes)
```sql
CREATE TABLE classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER,
    session_type ENUM('morning', 'evening') NOT NULL,
    grade_level ENUM('primary', 'intermediate', 'secondary') NOT NULL,
    grade_number INTEGER NOT NULL, -- 1-6 for primary, 1-3 for others
    section_count INTEGER DEFAULT 1,
    max_students_per_section INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

### 5. Subjects (subjects)
```sql
CREATE TABLE subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER,
    subject_name VARCHAR(100) NOT NULL,
    weekly_hours INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id)
);
```

## Student Management

### 6. Students (students)
```sql
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER,
    
    -- Personal Information
    full_name VARCHAR(200) NOT NULL,
    has_special_needs BOOLEAN DEFAULT FALSE,
    special_needs_details TEXT,
    father_name VARCHAR(100) NOT NULL,
    grandfather_name VARCHAR(100) NOT NULL,
    mother_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    birth_place VARCHAR(100),
    nationality VARCHAR(50),
    father_occupation VARCHAR(100),
    mother_occupation VARCHAR(100),
    religion VARCHAR(50),
    gender ENUM('male', 'female') NOT NULL,
    
    -- Transportation
    transportation_type ENUM('walking', 'full_bus', 'half_bus_to_school', 'half_bus_from_school') NOT NULL,
    bus_number VARCHAR(20),
    
    -- Contact Information
    landline_phone VARCHAR(20),
    father_phone VARCHAR(20),
    mother_phone VARCHAR(20),
    additional_phone VARCHAR(20),
    detailed_address TEXT,
    
    -- Academic Information
    previous_school VARCHAR(200),
    grade_level ENUM('primary', 'intermediate', 'secondary') NOT NULL,
    grade_number INTEGER NOT NULL,
    section VARCHAR(10),
    session_type ENUM('morning', 'evening') NOT NULL,
    ninth_grade_total DECIMAL(5,2), -- Only for secondary students
    
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

### 7. Student Financial Information (student_finances)
```sql
CREATE TABLE student_finances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    academic_year_id INTEGER,
    
    -- Fees Structure
    school_fee DECIMAL(10,2) DEFAULT 0,
    school_fee_discount DECIMAL(10,2) DEFAULT 0,
    bus_fee DECIMAL(10,2) DEFAULT 0,
    bus_fee_discount DECIMAL(10,2) DEFAULT 0,
    other_revenues DECIMAL(10,2) DEFAULT 0, -- courses, uniforms, etc.
    
    -- Calculated Fields
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (
        school_fee - school_fee_discount + 
        bus_fee - bus_fee_discount + 
        other_revenues
    ) STORED,
    
    payment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

### 8. Student Payments (student_payments)
```sql
CREATE TABLE student_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    academic_year_id INTEGER,
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    receipt_number VARCHAR(50),
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

### 9. Student Academic Records (student_academics)
```sql
CREATE TABLE student_academics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    academic_year_id INTEGER,
    subject_id INTEGER,
    
    -- Grades
    board_grades DECIMAL(5,2),
    recitation_grades DECIMAL(5,2),
    first_exam_grades DECIMAL(5,2),
    midterm_grades DECIMAL(5,2),
    second_exam_grades DECIMAL(5,2),
    final_exam_grades DECIMAL(5,2),
    behavior_grade DECIMAL(5,2),
    activity_grade DECIMAL(5,2),
    
    -- Attendance
    absence_days INTEGER DEFAULT 0,
    absence_dates TEXT, -- JSON array of dates
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);
```

## Teacher Management

### 10. Teachers (teachers)
```sql
CREATE TABLE teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER,
    
    -- Personal Information
    full_name VARCHAR(200) NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    birth_date DATE,
    phone VARCHAR(20),
    nationality VARCHAR(50),
    detailed_address TEXT,
    
    -- Transportation
    transportation_type ENUM('walking', 'full_bus', 'half_bus_to_school', 'half_bus_from_school'),
    
    -- Professional Information
    qualifications TEXT,
    experience TEXT,
    free_time_slots TEXT, -- JSON format for scheduling
    
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

### 11. Teacher Assignments (teacher_assignments)
```sql
CREATE TABLE teacher_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER,
    class_id INTEGER,
    subject_id INTEGER,
    section VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);
```

### 12. Teacher Attendance (teacher_attendance)
```sql
CREATE TABLE teacher_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER,
    attendance_date DATE NOT NULL,
    classes_attended INTEGER DEFAULT 0,
    extra_classes INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);
```

## Schedule Management

### 13. Schedules (schedules)
```sql
CREATE TABLE schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER,
    session_type ENUM('morning', 'evening') NOT NULL,
    class_id INTEGER,
    section VARCHAR(10),
    day_of_week INTEGER, -- 1-7 (Monday-Sunday)
    period_number INTEGER,
    subject_id INTEGER,
    teacher_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);
```

### 14. Enhanced Schedule Constraints (schedule_constraints)
```sql
CREATE TABLE schedule_constraints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER,
    constraint_type ENUM('forbidden', 'required', 'no_consecutive', 'max_consecutive', 'min_consecutive') NOT NULL,
    
    -- Target Specification
    class_id INTEGER,
    subject_id INTEGER,
    teacher_id INTEGER,
    
    -- Time Specification
    day_of_week INTEGER, -- 1-7 (Monday-Sunday), NULL for any day
    period_number INTEGER, -- 1-8, NULL for any period
    time_range_start INTEGER, -- For range constraints (e.g., periods 1-4)
    time_range_end INTEGER,
    
    -- Consecutive Constraints
    max_consecutive_periods INTEGER, -- For consecutive constraints
    min_consecutive_periods INTEGER,
    
    -- Advanced Options
    applies_to_all_sections BOOLEAN DEFAULT FALSE,
    session_type ENUM('morning', 'evening', 'both') DEFAULT 'both',
    priority_level INTEGER DEFAULT 1, -- 1=Low, 2=Medium, 3=High, 4=Critical
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- Constraint Templates for Common Patterns
CREATE TABLE constraint_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name VARCHAR(100) NOT NULL,
    template_description TEXT,
    constraint_config JSON, -- Stores constraint configuration
    is_system_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedule Generation History
CREATE TABLE schedule_generation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER,
    session_type ENUM('morning', 'evening') NOT NULL,
    generation_algorithm VARCHAR(50), -- 'genetic', 'backtrack', 'greedy'
    generation_parameters JSON,
    constraints_count INTEGER,
    conflicts_resolved INTEGER,
    generation_time_seconds INTEGER,
    quality_score DECIMAL(5,2), -- 0-100 rating of schedule quality
    status ENUM('success', 'partial', 'failed') NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

### Enhanced Constraint Examples:

#### Forbidden Constraints:
```sql
-- Math cannot be in first period on Monday
INSERT INTO schedule_constraints (constraint_type, subject_id, day_of_week, period_number, description)
VALUES ('forbidden', (SELECT id FROM subjects WHERE subject_name = 'Math'), 1, 1, 'Math class forbidden in first period Monday');

-- PE cannot be after 6th period
INSERT INTO schedule_constraints (constraint_type, subject_id, period_number, description)
VALUES ('forbidden', (SELECT id FROM subjects WHERE subject_name = 'PE'), 7, 'PE not allowed in late periods');
```

#### Required Constraints:
```sql
-- Arabic must be in morning periods (1-4)
INSERT INTO schedule_constraints (constraint_type, subject_id, time_range_start, time_range_end, description)
VALUES ('required', (SELECT id FROM subjects WHERE subject_name = 'Arabic'), 1, 4, 'Arabic must be scheduled in morning periods');

-- Assembly must be Monday first period
INSERT INTO schedule_constraints (constraint_type, subject_id, day_of_week, period_number, description)
VALUES ('required', (SELECT id FROM subjects WHERE subject_name = 'Assembly'), 1, 1, 'Assembly required Monday first period');
```

#### Consecutive Constraints:
```sql
-- Math cannot have more than 1 consecutive period
INSERT INTO schedule_constraints (constraint_type, subject_id, max_consecutive_periods, description)
VALUES ('max_consecutive', (SELECT id FROM subjects WHERE subject_name = 'Math'), 1, 'Math maximum 1 consecutive period');

-- Science lab requires exactly 2 consecutive periods
INSERT INTO schedule_constraints (constraint_type, subject_id, min_consecutive_periods, max_consecutive_periods, description)
VALUES ('min_consecutive', (SELECT id FROM subjects WHERE subject_name = 'Science Lab'), 2, 2, 'Science lab needs 2 consecutive periods');
```

## Financial Management

### 15. Finance Categories (finance_categories)
```sql
CREATE TABLE finance_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name VARCHAR(100) NOT NULL,
    category_type ENUM('income', 'expense') NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 16. Finance Transactions (finance_transactions)
```sql
CREATE TABLE finance_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER,
    category_id INTEGER,
    transaction_type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    reference_id INTEGER, -- Links to students, teachers, activities etc.
    reference_type VARCHAR(50), -- 'student', 'teacher', 'activity', etc.
    receipt_number VARCHAR(50),
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (category_id) REFERENCES finance_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

## Activities Management

### 17. Activities (activities)
```sql
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER,
    activity_name VARCHAR(200) NOT NULL,
    activity_date DATE NOT NULL,
    session_type ENUM('morning', 'evening', 'mixed') NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    participant_count INTEGER DEFAULT 0,
    images TEXT, -- JSON array of image paths
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

### 18. Activity Participants (activity_participants)
```sql
CREATE TABLE activity_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER,
    class_id INTEGER,
    section VARCHAR(10),
    is_participating BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (activity_id) REFERENCES activities(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
);
```

### 19. Student Activity Participation (student_activity_participation)
```sql
CREATE TABLE student_activity_participation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    activity_id INTEGER,
    is_participating BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (activity_id) REFERENCES activities(id)
);
```

## Director's Dashboard

### 20. Director Notes (director_notes)
```sql
CREATE TABLE director_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER,
    folder_type ENUM('goals', 'projects', 'blogs', 'notes', 'educational_admin') NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    note_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

### 21. Rewards (rewards)
```sql
CREATE TABLE rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER,
    title VARCHAR(200) NOT NULL,
    reward_date DATE NOT NULL,
    recipient_name VARCHAR(200) NOT NULL,
    recipient_type ENUM('student', 'teacher', 'other') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

### 22. Assistance Records (assistance_records)
```sql
CREATE TABLE assistance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_year_id INTEGER,
    title VARCHAR(200) NOT NULL,
    assistance_date DATE NOT NULL,
    organization VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);
```

## System Configuration

### 23. System Settings (system_settings)
```sql
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 24. Backup History (backup_history)
```sql
CREATE TABLE backup_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_path VARCHAR(500) NOT NULL,
    backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    backup_size INTEGER,
    status ENUM('success', 'failed') NOT NULL,
    error_message TEXT
);
```

## Indexes for Performance

```sql
-- Academic Years
CREATE INDEX idx_academic_years_active ON academic_years(is_active);

-- Students
CREATE INDEX idx_students_academic_year ON students(academic_year_id);
CREATE INDEX idx_students_name ON students(full_name);
CREATE INDEX idx_students_grade ON students(grade_level, grade_number);
CREATE INDEX idx_students_session ON students(session_type);

-- Teachers
CREATE INDEX idx_teachers_academic_year ON teachers(academic_year_id);
CREATE INDEX idx_teachers_name ON teachers(full_name);

-- Finance
CREATE INDEX idx_finance_transactions_year ON finance_transactions(academic_year_id);
CREATE INDEX idx_finance_transactions_date ON finance_transactions(transaction_date);
CREATE INDEX idx_finance_transactions_type ON finance_transactions(transaction_type);

-- Schedules
CREATE INDEX idx_schedules_class_section ON schedules(class_id, section);
CREATE INDEX idx_schedules_teacher ON schedules(teacher_id);
CREATE INDEX idx_schedules_day_period ON schedules(day_of_week, period_number);

-- Activities
CREATE INDEX idx_activities_year ON activities(academic_year_id);
CREATE INDEX idx_activities_date ON activities(activity_date);
```

## Database Relationships Summary

1. **One-to-Many Relationships:**
   - academic_years → students, teachers, classes, activities
   - students → student_finances, student_payments, student_academics
   - teachers → teacher_assignments, teacher_attendance
   - classes → subjects, schedules
   - activities → activity_participants

2. **Many-to-Many Relationships:**
   - students ↔ activities (through student_activity_participation)
   - teachers ↔ subjects (through teacher_assignments)
   - classes ↔ activities (through activity_participants)

3. **Self-referencing:**
   - finance_transactions can reference students, teachers, activities through reference_id/reference_type

This schema supports:
- Multi-year data management
- Dual session (morning/evening) operations
- Comprehensive financial tracking
- Flexible scheduling with constraints
- Activity management with participation tracking
- Director's administrative tools
- Automatic backup and system settings