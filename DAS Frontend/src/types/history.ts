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
  student: 'طالب',
  class: 'صف',
  subject: 'مادة',
  teacher: 'أستاذ',
  transaction: 'معاملة مالية',
  finance_card: 'بطاقة صندوق',
  payment: 'دفعة',
  activity: 'نشاط',
  note: 'ملاحظة',
  year: 'سنة دراسية',
  user: 'مستخدم',
  schedule: 'جدول',
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
