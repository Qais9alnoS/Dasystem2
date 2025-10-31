// Type definitions that mirror the Rust backend structure
// These will be used for seamless backend integration

export interface Project {
  id?: number;
  name: string;
  created_at?: string;
  updated_at?: string;
  db_path: string;
  is_active: boolean;
}

export interface ProjectDetails {
  project: Project;
  default_settings: DefaultSettings;
  grades: GradeWithDivisions[];
  teachers: TeacherWithSubjects[];
  constraints: Constraint[];
}

export interface DefaultSettings {
  id?: number;
  project_id: number;
  school_days: string[]; // ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]
  periods_per_day: number; // 6
  grades_range: string; // "الأول الابتدائي-الثالث الثانوي"
}

export interface Grade {
  id?: number;
  project_id: number;
  name: string; // "الصف الأول الابتدائي", "الصف الثاني الابتدائي", ...
  level: string; // "ابتدائي", "اعدادي", "ثانوي", "بكالوريا"
  grade_order: number; // 1 للصف الأول, 2 للصف الثاني...
}

export interface Division {
  id?: number;
  grade_id: number;
  name: string; // "أ", "ب", "شباب", "بنات", "أدبي مختلط"
  type: string; // "شعبة واحدة", "شباب", "بنات", "مختلط"
  division_order: number;
}

export interface GradeWithDivisions {
  grade: Grade;
  divisions: Division[];
}

export interface Subject {
  id?: number;
  project_id: number;
  name: string;
  weekly_hours: number;
  grade_id: number;
  is_mandatory: boolean;
}

export interface Teacher {
  id?: number;
  project_id: number;
  name: string;
  available_days?: string[]; // JSON array ["الأحد","الاثنين",...]
  max_daily_hours: number; // 6
}

export interface TeacherSubject {
  id?: number;
  teacher_id: number;
  subject_id: number;
  grade_id: number;
  division_id: number;
}

export interface TeacherWithSubjects {
  teacher: Teacher;
  subjects: TeacherSubject[];
}

export enum ConstraintType {
  ForbiddenPeriod = "forbidden",    // الحصة x ممنوع في اليوم y
  RequiredPeriod = "required",     // الحصة x يجب أن تكون في اليوم y
  Sequential = "sequential",       // الحصة x لا تكون متتالية
  MaxDailyHours = "max_daily_hours",     // أقصى عدد ساعات يومية للمعلم
  MinBreakBetween = "min_break_between"   // فاصل بين حصص المعلم
}

export interface ConstraintParameters {
  subject_id?: number;
  teacher_id?: number;
  grade_id?: number;
  division_id?: number;
  day?: string;
  period?: number;
  related_subject_id?: number;
}

export interface Constraint {
  id?: number;
  project_id: number;
  constraint_type: ConstraintType;
  description: string;
  parameters: ConstraintParameters;
  is_active: boolean;
}

export interface ScheduleEntry {
  id?: number;
  project_id: number;
  grade_id: number;
  division_id: number;
  day: string;
  period: number; // 1-6
  subject_id: number;
  teacher_id: number;
  created_at?: string;
}

export interface ScheduleGenerationResult {
  success: boolean;
  generated_schedules: ScheduleSummary[];
  missing_data: MissingDataInfo[];
  conflicts: ConstraintViolation[];
  total_grades: number;
  completed_grades: number;
  message: string;
}

export interface ScheduleSummary {
  grade_id: number;
  division_id: number;
  schedule: ScheduleEntry[];
}

export interface MissingDataInfo {
  grade: string;
  division: string;
  reason: string;
  suggestion: string;
  required_actions: string[];
}

export interface ConstraintViolation {
  constraint_type: string;
  description: string;
  suggestion: string;
  detailed_steps: string[];
  affected_items: string[];
  priority: string; // "عالي", "متوسط", "منخفض"
}

export interface TeacherSchedule {
  teacher_id: number;
  teacher_name: string;
  schedule: TeacherScheduleEntry[];
}

export interface TeacherScheduleEntry {
  day: string;
  period: number;
  subject: string;
  grade: string;
  division: string;
}

// Default data structures
export const DEFAULT_GRADES = [
  { name: "الصف الأول الابتدائي", level: "ابتدائي", grade_order: 1 },
  { name: "الصف الثاني الابتدائي", level: "ابتدائي", grade_order: 2 },
  { name: "الصف الثالث الابتدائي", level: "ابتدائي", grade_order: 3 },
  { name: "الصف الرابع الابتدائي", level: "ابتدائي", grade_order: 4 },
  { name: "الصف الخامس الابتدائي", level: "ابتدائي", grade_order: 5 },
  { name: "الصف السادس الابتدائي", level: "ابتدائي", grade_order: 6 },
  { name: "الصف السابع", level: "اعدادي", grade_order: 7 },
  { name: "الصف الثامن", level: "اعدادي", grade_order: 8 },
  { name: "الصف التاسع", level: "اعدادي", grade_order: 9 },
  { name: "الصف العاشر", level: "ثانوي", grade_order: 10 },
  { name: "الصف الحادي عشر", level: "ثانوي", grade_order: 11 },
  { name: "الصف الثالث ثانوي", level: "بكالوريا", grade_order: 12 },
];

export const DEFAULT_DIVISIONS = [
  // الصفوف 1-6: شعبة واحدة فقط
  { name: "أ", type: "شعبة واحدة", grade_order: 1, division_order: 1 },
  { name: "أ", type: "شعبة واحدة", grade_order: 2, division_order: 1 },
  { name: "أ", type: "شعبة واحدة", grade_order: 3, division_order: 1 },
  { name: "أ", type: "شعبة واحدة", grade_order: 4, division_order: 1 },
  { name: "أ", type: "شعبة واحدة", grade_order: 5, division_order: 1 },
  { name: "أ", type: "شعبة واحدة", grade_order: 6, division_order: 1 },
  // الصفوف 7-11: شعبتين (شباب وبنات)
  { name: "شباب", type: "شباب", grade_order: 7, division_order: 1 },
  { name: "بنات", type: "بنات", grade_order: 7, division_order: 2 },
  { name: "شباب", type: "شباب", grade_order: 8, division_order: 1 },
  { name: "بنات", type: "بنات", grade_order: 8, division_order: 2 },
  { name: "شباب", type: "شباب", grade_order: 9, division_order: 1 },
  { name: "بنات", type: "بنات", grade_order: 9, division_order: 2 },
  { name: "شباب", type: "شباب", grade_order: 10, division_order: 1 },
  { name: "بنات", type: "بنات", grade_order: 10, division_order: 2 },
  { name: "شباب", type: "شباب", grade_order: 11, division_order: 1 },
  { name: "بنات", type: "بنات", grade_order: 11, division_order: 2 },
  // البكالوريا: 3 شعب
  { name: "شباب", type: "شباب", grade_order: 12, division_order: 1 },
  { name: "بنات", type: "بنات", grade_order: 12, division_order: 2 },
  { name: "أدبي مختلط", type: "مختلط", grade_order: 12, division_order: 3 },
];