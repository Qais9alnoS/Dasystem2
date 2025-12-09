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
    BookOpen,
    Calendar,
    Users
} from 'lucide-react';
import { Teacher } from '@/types/school';
import { teachersApi } from '@/services/api';

interface TeachersListProps {
    searchQuery: string;
}

export const TeachersList: React.FC<TeachersListProps> = ({ searchQuery }) => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [totalTeachers, setTotalTeachers] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const teachersPerPage = 10;

    // Fetch teachers from API
    useEffect(() => {
        const fetchTeachers = async () => {
            setLoading(true);
            try {
                // If there's a search query, use the search API
                if (searchQuery) {
                    const response = await teachersApi.search(searchQuery, (currentPage - 1) * teachersPerPage, teachersPerPage);

                    if (response.success && response.data) {
                        setTeachers(response.data);
                        setTotalTeachers(response.data.length);
                    }
                } else {
                    // Otherwise, fetch all teachers with pagination
                    const response = await teachersApi.getAll({
                        skip: (currentPage - 1) * teachersPerPage,
                        limit: teachersPerPage
                    });

                    if (response.success && response.data) {
                        setTeachers(response.data);
                        // For now, we'll set a fixed total. In a real implementation,
                        // this would come from the API response pagination info
                        setTotalTeachers(response.data.length);
                    }
                }
            } catch (error) {

            } finally {
                setLoading(false);
            }
        };

        const delayDebounceFn = setTimeout(() => {
            fetchTeachers();
        }, 300); // Debounce search requests

        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, searchQuery]);

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

    const handleViewTeacher = (teacher: Teacher) => {

        // Navigate to teacher details page
    };

    const handleEditTeacher = (teacher: Teacher) => {

        // Navigate to edit teacher page
    };

    const handleDeleteTeacher = (teacher: Teacher) => {

        // Show confirmation dialog and delete
    };

    return (
        <div className="space-y-4">
            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>قائمة المعلمين</span>
                        <Badge variant="secondary">
                            {teachers.length} معلم
                        </Badge>
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Teachers Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>المعلم</TableHead>
                                <TableHead>المؤهلات</TableHead>
                                <TableHead>الهاتف</TableHead>
                                <TableHead>النقل</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                            <span>جاري تحميل البيانات...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : teachers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                            لا توجد نتائج
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery ? 'لم يتم العثور على معلمين مطابقين للبحث' : 'لا توجد معلمين مسجلين'}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                teachers.map((teacher) => (
                                    <TableRow key={teacher.id}>
                                        <TableCell>
                                            <div className="flex items-center space-x-3 space-x-reverse">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        {teacher.full_name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{teacher.full_name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {teacher.nationality || 'غير محدد'}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {Array.isArray(teacher.qualifications)
                                                  ? teacher.qualifications.map(q => q.degree).join(', ')
                                                  : (teacher.qualifications || 'غير محدد')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {teacher.phone || 'غير محدد'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {teacher.transportation_type ? getTransportationArabic(teacher.transportation_type) : 'غير محدد'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <Badge
                                                    variant={teacher.is_active ? 'default' : 'secondary'}
                                                    className={teacher.is_active ? 'bg-green-100 text-green-800' : ''}
                                                >
                                                    {teacher.is_active ? 'نشط' : 'غير نشط'}
                                                </Badge>
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
                                                        onClick={() => handleViewTeacher(teacher)}
                                                        className="gap-2"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        عرض التفاصيل
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleEditTeacher(teacher)}
                                                        className="gap-2"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        تعديل البيانات
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <BookOpen className="h-4 w-4" />
                                                        التوزيعات
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        الحضور
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteTeacher(teacher)}
                                                        className="gap-2 text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        حذف المعلم
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
            {totalTeachers > teachersPerPage && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        عرض {(currentPage - 1) * teachersPerPage + 1} إلى {Math.min(currentPage * teachersPerPage, totalTeachers)} من {totalTeachers} معلم
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
                            {Array.from({ length: Math.ceil(totalTeachers / teachersPerPage) }, (_, i) => i + 1).map((page) => (
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
                            disabled={currentPage === Math.ceil(totalTeachers / teachersPerPage)}
                        >
                            التالي
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};