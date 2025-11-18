import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import api from '@/services/api';

interface Holiday {
  id: number;
  holiday_date: string;
  holiday_name?: string;
  is_for_students: boolean;
  is_for_teachers: boolean;
  notes?: string;
}

interface HolidayManagementProps {
  academicYearId: number;
}

export function HolidayManagement({ academicYearId }: HolidayManagementProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);
  const [isForStudents, setIsForStudents] = useState(true);
  const [isForTeachers, setIsForTeachers] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchHolidays();
  }, [academicYearId]);

  const fetchHolidays = async () => {
    try {
      const response = await api.get(`/daily/holidays?academic_year_id=${academicYearId}`);
      setHolidays(response.data as Holiday[]);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  const handleDateClick = async (dateStr: string) => {
    const existing = holidays.find(h => h.holiday_date === dateStr);
    
    if (existing) {
      // حذف العطلة
      if (confirm('هل تريد حذف هذه العطلة؟')) {
        try {
          await api.delete(`/daily/holidays/${existing.id}`);
          fetchHolidays();
        } catch (error) {
          console.error('Error deleting holiday:', error);
        }
      }
    } else {
      // إضافة عطلة جديدة
      setSelectedDate(dateStr);
      setShowDialog(true);
    }
  };

  const handleSaveHoliday = async () => {
    try {
      await api.post('/daily/holidays', {
        academic_year_id: academicYearId,
        holiday_date: selectedDate,
        holiday_name: holidayName || null,
        is_for_students: isForStudents,
        is_for_teachers: isForTeachers,
        notes: notes || null
      });
      
      setShowDialog(false);
      resetForm();
      fetchHolidays();
    } catch (error) {
      console.error('Error saving holiday:', error);
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
    const dates = [];
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    
    return dates;
  };

  const isHoliday = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    
    // الجمعة (5) والسبت (6)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return { isHoliday: true, isWeekend: true };
    }
    
    const holiday = holidays.find(h => h.holiday_date === dateStr);
    return { isHoliday: !!holiday, isWeekend: false, holiday };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          إدارة أيام العطلة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
            <div key={day} className="text-center font-bold text-sm">
              {day}
            </div>
          ))}
          
          {generateCalendarDates().map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const { isHoliday: isHol, isWeekend, holiday } = isHoliday(dateStr);
            
            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(dateStr)}
                className={`p-2 text-center rounded border transition-colors ${
                  isHol
                    ? isWeekend
                      ? 'bg-gray-200 border-gray-400'
                      : 'bg-yellow-100 border-yellow-500'
                    : 'hover:bg-blue-50 border-gray-200'
                }`}
                title={holiday?.holiday_name || ''}
              >
                <div className="text-sm">{date.getDate()}</div>
                {isHol && !isWeekend && (
                  <div className="text-xs text-yellow-700">
                    {holiday?.is_for_students && holiday?.is_for_teachers
                      ? 'عطلة عامة'
                      : holiday?.is_for_students
                      ? 'طلاب'
                      : 'معلمين'}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {showDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">إضافة عطلة - {selectedDate}</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="holidayName">اسم العطلة (اختياري)</Label>
                  <Input
                    id="holidayName"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    placeholder="مثال: عيد الفطر"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="forStudents"
                      checked={isForStudents}
                      onCheckedChange={(checked) => setIsForStudents(checked as boolean)}
                    />
                    <Label htmlFor="forStudents">عطلة للطلاب</Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="forTeachers"
                      checked={isForTeachers}
                      onCheckedChange={(checked) => setIsForTeachers(checked as boolean)}
                    />
                    <Label htmlFor="forTeachers">عطلة للأساتذة</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات إضافية"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}>
                    إلغاء
                  </Button>
                  <Button onClick={handleSaveHoliday}>
                    حفظ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
