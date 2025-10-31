// API Service Layer for Python FastAPI Backend Integration
import {
  User, UserRole, AuthResponse, LoginCredentials,
  AcademicYear,
  Class, Subject,
  Student, StudentFinance, StudentPayment, StudentAcademic,
  Teacher, TeacherAssignment, TeacherAttendance,
  FinanceCategory, FinanceTransaction, Budget,
  Activity, ActivityParticipant, StudentActivityParticipation,
  ActivityRegistration, ActivitySchedule, ActivityAttendance,
  Schedule, ScheduleConstraint, ConstraintTemplate,
  DirectorNote, Reward, AssistanceRecord,
  FileItem, StorageStats
} from '../types/school';
import { getSecurityHeaders } from '@/lib/security';

// Base API configuration
const API_BASE_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT = 30000; // 30 seconds

// Types for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  detail?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Enhanced error handling
class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: any;

  constructor(message: string, status: number, code: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Request interceptor for authentication
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor(baseURL: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('das_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': 'ar,en',
      ...getSecurityHeaders(),
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          localStorage.removeItem('das_token');
          localStorage.removeItem('das_user');
          window.location.href = '/login';
          throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
        }

        const errorData = await response.json().catch(() => null);
        throw new ApiError(
          errorData?.message || errorData?.detail || `HTTP ${response.status}`,
          response.status,
          errorData?.code || 'HTTP_ERROR',
          errorData
        );
      }

      const data = await response.json();
      
      // Handle both response formats:
      // 1. Direct data (standard API response)
      // 2. Wrapped response with success/data properties
      if (data && typeof data === 'object' && 'success' in data) {
        // Wrapped response format
        return {
          success: data.success,
          data: data.data,
          message: data.message,
          errors: data.errors,
          detail: data.detail
        };
      } else {
        // Direct data format (standard API response)
        return {
          success: true,
          data: data
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry logic for network errors
      if (attempt < this.retryAttempts && error instanceof TypeError) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.makeRequest<T>(endpoint, options, attempt + 1);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    // Sanitize input data before sending
    const sanitizedData = this.sanitizeInput(data);
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    // Sanitize input data before sending
    const sanitizedData = this.sanitizeInput(data);
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(sanitizedData),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    // Sanitize input data before sending
    const sanitizedData = this.sanitizeInput(data);
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(sanitizedData),
    });
  }

  // Input sanitization to prevent injection attacks
  private sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      // Sanitize strings
      return data
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    } else if (Array.isArray(data)) {
      // Recursively sanitize array elements
      return data.map(item => this.sanitizeInput(item));
    } else if (typeof data === 'object' && data !== null) {
      // Recursively sanitize object properties
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Sanitize the key and value
        const sanitizedKey = key
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
        sanitized[sanitizedKey] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    return data;
  }
}

// Create API client instance
const apiClient = new ApiClient();

// Classes API
export const classesApi = {
  getAll: async (academic_year_id?: number) => {
    const params = academic_year_id ? `?academic_year_id=${academic_year_id}` : '';
    return apiClient.get<Class[]>(`/academic/classes${params}`);
  },

  getById: async (id: number) => {
    return apiClient.get<Class>(`/academic/classes/${id}`);
  },

  create: async (cls: Omit<Class, 'id' | 'created_at'>) => {
    return apiClient.post<Class>('/academic/classes', cls);
  },

  update: async (id: number, cls: Partial<Class>) => {
    return apiClient.put<Class>(`/academic/classes/${id}`, cls);
  },
};

// Subjects API
export const subjectsApi = {
  getAll: async (class_id?: number) => {
    const params = class_id ? `?class_id=${class_id}` : '';
    return apiClient.get<Subject[]>(`/academic/subjects${params}`);
  },

  getById: async (id: number) => {
    return apiClient.get<Subject>(`/academic/subjects/${id}`);
  },

  create: async (subject: Omit<Subject, 'id' | 'created_at'>) => {
    return apiClient.post<Subject>('/academic/subjects', subject);
  },

  update: async (id: number, subject: Partial<Subject>) => {
    return apiClient.put<Subject>(`/academic/subjects/${id}`, subject);
  },

  delete: async (id: number) => {
    return apiClient.delete<{ message: string }>(`/academic/subjects/${id}`);
  },
};

