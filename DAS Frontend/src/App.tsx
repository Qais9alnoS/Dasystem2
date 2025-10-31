import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { AcademicYearManagementPage, DashboardPage } from '@/pages';
import LoginPage from '@/pages/LoginPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedApp = () => {
  const { state } = useAuth();
  const [needsFirstRunSetup, setNeedsFirstRunSetup] = useState(false);
  const [checkingFirstRun, setCheckingFirstRun] = useState(true);
  const [needsYearSelection, setNeedsYearSelection] = useState(false);

  // Check if first run setup is needed
  useEffect(() => {
    const checkFirstRunStatus = async () => {
      // Skip first run check if already completed in this session
      const firstRunCompleted = localStorage.getItem('first_run_completed');
      if (firstRunCompleted === 'true') {
        // Check if year selection is needed
        const autoOpenSetting = localStorage.getItem('auto_open_academic_year');
        const selectedYearId = localStorage.getItem('selected_academic_year_id');
        
        // If we have a selected year, check if it's set as active/default
        if (selectedYearId) {
          // If auto_open_academic_year is true or not set (default behavior), go directly to dashboard
          if (autoOpenSetting !== 'false') {
            // Don't show year selection, let the router handle navigation
          } else {
            setNeedsYearSelection(true);
          }
        } else {
          // No selected year, need to select one
          setNeedsYearSelection(true);
        }
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
            
            // Check if year selection is needed
            const autoOpenSetting = localStorage.getItem('auto_open_academic_year');
            const selectedYearId = localStorage.getItem('selected_academic_year_id');
            
            // If we have a selected year, check if it's set as active/default
            if (selectedYearId) {
              // If auto_open_academic_year is true or not set (default behavior), go directly to dashboard
              if (autoOpenSetting !== 'false') {
                // Don't show year selection, let the router handle navigation
              } else {
                setNeedsYearSelection(true);
              }
            } else {
              // No selected year, need to select one
              setNeedsYearSelection(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking first run status:', error);
        // Continue with normal flow if check fails
      } finally {
        setCheckingFirstRun(false);
      }
    };

    if (state.isAuthenticated) {
      checkFirstRunStatus();
    }
  }, [state.isAuthenticated]);

  if (!state.isAuthenticated) {
    return <LoginPage />;
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
        }} 
      />
    );
  }

  // Show year selection if needed
  if (needsYearSelection) {
    return <AcademicYearManagementPage onYearSelected={() => setNeedsYearSelection(false)} />;
  }
  
  // Check if we have a selected year and should navigate to dashboard
  const storedSelectedYearId = localStorage.getItem('selected_academic_year_id');
  if (storedSelectedYearId && !needsYearSelection) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if we should auto-navigate to dashboard
  const autoOpenSetting = localStorage.getItem('auto_open_academic_year');
  const selectedYearId = localStorage.getItem('selected_academic_year_id');
  
  if (autoOpenSetting === 'true' && selectedYearId) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If we have a selected year but auto-open is disabled, still allow navigation to dashboard
  if (selectedYearId) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/*" element={<DesktopLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        {/* Dashboard route - show the main dashboard */}
        <Route path="dashboard" element={<DashboardPage />} />
        {/* Academic Year Management */}
        <Route path="academic-years" element={<AcademicYearManagementPage />} />
        {/* Catch-all for undefined routes */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
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