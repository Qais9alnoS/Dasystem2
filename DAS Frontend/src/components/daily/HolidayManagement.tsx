import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, AlertCircle, CalendarDays } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
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
  notes?: string;
}

interface HolidayManagementProps {
  academicYearId: number;
  sessionType: 'morning' | 'evening';
  selectedDate: string;
}

interface DailySummary {
  total_present: number;
  total_absent: number;
  total_actions: number;
}

export function HolidayManagement({ academicYearId, sessionType, selectedDate: propSelectedDate }: HolidayManagementProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [notes, setNotes] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date(propSelectedDate || new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHolidays();
  }, [academicYearId, sessionType]);

  useEffect(() => {
    // تحديث التقويم ليظهر الشهر المحدد من الصفحة الرئيسية
    if (propSelectedDate) {
      setCurrentMonth(new Date(propSelectedDate));
    }
  }, [propSelectedDate]);

  const fetchHolidays = async () => {
    try {
      setError(null);
      const response = await api.get(`/daily/holidays?academic_year_id=${academicYearId}&session_type=${sessionType}`);
      
      if (response.data && Array.isArray(response.data)) {
        setHolidays(response.data as Holiday[]);
      } else {
        setHolidays([]);
      }
    } catch (error: any) {
      console.error('Error fetching holidays:', error);
      setError('حدث خطأ أثناء تحميل العطل. سيتم إنشاء جدول العطل عند إضافة أول عطلة.');
      setHolidays([]);
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
    setLoading(true);
    try {
      await api.post('/daily/holidays', {
        academic_year_id: academicYearId,
        session_type: sessionType,
        holiday_date: selectedDate,
        holiday_name: holidayName || null,
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

  const isSelectedDate = (date: Date | null): boolean => {
    if (!date || !propSelectedDate) return false;
    const selected = new Date(propSelectedDate);
    return date.getDate() === selected.getDate() &&
           date.getMonth() === selected.getMonth() &&
           date.getFullYear() === selected.getFullYear();
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
    <Card className="ios-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              إدارة أيام العطلة
            </CardTitle>
            <CardDescription className="mt-1">
              قم بإضافة أو إزالة أيام العطل للفترة {sessionType === 'morning' ? 'الصباحية' : 'المسائية'}
            </CardDescription>
          </div>
          <Button 
            onClick={goToToday}
            variant="outline"
            size="sm"
          >
            <CalendarDays className="w-4 h-4 ml-2" />
            العودة لليوم
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* شريط التنقل بين الأشهر */}
        <div className="flex items-center justify-between mb-6 p-4 bg-muted/50 rounded-lg border border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="hover:bg-primary/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground">
              {formatMonthYear(currentMonth)}
            </h3>
            {currentMonth.getMonth() === today.getMonth() && 
             currentMonth.getFullYear() === today.getFullYear() && (
              <p className="text-xs text-primary">
                {getArabicDayName(today)} - {today.getDate()} {formatMonthYear(today).split(' ')[0]}
              </p>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="hover:bg-primary/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* أسماء الأيام */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => (
            <div 
              key={day} 
              className="text-center font-semibold text-xs py-2 rounded text-muted-foreground"
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
            const isSelected = isSelectedDate(date);
            
            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(dateStr)}
                className={`
                  aspect-square p-1 text-center rounded-lg border-2 transition-all duration-200
                  ${isTodayDate 
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' 
                    : ''
                  }
                  ${isSelected 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/10' 
                    : isHol
                      ? 'bg-accent/10 border-accent hover:bg-accent/20'
                      : 'bg-card border-border hover:bg-primary/5 hover:border-primary'
                  }
                `}
                title={holiday?.holiday_name || (isDefault ? 'عطلة نهاية الأسبوع' : '')}
              >
                <div className={`text-sm font-semibold ${
                  isSelected
                    ? 'text-primary'
                    : isTodayDate 
                      ? 'text-accent' 
                      : isHol
                        ? 'text-accent'
                        : 'text-foreground'
                }`}>
                  {date.getDate()}
                </div>
                {isHol && (
                  <div className="text-[9px] leading-tight mt-0.5 text-accent font-medium">
                    عطلة
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* تنبيه الخطأ */}
        {error && (
          <Alert className="mt-4 border-accent bg-accent/10">
            <AlertCircle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent-foreground">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* معلومات توضيحية */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm font-semibold text-foreground mb-3">دليل الألوان:</p>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-card border-2 border-border"></div>
              <span>يوم عادي</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-accent/10 border-2 border-accent"></div>
              <span>عطلة رسمية</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded ring-2 ring-primary bg-primary/10"></div>
              <span>اليوم المحدد</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded ring-2 ring-accent"></div>
              <span>اليوم الحالي</span>
            </div>
          </div>
        </div>

        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl">إضافة عطلة</DialogTitle>
              <DialogDescription className="text-muted-foreground">
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
                <Label htmlFor="holidayName" className="text-foreground">
                  اسم العطلة (اختياري)
                </Label>
                <Input
                  id="holidayName"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="مثال: عيد الفطر، عيد الأضحى..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground">
                  ملاحظات (اختياري)
                </Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
                disabled={loading}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleSaveHoliday}
                disabled={loading}
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