// Authentication API
export const authApi = {
  login: async (credentials: LoginCredentials) => {
    return apiClient.post<AuthResponse>('/auth/login', credentials);
  },

  logout: async () => {
    return apiClient.post<void>('/auth/logout', {});
  },

  changePassword: async (data: { current_password: string; new_password: string }) => {
    return apiClient.post<void>('/auth/change-password', data);
  },

  getMe: async () => {
    return apiClient.get<Omit<User, 'password_hash'>>('/auth/me');
  },

  refresh: async () => {
    return apiClient.post<AuthResponse>('/auth/refresh', {});
  },

  resetPassword: async (data: { username: string; role: string }) => {
    return apiClient.post<void>('/auth/reset-password', data);
  },
};

// Students API
export const studentsApi = {
  getAll: async (params?: {
    academic_year_id?: number;
    session_type?: string;
    grade_level?: string;
    grade_number?: number;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiClient.get<Student[]>(`/students/${queryString}`);
  },

  getById: async (id: number) => {
    return apiClient.get<Student>(`/students/${id}`);
  },

  create: async (student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
    return apiClient.post<Student>('/students/', student);
  },

  update: async (id: number, student: Partial<Student>) => {
    return apiClient.put<Student>(`/students/${id}`, student);
  },

  deactivate: async (id: number) => {
    return apiClient.delete<{ message: string }>(`/students/${id}`);
  },

  getFinances: async (student_id: number, academic_year_id?: number) => {
    const params = academic_year_id ? `?academic_year_id=${academic_year_id}` : '';
    return apiClient.get<StudentFinance>(`/students/${student_id}/finances${params}`);
  },

  createFinance: async (student_id: number, finance: Omit<StudentFinance, 'id' | 'student_id' | 'created_at' | 'updated_at'>) => {
    return apiClient.post<StudentFinance>(`/students/${student_id}/finances`, finance);
  },

  getPayments: async (student_id: number, academic_year_id?: number) => {
    const params = academic_year_id ? `?academic_year_id=${academic_year_id}` : '';
    return apiClient.get<StudentPayment[]>(`/students/${student_id}/payments${params}`);
  },

  recordPayment: async (student_id: number, payment: Omit<StudentPayment, 'id' | 'student_id' | 'created_at'>) => {
    return apiClient.post<StudentPayment>(`/students/${student_id}/payments`, payment);
  },

  getAcademics: async (student_id: number, academic_year_id?: number, subject_id?: number) => {
    const paramsObj: any = {};
    if (academic_year_id) paramsObj.academic_year_id = academic_year_id;
    if (subject_id) paramsObj.subject_id = subject_id;
    const params = Object.keys(paramsObj).length > 0 ? '?' + new URLSearchParams(paramsObj).toString() : '';
    return apiClient.get<StudentAcademic[]>(`/students/${student_id}/academics${params}`);
  },

  createAcademic: async (student_id: number, academic: Omit<StudentAcademic, 'id' | 'student_id' | 'created_at' | 'updated_at'>) => {
    return apiClient.post<StudentAcademic>(`/students/${student_id}/academics`, academic);
  },

  updateAcademic: async (student_id: number, academic_id: number, academic: Partial<StudentAcademic>) => {
    return apiClient.put<StudentAcademic>(`/students/${student_id}/academics/${academic_id}`, academic);
  },

  search: async (query: string, academic_year_id?: number, session_type?: string, limit: number = 20) => {
    const paramsObj: any = { q: query, limit };
    if (academic_year_id) paramsObj.academic_year_id = academic_year_id;
    if (session_type) paramsObj.session_type = session_type;
    const params = '?' + new URLSearchParams(paramsObj).toString();
    return apiClient.get<Student[]>(`/students/search/${params}`);
  },
};

// Teachers API
export const teachersApi = {
  getAll: async (params?: {
    academic_year_id?: number;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiClient.get<Teacher[]>(`/teachers/${queryString}`);
  },

  getById: async (id: number) => {
    return apiClient.get<Teacher>(`/teachers/${id}`);
  },

  create: async (teacher: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>) => {
    return apiClient.post<Teacher>('/teachers/', teacher);
  },

  update: async (id: number, teacher: Partial<Teacher>) => {
    return apiClient.put<Teacher>(`/teachers/${id}`, teacher);
  },

  delete: async (id: number) => {
    return apiClient.delete<{ message: string }>(`/teachers/${id}`);
  },

  search: async (query: string, skip: number = 0, limit: number = 50) => {
    const params = '?' + new URLSearchParams({ q: query, skip: skip.toString(), limit: limit.toString() }).toString();
    return apiClient.get<Teacher[]>(`/teachers/search/${params}`);
  },

  getAttendance: async (teacher_id: number, month: number, year: number) => {
    const params = '?' + new URLSearchParams({ month: month.toString(), year: year.toString() }).toString();
    return apiClient.get<TeacherAttendance[]>(`/teachers/${teacher_id}/attendance${params}`);
  },

  recordAttendance: async (teacher_id: number, attendance: Omit<TeacherAttendance, 'id' | 'teacher_id' | 'created_at'>) => {
    return apiClient.post<TeacherAttendance>(`/teachers/${teacher_id}/attendance`, attendance);
  },

  getFinanceRecords: async (teacher_id: number, params?: {
    academic_year_id?: number;
    month?: number;
    year?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiClient.get<any[]>(`/teachers/${teacher_id}/finance${queryString}`);
  },
};

// Academic Years API
export const academicYearsApi = {
  getAll: async () => {
    return apiClient.get<AcademicYear[]>('/academic/years');
  },

  getById: async (id: number) => {
    return apiClient.get<AcademicYear>(`/academic/years/${id}`);
  },

  create: async (academicYear: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at'>) => {
    return apiClient.post<AcademicYear>('/academic/years', academicYear);
  },

  update: async (id: number, academicYear: Partial<AcademicYear>) => {
    return apiClient.put<AcademicYear>(`/academic/years/${id}`, academicYear);
  },

  delete: async (id: number) => {
    return apiClient.delete<void>(`/academic/years/${id}`);
  },

  // First-run setup methods
  checkFirstRun: async () => {
    return apiClient.get<{ is_first_run: boolean; message: string }>('/academic/first-run-check');
  },

  initializeFirstYear: async (academicYear: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at'>) => {
    return apiClient.post<AcademicYear>('/academic/initialize-first-year', academicYear);
  },
  
  updateConfiguration: async (key: string, value: string, config_type: string = "string", description?: string, category?: string) => {
    return apiClient.put<any>(`/advanced/config/${key}`, { value, config_type, description, category });
  },

  migratePreview: async (data: { from_year_id: number; to_year_id: number }) => {
    return apiClient.post<any>('/academic/years/migrate/preview', data);
  },

  migrateExecute: async (data: { from_year_id: number; to_year_id: number }) => {
    return apiClient.post<any>('/academic/years/migrate/execute', data);
  },
};

// Activities API
export const activitiesApi = {
  getAll: async (params?: {
    academic_year_id?: number;
    activity_type?: string;
    session_type?: string;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiClient.get<Activity[]>(`/activities/${queryString}`);
  },

  getById: async (id: number) => {
    return apiClient.get<Activity>(`/activities/${id}`);
  },

  create: async (activity: Omit<Activity, 'id' | 'created_at'>) => {
    return apiClient.post<Activity>('/activities/', activity);
  },

  update: async (id: number, activity: Partial<Activity>) => {
    return apiClient.put<Activity>(`/activities/${id}`, activity);
  },

  delete: async (id: number) => {
    return apiClient.delete<{ message: string }>(`/activities/${id}`);
  },

  search: async (query: string, activity_type?: string, session_type?: string, skip: number = 0, limit: number = 50) => {
    const paramsObj: any = { q: query, skip: skip.toString(), limit: limit.toString() };
    if (activity_type) paramsObj.activity_type = activity_type;
    if (session_type) paramsObj.session_type = session_type;
    const params = '?' + new URLSearchParams(paramsObj).toString();
    return apiClient.get<Activity[]>(`/activities/search/${params}`);
  },

  getParticipants: async (activity_id: number) => {
    return apiClient.get<ActivityParticipant[]>(`/activities/${activity_id}/participants`);
  },

  addParticipants: async (activity_id: number, participants: Omit<ActivityParticipant, 'id' | 'activity_id' | 'created_at'>[]) => {
    return apiClient.post<void>(`/activities/${activity_id}/participants`, { participants });
  },

  getStudentParticipation: async (activity_id: number) => {
    return apiClient.get<StudentActivityParticipation[]>(`/activities/${activity_id}/student-participation`);
  },

  addStudentParticipation: async (activity_id: number, participation: Omit<StudentActivityParticipation, 'id' | 'activity_id' | 'created_at'>[]) => {
    return apiClient.post<void>(`/activities/${activity_id}/student-participation`, { participation });
  },

  // Activity Registration Functions
  getRegistrations: async (activity_id: number, payment_status?: string) => {
    const params = payment_status ? `?payment_status=${payment_status}` : '';
    return apiClient.get<ActivityRegistration[]>(`/activities/${activity_id}/registrations${params}`);
  },

  createRegistration: async (activity_id: number, registration: Omit<ActivityRegistration, 'id' | 'created_at' | 'updated_at' | 'student_name' | 'activity_name'>) => {
    return apiClient.post<ActivityRegistration>(`/activities/${activity_id}/registrations`, registration);
  },

  updateRegistration: async (activity_id: number, registration_id: number, registration: Partial<ActivityRegistration>) => {
    return apiClient.put<ActivityRegistration>(`/activities/${activity_id}/registrations/${registration_id}`, registration);
  },

  deleteRegistration: async (activity_id: number, registration_id: number) => {
    return apiClient.delete<void>(`/activities/${activity_id}/registrations/${registration_id}`);
  },

  // Activity Attendance Functions
  getAttendance: async (activity_id: number) => {
    return apiClient.get<ActivityAttendance[]>(`/activities/${activity_id}/attendance`);
  },

  recordAttendance: async (activity_id: number, attendance: Omit<ActivityAttendance, 'id' | 'created_at' | 'updated_at' | 'student_name' | 'activity_name'>) => {
    return apiClient.post<ActivityAttendance>(`/activities/${activity_id}/attendance`, attendance);
  },

  updateAttendance: async (activity_id: number, attendance_id: number, attendance: Partial<ActivityAttendance>) => {
    return apiClient.put<ActivityAttendance>(`/activities/${activity_id}/attendance/${attendance_id}`, attendance);
  },

  deleteAttendance: async (activity_id: number, attendance_id: number) => {
    return apiClient.delete<void>(`/activities/${activity_id}/attendance/${attendance_id}`);
  },

  // Activity Schedule Functions
  getSchedule: async (activity_id: number) => {
    return apiClient.get<ActivitySchedule[]>(`/activities/${activity_id}/schedule`);
  },

  createSchedule: async (activity_id: number, schedule: Omit<ActivitySchedule, 'id' | 'created_at' | 'updated_at' | 'activity_name' | 'day_name'>) => {
    return apiClient.post<ActivitySchedule>(`/activities/${activity_id}/schedule`, schedule);
  },

  updateSchedule: async (activity_id: number, schedule_id: number, schedule: Partial<ActivitySchedule>) => {
    return apiClient.put<ActivitySchedule>(`/activities/${activity_id}/schedule/${schedule_id}`, schedule);
  },

  deleteSchedule: async (activity_id: number, schedule_id: number) => {
    return apiClient.delete<void>(`/activities/${activity_id}/schedule/${schedule_id}`);
  },
};

// Financial API
export const financeApi = {
  getTransactions: async (params?: {
    academic_year_id?: number;
    transaction_type?: string;
    category?: string;
    start_date?: string;
    end_date?: string;
    payment_method?: string;
    skip?: number;
    limit?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiClient.get<FinanceTransaction[]>(`/finance/transactions${queryString}`);
  },

  createTransaction: async (transaction: Omit<FinanceTransaction, 'id' | 'created_at'>) => {
    return apiClient.post<FinanceTransaction>('/finance/transactions', transaction);
  },

  updateTransaction: async (id: number, transaction: Partial<FinanceTransaction>) => {
    return apiClient.put<FinanceTransaction>(`/finance/transactions/${id}`, transaction);
  },

  deleteTransaction: async (id: number) => {
    return apiClient.delete<void>(`/finance/transactions/${id}`);
  },

  getCategories: async (is_active?: boolean) => {
    const params = is_active !== undefined ? `?is_active=${is_active}` : '';
    return apiClient.get<FinanceCategory[]>(`/finance/categories${params}`);
  },

  createCategory: async (category: Omit<FinanceCategory, 'id' | 'created_at'>) => {
    return apiClient.post<FinanceCategory>('/finance/categories', category);
  },

  updateCategory: async (id: number, category: Partial<FinanceCategory>) => {
    return apiClient.put<FinanceCategory>(`/finance/categories/${id}`, category);
  },

  getBudgets: async (params?: {
    academic_year_id?: number;
    category?: string;
    period_type?: string;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiClient.get<Budget[]>(`/finance/budgets${queryString}`);
  },

  createBudget: async (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'spent_amount' | 'remaining_amount'>) => {
    return apiClient.post<Budget>('/finance/budgets', budget);
  },

  updateBudget: async (id: number, budget: Partial<Budget>) => {
    return apiClient.put<Budget>(`/finance/budgets/${id}`, budget);
  },

  deleteBudget: async (id: number) => {
    return apiClient.delete<void>(`/finance/budgets/${id}`);
  },

  getDashboard: async (academic_year_id: number, start_date?: string, end_date?: string) => {
    const paramsObj: any = { academic_year_id };
    if (start_date) paramsObj.start_date = start_date;
    if (end_date) paramsObj.end_date = end_date;
    const params = '?' + new URLSearchParams(paramsObj).toString();
    return apiClient.get<any>(`/finance/dashboard${params}`);
  },

  getReports: async (type: string, params: any) => {
    return apiClient.post<any>(`/finance/reports/${type}`, params);
  },
};

// Schedule API
export const schedulesApi = {
  getAll: async (params?: {
    academic_year_id?: number;
    session_type?: string;
    class_id?: number;
    teacher_id?: number;
    skip?: number;
    limit?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiClient.get<Schedule[]>(`/api/schedules/${queryString}`);
  },

  getById: async (id: number) => {
    return apiClient.get<Schedule>(`/api/schedules/${id}`);
  },

  create: async (schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>) => {
    return apiClient.post<Schedule>('/api/schedules/', schedule);
  },

  update: async (id: number, schedule: Partial<Schedule>) => {
    return apiClient.put<Schedule>(`/api/schedules/${id}`, schedule);
  },

  delete: async (id: number) => {
    return apiClient.delete<{ message: string }>(`/api/schedules/${id}`);
  },

  getWeeklyView: async (academic_year_id: number, session_type: string, class_id?: number, teacher_id?: number) => {
    const paramsObj: any = { academic_year_id, session_type };
    if (class_id) paramsObj.class_id = class_id;
    if (teacher_id) paramsObj.teacher_id = teacher_id;
    const params = '?' + new URLSearchParams(paramsObj).toString();
    return apiClient.get<any>(`/api/schedules/weekly-view${params}`);
  },

  analyzeConflicts: async (academic_year_id: number, session_type: string) => {
    const params = '?' + new URLSearchParams({ academic_year_id: academic_year_id.toString(), session_type }).toString();
    return apiClient.get<any>(`/api/schedules/analysis/conflicts${params}`);
  },

  getConstraints: async (academic_year_id?: number) => {
    const params = academic_year_id ? `?academic_year_id=${academic_year_id}` : '';
    return apiClient.get<ScheduleConstraint[]>(`/api/schedules/constraints${params}`);
  },

  createConstraint: async (constraint: Omit<ScheduleConstraint, 'id' | 'created_at' | 'updated_at'>) => {
    return apiClient.post<ScheduleConstraint>('/api/schedules/constraints', constraint);
  },

  updateConstraint: async (id: number, constraint: Partial<ScheduleConstraint>) => {
    return apiClient.put<ScheduleConstraint>(`/api/schedules/constraints/${id}`, constraint);
  },

  deleteConstraint: async (id: number) => {
    return apiClient.delete<void>(`/api/schedules/constraints/${id}`);
  },

  // Constraint Template Management
  getConstraintTemplates: async (params?: {
    is_system_template?: boolean;
    skip?: number;
    limit?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiClient.get<ConstraintTemplate[]>(`/api/schedules/constraint-templates/${queryString}`);
  },

  getConstraintTemplate: async (id: number) => {
    return apiClient.get<ConstraintTemplate>(`/api/schedules/constraint-templates/${id}`);
  },

  createConstraintTemplate: async (template: Omit<ConstraintTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    return apiClient.post<ConstraintTemplate>('/api/schedules/constraint-templates/', template);
  },

  updateConstraintTemplate: async (id: number, template: Partial<ConstraintTemplate>) => {
    return apiClient.put<ConstraintTemplate>(`/api/schedules/constraint-templates/${id}`, template);
  },

  deleteConstraintTemplate: async (id: number) => {
    return apiClient.delete<void>(`/api/schedules/constraint-templates/${id}`);
  },
};

// Search API
export const searchApi = {
  universal: async (query: string, params?: {
    scope?: string;
    mode?: string;
    academic_year_id?: number;
    session_type?: string;
    skip?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const searchParams: any = { query, ...params };
    const queryString = '?' + new URLSearchParams(
      Object.entries(searchParams)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return apiClient.get<any>(`/search/universal${queryString}`);
  },

  quick: async (query: string, limit: number = 10) => {
    const params = '?' + new URLSearchParams({ query, limit: limit.toString() }).toString();
    return apiClient.get<any>(`/search/quick${params}`);
  },

  students: async (query: string, academic_year_id?: number, class_id?: number, skip: number = 0, limit: number = 50) => {
    const paramsObj: any = { query, skip: skip.toString(), limit: limit.toString() };
    if (academic_year_id) paramsObj.academic_year_id = academic_year_id;
    if (class_id) paramsObj.class_id = class_id;
    const params = '?' + new URLSearchParams(paramsObj).toString();
    return apiClient.get<any>(`/search/students${params}`);
  },

  teachers: async (query: string, subject_id?: number, skip: number = 0, limit: number = 50) => {
    const paramsObj: any = { query, skip: skip.toString(), limit: limit.toString() };
    if (subject_id) paramsObj.subject_id = subject_id;
    const params = '?' + new URLSearchParams(paramsObj).toString();
    return apiClient.get<any>(`/search/teachers${params}`);
  },
};

// System API
export const systemApi = {
  getStatus: async () => {
    return apiClient.get<any>('/system/status');
  },

  getBackupStats: async () => {
    return apiClient.get<any>('/system/backup/stats');
  },

  createDatabaseBackup: async (backup_name: string) => {
    return apiClient.post<any>('/system/backup/database', { backup_name });
  },

  listBackups: async (backup_type?: string) => {
    const params = backup_type ? `?backup_type=${backup_type}` : '';
    return apiClient.get<any>(`/system/backup/list${params}`);
  },

  restoreBackup: async (backup_name: string) => {
    return apiClient.post<any>(`/system/backup/restore/${backup_name}`, {});
  },

  sendNotification: async (title: string, message: string, severity: string) => {
    return apiClient.post<any>('/system/notification/send', { title, message, severity });
  },

  testTelegramConnection: async () => {
    return apiClient.get<any>('/system/notification/test');
  },

  // Configuration Management
  getConfigurations: async () => {
    return apiClient.get<any>('/advanced/config');
  },

  updateConfiguration: async (key: string, value: string, config_type: string = "string", description?: string, category?: string) => {
    return apiClient.put<any>(`/advanced/config/${key}`, { value, config_type, description, category });
  },
};

// Monitoring API
export const monitoringApi = {
  getLogs: async (params?: {
    level?: string;
    module?: string;
    start_date?: string;
    end_date?: string;
    search_term?: string;
    skip?: number;
    limit?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiClient.get<any>(`/monitoring/logs${queryString}`);
  },

  getSystemHealth: async () => {
    return apiClient.get<any>('/monitoring/health');
  },

  getPerformanceMetrics: async () => {
    return apiClient.get<any>('/monitoring/metrics');
  },

  getAnalyticsDashboard: async () => {
    return apiClient.get<any>('/monitoring/analytics/dashboard');
  },

  getUsageStatistics: async (days?: number) => {
    const params = days ? `?days=${days}` : '';
    return apiClient.get<any>(`/monitoring/analytics/usage${params}`);
  },

  logEvent: async (level: string, message: string, module?: string, additional_data?: any) => {
    return apiClient.post<any>('/monitoring/events/log', { level, message, module, additional_data });
  },
};

// Director Tools API
export const directorApi = {
  getNotes: async (academic_year_id?: number, folder_type?: string) => {
    const paramsObj: any = {};
    if (academic_year_id) paramsObj.academic_year_id = academic_year_id;
    if (folder_type) paramsObj.folder_type = folder_type;
    const params = Object.keys(paramsObj).length > 0 ? '?' + new URLSearchParams(paramsObj).toString() : '';
    return apiClient.get<DirectorNote[]>(`/director/notes${params}`);
  },

  createNote: async (note: Omit<DirectorNote, 'id' | 'created_at' | 'updated_at'>) => {
    return apiClient.post<DirectorNote>('/director/notes', note);
  },

  updateNote: async (id: number, note: Partial<DirectorNote>) => {
    return apiClient.put<DirectorNote>(`/director/notes/${id}`, note);
  },

  deleteNote: async (id: number) => {
    return apiClient.delete<void>(`/director/notes/${id}`);
  },

  getRewards: async (academic_year_id?: number) => {
    const params = academic_year_id ? `?academic_year_id=${academic_year_id}` : '';
    return apiClient.get<Reward[]>(`/director/rewards${params}`);
  },

  createReward: async (reward: Omit<Reward, 'id' | 'created_at'>) => {
    return apiClient.post<Reward>('/director/rewards', reward);
  },

  updateReward: async (id: number, reward: Partial<Reward>) => {
    return apiClient.put<Reward>(`/director/rewards/${id}`, reward);
  },

  deleteReward: async (id: number) => {
    return apiClient.delete<void>(`/director/rewards/${id}`);
  },

  getAssistanceRecords: async (academic_year_id?: number) => {
    const params = academic_year_id ? `?academic_year_id=${academic_year_id}` : '';
    return apiClient.get<AssistanceRecord[]>(`/director/assistance${params}`);
  },

  createAssistanceRecord: async (record: Omit<AssistanceRecord, 'id' | 'created_at'>) => {
    return apiClient.post<AssistanceRecord>('/director/assistance', record);
  },

  updateAssistanceRecord: async (id: number, record: Partial<AssistanceRecord>) => {
    return apiClient.put<AssistanceRecord>(`/director/assistance/${id}`, record);
  },

  deleteAssistanceRecord: async (id: number) => {
    return apiClient.delete<void>(`/director/assistance/${id}`);
  },

  getDashboardStats: async (academic_year_id?: number | null) => {
    const params = academic_year_id !== null && academic_year_id !== undefined ? `?academic_year_id=${academic_year_id}` : '';
    return apiClient.get<any>(`/director/dashboard${params}`);
  }
};

// File Management API
export const filesApi = {
  getAll: async () => {
    return apiClient.get<FileItem[]>('/files');
  },

  upload: async (formData: FormData) => {
    return apiClient.post<FileItem>('/files/upload', formData);
  },

  download: async (id: number) => {
    return apiClient.get<FileItem>(`/files/${id}/download`);
  },

  delete: async (id: number) => {
    return apiClient.delete<void>(`/files/${id}`);
  },

  getStorageStats: async () => {
    return apiClient.get<StorageStats>('/files/stats');
  },
};

// Export API client and error class
export { ApiClient, ApiError };
export default apiClient;