/**
 * History Types - TypeScript interfaces for history tracking system
 */

export interface HistoryLog {
  id: number;
  timestamp: string;
  action_type: string;
  action_category: string;
  entity_type: string;
  entity_id: number | null;
  entity_name: string;
  user_id: number | null;
  user_name: string | null;
  user_role: string | null;
  description: string;
  meta_data: Record<string, any> | null;
  session_type: string | null;
  severity: 'info' | 'warning' | 'critical';
  is_visible: boolean;
  tags: string[] | null;
  academic_year_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface HistoryStatistics {
  actions_today: number;
  actions_week: number;
  actions_month: number;
  most_active_user: string | null;
  most_active_user_count: number;
  last_action_time: string | null;
  action_breakdown: Record<string, number>;
}

export interface HistoryFilters {
  skip?: number;
  limit?: number;
  action_category?: string;
  action_type?: string;
  entity_type?: string;
  severity?: string;
  start_date?: string;
  end_date?: string;
  search_query?: string;
  academic_year_id?: number;
}

export interface HistoryListResponse {
  items: HistoryLog[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

// Action type labels in Arabic
export const ACTION_TYPE_LABELS: Record<string, string> = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  activate: 'تفعيل',
  deactivate: 'إلغاء تفعيل',
};

// Action category labels in Arabic
export const ACTION_CATEGORY_LABELS: Record<string, string> = {
  morning: 'الفترة الصباحية',
  evening: 'الفترة المسائية',
  finance: 'المالية',
  director: 'المدير',
  system: 'النظام',
  activity: 'النشاطات',
};

// Entity type labels in Arabic
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  // Main entity types
  student: 'طالب',
  class: 'صف',
  subject: 'مادة',
  teacher: 'أستاذ',
  transaction: 'معاملة مالية',
  payment: 'دفعة',
  activity: 'نشاط',
  note: 'ملاحظة',
  year: 'سنة دراسية',
  user: 'مستخدم',
  schedule: 'جدول',

  // Finance entities with underscore
  finance_card: 'بطاقة صندوق',
  finance_card_transaction: 'معاملة بطاقة صندوق',

  // Finance entities with hyphen
  'finance-card': 'بطاقة صندوق',
  'finance-card-transaction': 'معاملة بطاقة صندوق',

  // Academic entities with underscore
  academic_year: 'سنة دراسية',

  // Academic entities with hyphen
  'academic-year': 'سنة دراسية',

