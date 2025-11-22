import React, { useState, useEffect, useRef } from 'react';
import { 
  minimizeWindow, 
  toggleMaximizeWindow, 
  closeWindow,
  handleSettings,
  handleThemeToggle
} from '@/utils/windowControls';
import { Settings, Moon, Sun } from 'lucide-react';
import { UniversalSearchBar } from '@/components/search/UniversalSearchBar';


const CustomTitleBar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // Focus the search input
        const searchInput = searchRef.current?.querySelector('input');
        if (searchInput) {
          (searchInput as HTMLInputElement).focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleMinimize = async () => {
    await minimizeWindow();
  };

  const handleMaximize = async () => {
    await toggleMaximizeWindow();
  };

  const handleClose = async () => {
    await closeWindow();
  };


  const onThemeToggle = async () => {
    await handleThemeToggle();
    setIsDarkMode(!isDarkMode);
  };

  const onSettings = async () => {
    await handleSettings();
  };

  const handleSearchNavigate = () => {
    // Called when user navigates from search result
    // Can add any additional logic here if needed
  };

  return (
    <div 
      className="custom-titlebar fixed top-0 left-0 right-0 h-8 bg-gradient-to-r from-gray-600 to-gray-700 text-white flex items-center justify-between z-50"
      data-tauri-drag-region
    >
      <div className="titlebar-left flex items-center pl-3 text-sm font-medium">
        <span>نظام DAS - مدرسة دمشق العربية</span>
      </div>
      
      <div className="titlebar-center flex-1 flex justify-center px-4" data-tauri-drag-region="false">
        {/* Universal Search Bar */}
        <div ref={searchRef} className="w-full max-w-md">
          <UniversalSearchBar
            placeholder="بحث... (Ctrl+K)"
            onNavigate={handleSearchNavigate}
          />
        </div>
      </div>
      
      <div className="titlebar-right flex items-center pr-3" data-tauri-drag-region="false">
        {/* Custom functionality buttons */}
        <button 
          className="titlebar-button w-8 h-8 flex items-center justify-center bg-transparent border-none text-white cursor-pointer transition-colors hover:bg-white/20"
          onClick={onThemeToggle}
          aria-label="تغيير النمط"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
        
        <button 
          className="titlebar-button w-8 h-8 flex items-center justify-center bg-transparent border-none text-white cursor-pointer transition-colors hover:bg-white/20"
          onClick={onSettings}
          aria-label="الإعدادات"
        >
          <Settings className="w-4 h-4" />
        </button>
        
        {/* Window controls */}
        <div className="window-controls flex">
          <button 
            className="window-control w-12 h-8 flex items-center justify-center bg-transparent border-none text-white cursor-pointer transition-colors hover:bg-white/20"
            onClick={handleMinimize}
            aria-label="تصغير"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          
          <button 
            className="window-control w-12 h-8 flex items-center justify-center bg-transparent border-none text-white cursor-pointer transition-colors hover:bg-white/20"
            onClick={handleMaximize}
            aria-label="تكبير"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2H10V8M2 10V4H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <button 
            className="window-control close w-12 h-8 flex items-center justify-center bg-transparent border-none text-white cursor-pointer transition-colors hover:bg-red-500"
            onClick={handleClose}
            aria-label="إغلاق"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomTitleBar;