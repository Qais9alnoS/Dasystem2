// School Management System Types
// Based on the backend architecture and database schema

// ===== Authentication & Users =====
export interface User {
    id?: number;
    username: string;
    password_hash?: string; // Never exposed to frontend
    role: UserRole;
    is_active: boolean;
    last_login?: string;
    created_at?: string;
}

export type UserRole = 'director' | 'finance' | 'morning_school' | 'evening_school';

export interface LoginCredentials {
    username: string;
    password: string;
    role: UserRole;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: Omit<User, 'password_hash'>;
}

// ===== Academic Years =====
export interface AcademicYear {
    id?: number;
    year_name: string; // e.g., "2025-2026"
    description?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

// ===== School Structure =====
export interface Class {
    id?: number;
    academic_year_id: number;
    session_type: SessionType;
    grade_level: GradeLevel;
    grade_number: number; // 1-6 for primary, 1-3 for others
    section_count: number;
    max_students_per_section?: number;
    created_at?: string;
}

export type SessionType = 'morning' | 'evening';
export type GradeLevel = 'primary' | 'intermediate' | 'secondary';

export interface Subject {
    id?: number;
    class_id: number;
    subject_name: string;
    weekly_hours: number;
    is_active?: boolean;
    created_at?: string;
}

// ===== Students ===== (Enhanced based on Arabic specifications)
export interface Student {
    id?: number;
    academic_year_id: number;

    // المعلومات الشخصية - Personal Information
    full_name: string;
    has_special_needs: boolean;
    special_needs_details?: string;
    father_name: string;
    grandfather_name: string; // اسم الجد (اب الاب)
    mother_name: string;
    birth_date: string;
    birth_place?: string;
    nationality?: string;
    father_occupation?: string;
    mother_occupation?: string; // (اختياري)
    religion?: string;
    gender: 'male' | 'female';

    // النقل - Transportation
    transportation_type: TransportationType;
    bus_number?: string;

    // معلومات التواصل - Contact Information
    landline_phone?: string; // رقم ارضي
    father_phone?: string; // رقم الاب
    mother_phone?: string; // رقم الام
    additional_phone?: string; // رقم هاتف اضافي
    detailed_address?: string; // العنوان التفصيلي

    // المعلومات الدراسية - Academic Information
    previous_school?: string; // المدرسة السابقة
    grade_level: GradeLevel; // المرحلة (ابتدائي، اعدادية، ثانوية)
    grade_number: number; // الصف
    section?: string; // الشعبة (اختياري)
    session_type: SessionType;
    ninth_grade_total?: number; // مجموع التاسع (للثانوي)

    notes?: string; // ملاحظات
    is_active: boolean;
    created_at?: string;
    updated_at?: string;

    // Additional fields for comprehensive student data
    photos?: string[]; // Student photos
    additional_info?: string; // Any additional information
}

// النقل - Transportation Types (Arabic specifications)
export type TransportationType =
    | 'walking' // مشي
    | 'full_bus' // باص كامل
    | 'half_bus_to_school' // نص باص بحيث بيروح عالمدرسة عالباص ويرجع مشي
    | 'half_bus_from_school'; // نص باص بحيث يروح عالمدرسة مشي ويرجع بالباص

// المعلومات المالية - Enhanced Financial Information
export interface StudentFinance {
    id?: number;
    student_id: number;
    academic_year_id: number;

    // Fee Structure - هيكل الرسوم
    school_fee: number; // القسط المدرسي
    school_fee_discount: number; // حسم القسط المدرسي
    bus_fee: number; // قسط الباص
    bus_fee_discount: number; // حسم الباص
    other_revenues: number; // ايرادات اخرى (دورات، لباس، اخرى)

    // Calculated Fields - الحقول المحسوبة
    total_amount: number; // الإجمالي: جمع الكل - المخصوم (المبلغ المطلوب من الطالب)
    total_paid: number; // الاجمالي المسدد: مجموعة الدفعات المسددة
    partial_balance: number; // الرصيد الجزئي: ما تبقى على الطالب من القسط
    total_balance: number; // الرصيد الكلي: مجموع رصيد السنة الحالية مع السنوات السابقة
    previous_years_balance: number; // رصيد السنوات السابقة

