import React, { useState, useEffect, useRef } from 'react';
import { Save, Calendar, Edit2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [academicRecords, setAcademicRecords] = useState<Map<number, StudentAcademic>>(new Map());
  const [absenceRecords, setAbsenceRecords] = useState<Map<number, AbsenceData>>(new Map());
  const [grades, setGrades] = useState<Map<string, string>>(new Map());
  const [pendingGrades, setPendingGrades] = useState<Map<string, { studentId: number, subjectId: number, gradeType: GradeType, grade: number }>>(new Map());
  const [newAbsenceDate, setNewAbsenceDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  // Max grades for each type (default 100)
  const [maxGrades, setMaxGrades] = useState<Record<GradeType, number>>({
    board_grades: 100,
    recitation_grades: 100,
    first_exam_grades: 100,
    midterm_grades: 100,
    second_exam_grades: 100,
    final_exam_grades: 100,
    behavior_grade: 100,
    activity_grade: 100,
  });
  
  // Dialog state
  const [editingGradeType, setEditingGradeType] = useState<GradeType | null>(null);
  const [tempMaxGrade, setTempMaxGrade] = useState<number>(100);
  
  // Refs for keyboard navigation
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

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

  // حفظ تلقائي كل دقيقة (60000 مللي ثانية)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (pendingGrades.size > 0 && !isSaving) {
        console.log('Auto-saving pending grades...');
        saveAllPendingGrades();
      }
    }, 60000); // 60 ثانية = 1 دقيقة

    return () => clearInterval(autoSaveInterval);
  }, [pendingGrades, isSaving]);

  // تحذير قبل مغادرة الصفحة مع تغييرات غير محفوظة
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'لديك تغييرات غير محفوظة. هل أنت متأكد من المغادرة؟';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
      const response = await api.academic.getSubjects({ class_id: selectedClass });
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

      console.log('🔄 Loading academic records for', students.length, 'students');

      for (const student of students) {
        try {
          // Ensure academic_year_id is a number
          const yearId = typeof selectedAcademicYear === 'number' 
            ? selectedAcademicYear 
            : parseInt(String(selectedAcademicYear), 10);
            
          console.log(`📖 Loading academics for student ${student.id} (${student.full_name}), year:`, yearId);
          
          // API expects separate parameters, not an object
          const response = await api.students.getAcademics(student.id, yearId);

          console.log(`✅ Raw response for student ${student.id}:`, response);

          // معالجة الاستجابة - قد تكون Array أو Object أو Object مع data
          let studentRecords: any[] = [];
          if (Array.isArray(response)) {
            studentRecords = response;
          } else if (response && typeof response === 'object') {
            if ('data' in response && Array.isArray(response.data)) {
              studentRecords = response.data;
            } else if ('id' in response) {
              // الاستجابة هي سجل واحد
              studentRecords = [response];
            }
          }

          console.log(`✅ Processed ${studentRecords.length} records for student ${student.id}:`, studentRecords);

          if (studentRecords.length > 0) {
            // Use the first record for each subject (or aggregate if needed)
            const firstRecord = studentRecords[0];
            records.set(student.id, firstRecord);

            console.log(`💾 Stored record for student ${student.id}:`, {
              id: firstRecord.id,
              board_grades: firstRecord.board_grades,
              recitation_grades: firstRecord.recitation_grades,
              first_exam_grades: firstRecord.first_exam_grades,
            });

            // Extract absence data
            absences.set(student.id, {
              student_id: student.id,
              absence_days: firstRecord.absence_days || 0,
              absence_dates: firstRecord.absence_dates ? JSON.parse(firstRecord.absence_dates) : [],
            });
          } else {
            console.log(`⚠️ No records found for student ${student.id}`);
          }
        } catch (error) {
          // No records yet for this student
          console.log(`❌ Error loading records for student ${student.id}:`, error);
        }
      }

      console.log('✅ Final academic records map:', records);
      setAcademicRecords(records);
      setAbsenceRecords(absences);
    } catch (error) {
      console.error('❌ Failed to load academic records:', error);
    }
  };

  const saveGrade = async (studentId: number, subjectId: number, gradeType: GradeType, grade: number) => {
    if (!selectedAcademicYear) return;

    try {
      const existingRecord = academicRecords.get(studentId);
      
      console.log('💾 Saving grade:', {
        studentId,
        gradeType,
        grade,
        existingRecord: existingRecord?.id,
        hasExistingRecord: !!existingRecord
      });

      // جمع جميع العلامات المعلقة لهذا الطالب
      const studentPendingGrades: Record<string, number> = {};
      pendingGrades.forEach((gradeData, key) => {
        if (gradeData.studentId === studentId) {
          studentPendingGrades[gradeData.gradeType] = gradeData.grade;
        }
      });

      const academicData = {
        student_id: studentId,
        academic_year_id: selectedAcademicYear,
        subject_id: subjectId,
        [gradeType]: grade,
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
        // دمج العلامات المعلقة
        ...studentPendingGrades,
      };

      console.log('📤 Sending to API:', academicData);

      let savedRecord;
      // التحقق من وجود السجل وأن له ID صالح (أكبر من 0)
      if (existingRecord && existingRecord.id && existingRecord.id > 0) {
        console.log('🔄 Updating existing record:', existingRecord.id);
        savedRecord = await api.students.updateAcademics(studentId, existingRecord.id, academicData);
      } else {
        console.log('✨ Creating new record');
        savedRecord = await api.students.createAcademics(studentId, academicData);
      }

      console.log('✅ Saved record response:', savedRecord);

      // استخراج الـ ID من الاستجابة بطرق مختلفة
      const recordId = savedRecord?.id 
        || savedRecord?.data?.id 
        || (Array.isArray(savedRecord) ? savedRecord[0]?.id : null)
        || existingRecord?.id 
        || 0;
      
      console.log('📝 Record ID:', recordId);

      // تحديث الـ state المحلي مع جميع العلامات
      const updatedRecord: StudentAcademic = {
        ...existingRecord,
        ...academicData,
        id: recordId,
      } as StudentAcademic;
      
      const newRecords = new Map(academicRecords);
      newRecords.set(studentId, updatedRecord);
      setAcademicRecords(newRecords);

      console.log('✅ Updated local state for student', studentId, ':', updatedRecord);

      // لا نستدعي loadAcademicRecords() هنا لتجنب إعادة التحميل
      return savedRecord;
    } catch (error: any) {
      console.error('❌ Error saving grade:', error);
      throw error;
    }
  };

  // حفظ جميع العلامات المعلقة
  const saveAllPendingGrades = async () => {
    if (pendingGrades.size === 0) {
      toast({
        title: 'تنبيه',
        description: 'لا توجد تغييرات للحفظ',
      });
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // تجميع العلامات حسب الطالب
      const gradesByStudent = new Map<number, Array<{ gradeType: GradeType, grade: number, subjectId: number }>>();
      
      pendingGrades.forEach((gradeData) => {
        if (!gradesByStudent.has(gradeData.studentId)) {
          gradesByStudent.set(gradeData.studentId, []);
        }
        gradesByStudent.get(gradeData.studentId)!.push({
          gradeType: gradeData.gradeType,
          grade: gradeData.grade,
          subjectId: gradeData.subjectId
        });
      });

      console.log('📊 Grouped grades by student:', gradesByStudent);

      // حفظ علامات كل طالب دفعة واحدة
      for (const [studentId, grades] of gradesByStudent.entries()) {
        try {
          console.log(`💾 Saving grades for student ${studentId}:`, grades);
          
          const existingRecord = academicRecords.get(studentId);
          const subjectId = grades[0].subjectId;

          // بناء بيانات الحفظ مع جميع العلامات
          const academicData: any = {
            student_id: studentId,
            academic_year_id: selectedAcademicYear,
            subject_id: subjectId,
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

          // إضافة جميع العلامات المعلقة
          grades.forEach(({ gradeType, grade }) => {
            academicData[gradeType] = grade;
          });

          console.log('📤 Sending to API:', academicData);

          let savedRecord;
          if (existingRecord && existingRecord.id && existingRecord.id > 0) {
            savedRecord = await api.students.updateAcademics(studentId, existingRecord.id, academicData);
          } else {
            savedRecord = await api.students.createAcademics(studentId, academicData);
          }

          console.log('✅ Saved successfully for student', studentId);

          // استخراج الـ ID
          const recordId = savedRecord?.id 
            || savedRecord?.data?.id 
            || (Array.isArray(savedRecord) ? savedRecord[0]?.id : null)
            || existingRecord?.id 
            || 0;

          // تحديث السجل المحلي
          const updatedRecord: StudentAcademic = {
            ...existingRecord,
            ...academicData,
            id: recordId,
          } as StudentAcademic;
          
          // تحديث الـ Map بدون إعادة إنشائها
          academicRecords.set(studentId, updatedRecord);

          successCount += grades.length;
        } catch (error) {
          errorCount += grades.length;
          console.error(`❌ Failed to save grades for student ${studentId}:`, error);
        }
      }

      // إجبار re-render بعد تحديث جميع السجلات
      setAcademicRecords(new Map(academicRecords));

      // مسح العلامات المعلقة بعد الحفظ
      setPendingGrades(new Map());
      setHasUnsavedChanges(false);

      if (errorCount === 0) {
        toast({
          title: 'نجح',
          description: `تم حفظ ${successCount} علامة لـ ${gradesByStudent.size} طالب بنجاح`,
        });
      } else {
        toast({
          title: 'تحذير',
          description: `تم حفظ ${successCount} علامة، فشل حفظ ${errorCount} علامة`,
          variant: 'default',
        });
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ العلامات',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
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
      sections.push(String(i + 1)); // 1, 2, 3, ...
    }
    return sections;
  };

  const getGradeValue = (studentId: number, gradeType: GradeType): number | undefined => {
    const record = academicRecords.get(studentId);
    const value = record ? record[gradeType] : undefined;
    // console.log(`Getting grade for student ${studentId}, type ${gradeType}:`, value);
    // إرجاع undefined بدلاً من null لعرض placeholder
    return value === null ? undefined : value;
  };

  const calculatePercentage = (studentId: number): number => {
    const record = academicRecords.get(studentId);
    if (!record) return 0;

    let totalPercentages = 0;
    let countGrades = 0;

    gradeTypes.forEach(({ value }) => {
      const gradeType = value as GradeType;
      const grade = record[gradeType];
      const maxGrade = maxGrades[gradeType];
      
      if (grade !== null && grade !== undefined && maxGrade > 0) {
        // حساب النسبة المئوية لكل علامة
        const percentage = (grade / maxGrade) * 100;
        totalPercentages += percentage;
        countGrades++;
      }
    });

    // المتوسط الحسابي للنسب المئوية
    if (countGrades === 0) return 0;
    return totalPercentages / countGrades;
  };

  const openMaxGradeDialog = (gradeType: GradeType) => {
    setEditingGradeType(gradeType);
    setTempMaxGrade(maxGrades[gradeType]);
  };

  const saveMaxGrade = () => {
    if (editingGradeType) {
      setMaxGrades({
        ...maxGrades,
        [editingGradeType]: tempMaxGrade,
      });
      setEditingGradeType(null);
      toast({
        title: 'نجح',
        description: 'تم تحديث العلامة القصوى',
      });
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>, 
    studentIndex: number, 
    gradeIndex: number, 
    saveCallback?: () => void
  ) => {
    const totalGradeTypes = gradeTypes.length;
    const totalStudents = students.length;
    
    // Handle Enter key - move to next row, same column
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      // حفظ القيمة الحالية قبل التنقل
      if (saveCallback) {
        saveCallback();
      }
      
      // الانتقال للحقل الجديد
      setTimeout(() => {
        const newStudentIndex = Math.min(studentIndex + 1, totalStudents - 1);
        const key = `${students[newStudentIndex]?.id}-${gradeTypes[gradeIndex]?.value}`;
        const input = inputRefs.current.get(key);
        if (input) {
          input.focus();
          input.select();
        }
      }, 50);
      return;
    }
    
    // Handle arrow keys for navigation
    if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      
      // حفظ القيمة الحالية قبل التنقل
      if (saveCallback) {
        saveCallback();
      }
      
      let newStudentIndex = studentIndex;
      let newGradeIndex = gradeIndex;
      
      switch(e.key) {
        case 'ArrowDown':
          // التنقل للأسفل - الطالب التالي، نفس العمود
          newStudentIndex = Math.min(studentIndex + 1, totalStudents - 1);
          break;
        case 'ArrowUp':
          // التنقل للأعلى - الطالب السابق، نفس العمود
          newStudentIndex = Math.max(studentIndex - 1, 0);
          break;
        case 'ArrowRight':
          // RTL: السهم الأيمن ينقل للعمود السابق (اليمين)
          newGradeIndex = Math.max(gradeIndex - 1, 0);
          break;
        case 'ArrowLeft':
          // RTL: السهم الأيسر ينقل للعمود التالي (اليسار)
          newGradeIndex = Math.min(gradeIndex + 1, totalGradeTypes - 1);
          break;
      }
      
      // الانتقال للحقل الجديد بعد فترة قصيرة
      setTimeout(() => {
        const key = `${students[newStudentIndex]?.id}-${gradeTypes[newGradeIndex]?.value}`;
        const input = inputRefs.current.get(key);
        if (input) {
          input.focus();
          input.select();
        }
      }, 50);
      return;
    }
    
    // السماح بجميع المفاتيح الأخرى (الأرقام، Backspace، Delete، إلخ) بالعمل بشكل طبيعي
  };

  // Modern Number Input Component - يستخدم useState محلي لتجنب مشاكل re-render
  const ModernNumberInput = ({ 
    initialValue, 
    onSave, 
    min, 
    max, 
    studentId, 
    gradeType,
    studentIndex,
    gradeIndex,
    placeholder = '--'
  }: { 
    initialValue: number | undefined, 
    onSave: (value: number) => void,
    min: number,
    max: number,
    studentId: number,
    gradeType: string,
    studentIndex: number,
    gradeIndex: number,
    placeholder?: string
  }) => {
    // تحويل القيمة الأولية وإزالة .00 إذا كان رقم صحيح
    const getDisplayValue = (value: number | undefined): string => {
      if (value === undefined || value === null) return '';
      
      // تحويل لرقم في حال كان string
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      
      // إذا كان رقم صحيح (بدون كسور عشرية)، إرجاع بدون .00
      if (Number.isInteger(numValue)) {
        return String(Math.round(numValue));
      }
      
      // إذا كان عشري (مثل 85.5)، إرجاعه كما هو
      return String(numValue);
    };

    const [localValue, setLocalValue] = useState<string>(getDisplayValue(initialValue));
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [lastSavedValue, setLastSavedValue] = useState<number | undefined>(initialValue);
    
    // تحديث القيمة المحلية عند تغيير initialValue من الخارج (بعد الحفظ)
    useEffect(() => {
      // تحديث فقط إذا القيمة الجديدة مختلفة عن القيمة المحفوظة الأخيرة
      if (initialValue !== lastSavedValue && !isEditing) {
        console.log(`Updating ${studentId}-${gradeType}: ${lastSavedValue} → ${initialValue}`);
        setLocalValue(getDisplayValue(initialValue));
        setLastSavedValue(initialValue);
      }
    }, [initialValue, lastSavedValue, isEditing, studentId, gradeType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      // السماح بالكتابة الحرة - فقط أرقام أو نقطة أو فارغ
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        // منع إدخال أرقام كبيرة جداً
        if (value !== '') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue > max * 10) {
            return;
          }
        }
        setLocalValue(value);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsEditing(true);
      e.target.select();
    };

    // دالة حفظ القيمة بدون تغيير حالة التعديل
    const saveValue = () => {
      const trimmed = localValue.trim();
      
      if (trimmed === '' || trimmed === '.' || trimmed === '-') {
        return;
      }
      
      let grade = parseFloat(trimmed);
      
      if (!isNaN(grade)) {
        // تطبيق القيمة القصوى والدنيا
        if (grade > max) {
          grade = max;
          toast({
            title: 'تنبيه',
            description: `تم تعديل العلامة إلى الحد الأقصى (${max})`,
            variant: 'default',
          });
        }
        grade = Math.max(min, grade);
        
        setLocalValue(String(grade));
        setLastSavedValue(grade);
        onSave(grade);
      }
    };

    const handleBlur = () => {
      saveValue();
      setIsEditing(false);
    };

    return (
      <Input
        ref={(el) => {
          if (el) {
            const key = `${studentId}-${gradeType}`;
            inputRefs.current.set(key, el);
          }
        }}
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={(e) => handleKeyDown(e, studentIndex, gradeIndex, saveValue)}
        placeholder={placeholder}
        className="w-24 text-center rounded-lg"
        autoComplete="off"
      />
    );
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
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <div className="flex flex-col items-end">
                <span className="text-sm text-orange-500 font-medium">
                  {pendingGrades.size} تغيير غير محفوظ
                </span>
                <span className="text-xs text-muted-foreground">
                  الحفظ التلقائي كل دقيقة
                </span>
              </div>
            )}
            <Button
              onClick={saveAllPendingGrades}
              disabled={isSaving || pendingGrades.size === 0}
              className="rounded-xl gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-3xl overflow-hidden">
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

        {/* Students Grades Table */}
        {selectedClass && selectedSection && students.length > 0 && (
          <Card className="rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle>العلامات والنشاط الدراسي</CardTitle>
              <CardDescription>
                {students.length} طالب في هذه الشعبة - اضغط على أي عنوان لتعديل العلامة القصوى
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
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-2 py-3 text-right text-sm font-semibold sticky right-0 bg-muted/50 z-10 first:rounded-tr-2xl">#</th>
                        <th className="px-2 py-3 text-right text-sm font-semibold sticky right-0 bg-muted/50 z-10 min-w-[150px]">اسم الطالب</th>
                        {gradeTypes.map((gradeType) => (
                          <th 
                            key={gradeType.value}
                            className="px-2 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-muted transition-colors group rounded-lg"
                            onClick={() => openMaxGradeDialog(gradeType.value as GradeType)}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span>{gradeType.label}</span>
                              <span className="text-xs text-muted-foreground">
                                (من {maxGrades[gradeType.value as GradeType]})
                              </span>
                              <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </th>
                        ))}
                        <th className="px-2 py-3 text-center text-sm font-semibold bg-primary/10 last:rounded-tl-2xl">
                          النسبة المئوية
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, studentIndex) => {
                        const defaultSubjectId = subjects[0]?.id || 1;
                        
                        // حساب النسبة المئوية من السجلات الأكاديمية المحفوظة
                        const percentage = calculatePercentage(student.id);

                        return (
                          <tr 
                            key={student.id}
                            className="border-b border-border hover:bg-muted/30 transition-colors last:border-b-0"
                          >
                            <td className="px-2 py-3 text-sm sticky right-0 bg-background">{studentIndex + 1}</td>
                            <td className="px-2 py-3 text-sm font-medium sticky right-0 bg-background min-w-[150px]">
                              {student.full_name}
                            </td>
                            {gradeTypes.map((gradeType, gradeIndex) => {
                              const gt = gradeType.value as GradeType;
                              const savedGrade = getGradeValue(student.id, gt);
                              const pendingKey = `${student.id}-${gt}`;
                              const pendingGrade = pendingGrades.get(pendingKey);
                              // استخدام العلامة المعلقة إذا كانت موجودة، وإلا استخدام المحفوظة
                              const currentGrade = pendingGrade?.grade ?? savedGrade;
                              const maxGrade = maxGrades[gt];

                              return (
                                <td key={gradeType.value} className="px-2 py-3">
                                  <ModernNumberInput
                                    initialValue={currentGrade}
                                    onSave={(grade) => {
                                      // إضافة إلى العلامات المعلقة بدلاً من الحفظ مباشرة
                                      const key = `${student.id}-${gt}`;
                                      const newPending = new Map(pendingGrades);
                                      newPending.set(key, {
                                        studentId: student.id,
                                        subjectId: defaultSubjectId,
                                        gradeType: gt,
                                        grade: grade,
                                      });
                                      setPendingGrades(newPending);
                                      setHasUnsavedChanges(true);
                                    }}
                                    min={0}
                                    max={maxGrade}
                                    studentId={student.id}
                                    gradeType={gt}
                                    studentIndex={studentIndex}
                                    gradeIndex={gradeIndex}
                                    placeholder="--"
                                  />
                                </td>
                              );
                            })}
                            <td className="px-2 py-3 text-center bg-primary/5">
                              <span className="text-lg font-bold text-primary">
                                {Number.isInteger(percentage) ? Math.round(percentage) : percentage.toFixed(1)}%
                              </span>
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
        )}

        {/* Max Grade Dialog */}
        <Dialog open={editingGradeType !== null} onOpenChange={() => setEditingGradeType(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل العلامة القصوى</DialogTitle>
              <DialogDescription>
                قم بتعديل العلامة القصوى لـ{' '}
                {editingGradeType && gradeTypes.find(g => g.value === editingGradeType)?.label}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="maxGrade">العلامة القصوى</Label>
                <Input
                  id="maxGrade"
                  type="number"
                  min="1"
                  max="1000"
                  value={tempMaxGrade}
                  onChange={(e) => setTempMaxGrade(parseInt(e.target.value) || 100)}
                  className="text-center text-lg rounded-2xl"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingGradeType(null)}
                className="rounded-xl"
              >
                إلغاء
              </Button>
              <Button onClick={saveMaxGrade} className="rounded-xl">
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentAcademicInfoPage;

