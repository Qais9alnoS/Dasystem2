import React, { useState, useEffect } from 'react';
import { X, Calendar, Filter as FilterIcon } from 'lucide-react';
import { SearchFilters, SearchScope } from '@/types/search';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface FilterPanelProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onClose: () => void;
}

// Available search scopes
const SEARCH_SCOPES: { value: SearchScope; label: string }[] = [
  { value: 'students', label: 'الطلاب' },
  { value: 'teachers', label: 'المعلمون' },
  { value: 'classes', label: 'الصفوف' },
  { value: 'subjects', label: 'المواد' },
  { value: 'activities', label: 'النشاطات' },
  { value: 'finance', label: 'المالية' },
  { value: 'schedules', label: 'الجداول' },
  { value: 'director_notes', label: 'ملاحظات المدير' },
  { value: 'pages', label: 'الصفحات' }
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClose
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSessionTypeChange = (value: string) => {
    const newFilters = {
      ...localFilters,
      session_type: value === 'all' ? undefined : (value as 'morning' | 'evening')
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateFromChange = (value: string) => {
    const newFilters = {
      ...localFilters,
      date_from: value || undefined
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateToChange = (value: string) => {
    const newFilters = {
      ...localFilters,
      date_to: value || undefined
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleIncludeInactiveChange = (checked: boolean) => {
    const newFilters = {
      ...localFilters,
      include_inactive: checked
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleScopeToggle = (scope: SearchScope) => {
    const currentScopes = localFilters.scopes || [];
    const newScopes = currentScopes.includes(scope)
      ? currentScopes.filter(s => s !== scope)
      : [...currentScopes, scope];
    
    const newFilters = {
      ...localFilters,
      scopes: newScopes.length > 0 ? newScopes : undefined
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: SearchFilters = {};
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFilterCount = Object.keys(localFilters).filter(key => {
    const value = localFilters[key as keyof SearchFilters];
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[60] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Filter Panel */}
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] shadow-[var(--shadow-elevation-3)] z-[70] animate-in slide-in-from-left duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5 text-[hsl(var(--foreground))]" />
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                تصفية النتائج
              </h2>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filters Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Session Type Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[hsl(var(--foreground))]">
                نوع الفترة
              </Label>
              <Select 
                value={localFilters.session_type || 'all'} 
                onValueChange={handleSessionTypeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الفترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="morning">صباحي</SelectItem>
                  <SelectItem value="evening">مسائي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[hsl(var(--foreground))] flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                نطاق التاريخ
              </Label>
              
              <div className="space-y-2">
                <div>
                  <Label htmlFor="date-from" className="text-xs text-[hsl(var(--muted-foreground))]">
                    من
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={localFilters.date_from || ''}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="w-full mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="date-to" className="text-xs text-[hsl(var(--muted-foreground))]">
                    إلى
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={localFilters.date_to || ''}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="w-full mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Include Inactive Toggle */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox
                id="include-inactive"
                checked={localFilters.include_inactive || false}
                onCheckedChange={handleIncludeInactiveChange}
              />
              <Label
                htmlFor="include-inactive"
                className="text-sm font-medium text-[hsl(var(--foreground))] cursor-pointer"
              >
                تضمين العناصر غير النشطة
              </Label>
            </div>

            {/* Search Scopes */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[hsl(var(--foreground))]">
                البحث في
              </Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {SEARCH_SCOPES.map((scope) => (
                  <div key={scope.value} className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id={`scope-${scope.value}`}
                      checked={localFilters.scopes?.includes(scope.value) || false}
                      onCheckedChange={() => handleScopeToggle(scope.value)}
                    />
                    <Label
                      htmlFor={`scope-${scope.value}`}
                      className="text-sm text-[hsl(var(--foreground))] cursor-pointer flex-1"
                    >
                      {scope.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[hsl(var(--border))] space-y-2">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="w-full"
              disabled={activeFilterCount === 0}
            >
              مسح جميع الفلاتر
            </Button>
            <Button
              onClick={onClose}
              className="w-full"
            >
              تطبيق الفلاتر
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