    payment_notes?: string; // ملاحظات الدفع
    created_at?: string;
    updated_at?: string;
}

export interface StudentPayment {
    id?: number;
    student_id: number;
    academic_year_id: number;
    payment_amount: number; // قيمة الدفعة
    payment_date: string; // تاريخ التسديد
    receipt_number?: string; // رقم امر القبض
    payment_method?: string;
    notes?: string;
    created_at?: string;
}

// المعلومات الدراسية - Enhanced Academic Information
export interface StudentAcademic {
    id?: number;
    student_id: number;
    academic_year_id: number;
    subject_id: number;

    // العلامات - Grades (based on Arabic specifications)
    board_grades?: number; // علامات السبور
    recitation_grades?: number; // علامات التسميع
    first_exam_grades?: number; // علامات المذاكرة الأولى
    midterm_grades?: number; // علامات الفحص النصفي
    second_exam_grades?: number; // علامات المذاكرة الثانية
    final_exam_grades?: number; // علامات الفحص النهائي
    behavior_grade?: number; // علامة السلوك
    activity_grade?: number; // علامات النشاط

    // الحضور والغياب - Attendance
    absence_days: number; // ايام الغياب (عدد)
    absence_dates?: string; // تاريخ الغياب (JSON array of dates)

    created_at?: string;
    updated_at?: string;

    // Additional calculated fields
    total_grade?: number; // Total calculated grade
    grade_percentage?: number; // Grade as percentage
    attendance_percentage?: number; // Attendance percentage
}

// ===== Teachers ===== (Enhanced based on Arabic specifications)
export interface Teacher {
    id?: number;
    academic_year_id: number;

    // المعلومات العامة - General Information
    full_name: string; // الاسم
    gender: 'male' | 'female'; // الجنس
    birth_date?: string; // تاريخ الميلاد
    phone?: string; // رقم تواصل
    nationality?: string; // الجنسية
    detailed_address?: string; // عنوان تفصيلي

    // المواصلات - Transportation (like students)
    transportation_type?: TransportationType;

    // الصفوف التي يدرسها - Classes they teach
    classes_taught?: number[]; // Array of class IDs
    sections_taught?: string[]; // الشعب التي يدرسها
    subjects_taught?: number[]; // Array of subject IDs - المواد التي يدرسها

    // اوقات فراغه - Free time slots
    free_time_slots?: string; // JSON format for scheduling

    // الشهادات - Qualifications
    qualifications?: string;

    // الخبرات - Experience
    experience?: string;

