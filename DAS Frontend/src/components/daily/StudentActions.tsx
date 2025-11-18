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

  useEffect(() => {
    fetchClasses();
  }, [academicYearId, sessionType]);

  useEffect(() => {
    if (selectedClassId && selectedSection) {
      fetchStudents();
      fetchSubjects();
    }
  }, [selectedClassId, selectedSection]);

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
    } catch (error) {
      console.error('Error saving action:', error);
      alert('حدث خطأ أثناء حفظ الإجراء');
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
      setWhatsappLink(data.group_link || '');
      setShowWhatsAppDialog(true);
    } catch (error) {
      console.error('Error generating WhatsApp message:', error);
      alert('حدث خطأ أثناء توليد الرسالة');
    }
  };

  const handleSendToWhatsApp = () => {
    if (whatsappLink) {
      const encodedMessage = encodeURIComponent(whatsappMessage);
      window.open(`${whatsappLink}?text=${encodedMessage}`, '_blank');
    } else {
      alert('يرجى تحديد رابط المجموعة أولاً');
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
      <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-700 dark:from-purple-800 dark:to-violet-900 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            <span>الإجراءات السريعة على الطلاب</span>
            <Badge className={`${
              sessionType === 'morning' 
                ? 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700' 
                : 'bg-purple-900 hover:bg-purple-950 dark:bg-purple-950 dark:hover:bg-black'
            } text-white`}>
              {sessionType === 'morning' ? '🌅 صباحي' : '🌆 مسائي'}
            </Badge>
          </div>
          <Button onClick={handleGenerateWhatsAppMessage} variant="outline" size="sm" className="text-white border-white hover:bg-white/20">
            <Send className="h-4 w-4 ml-2" />
            إرسال للأهل
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* اختيار المرحلة والصف والشعبة */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">المرحلة</label>
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
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">الصف</label>
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
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">الشعبة</label>
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
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                >
                  <span className="font-medium">{student.full_name}</span>
                  <Button
                    size="sm"
                    onClick={() => openActionDialog(student)}
                  >
                    إضافة إجراء
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* نافذة إضافة إجراء */}
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                إضافة إجراء - {selectedStudent?.full_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">نوع الإجراء</label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الإجراء" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" disabled>إجراءات بدون مادة</SelectItem>
                    {Object.entries(ACTION_TYPES.WITHOUT_SUBJECT).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                    <SelectItem value="" disabled>إجراءات مع مادة</SelectItem>
                    {Object.entries(ACTION_TYPES.WITH_SUBJECT).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                    <SelectItem value="" disabled>إجراءات أكاديمية</SelectItem>
                    {Object.entries(ACTION_TYPES.ACADEMIC).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {requiresSubject() && (
                <div>
                  <label className="block text-sm font-medium mb-2">المادة</label>
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
                <label className="block text-sm font-medium mb-2">التفاصيل / السبب</label>
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
                    <label className="block text-sm font-medium mb-2">العلامة</label>
                    <Input
                      type="number"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">العلامة الكاملة</label>
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
                <label className="block text-sm font-medium mb-2">ملاحظات إضافية</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setShowActionDialog(false);
                  resetActionForm();
                }}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveAction}>
                  حفظ الإجراء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* نافذة رسالة الواتساب */}
        <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إرسال التقرير اليومي للأهل</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">رابط مجموعة الواتساب</label>
                <Input
                  value={whatsappLink}
                  onChange={(e) => setWhatsappLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">محتوى الرسالة</label>
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
                <Button onClick={handleSendToWhatsApp} className="bg-green-600 hover:bg-green-700">
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
