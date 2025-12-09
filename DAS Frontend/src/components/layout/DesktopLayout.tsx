import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useProject } from '@/contexts/ProjectContext';
import { UniversalSearchBar } from '@/components/search/UniversalSearchBar';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';

const DesktopLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useProject();
  const { currentProject, isLoading } = state;

  const isProjectRoute = location.pathname.includes('/projects/');
  const showSidebar = true; // Always show sidebar for authenticated users
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default width in pixels
  const [academicYearName, setAcademicYearName] = useState<string>('2025-2026');

  // Load academic year name from localStorage
  useEffect(() => {
    const storedYearName = localStorage.getItem('selected_academic_year_name');
    if (storedYearName) {
      setAcademicYearName(storedYearName);
    }
  }, []);

  // Listen for changes to academic year selection
  useEffect(() => {
    const handleStorageChange = () => {
      const storedYearName = localStorage.getItem('selected_academic_year_name');
      if (storedYearName) {
        setAcademicYearName(storedYearName);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-window updates
    window.addEventListener('academicYearChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('academicYearChanged', handleStorageChange);
    };
  }, []);

  // Update sidebar width when collapsed state changes
  useEffect(() => {
    setSidebarWidth(isSidebarCollapsed ? 64 : 256);
  }, [isSidebarCollapsed]);

  // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // Focus the search input
        const searchInput = document.querySelector('input[placeholder*="بحث"]');
        if (searchInput) {
          (searchInput as HTMLInputElement).focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Check if running in Tauri
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" dir="rtl">
      {/* Header with search bar - seamless design without border */}
      <div className="h-12 bg-background px-4 flex items-center justify-center flex-shrink-0 z-50 relative">
        <div className="flex items-center absolute right-4">
          <span className="text-[hsl(var(--foreground))] font-semibold text-base">
            {academicYearName}
          </span>
        </div>
        <div className="w-full max-w-lg">
          <UniversalSearchBar
            placeholder="بحث... (Ctrl+K)"
            compact={false}
          />
        </div>
        {/* Theme Switcher - positioned to the left of search bar */}
        <div className="absolute left-[calc(50%-300px)]">
          <ThemeSwitcher />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - positioned on the right for RTL layout */}
        {showSidebar && (
          <div className="h-full flex relative p-2 pl-0">
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
              sidebarWidth={sidebarWidth}
            />
          </div>
        )}

        {/* Main Content - moved to the left side for RTL */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden h-full" style={{ overscrollBehavior: 'none' }}>
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
/*hiiiiiii*/
export { DesktopLayout };