import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useProject } from '@/contexts/ProjectContext';
import { UniversalSearchBar } from '@/components/search/UniversalSearchBar';

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
      {/* Web Header (only shown in browser mode, not in Tauri) */}
      {!isTauri && (
        <div className="h-14 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] flex items-center justify-between px-6 flex-shrink-0 shadow-[var(--shadow-card)] relative z-50">
          <div className="text-[hsl(var(--foreground))] font-semibold text-lg flex-shrink-0">
            نظام DAS
          </div>
          <div className="flex-1 max-w-md mx-6 min-w-0">
            <UniversalSearchBar placeholder="بحث... (Ctrl+K)" />
          </div>
          <div className="w-32 flex-shrink-0" /> {/* Spacer for balance */}
        </div>
      )}
      
      {/* Main content area - overlay titlebar is provided natively by Tauri */}
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