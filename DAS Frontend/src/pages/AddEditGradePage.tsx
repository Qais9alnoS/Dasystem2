import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, BookOpen, Users, GraduationCap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/services/api';
import type { Class, Subject, Student, Teacher, SessionType, GradeLevel } from '@/types/school';
import { toast } from '@/hooks/use-toast';
import { defaultGradeTemplates, defaultSubjects, getGradeLabel, getSectionLabel } from '@/lib/defaultSchoolData';

const AddEditGradePage = () => {
  const navigate = useNavigate();
  const { gradeId } = useParams<{ gradeId: string }>();
  const isEditMode = !!gradeId;

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingClasses, setExistingClasses] = useState<Class[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    session_type: 'morning' as SessionType,
    grade_level: 'primary' as GradeLevel,
    grade_number: 1,
    section_count: 1,
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState({ subject_name: '', weekly_hours: 1 });
  
  // Statistics
  const [studentsInGrade, setStudentsInGrade] = useState<Student[]>([]);
  const [teachersInGrade, setTeachersInGrade] = useState<Teacher[]>([]);

  useEffect(() => {
    // Load selected academic year
    const yearId = localStorage.getItem('selected_academic_year_id');
    if (yearId) {
      const parsedId = parseInt(yearId, 10);
      if (!isNaN(parsedId)) {
        setSelectedAcademicYear(parsedId);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedAcademicYear) {
      loadExistingClasses();
      if (isEditMode && gradeId) {
        loadGradeData(parseInt(gradeId));
      }
    }
  }, [selectedAcademicYear, gradeId]);

  useEffect(() => {
    if (selectedAcademicYear && formData.grade_level && formData.grade_number) {
      loadStudentsAndTeachers();
    }
  }, [selectedAcademicYear, formData.grade_level, formData.grade_number, formData.session_type]);

  const loadExistingClasses = async () => {
    if (!selectedAcademicYear) return;
    
    try {
      const response = await api.academic.getClasses(selectedAcademicYear);
      const allClasses = Array.isArray(response) ? response : (response?.data || []);
      setExistingClasses(allClasses);
    } catch (error) {
      console.error('Failed to load existing classes:', error);
    }
  };

  const loadGradeData = async (id: number) => {
    try {
      setLoading(true);
      
      // Load class data
      const classResponse = await api.classes.getById(id);
      const classData = classResponse.data || classResponse;
      
      setFormData({
        session_type: classData.session_type,
        grade_level: classData.grade_level,
        grade_number: classData.grade_number,
        section_count: classData.section_count,
      });

      // Load subjects for this class
      const subjectsResponse = await api.academic.getSubjects(id);
      const classSubjects = Array.isArray(subjectsResponse) ? subjectsResponse : (subjectsResponse?.data || []);
      setSubjects(classSubjects);
    } catch (error) {
      console.error('Failed to load grade data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات الصف',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsAndTeachers = async () => {
    if (!selectedAcademicYear) return;

    try {
      // Load students for this grade
      const studentsResponse = await api.students.getAll({
        academic_year_id: selectedAcademicYear,
        grade_level: formData.grade_level,
        grade_number: formData.grade_number,
        session_type: formData.session_type,
      });
      const allStudents = Array.isArray(studentsResponse) ? studentsResponse : (studentsResponse?.data || []);
      setStudentsInGrade(allStudents);

      // For teachers, we would need teacher assignments
      // For now, we'll just get all teachers
      const teachersResponse = await api.teachers.getAll({ academic_year_id: selectedAcademicYear });
      const allTeachers = Array.isArray(teachersResponse) ? teachersResponse : (teachersResponse?.data || []);
      setTeachersInGrade(allTeachers);
    } catch (error) {
      console.error('Failed to load students/teachers:', error);
    }
  };

  const handleLoadDefaultSubjects = () => {
    const key = `${formData.grade_level}-${formData.grade_number}`;
    const defaultSubjectsForGrade = defaultSubjects[key];
    
    if (defaultSubjectsForGrade) {
      setSubjects(defaultSubjectsForGrade.map((subj, index) => ({
        id: -(index + 1), // Temporary negative ID for new subjects
        class_id: isEditMode ? parseInt(gradeId!) : 0,
        subject_name: subj.name,
        weekly_hours: subj.weekly_hours,
        is_active: true,
      })));
      
      toast({
        title: 'نجح',
        description: 'تم تحميل المواد الافتراضية',
      });
    } else {
      toast({
        title: 'تنبيه',
        description: 'لا توجد مواد افتراضية لهذا الصف',
        variant: 'destructive',
      });
    }
  };

  const handleAddSubject = () => {
    if (!newSubject.subject_name.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم المادة',
        variant: 'destructive',
      });
      return;
    }

    setSubjects([
      ...subjects,
      {
        id: -(subjects.length + 1), // Temporary negative ID
        class_id: isEditMode ? parseInt(gradeId!) : 0,
        subject_name: newSubject.subject_name,
        weekly_hours: newSubject.weekly_hours,
        is_active: true,
      },
    ]);

    setNewSubject({ subject_name: '', weekly_hours: 1 });
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    // Check for duplicate class (same session_type + grade_level + grade_number)
    const duplicate = existingClasses.find(
      cls =>
        cls.session_type === formData.session_type &&
        cls.grade_level === formData.grade_level &&
        cls.grade_number === formData.grade_number &&
        (!isEditMode || cls.id !== parseInt(gradeId!))
    );

    if (duplicate) {
      toast({
        title: 'خطأ',
        description: 'يوجد صف بنفس المرحلة والرقم ونوع الجلسة',
        variant: 'destructive',
      });
      return false;
    }

    if (subjects.length === 0) {
      toast({
        title: 'خطأ',
        description: 'يجب إضافة مادة واحدة على الأقل',
        variant: 'destructive',
      });
      return false;
    }

    const maxGradeNumber = formData.grade_level === 'primary' ? 6 : 3;
    if (formData.grade_number < 1 || formData.grade_number > maxGradeNumber) {
      toast({
        title: 'خطأ',
        description: `رقم الصف يجب أن يكون بين 1 و ${maxGradeNumber} للمرحلة ${formData.grade_level === 'primary' ? 'الابتدائية' : formData.grade_level === 'intermediate' ? 'الإعدادية' : 'الثانوية'}`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!selectedAcademicYear) return;
    if (!validateForm()) return;

    try {
      setLoading(true);

      let classId: number;

      if (isEditMode) {
        // Update existing class
        await api.classes.update(parseInt(gradeId!), {
          academic_year_id: selectedAcademicYear,
          ...formData,
        });
        classId = parseInt(gradeId!);

        // Delete existing subjects
        const existingSubjects = await api.academic.getSubjects(classId);
        const subjectsList = Array.isArray(existingSubjects) ? existingSubjects : (existingSubjects?.data || []);
        for (const subject of subjectsList) {
          if (subject.id) {
            await api.subjects.delete(subject.id);
          }
        }

        toast({
          title: 'نجح',
          description: 'تم تحديث الصف بنجاح',
        });
      } else {
        // Create new class
        const response = await api.classes.create({
          academic_year_id: selectedAcademicYear,
          ...formData,
        });
        classId = response.data?.id || response.id;

        toast({
          title: 'نجح',
          description: 'تم إنشاء الصف بنجاح',
        });
      }

      // Create subjects
      for (const subject of subjects) {
        await api.subjects.create({
          class_id: classId,
          subject_name: subject.subject_name,
          weekly_hours: subject.weekly_hours,
          is_active: true,
        });
      }

      navigate('/school-info');
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'خطأ',
        description: error.response?.data?.detail || error.message || 'فشل في حفظ الصف',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStudentCountBySection = (section: string): number => {
    return studentsInGrade.filter(s => s.section === section).length;
  };

  const maxGradeNumber = formData.grade_level === 'primary' ? 6 : 3;

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/school-info')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditMode ? 'تعديل الصف' : 'إضافة صف جديد'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isEditMode ? 'قم بتعديل معلومات الصف والمواد' : 'أنشئ صفًا جديدًا وحدد المواد'}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading} size="lg">
            <Save className="ml-2 h-5 w-5" />
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>المعلومات الأساسية</CardTitle>
                <CardDescription>حدد معلومات الصف الأساسية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع الجلسة *</Label>
                    <Select
                      value={formData.session_type}
                      onValueChange={(value: SessionType) =>
                        setFormData({ ...formData, session_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">صباحي</SelectItem>
                        <SelectItem value="evening">مسائي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>المرحلة *</Label>
                    <Select
                      value={formData.grade_level}
                      onValueChange={(value: GradeLevel) =>
                        setFormData({ ...formData, grade_level: value, grade_number: 1 })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">ابتدائي</SelectItem>
                        <SelectItem value="intermediate">إعدادي</SelectItem>
                        <SelectItem value="secondary">ثانوي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>رقم الصف *</Label>
                    <Input
                      type="number"
                      min="1"
                      max={maxGradeNumber}
                      value={formData.grade_number}
                      onChange={(e) =>
                        setFormData({ ...formData, grade_number: parseInt(e.target.value) || 1 })
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.grade_level === 'primary' ? '(1-6)' : '(1-3)'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>عدد الشعب *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.section_count}
                      onChange={(e) =>
                        setFormData({ ...formData, section_count: parseInt(e.target.value) || 1 })
                      }
                      required
                    />
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    الحقول المميزة بـ (*) مطلوبة
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Subjects Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>المواد الدراسية</CardTitle>
                    <CardDescription>
                      المواد المفروضة لهذا الصف ({subjects.length} مادة)
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadDefaultSubjects}
                    disabled={subjects.length > 0}
                  >
                    <BookOpen className="ml-2 h-4 w-4" />
                    تحميل المواد الافتراضية
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Subject Form */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="اسم المادة"
                      value={newSubject.subject_name}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, subject_name: e.target.value })
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubject();
                        }
                      }}
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      min="1"
                      max="15"
                      placeholder="حصص"
                      value={newSubject.weekly_hours}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, weekly_hours: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <Button onClick={handleAddSubject} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Subjects List */}
                {subjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد مواد. اضغط "تحميل المواد الافتراضية" أو أضف مادة يدويًا.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {subjects.map((subject, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{subject.subject_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {subject.weekly_hours} {subject.weekly_hours === 1 ? 'حصة' : 'حصص'}{' '}
                            أسبوعياً
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSubject(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Statistics */}
          <div className="space-y-6">
            {/* Students Statistics */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <CardTitle>الطلاب في الصف</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500 mb-4">
                  {studentsInGrade.length}
                </div>
                
                {formData.section_count > 1 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">توزيع الطلاب حسب الشعب:</p>
                    {Array.from({ length: formData.section_count }).map((_, index) => {
                      const sectionLabel = getSectionLabel(index);
                      const studentCount = getStudentCountBySection(sectionLabel);

                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">الشعبة {sectionLabel}:</span>
                          <span className="font-medium">{studentCount} طالب</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Teachers Statistics */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                  <CardTitle>الأساتذة</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {teachersInGrade.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  أستاذ مسجل في المدرسة
                </p>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>ملخص الصف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الصف:</span>
                  <span className="font-medium">
                    {getGradeLabel(formData.grade_level, formData.grade_number)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الجلسة:</span>
                  <span className="font-medium">
                    {formData.session_type === 'morning' ? 'صباحي' : 'مسائي'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">عدد المواد:</span>
                  <span className="font-medium">{subjects.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الحصص الأسبوعية:</span>
                  <span className="font-medium">
                    {subjects.reduce((sum, s) => sum + s.weekly_hours, 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditGradePage;