    notes?: string; // الملاحظات
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface TeacherAssignment {
    id?: number;
    teacher_id: number;
    class_id: number;
    subject_id: number;
    section?: string;
    created_at?: string;
}

// حصصه والاضافي - Teacher attendance and extra work tracking
export interface TeacherAttendance {
    id?: number;
    teacher_id: number;
    attendance_date: string;
    classes_attended: number; // هل داوم الحصص
    extra_classes: number; // هل عطى اضافي
    session_type: SessionType; // صباحي أو مسائي
    total_hours_worked: number; // مجموع الساعات المعمولة
    hourly_rate?: number; // سعر الحصة (للحساب التلقائي للراتب)
    calculated_salary?: number; // الراتب المحسوب تلقائياً
    notes?: string;
    status?: 'present' | 'absent' | 'late' | 'excused'; // Add status field
    created_at?: string;
}

// ===== Financial Management =====
export interface FinanceCategory {
    id?: number;
    category_name: string;
    category_type: 'income' | 'expense';
    is_default: boolean;
    is_active: boolean;
    created_at?: string;
}

export interface FinanceTransaction {
    id?: number;
    academic_year_id: number;
    category_id: number;
    transaction_type: 'income' | 'expense';
    amount: number;
    transaction_date: string;
    description?: string;
    reference_id?: number; // Links to students, teachers, activities etc.
    reference_type?: string; // 'student', 'teacher', 'activity', etc.
    receipt_number?: string;
    created_by?: number;
    created_at?: string;
}

export interface Budget {
    id?: number;
    academic_year_id: number;
    category: string;
    budgeted_amount: number;
    period_type: 'annual' | 'monthly' | 'quarterly';
    period_value?: number; // month number, quarter number, etc.
    description?: string;
    spent_amount?: number;
    remaining_amount?: number;
    created_at?: string;
    updated_at?: string;
}

// ===== Activities Management =====
export interface Activity {
    id?: number;
    academic_year_id: number;
    name: string;
    description?: string;
    activity_type: 'academic' | 'sports' | 'cultural' | 'social' | 'trip';
    session_type: 'morning' | 'evening' | 'both';
    target_grades: string[]; // ["grade_1", "grade_2", etc.]
    max_participants?: number;
    cost_per_student: number;
    start_date: string;
    end_date: string;
    registration_deadline?: string;
    location?: string;
    instructor_name?: string;
    requirements?: string;
    is_active: boolean;
    current_participants?: number;
    created_at?: string;
    updated_at?: string;
}

export interface ActivityParticipant {
    id?: number;
    activity_id: number;
    class_id: number;
    section?: string;
    is_participating: boolean;
    created_at?: string;
}

export interface StudentActivityParticipation {
    id?: number;
    student_id: number;
    activity_id: number;
    is_participating: boolean;
    created_at?: string;
}

// Activity Registration Interface
export interface ActivityRegistration {
    id?: number;
    student_id: number;
    activity_id: number;
    registration_date: string;
    payment_status: 'pending' | 'paid' | 'cancelled';
    payment_amount: number;
    notes?: string;
    student_name?: string;
    activity_name?: string;
    created_at?: string;
    updated_at?: string;
}

// Activity Schedule Interface
export interface ActivitySchedule {
    id?: number;
    activity_id: number;
    day_of_week: number; // 0=Monday, 1=Tuesday, ..., 6=Sunday
    start_time: string; // ISO time format
    end_time: string; // ISO time format
    location?: string;
    instructor_name?: string;
    notes?: string;
    activity_name?: string;
    day_name?: string;
    created_at?: string;
    updated_at?: string;
}

// Activity Attendance Interface
export interface ActivityAttendance {
    id?: number;
    registration_id: number;
    attendance_date: string;
    status: 'present' | 'absent' | 'excused';
    notes?: string;
    student_name?: string;
    activity_name?: string;
    created_at?: string;
    updated_at?: string;
}

// ===== Schedule Management =====
export interface Schedule {
    id?: number;
    academic_year_id: number;
    session_type: SessionType;
    class_id: number;
    section?: string;
    day_of_week: number; // 1-7 (Monday-Sunday)
    period_number: number;
    subject_id: number;
    teacher_id: number;
    created_at?: string;
}

export interface ScheduleConstraint {
    id?: number;
    academic_year_id: number;
    constraint_type: ConstraintType;

    // Target Specification
    class_id?: number;
    subject_id?: number;
    teacher_id?: number;

    // Time Specification
    day_of_week?: number; // 1-7 (Monday-Sunday), NULL for any day
    period_number?: number; // 1-8, NULL for any period
    time_range_start?: number;
    time_range_end?: number;

    // Consecutive Constraints
    max_consecutive_periods?: number;
    min_consecutive_periods?: number;

    // Advanced Options
    applies_to_all_sections: boolean;
    session_type: SessionType | 'both';
    priority_level: number; // 1=Low, 2=Medium, 3=High, 4=Critical

