import React from 'react';
import { useLocation } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { QuickSearch } from '@/components/layout/QuickSearch';
import { Bell, Settings, User } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const { state } = useProject();
  const { currentProject } = state;

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === '/dashboard') return 'لوحة التحكم';
    if (path.includes('/projects/')) {
      if (path.includes('/subjects')) return 'إدارة المواد الدراسية';
      if (path.includes('/teachers')) return 'إدارة المعلمين';
      if (path.includes('/classes')) return 'إدارة الفصول';
      if (path.includes('/constraints')) return 'إدارة القيود';
      if (path.includes('/settings')) return 'إعدادات المشروع';
      return 'لوحة المشروع';
    }
    if (path === '/settings') return 'الإعدادات العامة';
    return 'Gene Flow Scheduler';
  };

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-700 fluent-acrylic flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {getPageTitle()}
        </h1>

        {currentProject && (
          <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
            {currentProject.name}
          </span>
        )}
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <QuickSearch />
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
          <Bell className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
          <Settings className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export { Header };