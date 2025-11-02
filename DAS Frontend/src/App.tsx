import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { SplashScreen } from '@/components/SplashScreen';
import { FirstRunSetup } from '@/components/FirstRunSetup';
import { AcademicYearManagementPage, DashboardPage, StudentPersonalInfoPage, StudentAcademicInfoPage, SchoolInfoManagementPage, AddEditGradePage, TeacherManagementPage } from '@/pages';
import LoginPage from '@/pages/LoginPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedApp = () => {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [needsFirstRunSetup, setNeedsFirstRunSetup] = useState(false);
  const [checkingFirstRun, setCheckingFirstRun] = useState(true);

  // Check if first run setup is needed
  useEffect(() => {
    const checkFirstRunStatus = async () => {
      // Skip first run check if already completed in this session
      const firstRunCompleted = localStorage.getItem('first_run_completed');
      if (firstRunCompleted === 'true') {
        setCheckingFirstRun(false);
        return;
      }

      try {
        // Import the API service dynamically to avoid circular dependencies
        const { academicYearsApi } = await import('@/services/api');
        const response = await academicYearsApi.checkFirstRun();
        
        if (response.success && response.data) {
          setNeedsFirstRunSetup(response.data.is_first_run);
          // If not first run, mark it as completed
          if (!response.data.is_first_run) {
            localStorage.setItem('first_run_completed', 'true');
          }
        }
      } catch (error) {
        console.error('Error checking first run status:', error);
        // Continue with normal flow if check fails
        localStorage.setItem('first_run_completed', 'true');
      } finally {
        setCheckingFirstRun(false);
      }
    };

    if (state.isAuthenticated) {
      checkFirstRunStatus();
    }
  }, [state.isAuthenticated]);

  // Show loading while auth is initializing (prevents login flash)
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading state while checking
  if (checkingFirstRun) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show first run setup if needed
  if (needsFirstRunSetup) {
    return (
      <FirstRunSetup 
        onComplete={() => {
          setNeedsFirstRunSetup(false);
          localStorage.setItem('first_run_completed', 'true');
          // After first run, navigate to year management
          navigate('/academic-years');
        }} 
      />
    );
  }

  // Routes for authenticated users
  return (
    <Routes>
      <Route path="/*" element={<DesktopLayout />}>
        {/* Default route - check year selection and redirect accordingly */}
        <Route index element={<YearSelectionCheck />} />
        {/* Dashboard route - show the main dashboard */}
        <Route path="dashboard" element={<DashboardPage />} />
        {/* Academic Year Management */}
        <Route path="academic-years" element={<AcademicYearManagementPage />} />
        {/* School Info Management */}
        <Route path="school-info" element={<SchoolInfoManagementPage />} />
        <Route path="school-info/add-grade" element={<AddEditGradePage />} />
        <Route path="school-info/edit-grade/:gradeId" element={<AddEditGradePage />} />
        {/* Student Management */}
        <Route path="students/personal-info" element={<StudentPersonalInfoPage />} />
        <Route path="students/academic-info" element={<StudentAcademicInfoPage />} />
        {/* Teacher Management */}
        <Route path="teachers" element={<TeacherManagementPage />} />
        {/* Catch-all for undefined routes */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

// Component to check year selection and redirect
const YearSelectionCheck = () => {
  const [loading, setLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  useEffect(() => {
    const checkAndSetDefaultYear = async () => {
      const selectedYearId = localStorage.getItem('selected_academic_year_id');
      
      if (selectedYearId) {
        // Year already selected
        setShouldRedirect(true);
        setLoading(false);
        return;
      }
      
      // Check for active/default year from backend
      try {
        const { academicYearsApi } = await import('@/services/api');
        const response = await academicYearsApi.getAll();
        
        let years = [];
        if (response.success && response.data) {
          years = response.data;
        } else if (Array.isArray(response)) {
          years = response;
        }
        
        // Find the active year
        const activeYear = years.find((year: any) => year.is_active);
        
        if (activeYear) {
          // Set the active year as selected
          localStorage.setItem('selected_academic_year_id', activeYear.id?.toString() || '');
          localStorage.setItem('selected_academic_year_name', activeYear.year_name || '');
          localStorage.setItem('auto_open_academic_year', 'true');
          setShouldRedirect(true);
        }
      } catch (error) {
        console.error('Error fetching default year:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAndSetDefaultYear();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (shouldRedirect) {
    // If year is selected, go to dashboard
    return <Navigate to="/dashboard" replace />;
  } else {
    // If no year selected, go to year management
    return <Navigate to="/academic-years" replace />;
  }
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} storageKey="theme-preference">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <ProjectProvider>
                <Router>
                  <div className="app-container bg-background text-foreground font-ios">
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/*" element={<ProtectedApp />} />
                    </Routes>
                    <Toaster />
                  </div>
                </Router>
              </ProjectProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;