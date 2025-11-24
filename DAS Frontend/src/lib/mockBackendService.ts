import {
  Project,
  ProjectDetails,
  Subject,
  Teacher,
  TeacherWithSubjects,
  GradeWithDivisions,
  Constraint,
  ScheduleGenerationResult,
  TeacherSchedule,
  DEFAULT_GRADES,
  DEFAULT_DIVISIONS
} from '../types/backend';

// Mock data storage
let projects: Project[] = [];
let currentProject: ProjectDetails | null = null;

// Simulate backend delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockBackendService = {
  // Project management
  async createProject(name: string): Promise<Project> {
    await delay(500);
    const project: Project = {
      id: Date.now(),
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      db_path: `/data/${name.replace(/\s+/g, '_').toLowerCase()}.db`,
      is_active: true
    };
    projects.push(project);
    return project;
  },

  async getProjects(): Promise<Project[]> {
    await delay(300);
    return projects;
  },

  async getProjectDetails(projectId: number): Promise<ProjectDetails> {
    await delay(400);
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    // Return mock project details
    return {
      project,
      default_settings: {
        school_days: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
        periods_per_day: 6,
        grades_range: "الأول الابتدائي-الثالث الثانوي"
      },
      grades: DEFAULT_GRADES.map((grade, index) => ({
        grade: { ...grade, id: index + 1, project_id: projectId },
        divisions: DEFAULT_DIVISIONS
          .filter(d => d.grade_order === grade.grade_order)
          .map((div, divIndex) => ({
            ...div,
            id: (index * 10) + divIndex + 1,
            grade_id: index + 1
          }))
      })),
      teachers: [],
      constraints: []
    };
  },

  async setCurrentProject(project: ProjectDetails): Promise<void> {
    await delay(200);
    currentProject = project;
  },

  async getCurrentProject(): Promise<ProjectDetails | null> {
    await delay(100);
    return currentProject;
  },

  // Subjects management
  async createSubject(subject: Omit<Subject, 'id'>): Promise<Subject> {
    await delay(400);
    const newSubject: Subject = {
      ...subject,
      id: Date.now()
    };
    return newSubject;
  },

  async getSubjects(projectId: number): Promise<Subject[]> {
    await delay(300);
    return []; // Will be populated as subjects are created
  },

  // Teachers management
  async createTeacher(teacher: Omit<Teacher, 'id'>): Promise<Teacher> {
    await delay(400);
    const newTeacher: Teacher = {
      ...teacher,
      id: Date.now()
    };
    return newTeacher;
  },

  async getTeachers(projectId: number): Promise<TeacherWithSubjects[]> {
    await delay(300);
    return []; // Will be populated as teachers are created
  },

  async assignTeacherSubject(assignment: {
    teacher_id: number;
    subject_id: number;
    grade_id: number;
    division_id: number;
  }): Promise<void> {
    await delay(300);
    // Mock implementation
  },

  // Constraints management
  async createConstraint(constraint: Omit<Constraint, 'id'>): Promise<Constraint> {
    await delay(400);
    const newConstraint: Constraint = {
      ...constraint,
      id: Date.now()
    };
    return newConstraint;
  },

  async getConstraints(projectId: number): Promise<Constraint[]> {
    await delay(300);
    return []; // Will be populated as constraints are created
  },

  // Schedule generation
  async generateSchedule(projectId: number): Promise<ScheduleGenerationResult> {
    await delay(2000); // Simulate longer processing time
    
    return {
      success: true,
      generated_schedules: [],
      missing_data: [
        {
          grade: "الصف الأول الابتدائي",
          division: "أ",
          reason: "لا يوجد معلمون متاحون",
          suggestion: "يرجى إضافة معلمين للصف الأول الابتدائي",
          required_actions: ["إضافة معلم", "تعيين مواد للمعلم"]
        }
      ],
      conflicts: [
        {
          constraint_type: "forbidden",
          description: "معلم الرياضيات غير متاح في الحصة الأولى يوم الأحد",
          suggestion: "تغيير وقت الحصة أو إلغاء القيد",
          detailed_steps: ["مراجعة القيود", "تعديل جدول المعلم"],
          affected_items: ["رياضيات - الصف الأول", "الأحد - الحصة 1"],
          priority: "متوسط"
        }
      ],
      total_grades: 12,
      completed_grades: 0,
      message: "تم اكتشاف مشاكل في البيانات، يرجى مراجعة المعلمين والقيود"
    };
  },

  async getTeacherSchedules(projectId: number): Promise<TeacherSchedule[]> {
    await delay(500);
    return []; // Will be populated after schedule generation
  },

  // Utility methods for frontend
  async validateProjectData(projectId: number): Promise<{
    isValid: boolean;
    issues: string[];
    missing: { type: string; count: number }[];
  }> {
    await delay(600);
    return {
      isValid: false,
      issues: ["لا يوجد معلمون", "لا يوجد مواد دراسية", "لا توجد قيود محددة"],
      missing: [
        { type: "teachers", count: 0 },
        { type: "subjects", count: 0 },
        { type: "constraints", count: 0 }
      ]
    };
  }
};

// Backend service interface that will be implemented with actual API calls
export interface BackendService {
  createProject(name: string): Promise<Project>;
  getProjects(): Promise<Project[]>;
  getProjectDetails(projectId: number): Promise<ProjectDetails>;
  setCurrentProject(project: ProjectDetails): Promise<void>;
  getCurrentProject(): Promise<ProjectDetails | null>;
  createSubject(subject: Omit<Subject, 'id'>): Promise<Subject>;
  getSubjects(projectId: number): Promise<Subject[]>;
  createTeacher(teacher: Omit<Teacher, 'id'>): Promise<Teacher>;
  getTeachers(projectId: number): Promise<TeacherWithSubjects[]>;
  assignTeacherSubject(assignment: any): Promise<void>;
  createConstraint(constraint: Omit<Constraint, 'id'>): Promise<Constraint>;
  getConstraints(projectId: number): Promise<Constraint[]>;
  generateSchedule(projectId: number): Promise<ScheduleGenerationResult>;
  getTeacherSchedules(projectId: number): Promise<TeacherSchedule[]>;
  validateProjectData(projectId: number): Promise<any>;
}

// Export mock service as default - this will be replaced with real backend service
export default mockBackendService;