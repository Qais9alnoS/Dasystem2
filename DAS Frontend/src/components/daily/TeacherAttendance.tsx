import { useState, useEffect } from 'react';
import { Users, Search, UserCheck, UserX, Save, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import api from '@/services/api';

interface TeacherScheduleEntry {
  teacher_id: number;
  teacher_name: string;
  day_of_week: number; // 1-5 (Sunday to Thursday)
  period_number: number; // 1-6
  subject_name: string;
  grade_number: number;
  section: string;
  grade_level: string;
  schedule_id: number;
}

interface TeacherDaySchedule {
  teacher_id: number;
  teacher_name: string;
  classes: {
    schedule_id: number;
    period_number: number;
    subject_name: string;
    grade_number: number;
    section: string;
    grade_level: string;
    is_present: boolean;
  }[];
}

interface TeacherAttendanceProps {
  academicYearId: number;
  sessionType: string;
  selectedDate: string;
}

export function TeacherAttendance({ academicYearId, sessionType, selectedDate }: TeacherAttendanceProps) {
  const [teacherSchedules, setTeacherSchedules] = useState<TeacherDaySchedule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeacherSchedules();
  }, [academicYearId, sessionType, selectedDate]);

  const getDayOfWeek = (dateString: string): number => {
    const date = new Date(dateString);
    const day = date.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Convert JavaScript day (0-6, Sunday-Saturday) to backend day (1-5, Sunday-Thursday)
    // Sunday=0 -> 1, Monday=1 -> 2, Tuesday=2 -> 3, Wednesday=3 -> 4, Thursday=4 -> 5
    // Friday=5 and Saturday=6 should not be used (weekend)
    if (day === 5 || day === 6) {
      return -1; // Weekend
    }
    return day + 1; // Convert 0-4 to 1-5
  };

  const fetchTeacherSchedules = async () => {
    setLoading(true);
    try {
      const dayOfWeek = getDayOfWeek(selectedDate);
      
      if (dayOfWeek === -1) {
        // Weekend, no classes
        setTeacherSchedules([]);
        setLoading(false);
        return;
      }

      // Get all schedules for this day
      const response = await api.get(
        `/schedules/?academic_year_id=${academicYearId}&session_type=${sessionType}&day_of_week=${dayOfWeek}`
      );

      const scheduleEntries = response.data as TeacherScheduleEntry[];
      
      // Group by teacher
      const teacherMap = new Map<number, TeacherDaySchedule>();
      
      for (const entry of scheduleEntries) {
        if (!teacherMap.has(entry.teacher_id)) {
          teacherMap.set(entry.teacher_id, {
            teacher_id: entry.teacher_id,
            teacher_name: entry.teacher_name,
            classes: []
          });
        }
        
        teacherMap.get(entry.teacher_id)!.classes.push({
          schedule_id: entry.schedule_id,
          period_number: entry.period_number,
          subject_name: entry.subject_name,
          grade_number: entry.grade_number,
          section: entry.section,
          grade_level: entry.grade_level,
          is_present: true // Default to present
        });
      }
      
      // Sort classes by period number for each teacher
      const teachers = Array.from(teacherMap.values()).map(teacher => ({
        ...teacher,
        classes: teacher.classes.sort((a, b) => a.period_number - b.period_number)
      }));
      
      // Get existing attendance records for this day
      const attendanceResponse = await api.get(
        `/daily/attendance/teachers?attendance_date=${selectedDate}`
      );
      
      if (attendanceResponse.data) {
        const attendanceRecords = attendanceResponse.data as Array<{
          teacher_id: number;
          schedule_id: number;
          is_present: boolean;
        }>;
        
        // Update presence status based on existing records
        for (const teacher of teachers) {
          for (const classEntry of teacher.classes) {
            const record = attendanceRecords.find(
              r => r.teacher_id === teacher.teacher_id && r.schedule_id === classEntry.schedule_id
            );
            if (record) {
              classEntry.is_present = record.is_present;
            }
          }
        }
      }
      
      setTeacherSchedules(teachers);
    } catch (error) {
      console.error('Error fetching teacher schedules:', error);
      alert('حدث خطأ أثناء جلب جداول الأساتذة');
    } finally {
      setLoading(false);
    }
  };

  const toggleClassAttendance = (teacherId: number, scheduleId: number | null, periodNumber?: number) => {
    setTeacherSchedules(prev => 
      prev.map(teacher => {
        if (teacher.teacher_id === teacherId) {
          return {
            ...teacher,
            classes: teacher.classes.map(cls => {
              // Match by schedule_id if available, otherwise by period_number
              const isMatch = scheduleId !== null 
                ? cls.schedule_id === scheduleId 
                : cls.period_number === periodNumber;
              
              return isMatch ? { ...cls, is_present: !cls.is_present } : cls;
            })
          };
        }
        return teacher;
      })
    );
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const attendanceData = teacherSchedules.flatMap(teacher =>
        teacher.classes.map(cls => ({
          teacher_id: teacher.teacher_id,
          schedule_id: cls.schedule_id ?? null, // Ensure null instead of undefined
          attendance_date: selectedDate,
          is_present: cls.is_present
        }))
      );

      await api.post('/daily/attendance/teachers/bulk', {
        academic_year_id: academicYearId,
        attendance_date: selectedDate,
        records: attendanceData
      });
      
      alert('✅ تم حفظ حضور الأساتذة بنجاح');
    } catch (error) {
      console.error('Error saving teacher attendance:', error);
      alert('❌ حدث خطأ أثناء حفظ حضور الأساتذة');
    } finally {
      setSaving(false);
    }
  };

  const filteredTeachers = teacherSchedules.filter(teacher =>
    teacher.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
  );

  const getGradeLevelLabel = (gradeLevel: string): string => {
    const labels: Record<string, string> = {
      'primary': 'الابتدائي',
      'intermediate': 'الإعدادي',
      'secondary': 'الثانوي'
    };
    return labels[gradeLevel] || gradeLevel;
  };

  // Calculate stats
  const totalClasses = teacherSchedules.reduce((sum, teacher) => sum + teacher.classes.length, 0);
  const presentClasses = teacherSchedules.reduce(
    (sum, teacher) => sum + teacher.classes.filter(c => c.is_present).length, 
    0
  );
  const absentClasses = totalClasses - presentClasses;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            حضور الأساتذة
          </CardTitle>
          <Badge className="bg-accent text-accent-foreground">
            {sessionType === 'morning' ? '🌅 صباحي' : '🌆 مسائي'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* إحصائيات */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary/10 p-4 rounded-xl border border-primary">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <Badge className="bg-primary text-primary-foreground">{presentClasses}</Badge>
            </div>
            <div className="text-sm font-medium text-primary">حصص حضور</div>
          </div>
          <div className="bg-destructive/10 p-4 rounded-xl border border-destructive">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <Badge className="bg-destructive text-destructive-foreground">{absentClasses}</Badge>
            </div>
            <div className="text-sm font-medium text-destructive">حصص غياب</div>
          </div>
          <div className="bg-accent/10 p-4 rounded-xl border border-accent">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-5 w-5 text-accent" />
              <Badge className="bg-accent text-accent-foreground">{totalClasses}</Badge>
            </div>
            <div className="text-sm font-medium text-accent">مجموع الحصص</div>
          </div>
        </div>

        {/* شريط البحث */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="ابحث عن أستاذ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* قائمة الأساتذة */}
        <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
              <p>جاري تحميل جداول الأساتذة...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا يوجد أساتذة لديهم حصص في هذا اليوم</p>
            </div>
          ) : (
            filteredTeachers.map(teacher => (
              <Card key={teacher.teacher_id} className="border-2 border-border">
                <CardHeader className="pb-3 bg-muted/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {teacher.teacher_name}
                    <Badge variant="outline" className="mr-auto">
                      {teacher.classes.length} حصة
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {teacher.classes.map((cls, idx) => (
                    <div
                      key={cls.schedule_id ?? `${teacher.teacher_id}-${cls.period_number}-${idx}`}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 ${
                        cls.is_present
                          ? 'bg-primary/10 border-primary'
                          : 'bg-destructive/10 border-destructive'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {cls.is_present ? (
                          <UserCheck className="h-5 w-5 text-primary" />
                        ) : (
                          <UserX className="h-5 w-5 text-destructive" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">
                              الحصة {cls.period_number}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {cls.subject_name}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {getGradeLevelLabel(cls.grade_level)} - الصف {cls.grade_number} / {cls.section}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={cls.is_present ? 'default' : 'destructive'}
                        onClick={() => toggleClassAttendance(teacher.teacher_id, cls.schedule_id ?? null, cls.period_number)}
                        className="min-w-[80px]"
                      >
                        {cls.is_present ? 'حاضر' : 'غائب'}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* زر الحفظ */}
        {filteredTeachers.length > 0 && (
          <Button 
            onClick={handleSaveAttendance} 
            className="w-full" 
            size="lg"
            disabled={saving}
          >
            <Save className="h-5 w-5 ml-2" />
            {saving ? 'جاري الحفظ...' : 'حفظ حضور الأساتذة'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