  // Other compound entities
  'director-note': 'ملاحظة المدير',
  'director_note': 'ملاحظة المدير',
  'student-payment': 'دفعة طالب',
  'student_payment': 'دفعة طالب',
  'teacher-schedule': 'جدول أستاذ',
  'teacher_schedule': 'جدول أستاذ',
  'student-activity': 'نشاط طالب',
  'student_activity': 'نشاط طالب',
};

// Severity colors for UI with dark mode support
export const SEVERITY_COLORS: Record<string, string> = {
  info: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-800',
  critical: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800',
};

// Action type icons (using lucide-react icon names)
export const ACTION_TYPE_ICONS: Record<string, string> = {
  create: 'PlusCircle',
  update: 'Edit',
  delete: 'Trash2',
  activate: 'CheckCircle',
  deactivate: 'XCircle',
};

// Category icons
export const CATEGORY_ICONS: Record<string, string> = {
  morning: 'Sun',
  evening: 'Moon',
  finance: 'DollarSign',
  director: 'Shield',
  system: 'Settings',
  activity: 'Target',
};

// Grade level labels in Arabic
export const GRADE_LEVEL_LABELS: Record<string, string> = {
  'KG': 'روضة',
  'Primary': 'ابتدائي',
  'Elementary': 'ابتدائي',
  'Middle': 'إعدادي',
  'Secondary': 'ثانوي',
  'High': 'ثانوي',
};

// Grade number labels in Arabic
export const GRADE_NUMBER_LABELS: Record<string, string> = {
  '1': 'الأول',
  '2': 'الثاني',
  '3': 'الثالث',
  '4': 'الرابع',
  '5': 'الخامس',
  '6': 'السادس',
  '7': 'السابع',
  '8': 'الثامن',
  '9': 'التاسع',
  '10': 'العاشر',
  '11': 'الحادي عشر',
  '12': 'الثاني عشر',
};

// Helper function to format class names in Arabic
export const formatClassName = (entityName: string): string => {
  // Pattern 1: Backend format "الصف primary - 1" or "الصف intermediate - 2"
  const backendMatch = entityName.match(/الصف\s+(primary|intermediate|secondary|Primary|Intermediate|Secondary)\s*-\s*(\d+)/i);
  if (backendMatch) {
    const gradeLevelEn = backendMatch[1].toLowerCase();
    const gradeNumber = backendMatch[2];

    const gradeLevelAr = GRADE_LEVEL_LABELS[gradeLevelEn.charAt(0).toUpperCase() + gradeLevelEn.slice(1)] || gradeLevelEn;
    const gradeNumberAr = GRADE_NUMBER_LABELS[gradeNumber] || gradeNumber;

    return `الصف ${gradeNumberAr} ${gradeLevelAr}`;
  }

  // Pattern 2: "Grade 1", "Grade 2 - A", etc.
  const gradeMatch = entityName.match(/(?:Grade|الصف)\s*(\d+)(?:\s*-\s*([A-Za-zأ-ي]+))?/i);
  if (gradeMatch) {
    const gradeNumber = gradeMatch[1];
    const section = gradeMatch[2] || '';
    const arabicGrade = GRADE_NUMBER_LABELS[gradeNumber] || gradeNumber;

    // Determine grade level based on grade number
    let gradeLevel = 'ابتدائي'; // default to Primary
    const gradeNum = parseInt(gradeNumber);
    if (gradeNum <= 6) {
      gradeLevel = 'ابتدائي';
    } else if (gradeNum <= 9) {
      gradeLevel = 'إعدادي';
    } else {
      gradeLevel = 'ثانوي';
    }

    if (section) {
      return `الصف ${arabicGrade} ${gradeLevel} - ${section}`;
    }
    return `الصف ${arabicGrade} ${gradeLevel}`;
  }

  // Pattern 3: Already in correct Arabic format
  if (entityName.includes('الصف') && (entityName.includes('ابتدائي') || entityName.includes('إعدادي') || entityName.includes('ثانوي'))) {
    return entityName;
  }

  // Return original if no pattern matched
  return entityName;
};

// Severity labels in Arabic
export const SEVERITY_LABELS: Record<string, string> = {
  info: 'معلومات',
  warning: 'تحذير',
  critical: 'حرج',
};

// User role labels in Arabic
export const USER_ROLE_LABELS: Record<string, string> = {
  // Main roles
  admin: 'مدير',
  director: 'مدير',
  morning: 'صباحي',
  evening: 'مسائي',
  teacher: 'أستاذ',
  finance: 'مالية',

  // Combined roles with underscore
  'morning_admin': 'مدير صباحي',
  'evening_admin': 'مدير مسائي',
  'morning_school': 'مدرسة صباحية',
  'evening_school': 'مدرسة مسائية',
  'finance_admin': 'مدير مالي',

  // Combined roles with hyphen
  'morning-admin': 'مدير صباحي',
  'evening-admin': 'مدير مسائي',
  'morning-school': 'مدرسة صباحية',
  'evening-school': 'مدرسة مسائية',
  'finance-admin': 'مدير مالي',
};

// Common field name labels in Arabic
export const FIELD_NAME_LABELS: Record<string, string> = {
  // Academic Year fields
  academic_year: 'السنة الدراسية',
  year_name: 'اسم السنة',
  start_date: 'تاريخ البدء',
  end_date: 'تاريخ الانتهاء',
  is_active: 'نشط',

  // Finance fields
  finance_card: 'بطاقة صندوق',
  finance_card_transaction: 'معاملة بطاقة صندوق',
  transaction_type: 'نوع المعاملة',
  amount: 'المبلغ',
  balance: 'الرصيد',
  description: 'الوصف',
  notes: 'ملاحظات',
  school_fee: 'القسط المدرسي',
  bus_fee: 'قسط الباص',
  school_discount_value: 'حسم القسط',
  bus_discount_value: 'حسم الباص',
  payment_amount: 'المبلغ المدفوع',

  // Student fields
  student: 'الطالب',
  student_name: 'اسم الطالب',
  full_name: 'الاسم الكامل',
  father_name: 'اسم الأب',
  mother_name: 'اسم الأم',
  birth_date: 'تاريخ الميلاد',
  grade: 'الصف',
  grade_number: 'الصف',
  class: 'الشعبة',
  section: 'الشعبة',
  session_type: 'الفترة',
  transportation_type: 'نوع المواصلات',
  bus_number: 'رقم الباص',

  // Class fields
  grade_level: 'المرحلة',
  section_count: 'عدد الشعب',
  max_students_per_section: 'الحد الأقصى للطلاب',

  // Teacher fields
  teacher: 'الأستاذ',
  teacher_name: 'اسم الأستاذ',
  subject: 'المادة',
  subjects: 'المواد',
  free_time_slots: 'الأوقات المتاحة',

  // Common fields
  status: 'الحالة',
  created_at: 'تاريخ الإنشاء',
  updated_at: 'تاريخ التحديث',
  name: 'الاسم',
  type: 'النوع',
  date: 'التاريخ',
  time: 'الوقت',

  // Attendance fields
  attendance: 'الحضور',
  attendance_rate: 'نسبة الحضور',
  present: 'حاضر',
  absent: 'غائب',

  // Schedule fields
  schedule: 'الجدول',
  day: 'اليوم',
  period: 'الحصة',

  // Activity fields
  activity: 'النشاط',
  activity_name: 'اسم النشاط',
  activity_type: 'نوع النشاط',
  cost_per_student: 'التكلفة للطالب',
  max_participants: 'الحد الأقصى للمشاركين',
  target_grades: 'الصفوف المستهدفة',
  participants: 'المشاركون',

  // System fields
  user: 'المستخدم',
  username: 'اسم المستخدم',
  role: 'الصلاحية',
  permissions: 'الصلاحيات',
};
