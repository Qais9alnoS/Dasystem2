import React, { useState, useEffect } from 'react';
import { Save, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { api } from '@/services/api';
import type { Student, StudentAcademic, Class, AcademicYear, Subject } from '@/types/school';
import { toast } from '@/hooks/use-toast';

type GradeType =
  | 'board_grades'
  | 'recitation_grades'
  | 'first_exam_grades'
  | 'midterm_grades'
  | 'second_exam_grades'
  | 'final_exam_grades'
  | 'behavior_grade'
  | 'activity_grade';

type AbsenceData = {
  student_id: number;
  absence_days: number;
  absence_dates: string[];
};

const StudentAcademicInfoPage = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedGradeType, setSelectedGradeType] = useState<GradeType>('board_grades');
  const [maxGrade, setMaxGrade] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [academicRecords, setAcademicRecords] = useState<Map<number, StudentAcademic>>(new Map());
  const [absenceRecords, setAbsenceRecords] = useState<Map<number, AbsenceData>>(new Map());
  const [grades, setGrades] = useState<Map<string, number>>(new Map());
  const [newAbsenceDate, setNewAbsenceDate] = useState<string>('');

  const gradeTypes = [
    { value: 'board_grades', label: 'السبور' },
    { value: 'recitation_grades', label: 'التسميع' },
    { value: 'first_exam_grades', label: 'المذاكرة الأولى' },
    { value: 'midterm_grades', label: 'الفحص النصفي' },
    { value: 'second_exam_grades', label: 'المذاكرة الثانية' },
    { value: 'final_exam_grades', label: 'الفحص النهائي' },
    { value: 'behavior_grade', label: 'السلوك' },
    { value: 'activity_grade', label: 'النشاط' },
  ];

  const loadClasses = async (academicYearId: number) => {
    try {
      setClassesLoading(true);
      setClassesError(null);
      console.log('=== Loading Classes Debug ===');
      console.log('Academic Year ID:', academicYearId);
      console.log('Academic Year ID Type:', typeof academicYearId);
      
      const response = await api.academic.getClasses(academicYearId);
      console.log('Raw API Response:', response);
      console.log('Response Type:', typeof response);
      console.log('Is Array:', Array.isArray(response));
      
      // Handle multiple response formats
      let allClasses: Class[] = [];
      
      if (Array.isArray(response)) {
        allClasses = response;
        console.log('Response is direct array');
      } else if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          allClasses = response.data;
          console.log('Response has data array');
        } else if ('items' in response && Array.isArray(response.items)) {
          allClasses = response.items;
          console.log('Response has items array');
        } else if ('success' in response && response.success && 'data' in response) {
          allClasses = Array.isArray(response.data) ? response.data : [];
          console.log('Response is success wrapper');
        }
      }
      
      console.log('Processed classes count:', allClasses.length);
      console.log('Processed classes:', allClasses);
      
      setClasses(allClasses);
      
      // Don't set error for empty classes - just show empty dropdown
      if (allClasses.length === 0) {
        console.log('No classes found for this academic year - showing empty dropdown');
      }
    } catch (error: any) {
      console.error('=== Error Loading Classes ===');
      console.error('Error:', error);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      setClasses([]);
      setClassesError(error.message || 'فشل في تحميل الصفوف. يرجى التحقق من الاتصال بالخادم.');
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحميل الصفوف',
        variant: 'destructive',
      });
    } finally {
      setClassesLoading(false);
    }
  };

  // Load selected academic year from localStorage on mount
  useEffect(() => {
    console.log('=== Initializing Student Academic Info Page ===');
    const yearId = localStorage.getItem('selected_academic_year_id');
    const yearName = localStorage.getItem('selected_academic_year_name');
    console.log('Stored Year ID:', yearId);
    console.log('Stored Year Name:', yearName);
    console.log('All localStorage keys:', Object.keys(localStorage));
    
    if (yearId) {
      const parsedId = parseInt(yearId, 10);
      console.log('Parsed Year ID:', parsedId);
      console.log('Is Valid Number:', !isNaN(parsedId));
      
      if (!isNaN(parsedId)) {
        setSelectedAcademicYear(parsedId);
        loadClasses(parsedId);
      } else {
        setClassesError('معرّف السنة الدراسية غير صالح. يرجى اختيار سنة دراسية صحيحة.');
        console.error('Invalid academic year ID:', yearId);
      }
    } else {
      setClassesError('لم يتم اختيار سنة دراسية. يرجى اختيار سنة من صفحة السنوات الدراسية.');
      console.warn('No academic year selected in localStorage');
    }
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadStudents();
      loadSubjects();
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    if (students.length > 0 && subjects.length > 0) {
      loadAcademicRecords();
    }
  }, [students, subjects]);

  const loadStudents = async () => {
    if (!selectedAcademicYear || !selectedClass || !selectedSection) return;

    try {
      setLoading(true);
      const selectedClassData = classes.find(c => c.id === selectedClass);

      const response = await api.students.getAll({
        academic_year_id: selectedAcademicYear,
        grade_level: selectedClassData?.grade_level,
        grade_number: selectedClassData?.grade_number,
      });

      // Handle both direct array and wrapped response
      const allStudents = Array.isArray(response) ? response : (response?.data || []);

      const filteredStudents = allStudents.filter(s => s.section === selectedSection);
      const sortedStudents = filteredStudents.sort((a, b) =>
        a.full_name.localeCompare(b.full_name, 'ar')
      );

      setStudents(sortedStudents);
    } catch (error) {
      console.error('Failed to load students:', error);
      setStudents([]); // Set to empty array on error
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الطلاب',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    if (!selectedClass) return;

    try {
      const response = await api.academic.getSubjects(selectedClass);
      // Handle both direct array and wrapped response
      const classSubjects = Array.isArray(response) ? response : (response?.data || []);
      setSubjects(classSubjects);
    } catch (error) {
      console.error('Failed to load subjects:', error);
      setSubjects([]); // Set to empty array on error
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل المواد',
        variant: 'destructive',
      });
    }
  };

  const loadAcademicRecords = async () => {
    if (!selectedAcademicYear || students.length === 0) return;

    try {
      const records = new Map<number, StudentAcademic>();
      const absences = new Map<number, AbsenceData>();

      for (const student of students) {
        try {
          const studentRecords = await api.students.getAcademics(student.id, {
            academic_year_id: selectedAcademicYear,
          });

          if (studentRecords.length > 0) {
            // Use the first record for each subject (or aggregate if needed)
            const firstRecord = studentRecords[0];
            records.set(student.id, firstRecord);

            // Extract absence data
            absences.set(student.id, {
              student_id: student.id,
              absence_days: firstRecord.absence_days || 0,
              absence_dates: firstRecord.absence_dates ? JSON.parse(firstRecord.absence_dates) : [],
            });
          }
        } catch (error) {
          // No records yet for this student
          console.log(`No academic records for student ${student.id}`);
        }
      }

      setAcademicRecords(records);
      setAbsenceRecords(absences);
    } catch (error) {
      console.error('Failed to load academic records:', error);
    }
  };

  const saveGrade = async (studentId: number, subjectId: number, grade: number) => {
    if (!selectedAcademicYear) return;

    try {
      const existingRecord = academicRecords.get(studentId);

      const academicData = {
        student_id: studentId,
        academic_year_id: selectedAcademicYear,
        subject_id: subjectId,
        [selectedGradeType]: grade,
        ...(existingRecord && {
          board_grades: existingRecord.board_grades,
          recitation_grades: existingRecord.recitation_grades,
          first_exam_grades: existingRecord.first_exam_grades,
          midterm_grades: existingRecord.midterm_grades,
          second_exam_grades: existingRecord.second_exam_grades,
          final_exam_grades: existingRecord.final_exam_grades,
          behavior_grade: existingRecord.behavior_grade,
          activity_grade: existingRecord.activity_grade,
          absence_days: existingRecord.absence_days,
          absence_dates: existingRecord.absence_dates,
        }),
      };

      if (existingRecord) {
        await api.students.updateAcademics(studentId, existingRecord.id, academicData);
      } else {
        await api.students.createAcademics(studentId, academicData);
      }

      toast({
        title: 'نجح',
        description: 'تم حفظ العلامة بنجاح',
      });

      loadAcademicRecords();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حفظ العلامة',
        variant: 'destructive',
      });
    }
  };

  const saveAbsence = async (studentId: number, subjectId: number) => {
    if (!selectedAcademicYear) return;

    try {
      const absenceData = absenceRecords.get(studentId);
      const existingRecord = academicRecords.get(studentId);

      if (!absenceData) return;

      const academicData = {
        student_id: studentId,
        academic_year_id: selectedAcademicYear,
        subject_id: subjectId,
        absence_days: absenceData.absence_days,
        absence_dates: JSON.stringify(absenceData.absence_dates),
        ...(existingRecord && {
          board_grades: existingRecord.board_grades,
          recitation_grades: existingRecord.recitation_grades,
          first_exam_grades: existingRecord.first_exam_grades,
          midterm_grades: existingRecord.midterm_grades,
          second_exam_grades: existingRecord.second_exam_grades,
          final_exam_grades: existingRecord.final_exam_grades,
          behavior_grade: existingRecord.behavior_grade,
          activity_grade: existingRecord.activity_grade,
        }),
      };

      if (existingRecord) {
        await api.students.updateAcademics(studentId, existingRecord.id, academicData);
      } else {
        await api.students.createAcademics(studentId, academicData);
      }

      toast({
        title: 'نجح',
        description: 'تم حفظ الغياب بنجاح',
      });

      loadAcademicRecords();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حفظ الغياب',
        variant: 'destructive',
      });
    }
  };

  const addAbsenceDate = (studentId: number) => {
    if (!newAbsenceDate) return;

    const currentData = absenceRecords.get(studentId) || {
      student_id: studentId,
      absence_days: 0,
      absence_dates: [],
    };

    const updatedData = {
      ...currentData,
      absence_dates: [...currentData.absence_dates, newAbsenceDate],
      absence_days: currentData.absence_days + 1,
    };

    const newRecords = new Map(absenceRecords);
    newRecords.set(studentId, updatedData);
    setAbsenceRecords(newRecords);
    setNewAbsenceDate('');
  };

  const removeAbsenceDate = (studentId: number, dateToRemove: string) => {
    const currentData = absenceRecords.get(studentId);
    if (!currentData) return;

    const updatedData = {
      ...currentData,
      absence_dates: currentData.absence_dates.filter(d => d !== dateToRemove),
      absence_days: Math.max(0, currentData.absence_days - 1),
    };

    const newRecords = new Map(absenceRecords);
    newRecords.set(studentId, updatedData);
    setAbsenceRecords(newRecords);
  };

  const getSectionOptions = () => {
    if (!selectedClass) return [];
    const classData = classes.find(c => c.id === selectedClass);
    if (!classData) return [];

    const sections = [];
    for (let i = 0; i < (classData.section_count || 1); i++) {
      sections.push(String.fromCharCode(65 + i));
    }
    return sections;
  };

  const getGradeValue = (studentId: number): number | undefined => {
    const record = academicRecords.get(studentId);
    return record ? record[selectedGradeType] : undefined;
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">معلومات دراسية - الطلاب</h1>
            <p className="text-muted-foreground mt-1">إدارة العلامات والحضور للطلاب</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>اختيار الصف والشعبة</CardTitle>
            <CardDescription>اختر الصف والشعبة لعرض وإدارة العلامات</CardDescription>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                جاري تحميل الصفوف...
              </div>
            ) : classesError ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{classesError}</p>
                <Button onClick={() => {
                  if (selectedAcademicYear) {
                    loadClasses(selectedAcademicYear);
                  }
                }}>
                  إعادة المحاولة
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الصف</Label>
                  <Select
                    value={selectedClass?.toString()}
                    onValueChange={(value) => {
                      setSelectedClass(parseInt(value));
                      setSelectedSection('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={classes.length === 0 ? "لا توجد صفوف متاحة" : "اختر الصف"} />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          لا توجد صفوف مسجلة
                        </div>
                      ) : (
                        classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {`${cls.grade_level === 'primary' ? 'ابتدائي' : cls.grade_level === 'intermediate' ? 'إعدادي' : 'ثانوي'} - الصف ${cls.grade_number}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الشعبة</Label>
                  <Select
                    value={selectedSection}
                    onValueChange={setSelectedSection}
                    disabled={!selectedClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الشعبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSectionOptions().map((section) => (
                        <SelectItem key={section} value={section}>
                          الشعبة {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grade Types */}
        {selectedClass && selectedSection && students.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>نوع العلامة</CardTitle>
                <CardDescription>اختر نوع العلامة لإدخال العلامات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <SegmentedControl
                    options={gradeTypes.slice(0, 4)}
                    value={selectedGradeType}
                    onValueChange={(value) => setSelectedGradeType(value as GradeType)}
                  />
                  <SegmentedControl
                    options={gradeTypes.slice(4)}
                    value={selectedGradeType}
                    onValueChange={(value) => setSelectedGradeType(value as GradeType)}
                  />

                  {selectedGradeType !== 'absence' && (
                    <div className="mt-4">
                      <Label htmlFor="max_grade">العلامة العليا (العلامة الكاملة)</Label>
                      <Input
                        id="max_grade"
                        type="number"
                        min="0"
                        value={maxGrade}
                        onChange={(e) => setMaxGrade(parseInt(e.target.value) || 100)}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Students Grades */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {gradeTypes.find(g => g.value === selectedGradeType)?.label || 'العلامات'}
                </CardTitle>
                <CardDescription>
                  {students.length} طالب في هذه الشعبة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    جاري التحميل...
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا يوجد طلاب في هذه الشعبة. يرجى إضافة طلاب من صفحة المعلومات الشخصية أولاً.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-4 py-3 text-right text-sm font-semibold sticky right-0 bg-muted/50">#</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold sticky right-0 bg-muted/50">اسم الطالب</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">
                            {selectedGradeType === 'absence' ? 'عدد أيام الغياب' : `العلامة (من ${maxGrade})`}
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, index) => {
                          const currentGrade = getGradeValue(student.id);
                          const absenceData = absenceRecords.get(student.id);
                          const defaultSubjectId = subjects[0]?.id || 1;

                          return (
                            <tr 
                              key={student.id}
                              className="border-b border-border hover:bg-muted/30 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm">{index + 1}</td>
                              <td className="px-4 py-3 text-sm font-medium">{student.full_name}</td>
                              <td className="px-4 py-3">
                                {selectedGradeType === 'absence' ? (
                                  <div className="text-center">
                                    <span className="text-lg font-bold">
                                      {absenceData?.absence_days || 0}
                                    </span>
                                  </div>
                                ) : (
                                  <Input
                                    type="number"
                                    min="0"
                                    max={maxGrade}
                                    step="0.5"
                                    value={currentGrade !== undefined ? currentGrade : ''}
                                    onChange={(e) => {
                                      const newGrades = new Map(grades);
                                      newGrades.set(`${student.id}`, parseFloat(e.target.value) || 0);
                                      setGrades(newGrades);
                                    }}
                                    onBlur={(e) => {
                                      const grade = parseFloat(e.target.value);
                                      if (!isNaN(grade) && grade >= 0 && grade <= maxGrade) {
                                        saveGrade(student.id, defaultSubjectId, grade);
                                      }
                                    }}
                                    placeholder="العلامة"
                                    className="w-24 text-center mx-auto"
                                  />
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (selectedGradeType === 'absence') {
                                        saveAbsence(student.id, defaultSubjectId);
                                      } else {
                                        const grade = grades.get(`${student.id}`) || currentGrade;
                                        if (grade !== undefined && grade >= 0 && grade <= maxGrade) {
                                          saveGrade(student.id, defaultSubjectId, grade);
                                        }
                                      }
                                    }}
                                  >
                                    <Save className="h-4 w-4 ml-1" />
                                    حفظ
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentAcademicInfoPage;

