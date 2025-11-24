import { useState, useEffect } from 'react';
import { FileText, Search, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import api from '@/services/api';

interface Student {
  id: number;
  full_name: string;
}

interface Subject {
  id: number;
  subject_name: string;
}

interface StudentAction {
  id: number;
  student_id: number;
  student_name: string;
  action_type: string;
  action_type_label: string;
  subject_id: number | null;
  subject_name: string | null;
  description: string;
  grade: number | null;
  max_grade: number | null;
  notes: string | null;
  action_date: string;
}

interface StudentActionsProps {
  academicYearId: number;
  sessionType: string;
  selectedDate: string;
}

const ACTION_TYPES = {
  WITHOUT_SUBJECT: {
    warning: 'إنذار',
    parent_call: 'استدعاء ولي أمر',
    suspension: 'فصل'
  },
  WITH_SUBJECT: {
    misbehavior: 'مشاغبة',
    distinguished_participation: 'مشاركة مميزة',
    thank_you_card: 'بطاقة شكر',
    note: 'ملاحظة'
  },
  ACADEMIC: {
    recitation: 'تسميع',
    activity: 'نشاط',
    quiz: 'سبر'
  }
};

export function StudentActions({ academicYearId, sessionType, selectedDate }: StudentActionsProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [actionType, setActionType] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('');
  const [maxGrade, setMaxGrade] = useState('');
  const [notes, setNotes] = useState('');
  
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  
  const [todayActions, setTodayActions] = useState<StudentAction[]>([]);
  const [editingAction, setEditingAction] = useState<StudentAction | null>(null);

  useEffect(() => {
    fetchClasses();
  }, [academicYearId, sessionType]);

  useEffect(() => {
    if (selectedClassId && selectedSection) {
      fetchStudents();
      fetchSubjects();
      fetchTodayActions();
    }
  }, [selectedClassId, selectedSection, selectedDate]);

  const fetchClasses = async () => {
    try {
      const response = await api.get(`/academic/classes?academic_year_id=${academicYearId}&session_type=${sessionType}`);
      setClasses(response.data as any[]);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const getAvailableGradeLevels = (): string[] => {
    const levels = new Set(classes.map((c: any) => c.grade_level));
    return Array.from(levels).sort();
  };

  const getFilteredClasses = (): any[] => {
    if (!selectedGradeLevel) return classes;
    return classes.filter((c: any) => c.grade_level === selectedGradeLevel);
  };

  const fetchStudents = async () => {
    if (!selectedClassId || !selectedSection) {
      console.log('Missing classId or section');
      return;
    }
    
    try {
      console.log('Fetching students for actions:', { 
        classId: selectedClassId, 
        section: selectedSection
      });
      const response = await api.get(`/students/?class_id=${selectedClassId}&section=${selectedSection}`);
      console.log('Students response:', response.data);
      setStudents(response.data as Student[]);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('حدث خطأ أثناء جلب بيانات الطلاب');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get(`/academic/subjects?class_id=${selectedClassId}`);
      setSubjects(response.data as Subject[]);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const openActionDialog = (student: Student) => {
    setSelectedStudent(student);
    setShowActionDialog(true);
  };

  const resetActionForm = () => {
    setActionType('');
    setSelectedSubjectId(null);
    setDescription('');
    setGrade('');
    setMaxGrade('');
    setNotes('');
  };

  const handleSaveAction = async () => {
    if (!selectedStudent || !actionType || !description) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // التحقق من المادة إذا كانت مطلوبة
    if (requiresSubject() && !selectedSubjectId) {
      alert('يرجى اختيار المادة لهذا النوع من الإجراءات');
      return;
    }

    // التحقق من العلامة
    if (isAcademicAction() && grade && maxGrade) {
      const gradeNum = parseFloat(grade);
      const maxGradeNum = parseFloat(maxGrade);
      if (gradeNum > maxGradeNum) {
        alert('العلامة لا يمكن أن تكون أعلى من العلامة الكاملة');
        return;
      }
    }

    try {
      await api.post('/daily/actions/students', {
        student_id: selectedStudent.id,
        academic_year_id: academicYearId,
        action_date: selectedDate,
        action_type: actionType,
        subject_id: selectedSubjectId,
        description,
        grade: grade ? parseFloat(grade) : null,
        max_grade: maxGrade ? parseFloat(maxGrade) : null,
        notes
      });

      alert('تم حفظ الإجراء بنجاح');
      setShowActionDialog(false);
      resetActionForm();
      fetchTodayActions(); // تحديث قائمة الإجراءات
    } catch (error) {
      console.error('Error saving action:', error);
      alert('حدث خطأ أثناء حفظ الإجراء');
    }
  };

  const fetchTodayActions = async () => {
    if (!selectedClassId || !selectedSection) return;
    
    try {
      const response = await api.get(
        `/daily/actions/students?class_id=${selectedClassId}&section=${selectedSection}&action_date=${selectedDate}`
      );
      setTodayActions(response.data as StudentAction[]);
    } catch (error) {
      console.error('Error fetching today actions:', error);
    }
  };

  const handleDeleteAction = async (actionId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإجراء؟')) return;
    
    try {
      await api.delete(`/daily/actions/students/${actionId}`);
      alert('تم حذف الإجراء بنجاح');
      fetchTodayActions();
    } catch (error) {
      console.error('Error deleting action:', error);
      alert('حدث خطأ أثناء حذف الإجراء');
    }
  };

  const handleEditAction = (action: StudentAction) => {
    setEditingAction(action);
    setSelectedStudent({ id: action.student_id, full_name: action.student_name });
    setActionType(action.action_type);
    setSelectedSubjectId(action.subject_id);
    setDescription(action.description);
    setGrade(action.grade?.toString() || '');
    setMaxGrade(action.max_grade?.toString() || '');
    setNotes(action.notes || '');
    setShowActionDialog(true);
  };

  const handleUpdateAction = async () => {
    if (!editingAction || !actionType || !description) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (requiresSubject() && !selectedSubjectId) {
      alert('يرجى اختيار المادة لهذا النوع من الإجراءات');
      return;
    }

    // التحقق من العلامة
    if (isAcademicAction() && grade && maxGrade) {
      const gradeNum = parseFloat(grade);
      const maxGradeNum = parseFloat(maxGrade);
      if (gradeNum > maxGradeNum) {
        alert('العلامة لا يمكن أن تكون أعلى من العلامة الكاملة');
        return;
      }
    }

    try {
      await api.put(`/daily/actions/students/${editingAction.id}`, {
        action_type: actionType,
        subject_id: selectedSubjectId,
        description,
        grade: grade ? parseFloat(grade) : null,
        max_grade: maxGrade ? parseFloat(maxGrade) : null,
        notes
      });

      alert('تم تحديث الإجراء بنجاح');
      setShowActionDialog(false);
      setEditingAction(null);
      resetActionForm();
      fetchTodayActions();
    } catch (error) {
      console.error('Error updating action:', error);
      alert('حدث خطأ أثناء تحديث الإجراء');
    }
  };

  const handleGenerateWhatsAppMessage = async () => {
    if (!selectedGradeLevel || !selectedClassId || !selectedSection) {
      alert('يرجى اختيار المرحلة والصف والشعبة أولاً');
      return;
    }

    try {
      const response = await api.get(
        `/daily/whatsapp/message/${selectedClassId}/${selectedSection}/${selectedDate}?academic_year_id=${academicYearId}`
      );
      
      const data = response.data as { message_content: string; group_link: string | null };
      setWhatsappMessage(data.message_content);
      
      // إذا كان هناك رابط محفوظ، استخدمه، وإلا استخدم الرابط من الاستجابة
      if (whatsappLink) {
        // احتفظ بالرابط الحالي
      } else if (data.group_link) {
        setWhatsappLink(data.group_link);
      }
      
      setShowWhatsAppDialog(true);
    } catch (error) {
      console.error('Error generating WhatsApp message:', error);
      alert('حدث خطأ أثناء توليد الرسالة');
    }
  };

  const handleSendToWhatsApp = async () => {
    if (!whatsappLink) {
      alert('يرجى إدخال رابط المجموعة أولاً');
      return;
    }

    // حفظ رابط المجموعة
    try {
      await api.post('/daily/whatsapp/config', {
        class_id: selectedClassId,
        section: selectedSection,
        academic_year_id: academicYearId,
        group_link: whatsappLink
      });
    } catch (error) {
      console.error('Error saving WhatsApp link:', error);
    }

    // إرسال الرسالة
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // تنسيق الرابط: https://chat.whatsapp.com/XXXXXXXX
    if (whatsappLink.includes('chat.whatsapp.com/')) {
      // رابط مجموعة - نسخ الرسالة وفتح المجموعة
      navigator.clipboard.writeText(whatsappMessage).then(() => {
        alert('تم نسخ الرسالة! الآن افتح مجموعة الواتساب والصقها.');
        setTimeout(() => {
          window.open(whatsappLink, '_blank');
        }, 500);
      }).catch(() => {
        window.open(whatsappLink, '_blank');
        alert('افتح المجموعة وانسخ الرسالة من النافذة السابقة');
      });
    }
    // تنسيق wa.me مع رقم هاتف
    else if (whatsappLink.includes('wa.me/')) {
      const phoneNumber = whatsappLink.split('wa.me/')[1].replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    }
    // رقم هاتف مباشر
    else if (whatsappLink.match(/^\+?[0-9]+$/)) {
      const phoneNumber = whatsappLink.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    }
    // رابط مباشر
    else {
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const requiresSubject = () => {
    return Object.keys(ACTION_TYPES.WITH_SUBJECT).includes(actionType) ||
           Object.keys(ACTION_TYPES.ACADEMIC).includes(actionType);
  };

  const isAcademicAction = () => {
    return Object.keys(ACTION_TYPES.ACADEMIC).includes(actionType);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg">
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            <span>الإجراءات السريعة على الطلاب</span>
            <Badge className="bg-accent text-accent-foreground">
              {sessionType === 'morning' ? '🌅 صباحي' : '🌆 مسائي'}
            </Badge>
          </div>
          <Button onClick={handleGenerateWhatsAppMessage} variant="outline" size="sm" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground/20">
            <Send className="h-4 w-4 ml-2" />
            إرسال للأهل
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* اختيار المرحلة والصف والشعبة */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">المرحلة</label>
            <Select value={selectedGradeLevel} onValueChange={(val) => {
              setSelectedGradeLevel(val);
              setSelectedClassId(null);
              setSelectedSection('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المرحلة" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableGradeLevels().map(level => (
                  <SelectItem key={level} value={level}>
                    {level === 'primary' ? 'الابتدائية' : level === 'intermediate' ? 'الإعدادية' : 'الثانوية'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">الصف</label>
            <Select value={selectedClassId?.toString()} onValueChange={(val) => {
              setSelectedClassId(parseInt(val));
              setSelectedSection('');
            }} disabled={!selectedGradeLevel}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent>
                {getFilteredClasses().map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    الصف {cls.grade_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">الشعبة</label>
            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الشعبة" />
              </SelectTrigger>
              <SelectContent>
                {selectedClassId && classes.find((c: any) => c.id === selectedClassId)?.section_count &&
                  Array.from({ length: classes.find((c: any) => c.id === selectedClassId)!.section_count }, (_, i) => 
                    String(i + 1)
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
            {/* شريط البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="ابحث عن طالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* قائمة الطلاب */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold text-foreground">{student.full_name}</span>
                  <Button
                    size="sm"
                    onClick={() => openActionDialog(student)}
                  >
                    إضافة إجراء
                  </Button>
                </div>
              ))}
            </div>

            {/* إجراءات اليوم */}
            {todayActions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-4 text-foreground">
                  📋 إجراءات اليوم ({todayActions.length})
                </h3>
                <div className="space-y-3">
                  {todayActions.map(action => (
                    <Card key={action.id} className="border-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-foreground">
                                {action.student_name}
                              </span>
                              <Badge className="bg-primary/10 text-primary">
                                {action.action_type_label}
                              </Badge>
                              {action.subject_name && (
                                <Badge variant="outline">
                                  📚 {action.subject_name}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(action.action_date).toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                            <p className="text-sm text-foreground mb-2">
                              {action.description}
                            </p>
                            {action.grade !== null && action.max_grade !== null && (
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">العلامة:</span> {action.grade}/{action.max_grade}
                              </div>
                            )}
                            {action.notes && (
                              <div className="text-sm text-muted-foreground mt-1">
                                <span className="font-medium">ملاحظات:</span> {action.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAction(action)}
                            >
                              تعديل
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteAction(action.id)}
                            >
                              حذف
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* نافذة إضافة إجراء */}
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingAction ? 'تعديل إجراء' : 'إضافة إجراء'} - {selectedStudent?.full_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">نوع الإجراء</label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الإجراء" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">إجراءات بدون مادة</div>
                    {Object.entries(ACTION_TYPES.WITHOUT_SUBJECT).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground mt-2">إجراءات مع مادة</div>
                    {Object.entries(ACTION_TYPES.WITH_SUBJECT).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground mt-2">إجراءات أكاديمية</div>
                    {Object.entries(ACTION_TYPES.ACADEMIC).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {requiresSubject() && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">المادة</label>
                  <Select value={selectedSubjectId?.toString()} onValueChange={(val) => setSelectedSubjectId(parseInt(val))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المادة" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">التفاصيل / السبب</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب تفاصيل الإجراء أو السبب..."
                  rows={3}
                />
              </div>

              {isAcademicAction() && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">العلامة</label>
                    <Input
                      type="number"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">العلامة الكاملة</label>
                    <Input
                      type="number"
                      value={maxGrade}
                      onChange={(e) => setMaxGrade(e.target.value)}
                      placeholder="10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">ملاحظات إضافية</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setShowActionDialog(false);
                  setEditingAction(null);
                  resetActionForm();
                }}>
                  إلغاء
                </Button>
                <Button onClick={editingAction ? handleUpdateAction : handleSaveAction}>
                  {editingAction ? 'تحديث الإجراء' : 'حفظ الإجراء'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* نافذة رسالة الواتساب */}
        <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">إرسال التقرير اليومي للأهل</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">رابط مجموعة الواتساب</label>
                <div className="flex gap-2">
                  <Input
                    value={whatsappLink}
                    onChange={(e) => setWhatsappLink(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    className="flex-1"
                  />
                  <Button
                    onClick={async () => {
                      if (!whatsappLink) {
                        alert('يرجى إدخال رابط المجموعة أولاً');
                        return;
                      }
                      try {
                        await api.post('/daily/whatsapp/config', {
                          class_id: selectedClassId,
                          section: selectedSection,
                          academic_year_id: academicYearId,
                          group_link: whatsappLink
                        });
                        alert('تم حفظ رابط المجموعة بنجاح');
                      } catch (error) {
                        console.error('Error saving WhatsApp link:', error);
                        alert('حدث خطأ أثناء حفظ الرابط');
                      }
                    }}
                    variant="outline"
                  >
                    حفظ
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">محتوى الرسالة</label>
                <Textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowWhatsAppDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSendToWhatsApp}>
                  <Send className="h-4 w-4 ml-2" />
                  إرسال عبر الواتساب
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