    description?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export type ConstraintType =
    | 'forbidden'
    | 'required'
    | 'no_consecutive'
    | 'max_consecutive'
    | 'min_consecutive';

// Constraint Template Interface
export interface ConstraintTemplate {
    id: number;
    template_name: string;
    template_description: string;
    constraint_config: Partial<ScheduleConstraint>;
    is_system_template: boolean;
    created_at?: string;
    updated_at?: string;
}

// ===== Director Dashboard =====

// ===== API Response Types =====
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

// ===== Search and Filter Types =====
export interface SearchParams {
    query?: string;
    academic_year_id?: number;
    session_type?: SessionType;
    grade_level?: GradeLevel;
    is_active?: boolean;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface StudentSearchResult {
    id: number;
    name: string;
    father_name: string;
    grade: string;
    section?: string;
    session: SessionType;
    status: 'current' | 'former';
    type: 'student';
    academic_year: number;
    has_financial_dues?: boolean;
}

export interface TeacherSearchResult {
    id: number;
    name: string;
    subjects: string[];
    classes?: string[];
    phone?: string;
    status: 'current' | 'former';
    type: 'teacher';
    academic_year: number;
}

export interface UniversalSearchResult {
    students: {
        current: StudentSearchResult[];
        former: StudentSearchResult[];
    };
    teachers: {
        current: TeacherSearchResult[];
        former: TeacherSearchResult[];
    };
    total_results: number;
}

// ===== Dashboard Analytics =====
export interface DashboardStats {
    total_students: number;
    total_teachers: number;
    monthly_revenue: number;
    active_activities: number;
    recent_activities: DashboardActivity[];
}

export interface DashboardActivity {
    id: number;
    type: 'student_registration' | 'payment' | 'schedule_creation' | 'teacher_added';
    title: string;
    description: string;
    timestamp: string;
    icon?: string;
    color?: string;
}

// ===== Form Types =====
export interface StudentRegistrationForm {
    // Personal Information
    full_name: string;
    father_name: string;
    grandfather_name: string;
    mother_name: string;
    birth_date: string;
    birth_place?: string;
    nationality?: string;
    gender: 'male' | 'female';
    religion?: string;

    // Parents Information
    father_occupation?: string;
    mother_occupation?: string;
    landline_phone?: string;
    father_phone?: string;
    mother_phone?: string;
    additional_phone?: string;
    detailed_address?: string;

    // Academic Information
    grade_level: GradeLevel;
    grade_number: number;
    section?: string;
    session_type: SessionType;
    previous_school?: string;
    ninth_grade_total?: number;

    // Special Needs
    has_special_needs: boolean;
    special_needs_details?: string;

    // Transportation
    transportation_type: TransportationType;
    bus_number?: string;

    // Additional
    notes?: string;
}

export interface TeacherRegistrationForm {
    full_name: string;
    gender: 'male' | 'female';
    birth_date?: string;
    phone?: string;
    nationality?: string;
    detailed_address?: string;
    transportation_type?: TransportationType;
    qualifications?: string;
    experience?: string;
    notes?: string;
}

// ===== File Management =====
export interface FileItem {
    id: number;
    filename: string;
    original_filename: string;
    file_path: string;
    file_size: number;
    file_type: string;
    uploaded_by: number;
    related_entity_type?: string;
    related_entity_id?: number;
    is_active: boolean;
    created_at: string;
}

export interface StorageStats {
    total_size: number;
    used_size: number;
    free_size: number;
    file_count: number;
}

// ===== System Configuration =====
export interface SystemSettings {
    id?: number;
    setting_key: string;
    setting_value?: string;
    description?: string;
    updated_at?: string;
}

export interface BackupHistory {
    id?: number;
    backup_path: string;
    backup_date: string;
    backup_size?: number;
    status: 'success' | 'failed';
    error_message?: string;
}

// ===== Director Tools =====
export interface DirectorNote {
    id?: number;
    academic_year_id: number;
    folder_type: 'goals' | 'projects' | 'blogs' | 'notes' | 'educational_admin';
    title: string;
    content: string;
    note_date: string;
    created_at?: string;
    updated_at?: string;
}

export interface Reward {
    id?: number;
    academic_year_id: number;
    title: string;
    reward_date: string;
    recipient_name: string;
    recipient_type: 'student' | 'teacher' | 'other';
    amount: number;
    description: string;
    created_at?: string;
}

export interface AssistanceRecord {
    id?: number;
    academic_year_id: number;
    title: string;
    assistance_date: string;
    organization: string;
    amount: number;
    description: string;
    created_at?: string;
}
