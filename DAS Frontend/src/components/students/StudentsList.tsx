import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Phone,
    DollarSign,
    FileText,
    GraduationCap
} from 'lucide-react';
import { Student } from '@/types/school';
import { studentsApi } from '@/services/api';

interface StudentsListProps {
    searchQuery: string;
}

export const StudentsList: React.FC<StudentsListProps> = ({ searchQuery }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const studentsPerPage = 10;

    // Fetch students from API
    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                // If there's a search query, use the search API
                if (searchQuery) {
                    const response = await studentsApi.search(searchQuery, undefined, undefined, studentsPerPage);
                    
                    if (response.success && response.data) {
                        setStudents(response.data);
                        setTotalStudents(response.data.length);
                    }
                } else {
                    // Otherwise, fetch all students with pagination
                    const response = await studentsApi.getAll({
                        skip: (currentPage - 1) * studentsPerPage,
                        limit: studentsPerPage
                    });
                    
                    if (response.success && response.data) {
                        setStudents(response.data);
                        // For now, we'll set a fixed total. In a real implementation, 
                        // this would come from the API response pagination info
                        setTotalStudents(response.data.length);
                    }
                }
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoading(false);
            }
        };

        const delayDebounceFn = setTimeout(() => {
            fetchStudents();
        }, 300); // Debounce search requests

        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, searchQuery]);

    // Filter students based on search query (client-side filtering for now)
    const filteredStudents = students.filter(student =>
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.father_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.father_phone?.includes(searchQuery)
    );

    // Pagination
    const totalPages = Math.ceil(totalStudents / studentsPerPage);
    const currentStudents = filteredStudents;

    const getGradeLevelArabic = (level: string) => {
        switch (level) {
            case 'primary': return 'ابتدائي';
            case 'intermediate': return 'إعدادي';
            case 'secondary': return 'ثانوي';
            default: return level;
        }
    };

    const getSessionTypeArabic = (session: string) => {
        switch (session) {
            case 'morning': return 'صباحي';
            case 'evening': return 'مسائي';
            default: return session;
        }
    };

    const getTransportationArabic = (type: string) => {
        switch (type) {
            case 'walking': return 'مشي';
            case 'full_bus': return 'باص كامل';
            case 'half_bus_to_school': return 'باص ذهاب';
            case 'half_bus_from_school': return 'باص إياب';
            default: return type;
        }
    };

    const handleViewStudent = (student: Student) => {
        console.log('View student:', student);
        // Navigate to student details page
    };

    const handleEditStudent = (student: Student) => {
        console.log('Edit student:', student);
        // Navigate to edit student page
    };

    const handleDeleteStudent = (student: Student) => {
        console.log('Delete student:', student);
        // Show confirmation dialog and delete
    };

    return (
        <div className="space-y-4">
            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>قائمة الطلاب</span>
                        <Badge variant="secondary">
                            {filteredStudents.length} طالب
                        </Badge>
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Students Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الطالب</TableHead>
                                <TableHead>الصف</TableHead>
                                <TableHead>الفترة</TableHead>
                                <TableHead>النقل</TableHead>
                                <TableHead>الهاتف</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                            <span>جاري تحميل البيانات...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : currentStudents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                            لا توجد نتائج
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery ? 'لم يتم العثور على طلاب مطابقين للبحث' : 'لا توجد طلاب مسجلين'}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentStudents.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell>
                                            <div className="flex items-center space-x-3 space-x-reverse">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        {student.full_name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{student.full_name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        والد: {student.father_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    {getGradeLevelArabic(student.grade_level)} {student.grade_number}
                                                </div>
                                                {student.section && (
                                                    <Badge variant="outline" className="text-xs">
                                                        شعبة {student.section}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={student.session_type === 'morning' ? 'default' : 'secondary'}
                                            >
                                                {getSessionTypeArabic(student.session_type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {getTransportationArabic(student.transportation_type)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {student.father_phone || 'غير محدد'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <Badge
                                                    variant={student.is_active ? 'default' : 'secondary'}
                                                    className={student.is_active ? 'bg-green-100 text-green-800' : ''}
                                                >
                                                    {student.is_active ? 'نشط' : 'غير نشط'}
                                                </Badge>
                                                {student.has_special_needs && (
                                                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                                                        رعاية خاصة
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleViewStudent(student)}
                                                        className="gap-2"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        عرض التفاصيل
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleEditStudent(student)}
                                                        className="gap-2"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        تعديل البيانات
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <DollarSign className="h-4 w-4" />
                                                        الشؤون المالية
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <FileText className="h-4 w-4" />
                                                        السجل الأكاديمي
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteStudent(student)}
                                                        className="gap-2 text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        حذف الطالب
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        عرض {(currentPage - 1) * studentsPerPage + 1} إلى {Math.min(currentPage * studentsPerPage, totalStudents)} من {totalStudents} طالب
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            السابق
                        </Button>
                        <div className="flex space-x-1 space-x-reverse">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === currentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className="w-8"
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            التالي
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};