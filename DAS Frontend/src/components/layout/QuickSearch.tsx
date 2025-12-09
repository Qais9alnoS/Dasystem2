import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, GraduationCap, Users } from 'lucide-react';
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

export const QuickSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<QuickSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
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

  // Close search on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        if (inputRef.current) {
          inputRef.current.blur();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Perform search with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchApi.quick(searchQuery, 10);

        if (response.success && response.data) {
          // Transform API response to match our UI structure
          const transformedResults: QuickSearchResult[] = [
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

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          placeholder="بحث سريع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 fluent-surface border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
          onFocus={() => {
            if (results.length > 0 && searchQuery.length >= 2) {
              setIsOpen(true);
            }
          }}
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

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
                  <div className="flex-shrink-0">
                    {result.type === 'student' ? (
                      <GraduationCap className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Users className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {result.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {result.type === 'student'
                        ? `${result.grade} - شعبة ${result.section}`
                        : result.subjects?.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              لا توجد نتائج
            </div>
          )}
        </div>
      )}
    </div>
  );
};