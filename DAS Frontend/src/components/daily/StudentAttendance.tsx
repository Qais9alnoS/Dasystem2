import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import api from '@/services/api';

interface Student {
  id: number;
  full_name: string;
  grade_number: number;
  section: string;
  is_present?: boolean;
}

interface Class {
  id: number;
  grade_number: number;
  section_count: number;
  grade_level: string;
}

interface StudentAttendanceProps {
  academicYearId: number;
  sessionType: string;
  selectedDate: string;
}

export function StudentAttendance({ academicYearId, sessionType, selectedDate }: StudentAttendanceProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [absentStudentIds, setAbsentStudentIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchClasses();
  }, [academicYearId, sessionType]);

  useEffect(() => {
    if (selectedClassId && selectedSection) {
      fetchStudents();
    }
  }, [selectedClassId, selectedSection, selectedDate]);

  const fetchClasses = async () => {
    try {
      const response = await api.get(`/academic/classes?academic_year_id=${academicYearId}&session_type=${sessionType}`);
      setClasses(response.data as Class[]);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      // احصل على الطلاب
      const studentsResponse = await api.get(`/students/?class_id=${selectedClassId}&section=${selectedSection}`);
      
      // احصل على حضور اليوم
      const attendanceResponse = await api.get(
        `/daily/attendance/students?class_id=${selectedClassId}&section=${selectedSection}&attendance_date=${selectedDate}`
      );
      
      const attendanceData = attendanceResponse.data as Array<{student_id: number, is_present: boolean}>;
      const attendanceMap = new Map(
        attendanceData.map((a) => [a.student_id, a.is_present])
      );
      
      const studentsData = studentsResponse.data as Student[];
      const studentsWithAttendance = studentsData.map((student) => ({
        ...student,
        is_present: attendanceMap.get(student.id) ?? true
      }));
      
      setStudents(studentsWithAttendance);
      
      // تحديث قائمة الغائبين
      const absent = new Set<number>(
        studentsWithAttendance
          .filter((s) => !s.is_present)
          .map((s) => s.id)
      );
      setAbsentStudentIds(absent);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const toggleStudentAttendance = (studentId: number) => {
    setAbsentStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSaveAttendance = async () => {
    try {
      await api.post('/daily/attendance/students/bulk', {
        academic_year_id: academicYearId,
        attendance_date: selectedDate,
        class_id: selectedClassId,
        section: selectedSection,
        absent_student_ids: Array.from(absentStudentIds)
      });
      
      alert('تم حفظ الحضور بنجاح');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('حدث خطأ أثناء حفظ الحضور');
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = students.length - absentStudentIds.size;
  const absentCount = absentStudentIds.size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          حضور الطلاب
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* اختيار الصف والشعبة */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">الصف</label>
            <Select value={selectedClassId?.toString()} onValueChange={(val) => {
              setSelectedClassId(parseInt(val));
              setSelectedSection('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    الصف {cls.grade_number} - {cls.grade_level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الشعبة</label>
            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الشعبة" />
              </SelectTrigger>
              <SelectContent>
                {selectedClassId && classes.find(c => c.id === selectedClassId)?.section_count &&
                  Array.from({ length: classes.find(c => c.id === selectedClassId)!.section_count }, (_, i) => 
                    String.fromCharCode(65 + i)
                  ).map(section => (
                    <SelectItem key={section} value={section}>
                      الشعبة {section}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedClassId && selectedSection && (
          <>
            {/* إحصائيات */}
            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                <div className="text-sm text-gray-600">حاضر</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                <div className="text-sm text-gray-600">غائب</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                <div className="text-sm text-gray-600">المجموع</div>
              </div>
            </div>

            {/* شريط البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="ابحث عن طالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* قائمة الطلاب */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    absentStudentIds.has(student.id)
                      ? 'bg-red-50 border-red-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <span className="font-medium">{student.full_name}</span>
                  <Button
                    size="sm"
                    variant={absentStudentIds.has(student.id) ? 'destructive' : 'default'}
                    onClick={() => toggleStudentAttendance(student.id)}
                  >
                    {absentStudentIds.has(student.id) ? 'غائب' : 'حاضر'}
                  </Button>
                </div>
              ))}
            </div>

            {/* زر الحفظ */}
            <Button onClick={handleSaveAttendance} className="w-full" size="lg">
              حفظ الحضور
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
