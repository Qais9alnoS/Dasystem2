import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, AlertCircle, CalendarDays } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import api from '@/services/api';

interface Holiday {
  id: number;
  holiday_date: string;
  session_type: string;
  holiday_name?: string;
  is_for_students: boolean;
  is_for_teachers: boolean;
  notes?: string;
}

interface HolidayManagementProps {
  academicYearId: number;
  sessionType: 'morning' | 'evening';
}

interface DailySummary {
  total_present: number;
  total_absent: number;
  total_actions: number;
}

export function HolidayManagement({ academicYearId, sessionType }: HolidayManagementProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);
  const [isForStudents, setIsForStudents] = useState(true);
  const [isForTeachers, setIsForTeachers] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [notes, setNotes] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHolidays();
  }, [academicYearId, sessionType]);

  const fetchHolidays = async () => {
    try {
      const response = await api.get(`/daily/holidays?academic_year_id=${academicYearId}&session_type=${sessionType}`);
      setHolidays(response.data as Holiday[]);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  const checkPastDateData = async (dateStr: string): Promise<boolean> => {
    try {
      // التحقق من وجود بيانات حضور في هذا التاريخ
      const response = await api.get(`/daily/summary/${dateStr}?academic_year_id=${academicYearId}`);
      const data = response.data as DailySummary;
      
      // إذا كان هناك حضور أو إجراءات
      if (data && (data.total_present > 0 || data.total_absent > 0 || data.total_actions > 0)) {
        return true;
      }
      return false;
    } catch (error) {
      // إذا حدث خطأ، نفترض عدم وجود بيانات
      return false;
    }
  };

  const handleDateClick = async (dateStr: string) => {
    const existing = holidays.find(h => h.holiday_date === dateStr);
    const selectedDateObj = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (existing) {
      // حذف العطلة
      if (confirm('هل تريد إلغاء هذه العطلة؟')) {
        try {
          await api.delete(`/daily/holidays/${existing.id}`);
          fetchHolidays();
        } catch (error) {
          console.error('Error deleting holiday:', error);
          alert('حدث خطأ أثناء حذف العطلة');
        }
      }
    } else {
      // التحقق إذا كان تاريخ سابق
      if (selectedDateObj < today) {
        const hasData = await checkPastDateData(dateStr);
        if (hasData) {
          if (!confirm('⚠️ هذا التاريخ يحتوي على بيانات حضور أو إجراءات. هل تريد المتابعة وجعله عطلة؟')) {
            return;
          }
        }
      }
      
      // إضافة عطلة جديدة
      setSelectedDate(dateStr);
      setShowDialog(true);
    }
  };

  const handleSaveHoliday = async () => {
    if (!isForStudents && !isForTeachers) {
      alert('يجب اختيار عطلة للطلاب أو الأساتذة أو كليهما');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/daily/holidays', {
        academic_year_id: academicYearId,
        session_type: sessionType,
        holiday_date: selectedDate,
        holiday_name: holidayName || null,
        is_for_students: isForStudents,
        is_for_teachers: isForTeachers,
        notes: notes || null
      });
      
      setShowDialog(false);
      resetForm();
      await fetchHolidays(); // تحديث العطل بعد الحفظ
    } catch (error) {
      console.error('Error saving holiday:', error);
      alert('حدث خطأ أثناء حفظ العطلة');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate('');
    setHolidayName('');
    setNotes('');
    setIsForStudents(true);
    setIsForTeachers(false);
  };

  const generateCalendarDates = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // أول يوم في الشهر
    const firstDay = new Date(year, month, 1);
    // آخر يوم في الشهر
    const lastDay = new Date(year, month + 1, 0);
    
    // يوم الأسبوع لأول يوم (0 = الأحد)
    const startDayOfWeek = firstDay.getDay();
    
    // إضافة أيام فارغة في البداية
    const dates: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      dates.push(null);
    }
    
    // إضافة أيام الشهر
    for (let day = 1; day <= lastDay.getDate(); day++) {
      dates.push(new Date(year, month, day));
    }
    
    return dates;
  };
  
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const isHoliday = (dateStr: string, dateObj?: Date) => {
    // استخدام الكائن Date إذا تم تمريره، وإلا إنشاء واحد جديد
    const date = dateObj || new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    
    // التحقق من العطل المسجلة في قاعدة البيانات أولاً
    const holiday = holidays.find(h => h.holiday_date === dateStr);
    
    // إذا كانت هناك عطلة مسجلة، نعيدها
    if (holiday) {
      return { isHoliday: true, isDefault: false, holiday };
    }
    
    // الجمعة (5) والسبت (6) كعطلة افتراضية - في JS: 0=الأحد، 5=الجمعة، 6=السبت
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return { isHoliday: true, isDefault: true, holiday: null };
    }
    
    return { isHoliday: false, isDefault: false, holiday: null };
  };
  
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  const formatMonthYear = (date: Date): string => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };
  
  const getArabicDayName = (date: Date): string => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[date.getDay()];
  };

  const today = new Date();
  
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              إدارة أيام العطلة
            </CardTitle>
            <Badge className={`${
              sessionType === 'morning' 
                ? 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700' 
                : 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700'
            } text-white`}>
              {sessionType === 'morning' ? '🌅 الفترة الصباحية' : '🌆 الفترة المسائية'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm"
              variant="outline" 
              onClick={goToToday}
              className="text-white border-white hover:bg-white/20 flex items-center gap-1.5"
            >
              <CalendarDays className="h-4 w-4" />
              العودة لليوم
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* شريط التنقل بين الأشهر */}
        <div className="flex items-center justify-between mb-6 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {formatMonthYear(currentMonth)}
            </h3>
            {currentMonth.getMonth() === today.getMonth() && 
             currentMonth.getFullYear() === today.getFullYear() && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {getArabicDayName(today)} - {today.getDate()} {formatMonthYear(today).split(' ')[0]}
              </p>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* أسماء الأيام */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => (
            <div 
              key={day} 
              className="text-center font-semibold text-xs py-2 rounded text-gray-700 dark:text-gray-300"
            >
              {day}
            </div>
          ))}
        </div>
          
        {/* أيام التقويم */}
        <div className="grid grid-cols-7 gap-2">
          {generateCalendarDates().map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            
            // استخدام التوقيت المحلي بدلاً من UTC
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const { isHoliday: isHol, isDefault, holiday } = isHoliday(dateStr, date);
            const isTodayDate = isToday(date);
            
            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(dateStr)}
                className={`
                  aspect-square p-1 text-center rounded-lg border-2 transition-all duration-200
                  ${isTodayDate 
                    ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' 
                    : ''
                  }
                  ${isHol
                    ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600'
                  }
                `}
                title={holiday?.holiday_name || (isDefault ? 'عطلة نهاية الأسبوع' : '')}
              >
                <div className={`text-sm font-semibold ${
                  isTodayDate 
                    ? 'text-blue-700 dark:text-blue-400' 
                    : isHol
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {date.getDate()}
                </div>
                {isHol && (
                  <div className="text-[9px] leading-tight mt-0.5 text-amber-700 dark:text-amber-300 font-medium">
                    {holiday ? (
                      holiday.is_for_students && holiday.is_for_teachers
                        ? 'عامة'
                        : holiday.is_for_students
                        ? 'طلاب'
                        : 'معلمين'
                    ) : (
                      'عطلة'
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* معلومات توضيحية */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700"></div>
            <span>يوم عادي</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600"></div>
            <span>عطلة (رسمية أو أسبوعية)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded ring-2 ring-blue-500"></div>
            <span>اليوم الحالي</span>
          </div>
        </div>

        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl">إضافة عطلة</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                {selectedDate && new Date(selectedDate).toLocaleDateString('ar-EG', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="holidayName" className="text-gray-900 dark:text-gray-100">
                  اسم العطلة (اختياري)
                </Label>
                <Input
                  id="holidayName"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="مثال: عيد الفطر، عيد الأضحى..."
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-gray-900 dark:text-gray-100">العطلة تشمل:</Label>
                
                <div className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <Checkbox
                    id="forStudents"
                    checked={isForStudents}
                    onCheckedChange={(checked) => setIsForStudents(checked as boolean)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label 
                    htmlFor="forStudents" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-900 dark:text-gray-100"
                  >
                    الطلاب
                  </Label>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <Checkbox
                    id="forTeachers"
                    checked={isForTeachers}
                    onCheckedChange={(checked) => setIsForTeachers(checked as boolean)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label 
                    htmlFor="forTeachers" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-900 dark:text-gray-100"
                  >
                    الأساتذة
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-900 dark:text-gray-100">
                  ملاحظات (اختياري)
                </Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية..."
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              
              {!isForStudents && !isForTeachers && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    يجب اختيار الطلاب أو الأساتذة أو كليهما
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
                disabled={loading}
                className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleSaveHoliday}
                disabled={loading || (!isForStudents && !isForTeachers)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ العطلة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
