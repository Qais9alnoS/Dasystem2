import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useProject } from '@/contexts/ProjectContext';

const DesktopLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useProject();
  const { currentProject, isLoading } = state;

  const isProjectRoute = location.pathname.includes('/projects/');
  const showSidebar = true; // Always show sidebar for authenticated users
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default width in pixels

  // Update sidebar width when collapsed state changes
  useEffect(() => {
    setSidebarWidth(isSidebarCollapsed ? 64 : 256);
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" dir="rtl">
      {/* Main content area - overlay titlebar is provided natively by Tauri */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - positioned on the right for RTL layout */}
        {showSidebar && (
          <div className="h-full border-l border-border bg-card flex relative">
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

export { DesktopLayout };