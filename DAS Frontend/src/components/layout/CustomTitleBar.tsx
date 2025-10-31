import React, { useState, useEffect, useRef } from 'react';
import { 
  minimizeWindow, 
  toggleMaximizeWindow, 
  closeWindow,
  handleSearch,
  handleSettings,
  handleThemeToggle
} from '@/utils/windowControls';
import { Input } from '@/components/ui/input';
import { Search, X, Settings, Moon, Sun } from 'lucide-react';
import { searchApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface QuickSearchResult {
  id: number;
  name: string;
  type: 'student' | 'teacher';
  // Student specific
  grade?: string;
  section?: string;
  // Teacher specific
  subjects?: string[];
}

const CustomTitleBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<QuickSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const response = await searchApi.quick(searchQuery, 10);
          
          if (response.success && response.data) {
            const transformedResults = [
              ...(response.data.students?.map((student: any) => ({
                id: student.id,
                name: student.name,
                type: 'student',
                grade: student.grade,
                section: student.section
              })) || []),
              ...(response.data.teachers?.map((teacher: any) => ({
                id: teacher.id,
                name: teacher.name,
                type: 'teacher',
                subjects: teacher.subjects
              })) || [])
            ];
            
            setResults(transformedResults);
            setIsOpen(true);
          } else {
            setResults([]);
            setIsOpen(false);
          }
        } catch (error: any) {
          console.error('Quick search error:', error);
          toast({
            title: "خطأ في البحث السريع",
            description: error.message || "حدث خطأ أثناء البحث",
            variant: "destructive"
          });
          setResults([]);
          setIsOpen(false);
        } finally {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, toast]);

  const handleResultClick = (result: QuickSearchResult) => {
    // Navigate to the appropriate page based on result type
    if (result.type === 'student') {
      navigate(`/students/${result.id}`);
    } else if (result.type === 'teacher') {
      navigate(`/teachers/${result.id}`);
    }
    
    // Clear search
    setSearchQuery('');
    setIsOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleMinimize = async () => {
    await minimizeWindow();
  };

  const handleMaximize = async () => {
    await toggleMaximizeWindow();
  };

  const handleClose = async () => {
    await closeWindow();
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const onThemeToggle = async () => {
    await handleThemeToggle();
    setIsDarkMode(!isDarkMode);
  };

  const onSettings = async () => {
    await handleSettings();
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
        {/* Search Bar */}
        <div ref={searchRef} className="relative w-full max-w-md">
          <form onSubmit={onSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              placeholder="بحث سريع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-6 text-sm fluent-surface border-0 focus-visible:ring-2 focus-visible:ring-blue-500 bg-white/20 text-white placeholder:text-gray-300"
              onFocus={() => {
                if (results.length > 0 && searchQuery.length >= 2) {
                  setIsOpen(true);
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* Search Results Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500">
                  جاري البحث...
                </div>
              ) : results.length > 0 ? (
                <div className="py-1">
                  {results.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-3 rtl:space-x-reverse"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {result.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {result.type === 'student' 
                            ? `طالب - ${result.grade || ''} ${result.section || ''}` 
                            : `معلم - ${result.subjects?.join(', ') || ''}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="p-4 text-center text-gray-500">
                  لا توجد نتائج
                </div>
              ) : null}
            </div>
          )}
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