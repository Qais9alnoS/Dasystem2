import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, Filter, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UniversalSearchResult, 
  GroupedSearchResults, 
  SearchFilters,
  CATEGORY_NAMES 
} from '@/types/search';
import { searchApi, classesApi, schedulesApi, activitiesApi, directorApi, financeApi, financeManagerApi, academicYearsApi } from '@/services/api';
import { SearchResults } from './SearchResults';
import { FilterPanel } from './FilterPanel';

interface UniversalSearchBarProps {
  className?: string;
  placeholder?: string;
  onNavigate?: () => void;
}

export const UniversalSearchBar: React.FC<UniversalSearchBarProps> = ({
  className = '',
  placeholder = 'بحث...',
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<UniversalSearchResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedSearchResults>({});
  const [filters, setFilters] = useState<SearchFilters>({});
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state: authState } = useAuth();

  // Hardcoded pages with role filtering
  const getFilteredPages = useCallback(() => {
    const userRole = authState.user?.role || '';
    
    const allPages = [
      { name: 'لوحة التحكم', route: '/dashboard', roles: ['director', 'morning_school', 'evening_school', 'morning_supervisor', 'evening_supervisor', 'finance'] },
      { name: 'إدارة السنوات الدراسية', route: '/academic-years', roles: ['director'] },
      { name: 'معلومات المدرسة', route: '/school-info', roles: ['director', 'morning_school', 'evening_school'] },
      { name: 'المعلومات الشخصية للطلاب', route: '/students/personal-info', roles: ['director', 'morning_school', 'evening_school'] },
      { name: 'المعلومات الأكاديمية للطلاب', route: '/students/academic-info', roles: ['director', 'morning_school', 'evening_school'] },
      { name: 'المعلومات المالية للطلاب', route: '/finance?tab=students', roles: ['director', 'finance'] },
      { name: 'إدارة المعلمين', route: '/teachers', roles: ['director', 'morning_school', 'evening_school'] },
      { name: 'إدارة الجداول الدراسية', route: '/schedules', roles: ['director', 'morning_school', 'evening_school'] },
      { name: 'الصفحة اليومية', route: '/daily', roles: ['director', 'morning_school', 'evening_school', 'morning_supervisor', 'evening_supervisor'] },
      { name: 'إدارة النشاطات', route: '/activities', roles: ['director', 'morning_school', 'evening_school', 'morning_supervisor', 'evening_supervisor'] },
      { name: 'الإدارة المالية', route: '/finance', roles: ['director', 'finance'] },
      { name: 'الصندوق', route: '/finance?tab=treasury', roles: ['director', 'finance'] },
      { name: 'إدارة المستخدمين', route: '/user-management', roles: ['director'] },
      { name: 'ملاحظات المدير', route: '/director/notes', roles: ['director'] },
      { name: 'المكافآت والمساعدات', route: '/director/rewards', roles: ['director'] },
      { name: 'التحليلات', route: '/analytics', roles: ['director'] },
    ];

    return allPages
      .filter(page => page.roles.includes(userRole))
      .map(page => ({
        id: page.route,
        type: 'page' as const,
        title: page.name,
        subtitle: 'صفحة',
        category: 'Pages',
        url: page.route,
        relevance_score: 1.0,
        data: { route: page.route }
      }));
  }, [authState.user?.role]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
        setShowFilters(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Group results by category
  const groupResultsByCategory = useCallback((results: UniversalSearchResult[]) => {
    const grouped: GroupedSearchResults = {};
    results.forEach(result => {
      const category = result.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(result);
    });
    return grouped;
  }, []);

  // Perform search with debounce
  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setGroupedResults({});
      setIsExpanded(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setIsExpanded(true); // Show dropdown immediately
      try {
        console.log('🔍 Searching for:', query);
        const academicYearId = parseInt(localStorage.getItem('selected_academic_year_id') || '0');
        const userRole = authState.user?.role || '';
        
        // Parallel search across all entity types
        const searchPromises: Promise<any>[] = [];
        
        // 1. Students & Teachers (API search)
        let response;
        try {
          console.log('Trying universal search...');
          response = await searchApi.universalSearch(query, {
            scope: 'all',
            mode: 'partial',
            filters: { ...filters, academic_year_id: academicYearId },
            limit: 50
          });
          console.log('✅ Universal search response:', response);
        } catch (universalError) {
          console.warn('❌ Universal search failed, falling back to quick search:', universalError);
          response = await searchApi.quick(query, 50);
          console.log('✅ Quick search response:', response);
        }

        console.log('📊 Full response data:', JSON.stringify(response.data, null, 2));

        if (response.success && response.data) {
          let searchResults = response.data.results || [];
          
          // Handle quick search format (has nested current/former structure)
          if (!searchResults.length && (response.data.students || response.data.teachers)) {
            console.log('🔄 Converting quick search format...');
            
            // Extract students from nested structure
            let students: any[] = [];
            if (response.data.students) {
              const studentData = response.data.students;
              students = [
                ...(Array.isArray(studentData.current) ? studentData.current : []),
                ...(Array.isArray(studentData.former) ? studentData.former : [])
              ];
            }
            
            // Extract teachers from nested structure
            let teachers: any[] = [];
            if (response.data.teachers) {
              const teacherData = response.data.teachers;
              teachers = [
                ...(Array.isArray(teacherData.current) ? teacherData.current : []),
                ...(Array.isArray(teacherData.former) ? teacherData.former : [])
              ];
            }
            
            console.log(`Found ${students.length} students and ${teachers.length} teachers`);
            
            searchResults = [
              ...students.map((s: any) => ({
                id: s.id,
                type: 'student' as const,
                title: s.name || s.full_name,
                subtitle: `${s.grade || s.grade_level || ''} ${s.section || ''}`.trim(),
                category: 'Students',
                url: `/students/personal-info`,
                relevance_score: 1.0,
                data: s
              })),
              ...teachers.map((t: any) => ({
                id: t.id,
                type: 'teacher' as const,
                title: t.name || t.full_name,
                subtitle: t.subjects?.join(', ') || '',
                category: 'Teachers',
                url: `/teachers`,
                relevance_score: 1.0,
                data: t
              }))
            ];
            
            console.log('Transformed API results:', searchResults);
          }

          // 2. Search Academic Years
          try {
            const yearsResponse = await academicYearsApi.getAll();
            if (yearsResponse.success && yearsResponse.data) {
              const matchingYears = yearsResponse.data
                .filter((year: any) => 
                  year.year_name?.includes(query) ||
                  year.start_date?.includes(query) ||
                  year.end_date?.includes(query)
                )
                .map((year: any) => ({
                  id: year.id,
                  type: 'academic_year' as const,
                  title: year.year_name,
                  subtitle: `${year.start_date} - ${year.end_date}`,
                  category: 'Academic Years',
                  url: '/academic-years',
                  relevance_score: 0.95,
                  data: year
                }));
              searchResults.push(...matchingYears);
              console.log(`📅 Found ${matchingYears.length} academic years`);
            }
          } catch (error) {
            console.warn('Academic years search failed:', error);
          }

          // 3. Search Classes (restricted to school management roles)
          if (['director', 'morning_school', 'evening_school'].includes(userRole)) {
            try {
            const classesResponse = await classesApi.getAll({ academic_year_id: academicYearId });
            if (classesResponse.success && classesResponse.data) {
              // Helper to convert grade number to Arabic ordinal
              const gradeNumberToArabic: Record<number, string> = {
                1: 'الأول',
                2: 'الثاني',
                3: 'الثالث',
                4: 'الرابع',
                5: 'الخامس',
                6: 'السادس',
                7: 'السابع',
                8: 'الثامن',
                9: 'التاسع',
                10: 'العاشر',
                11: 'الحادي عشر',
                12: 'الثاني عشر'
              };
              
              // Helper to get educational level name
              const gradeLevelToArabic: Record<string, string> = {
                'primary': 'الابتدائي',
                'intermediate': 'الإعدادي',
                'secondary': 'الثانوي'
              };
              
              // Helper to format class name
              const formatClassName = (cls: any) => {
                if (cls.class_name) return cls.class_name;
                
                // Format as "الصف الأول الابتدائي" + section
                const gradeNumber = cls.grade_number || 1;
                const gradeName = gradeNumberToArabic[gradeNumber] || `${gradeNumber}`;
                const levelName = gradeLevelToArabic[cls.grade_level] || cls.grade_level;
                return `الصف ${gradeName} ${levelName} ${cls.section || ''}`.trim();
              };
              
              const matchingClasses = classesResponse.data
                .filter((cls: any) => {
                  const className = formatClassName(cls);
                  return className.toLowerCase().includes(query.toLowerCase()) ||
                         cls.section?.toLowerCase().includes(query.toLowerCase());
                })
                .map((cls: any) => {
                  const className = formatClassName(cls);
                  const gradeNumber = cls.grade_number || 1;
                  const gradeName = gradeNumberToArabic[gradeNumber] || `${gradeNumber}`;
                  const levelName = gradeLevelToArabic[cls.grade_level] || cls.grade_level;
                  
                  return {
                    id: cls.id,
                    type: 'class' as const,
                    title: className,
                    subtitle: `${levelName} - الشعبة ${cls.section || ''}`,
                    category: 'Classes',
                    url: `/school-info/edit-grade/${cls.id}`,
                    relevance_score: 0.9,
                    data: cls
                  };
                });
              searchResults.push(...matchingClasses);
              console.log(`📚 Found ${matchingClasses.length} classes`);
            }
            } catch (error) {
              console.warn('Classes search failed:', error);
            }
          }

          // 4. Search Schedules (restricted to school management roles)
          if (['director', 'morning_school', 'evening_school'].includes(userRole)) {
            try {
            const schedulesResponse = await schedulesApi.getAll({
              academic_year_id: academicYearId
            });
            if (schedulesResponse.success && schedulesResponse.data) {
              const matchingSchedules = schedulesResponse.data
                .filter((schedule: any) => 
                  (schedule.name?.toLowerCase().includes(query.toLowerCase()) ||
                   schedule.class_name?.toLowerCase().includes(query.toLowerCase())) &&
                  schedule.status === 'published'
                )
                .map((schedule: any) => ({
                  id: schedule.id,
                  type: 'schedule' as const,
                  title: schedule.name || `جدول ${schedule.class_name}`,
                  subtitle: `${schedule.class_name || ''} - ${schedule.session_type === 'morning' ? 'صباحي' : 'مسائي'}`,
                  category: 'Schedules',
                  url: '/schedules',
                  relevance_score: 0.85,
                  data: schedule
                }));
              searchResults.push(...matchingSchedules);
              console.log(`📅 Found ${matchingSchedules.length} schedules`);
            }
            } catch (error) {
              console.warn('Schedules search failed:', error);
            }
          }

          // 5. Search Activities (restricted to management and supervisors)
          if (['director', 'morning_school', 'evening_school', 'morning_supervisor', 'evening_supervisor'].includes(userRole)) {
            try {
            const activitiesResponse = await activitiesApi.getAll({
              academic_year_id: academicYearId
            });
            if (activitiesResponse.success && activitiesResponse.data) {
              const matchingActivities = activitiesResponse.data
                .filter((activity: any) => 
                  activity.name?.toLowerCase().includes(query.toLowerCase()) ||
                  activity.description?.toLowerCase().includes(query.toLowerCase())
                )
                .map((activity: any) => ({
                  id: activity.id,
                  type: 'activity' as const,
                  title: activity.name,
                  subtitle: activity.activity_type || activity.description?.substring(0, 50),
                  category: 'Activities',
                  url: '/activities',
                  relevance_score: 0.8,
                  data: activity
                }));
              searchResults.push(...matchingActivities);
              console.log(`🎯 Found ${matchingActivities.length} activities`);
            }
            } catch (error) {
              console.warn('Activities search failed:', error);
            }
          }

          // 6. Search Director Notes (restricted to director only)
          if (userRole === 'director') {
            try {
              const notesResponse = await directorApi.searchNotes(query, academicYearId);
              if (notesResponse.success && notesResponse.data?.results) {
                // Category name mapping
                const categoryNames: Record<string, string> = {
                  'goals': 'الأهداف',
                  'projects': 'المشاريع',
                  'blogs': 'مدونات',
                  'educational_admin': 'الأمور التعليمية والإدارية'
                };
                
                const matchingNotes = notesResponse.data.results.map((note: any) => {
                  const categoryName = categoryNames[note.folder_type] || note.folder_type;
                  const itemType = note.is_folder ? 'مجلد' : 'ملف';
                  return {
                    id: note.id,
                    type: 'director_note' as const,
                    title: note.title,
                    subtitle: `${categoryName} - ${itemType}`,
                    category: 'Director Notes',
                    url: `/director/notes/edit/${note.id}`,
                    relevance_score: 0.75,
                    data: note
                  };
                });
                searchResults.push(...matchingNotes);
                console.log(`📝 Found ${matchingNotes.length} director notes`);
              }
            } catch (error) {
              console.warn('Director notes search failed:', error);
            }
          }

          // 7. Search Finance Categories (if user is director or finance)
          if (userRole === 'director' || userRole === 'finance') {
            try {
              const categoriesResponse = await financeApi.getCategories(true);
              if (categoriesResponse.success && categoriesResponse.data) {
                const matchingCategories = categoriesResponse.data
                  .filter((category: any) => 
                    category.name?.toLowerCase().includes(query.toLowerCase()) ||
                    category.category_type?.toLowerCase().includes(query.toLowerCase())
                  )
                  .map((category: any) => ({
                    id: category.id,
                    type: 'finance' as const,
                    title: category.name,
                    subtitle: category.category_type === 'income' ? 'دخل' : 'مصروف',
                    category: 'Finance',
                    url: '/finance',
                    relevance_score: 0.7,
                    data: category
                  }));
                searchResults.push(...matchingCategories);
                console.log(`💰 Found ${matchingCategories.length} finance categories`);
              }
            } catch (error) {
              console.warn('Finance categories search failed:', error);
            }
          }

          // 8. Search Finance Cards (if user is director or finance)
          if (userRole === 'director' || userRole === 'finance') {
            try {
              const cardsResponse = await financeManagerApi.getFinanceCards({
                academic_year_id: academicYearId
              });
              if (cardsResponse.success && cardsResponse.data) {
                const matchingCards = cardsResponse.data
                  .filter((card: any) => 
                    card.card_name?.toLowerCase().includes(query.toLowerCase()) ||
                    card.category?.toLowerCase().includes(query.toLowerCase())
                  )
                  .map((card: any) => ({
                    id: card.id,
                    type: 'finance_card' as const,
                    title: card.card_name,
                    subtitle: card.card_type === 'income' ? 'كارد دخل' : 'كارد مصروف',
                    category: 'Finance Cards',
                    url: '/finance',
                    relevance_score: 0.75,
                    data: card
                  }));
                searchResults.push(...matchingCards);
                console.log(`💳 Found ${matchingCards.length} finance cards`);
              }
            } catch (error) {
              console.warn('Finance cards search failed:', error);
            }
          }

          // 9. Add filtered pages to results
          const filteredPages = getFilteredPages();
          const pageResults = filteredPages.filter(page => 
            page.title.toLowerCase().includes(query.toLowerCase())
          );
          
          console.log(`📄 Found ${pageResults.length} matching pages`);
          searchResults = [...searchResults, ...pageResults];

          console.log(`✨ Final processed results (${searchResults.length}):`, searchResults);
          setResults(searchResults);
          setGroupedResults(groupResultsByCategory(searchResults));
          setTotalResults(response.data.total_results || searchResults.length);
          setSearchTime(response.data.search_time_ms || 0);
        } else {
          console.log('No results or unsuccessful response');
          setResults([]);
          setGroupedResults({});
          setTotalResults(0);
        }
      } catch (error: any) {
        console.error('Search error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          query: query
        });
        
        // Don't show toast for every search error, just log it
        // Only show for network errors
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          toast({
            title: "خطأ في الاتصال",
            description: "تحقق من الاتصال بالخادم",
            variant: "destructive"
          });
        }
        
        setResults([]);
        setGroupedResults({});
        setTotalResults(0);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, filters, groupResultsByCategory, toast, getFilteredPages]);

  const handleResultClick = (result: UniversalSearchResult) => {
    const userRole = authState.user?.role || '';
    const academicYearId = parseInt(localStorage.getItem('selected_academic_year_id') || '0');
    
    // Smart navigation based on result type and user role
    if (result.type === 'page') {
      // Special handling for school info page - pass academic year context
      if (result.url === '/school-info') {
        navigate('/school-info', {
          state: {
            academicYearId: academicYearId
          }
        });
      } else {
        // Navigate directly to other pages
        navigate(result.url);
      }
      
    } else if (result.type === 'student') {
      const studentData = result.data;
      
      // Role-based navigation for students
      if (userRole === 'finance') {
        // Finance user: Open finance popup for student
        navigate('/finance', {
          state: {
            preselectedStudentId: result.id,
            openFinancePopup: true,
            studentData: studentData
          }
        });
      } else if (userRole === 'director') {
        // Director can access both - default to personal info with option
        navigate('/students/personal-info', {
          state: {
            preselected: {
              grade: studentData?.grade_level || studentData?.grade,
              section: studentData?.section,
              studentId: result.id,
              openPopup: true
            }
          }
        });
      } else {
        // Other users: Navigate to students page with pre-selected filters and open popup
        navigate('/students/personal-info', {
          state: {
            preselected: {
              grade: studentData?.grade_level || studentData?.grade,
              section: studentData?.section,
              studentId: result.id,
              openPopup: true
            }
          }
        });
      }
      
    } else if (result.type === 'teacher') {
      // Navigate to teachers page with pre-selected teacher
      navigate('/teachers', {
        state: {
          preselectedTeacherId: result.id,
          teacherData: result.data
        }
      });
      
    } else if (result.type === 'class') {
      // Navigate directly to class edit page
      navigate(`/school-info/edit-grade/${result.id}`, {
        state: {
          classData: result.data,
          academicYearId: academicYearId
        }
      });
      
    } else if (result.type === 'academic_year') {
      // Select the academic year and navigate to dashboard
      localStorage.setItem('selected_academic_year_id', result.id.toString());
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('academicYearChanged', { 
        detail: { yearId: result.id, yearData: result.data } 
      }));
      
      // Navigate to dashboard or stay on current page
      toast({
        title: "تم تغيير السنة الدراسية",
        description: `تم التبديل إلى ${result.title}`,
      });
      
      // Refresh the page to load data for new year
      window.location.reload();
      
    } else if (result.type === 'schedule') {
      // Navigate to schedules page with class selected and popup open
      const scheduleData = result.data;
      navigate('/schedules', {
        state: {
          preselectedClassId: scheduleData?.class_id,
          viewSchedule: true,
          scheduleData: scheduleData
        }
      });
      
    } else if (result.type === 'activity') {
      // Open activity popup
      navigate('/activities', {
        state: {
          preselectedActivityId: result.id,
          openActivityPopup: true,
          activityData: result.data
        }
      });
      
    } else if (result.type === 'director_note') {
      // Navigate directly to the note edit page
      navigate(`/director/notes/edit/${result.id}`);
      
    } else if (result.type === 'finance_card') {
      // Open finance page with card popup
      navigate('/finance', {
        state: {
          preselectedCardId: result.id,
          openCardPopup: true,
          cardData: result.data
        }
      });
      
    } else if (result.type === 'finance') {
      // Open finance page with category selected
      navigate('/finance', {
        state: {
          preselectedCategoryId: result.id,
          categoryData: result.data
        }
      });
      
    } else {
      // Default navigation
      navigate(result.url);
    }

    // Clear and close
    setQuery('');
    setIsExpanded(false);
    setShowFilters(false);
    onNavigate?.();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setGroupedResults({});
    setIsExpanded(false);
    inputRef.current?.focus();
  };

  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleInputClick = () => {
    if (query.length >= 1 && results.length > 0) {
      setIsExpanded(true);
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Search Bar - Single Expanding Container */}
      <div className={`relative transition-all duration-300 ease-in-out ${
        isExpanded 
          ? 'bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-[var(--shadow-elevation-2)] rounded-t-xl' 
          : 'bg-[hsl(var(--muted))]/60 border border-[hsl(var(--border))]/40 rounded-xl'
      }`}>
        {/* Search Input Field */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))] pointer-events-none z-10" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={handleInputClick}
            className={`pl-10 pr-20 h-9 text-sm border-0 transition-all ${
              isExpanded
                ? 'bg-transparent text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]'
                : 'bg-transparent text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/70'
            } focus-visible:ring-0 focus-visible:ring-offset-0`}
          />
          
          {/* Action Buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 z-10">
            {isSearching && (
              <Loader2 className="h-4 w-4 text-[hsl(var(--muted-foreground))] animate-spin" />
            )}
            {query && !isSearching && (
              <button
                onClick={handleClear}
                className="p-1 rounded transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                aria-label="مسح"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleFilterToggle}
              className={`p-1 rounded transition-colors ${
                showFilters || Object.keys(filters).length > 0
                  ? 'text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
              aria-label="تصفية"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Expanded Results - Connected to Search Bar (Looks Like One Box) */}
      {isExpanded && (
        <div className="absolute top-[calc(100%-0.5rem)] left-0 right-0 pt-2 pb-0 bg-[hsl(var(--card))] border border-t-0 border-[hsl(var(--border))] rounded-b-xl shadow-[var(--shadow-elevation-3)] z-[90] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {results.length > 0 ? (
            <>
              {/* Results Content */}
              <div className="overflow-y-auto max-h-[60vh]">
                <SearchResults
                  groupedResults={groupedResults}
                  onResultClick={handleResultClick}
                  query={query}
                />
              </div>
            </>
          ) : query.length > 0 && !isSearching ? (
            /* No Results Message */
            <div className="p-8 text-center">
              <div className="text-[hsl(var(--muted-foreground))] mb-2">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">لم يتم العثور على نتائج</p>
                <p className="text-xs mt-1">جرب كلمات بحث مختلفة أو قم بتعديل الفلاتر</p>
              </div>
            </div>
          ) : isSearching ? (
            /* Loading State */
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-[hsl(var(--muted-foreground))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">جاري البحث...</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Filter Panel Overlay */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
};
