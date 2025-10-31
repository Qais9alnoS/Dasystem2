import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  Project,
  ProjectDetails,
  DefaultSettings,
  GradeWithDivisions,
  TeacherWithSubjects,
  Constraint,
  ScheduleEntry
} from '@/types/project';

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  projectDetails: ProjectDetails | null;
  isLoading: boolean;
  error: string | null;
}

type ProjectAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'SET_PROJECT_DETAILS'; payload: ProjectDetails | null }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: number }
  | { type: 'UPDATE_SETTINGS'; payload: DefaultSettings }
  | { type: 'UPDATE_GRADES'; payload: GradeWithDivisions[] }
  | { type: 'UPDATE_TEACHERS'; payload: TeacherWithSubjects[] }
  | { type: 'UPDATE_CONSTRAINTS'; payload: Constraint[] }
  | { type: 'UPDATE_SCHEDULES'; payload: ScheduleEntry[] };

const initialState: ProjectState = {
  currentProject: null,
  projects: [],
  projectDetails: null,
  isLoading: false,
  error: null,
};

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'SET_PROJECT_DETAILS':
      return { ...state, projectDetails: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
        currentProject: state.currentProject?.id === action.payload.id ? action.payload : state.currentProject,
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject,
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        projectDetails: state.projectDetails ? {
          ...state.projectDetails,
          default_settings: action.payload,
        } : null,
      };
    case 'UPDATE_GRADES':
      return {
        ...state,
        projectDetails: state.projectDetails ? {
          ...state.projectDetails,
          grades: action.payload,
        } : null,
      };
    case 'UPDATE_TEACHERS':
      return {
        ...state,
        projectDetails: state.projectDetails ? {
          ...state.projectDetails,
          teachers: action.payload,
        } : null,
      };
    case 'UPDATE_CONSTRAINTS':
      return {
        ...state,
        projectDetails: state.projectDetails ? {
          ...state.projectDetails,
          constraints: action.payload,
        } : null,
      };
    case 'UPDATE_SCHEDULES':
      // This would be handled differently based on actual schedule structure
      return state;
    default:
      return state;
  }
}

const ProjectContext = createContext<{
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
} | null>(null);

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

// Mock functions for backend integration - these will be replaced with actual Tauri commands
export const projectService = {
  async createProject(name: string): Promise<Project> {
    // This will be replaced with actual Tauri command: invoke('create_project', { name })
    const project: Project = {
      id: Math.floor(Math.random() * 1000) + 1, // Mock ID
      name,
      db_path: `data/projects/${name.replace(/\s+/g, '_').toLowerCase()}/database.db`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    return project;
  },

  async loadProjects(): Promise<Project[]> {
    // This will be replaced with actual Tauri command: invoke('load_projects')
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  },

  async loadProjectDetails(projectId: number): Promise<ProjectDetails> {
    // This will be replaced with actual Tauri command: invoke('load_project_details', { projectId })
    await new Promise(resolve => setTimeout(resolve, 800));
    throw new Error('Not implemented - will be replaced with Tauri backend');
  },

  async generateSchedules(projectId: number): Promise<any> {
    // This will be replaced with actual Tauri command: invoke('generate_schedules', { projectId })
    await new Promise(resolve => setTimeout(resolve, 2000));
    throw new Error('Not implemented - will be replaced with Tauri backend');
  },

  async updateProjectData(
    projectId: number,
    dataType: 'teachers' | 'subjects' | 'constraints' | 'settings',
    data: any
  ): Promise<any> {
    // This will be replaced with actual Tauri command: invoke('update_project_data', { projectId, dataType, data })
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Mock: Updating ${dataType} for project ${projectId}:`, data);
    return { success: true };
  },

  async getTeacherSchedule(projectId: number, teacherId: number): Promise<any> {
    // This will be replaced with actual Tauri command: invoke('get_teacher_schedule', { projectId, teacherId })
    await new Promise(resolve => setTimeout(resolve, 300));
    throw new Error('Not implemented - will be replaced with Tauri backend');
  },

  async validateConstraints(projectId: number): Promise<any> {
    // This will be replaced with actual Tauri command: invoke('validate_constraints', { projectId })
    await new Promise(resolve => setTimeout(resolve, 600));
    throw new Error('Not implemented - will be replaced with Tauri backend');
  },

  async deleteProject(projectId: number): Promise<void> {
    // This will be replaced with actual Tauri command: invoke('delete_project', { projectId })
    await new Promise(resolve => setTimeout(resolve, 400));
    console.log(`Mock: Deleting project ${projectId}`);
  },

  async exportSchedules(projectId: number, format: 'pdf' | 'excel' | 'csv'): Promise<string> {
    // This will be replaced with actual Tauri command: invoke('export_schedules', { projectId, format })
    await new Promise(resolve => setTimeout(resolve, 1500));
    throw new Error('Not implemented - will be replaced with Tauri backend');
  }
};