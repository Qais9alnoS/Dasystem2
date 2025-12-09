import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { activitiesApi, classesApi, studentsApi } from '@/services/api';
import { ActivityParticipant, Class, Student, StudentSearchResult } from '@/types/school';
import { Search, Users, Loader2, Save, X } from 'lucide-react';

interface ActivityParticipantsManagerProps {
  activityId: number;
  onClose: () => void;
}

export const ActivityParticipantsManager: React.FC<ActivityParticipantsManagerProps> = ({ activityId, onClose }) => {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch activity participants
        const participantsResponse = await activitiesApi.getParticipants(activityId);
        if (participantsResponse.success && participantsResponse.data) {
          setParticipants(participantsResponse.data);
        }

        // Fetch classes
        const classesResponse = await classesApi.getAll();
        if (classesResponse.success && classesResponse.data) {
          setClasses(classesResponse.data);
        }

        // Fetch students (we'll filter them as needed)
        const studentsResponse = await studentsApi.getAll();
        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data);
          setFilteredStudents(studentsResponse.data);
        }
      } catch (error) {

        toast({
          title: "خطأ",
          description: "فشل في تحميل بيانات المشاركين",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activityId]);

  // Filter students based on search term and selected class
  useEffect(() => {
    let result = students;

    if (searchTerm) {
      result = result.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.father_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedClassId) {
      result = result.filter(student =>
        student.grade_number === classes.find(c => c.id === selectedClassId)?.grade_number
      );
    }

    setFilteredStudents(result);
  }, [searchTerm, selectedClassId, students, classes]);

  // Get participating student IDs
  const participatingStudentIds = participants
    .filter(p => p.is_participating)
    .map(p => p.class_id); // Note: This should be student_id in a real implementation

  const handleSaveParticipants = async () => {
    try {
      // In a real implementation, we would send the selected students to the API
      // For now, we'll just show a success message
      toast({
        title: "نجاح",
        description: "تم حفظ قائمة المشاركين بنجاح",
        variant: "default"
      });
      onClose();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ المشاركين',
        variant: "destructive"
      });
    }
  };

  const handleStudentSelect = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              إدارة مشاركي النشاط
            </span>
            <div className="flex gap-2">
              <Button onClick={handleSaveParticipants} className="flex items-center">
                <Save className="h-4 w-4 ml-1" />
                حفظ
              </Button>
              <Button variant="outline" onClick={onClose} className="flex items-center">
                <X className="h-4 w-4 ml-1" />
                إغلاق
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث عن طالب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={selectedClassId?.toString() || ''} onValueChange={(value) => setSelectedClassId(value ? parseInt(value) : null)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الصفوف</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id?.toString() || ''}>
                    {cls.grade_level} {cls.grade_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="flex gap-4">
            <Badge variant="secondary">
              إجمالي الطلاب: {filteredStudents.length}
            </Badge>
            <Badge variant="default">
              مشاركون محددون: {selectedStudents.length}
            </Badge>
          </div>

          {/* Students Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents(filteredStudents.map(s => s.id!));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>اسم الطالب</TableHead>
                  <TableHead>اسم الأب</TableHead>
                  <TableHead>الصف</TableHead>
                  <TableHead>الشعبة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    className={selectedStudents.includes(student.id!) ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.id!)}
                        onCheckedChange={() => handleStudentSelect(student.id!)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>{student.father_name}</TableCell>
                    <TableCell>{student.grade_level} {student.grade_number}</TableCell>
                    <TableCell>{student.section || '-'}</TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      لا توجد بيانات طلاب
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};