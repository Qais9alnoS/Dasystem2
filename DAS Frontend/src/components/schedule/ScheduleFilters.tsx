import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { classesApi } from '@/services/api';
import type { Class } from '@/types/school';

interface ScheduleFiltersProps {
  onComplete: (data: {
    academicYearId: number;
    sessionType: string;
    gradeLevel: string;
    gradeNumber: number;
    classId: number;
    section: string;
  }) => void;
}

const GRADE_LEVELS = {
  primary: { label: 'ابتدائي', grades: [1, 2, 3, 4, 5, 6] },
  intermediate: { label: 'متوسط', grades: [1, 2, 3] },
  secondary: { label: 'ثانوي', grades: [1, 2, 3] }
};

const SESSIONS = [
  { value: 'morning', label: 'صباحي' },
  { value: 'evening', label: 'مسائي' }
];

export const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({ onComplete }) => {
  // State
  const [academicYearId, setAcademicYearId] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [gradeNumber, setGradeNumber] = useState<number | null>(null);
  const [section, setSection] = useState<string>('');
  const [classId, setClassId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  // Data
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Validation
  const [isValid, setIsValid] = useState(false);

  // Load academic year and user role from localStorage on mount
  useEffect(() => {
    loadSelectedAcademicYear();
    loadUserRole();
  }, []);

  const loadSelectedAcademicYear = async () => {
    setLoading(true);
    try {
      // Get the globally selected academic year from localStorage
      const selectedYearId = localStorage.getItem('selected_academic_year_id');
      
      if (selectedYearId) {
        setAcademicYearId(parseInt(selectedYearId, 10));
      } else {
        toast({
          title: 'تنبيه',
          description: 'لم يتم اختيار سنة دراسية. يرجى اختيار سنة دراسية من صفحة إدارة السنوات الدراسية.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل السنة الدراسية المختارة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserRole = () => {
    try {
      const storedUser = localStorage.getItem('das_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserRole(user.role);
        
        // Auto-set session type based on user role
        if (user.role === 'morning_school') {
          setSessionType('morning');
        } else if (user.role === 'evening_school') {
          setSessionType('evening');
        }
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  // Load classes when academic year and session type are selected
  useEffect(() => {
    if (academicYearId && sessionType) {
      loadClasses();
    }
  }, [academicYearId, sessionType]);

  const loadClasses = async () => {
    if (!academicYearId || !sessionType) return;

    setLoadingClasses(true);
    try {
      const response = await classesApi.getAll({
        academic_year_id: academicYearId,
        session_type: sessionType
      });

      if (response.success && response.data) {
        setClasses(response.data);
      } else {
        setClasses([]);
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الصفوف',
        variant: 'destructive'
      });
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Filter classes when grade level is selected
  useEffect(() => {
    if (gradeLevel) {
      const filtered = classes.filter(c => c.grade_level === gradeLevel);
      setFilteredClasses(filtered);
      
      // Reset dependent selections
      setGradeNumber(null);
      setSection('');
      setClassId(null);
    } else {
      setFilteredClasses([]);
    }
  }, [gradeLevel, classes]);

  // Filter by grade number
  useEffect(() => {
    if (gradeLevel && gradeNumber) {
      const classesForGrade = classes.filter(
        c => c.grade_level === gradeLevel && c.grade_number === gradeNumber
      );

      // Get available sections
      const sections: string[] = [];
      classesForGrade.forEach(c => {
        const sectionCount = c.section_count || 1;
        for (let i = 0; i < sectionCount; i++) {
          const sectionNumber = String(i + 1); // 1, 2, 3, ...
          if (!sections.includes(sectionNumber)) {
            sections.push(sectionNumber);
          }
        }
      });

      setAvailableSections(sections.sort());
      
      // Reset section
      setSection('');
      setClassId(null);
    } else {
      setAvailableSections([]);
    }
  }, [gradeLevel, gradeNumber, classes]);

  // Find class ID when all selections are made
  useEffect(() => {
    if (academicYearId && sessionType && gradeLevel && gradeNumber && section) {
      const foundClass = classes.find(
        c =>
          c.academic_year_id === academicYearId &&
          c.session_type === sessionType &&
          c.grade_level === gradeLevel &&
          c.grade_number === gradeNumber
      );

      if (foundClass) {
        setClassId(foundClass.id);
        setIsValid(true);
      } else {
        setClassId(null);
        setIsValid(false);
      }
    } else {
      setIsValid(false);
    }
  }, [academicYearId, sessionType, gradeLevel, gradeNumber, section, classes]);

  const handleContinue = () => {
    if (!isValid || !academicYearId || !classId || !gradeNumber) {
      toast({
        title: 'تنبيه',
        description: 'يرجى إكمال جميع الاختيارات',
        variant: 'destructive'
      });
      return;
    }

    onComplete({
      academicYearId,
      sessionType,
      gradeLevel,
      gradeNumber,
      classId,
      section
    });
  };

  const availableGrades = gradeLevel ? GRADE_LEVELS[gradeLevel as keyof typeof GRADE_LEVELS]?.grades || [] : [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Session Type Selection - Only show for director, auto-set for others */}
      {userRole === 'director' ? (
        <div className="space-y-2">
          <Label htmlFor="session-type">الفترة</Label>
          <Select
            value={sessionType}
            onValueChange={setSessionType}
            disabled={!academicYearId}
          >
            <SelectTrigger id="session-type">
              <SelectValue placeholder="اختر الفترة" />
            </SelectTrigger>
            <SelectContent>
              {SESSIONS.map((session) => (
                <SelectItem key={session.value} value={session.value}>
                  {session.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            الفترة المحددة: <strong>{sessionType === 'morning' ? 'صباحي' : 'مسائي'}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Grade Level Selection */}
      <div className="space-y-2">
        <Label htmlFor="grade-level">المرحلة</Label>
        <Select
          value={gradeLevel}
          onValueChange={setGradeLevel}
          disabled={!sessionType || loadingClasses}
        >
          <SelectTrigger id="grade-level">
            <SelectValue placeholder="اختر المرحلة" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GRADE_LEVELS).map(([key, value]) => {
              const hasClasses = classes.some(c => c.grade_level === key);
              return (
                <SelectItem key={key} value={key} disabled={!hasClasses}>
                  {value.label}
                  {!hasClasses && (
                    <span className="mr-2 text-xs text-muted-foreground">
                      (لا توجد صفوف)
                    </span>
                  )}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {loadingClasses && (
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            جاري تحميل الصفوف...
          </p>
        )}
      </div>

      {/* Grade Number Selection */}
      <div className="space-y-2">
        <Label htmlFor="grade-number">الصف</Label>
        <Select
          value={gradeNumber?.toString() || ''}
          onValueChange={(value) => setGradeNumber(parseInt(value))}
          disabled={!gradeLevel}
        >
          <SelectTrigger id="grade-number">
            <SelectValue placeholder="اختر الصف" />
          </SelectTrigger>
          <SelectContent>
            {availableGrades.map((grade) => {
              const hasClass = filteredClasses.some(c => c.grade_number === grade);
              return (
                <SelectItem
                  key={grade}
                  value={grade.toString()}
                  disabled={!hasClass}
                >
                  الصف {grade}
                  {!hasClass && (
                    <span className="mr-2 text-xs text-muted-foreground">
                      (غير متوفر)
                    </span>
                  )}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Section Selection */}
      <div className="space-y-2">
        <Label htmlFor="section">الشعبة</Label>
        <Select
          value={section}
          onValueChange={setSection}
          disabled={!gradeNumber || availableSections.length === 0}
        >
          <SelectTrigger id="section">
            <SelectValue placeholder="اختر الشعبة" />
          </SelectTrigger>
          <SelectContent>
            {availableSections.map((sec) => (
              <SelectItem key={sec} value={sec}>
                شعبة {sec}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Validation Status */}
      {isValid && classId && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            تم اختيار الصف بنجاح. يمكنك المتابعة للخطوة التالية.
          </AlertDescription>
        </Alert>
      )}

      {gradeLevel && gradeNumber && section && !classId && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            لم يتم العثور على صف مطابق للاختيارات. يرجى التحقق من البيانات.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Card */}
      {academicYearId && sessionType && gradeLevel && gradeNumber && section && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-3">ملخص الاختيار:</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex justify-between">
                <span className="text-blue-600">الفترة:</span>
                <span className="font-medium">
                  {SESSIONS.find(s => s.value === sessionType)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">المرحلة:</span>
                <span className="font-medium">
                  {GRADE_LEVELS[gradeLevel as keyof typeof GRADE_LEVELS]?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">الصف:</span>
                <span className="font-medium">الصف {gradeNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">الشعبة:</span>
                <span className="font-medium">شعبة {section}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!isValid || loading || loadingClasses}
          size="lg"
          className="min-w-[200px]"
        >
          {loading || loadingClasses ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري التحميل...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 ml-2" />
              المتابعة للتحقق
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

