import { useState, useEffect } from 'react';
import { FileText, Search, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
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
    if (selectedClassId && selectedSection) {
      fetchStudents();
      fetchSubjects();
    }
  }, [selectedClassId, selectedSection]);

  const fetchStudents = async () => {
    try {
      const response = await api.get(`/students/?class_id=${selectedClassId}&section=${selectedSection}`);
      setStudents(response.data as Student[]);
    } catch (error) {
      console.error('Error fetching students:', error);
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
    if (!selectedClassId || !selectedSection) {
      alert('يرجى اختيار الصف والشعبة أولاً');
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            الإجراءات السريعة على الطلاب
          </div>
          <Button onClick={handleGenerateWhatsAppMessage} variant="outline" size="sm">
            <Send className="h-4 w-4 ml-2" />
            إرسال للأهل
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* اختيار الصف والشعبة */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">الصف</label>
            <Select value={selectedClassId?.toString()} onValueChange={(val) => setSelectedClassId(parseInt(val))}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent>
                {/* سيتم ملؤها من البيانات */}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الشعبة</label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الشعبة" />
              </SelectTrigger>
              <SelectContent>
                {/* سيتم ملؤها من البيانات */}
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
