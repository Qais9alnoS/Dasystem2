import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Eye, EyeOff, AlertTriangle, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { IOSNavbar } from '@/components/ui/ios-navbar';

interface UserData {
  id: number;
  username: string;
  role: string;
  session_type?: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
}

const UserManagementPage = () => {
  const { state: authState } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: '',
    session_type: ''
  });

  const [editFormData, setEditFormData] = useState({
    username: '',
    password: '',
    role: '',
    session_type: '',
    is_active: true
  });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const roleOptions = [
    {
      value: 'director',
      label: 'مدير المدرسة',
      color: 'bg-primary text-primary-foreground'
    },
    {
      value: 'finance',
      label: 'المسؤول المالي',
      color: 'bg-secondary text-secondary-foreground'
    },
    {
      value: 'morning_school',
      label: 'إدارة الفترة الصباحية',
      color: 'bg-accent text-accent-foreground'
    },
    {
      value: 'evening_school',
      label: 'إدارة الفترة المسائية',
      color: 'bg-purple-500 text-white'
    }
  ];

  const getRoleLabel = (role: string) => {
    return roleOptions.find(r => r.value === role)?.label || role;
  };

  const getRoleBadgeClass = (role: string) => {
    return roleOptions.find(r => r.value === role)?.color || 'bg-gray-500 text-white';
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل قائمة المستخدمين',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!formData.username || !formData.password || !formData.role) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      const userData: any = {
        username: formData.username,
        password: formData.password,
        role: formData.role
      };

      // Add session_type only for morning/evening school roles
      if (formData.role === 'morning_school') {
        userData.session_type = 'morning';
      } else if (formData.role === 'evening_school') {
        userData.session_type = 'evening';
      }

      const response = await authApi.createUser(userData);
      
      if (response.success) {
        toast({
          title: 'نجح',
          description: 'تم إنشاء المستخدم بنجاح'
        });
        setIsAddDialogOpen(false);
        setFormData({ username: '', password: '', role: '', session_type: '' });
        fetchUsers();
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل إنشاء المستخدم',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await authApi.deleteUser(userToDelete.id);
      if (response.success) {
        toast({
          title: 'نجح',
          description: 'تم حذف المستخدم بنجاح'
        });
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل حذف المستخدم',
        variant: 'destructive'
      });
    }
  };

  const handleEditUser = (user: UserData) => {
    setUserToEdit(user);
    setEditFormData({
      username: user.username,
      password: '', // Don't populate password for security
      role: user.role,
      session_type: user.session_type || '',
      is_active: user.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!userToEdit || !editFormData.username || !editFormData.role) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      const userData: any = {
        username: editFormData.username,
        role: editFormData.role,
        is_active: editFormData.is_active
      };

      // Add password only if provided
      if (editFormData.password && editFormData.password.length > 0) {
        userData.password = editFormData.password;
      }

      // Add session_type only for morning/evening school roles
      if (editFormData.role === 'morning_school') {
        userData.session_type = 'morning';
      } else if (editFormData.role === 'evening_school') {
        userData.session_type = 'evening';
      }

      const response = await authApi.updateUser(userToEdit.id, userData);
      
      if (response.success) {
        toast({
          title: 'نجح',
          description: 'تم تحديث المستخدم بنجاح'
        });
        setIsEditDialogOpen(false);
        setUserToEdit(null);
        setEditFormData({ username: '', password: '', role: '', session_type: '', is_active: true });
        fetchUsers();
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل تحديث المستخدم',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير متوفر';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Role filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="min-h-screen bg-background">
      <IOSNavbar 
        title="إدارة تسجيل الدخول" 
        largeTitle={true}
      />
      
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Add User Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filteredUsers.length} من {users.length} مستخدم
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                إضافة مستخدم جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                <DialogDescription>
                  قم بإدخال بيانات المستخدم الجديد
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role">الصلاحية</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="اختر الصلاحية" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="أدخل كلمة المرور"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="rounded-xl pl-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setFormData({ username: '', password: '', role: '', session_type: '' });
                  }}
                >
                  إلغاء
                </Button>
                <Button onClick={handleAddUser}>
                  إضافة المستخدم
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="md:col-span-1">
                <Label className="text-sm font-semibold mb-2 block">البحث عن مستخدم</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="ابحث باسم المستخدم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">تصفية حسب الصلاحية</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="جميع الصلاحيات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الصلاحيات</SelectItem>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">تصفية حسب الحالة</Label>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="rounded-xl flex-1">
                      <SelectValue placeholder="جميع الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">معطل</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={clearFilters}
                      className="rounded-xl"
                      title="مسح جميع الفلاتر"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>قائمة المستخدمين</CardTitle>
            <CardDescription>
              عرض {filteredUsers.length} من {users.length} مستخدم
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">لا يوجد مستخدمون في النظام</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="text-right">اسم المستخدم</TableHead>
                      <TableHead className="text-right">الصلاحية</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">آخر تسجيل دخول</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <p className="text-muted-foreground">
                            {hasActiveFilters ? 'لا توجد نتائج مطابقة للفلاتر' : 'لا يوجد مستخدمون'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                      <TableRow 
                        key={user.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleEditUser(user)}
                      >
                        <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                          {user.id !== authState.user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserToDelete(user);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeClass(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'نشط' : 'معطل'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.last_login)}
                        </TableCell>
                      </TableRow>
                    ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>تعديل المستخدم</DialogTitle>
              <DialogDescription>
                قم بتعديل بيانات المستخدم "{userToEdit?.username}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="edit-role">الصلاحية</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="اختر الصلاحية" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="edit-username">اسم المستخدم</Label>
                <Input
                  id="edit-username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              {/* Password (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="edit-password">كلمة المرور الجديدة (اختياري)</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="اترك فارغاً للإبقاء على كلمة المرور الحالية"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="rounded-xl pl-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                  >
                    {showEditPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل
                </p>
              </div>

              {/* Active Status */}
              <div className="space-y-2">
                <Label htmlFor="edit-status">حالة الحساب</Label>
                <Select
                  value={editFormData.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, is_active: value === 'active' }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط ✅</SelectItem>
                    <SelectItem value="inactive">معطل ⏸️</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setUserToEdit(null);
                  setEditFormData({ username: '', password: '', role: '', session_type: '', is_active: true });
                }}
              >
                إلغاء
              </Button>
              <Button onClick={handleUpdateUser}>
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                تأكيد الحذف
              </DialogTitle>
              <DialogDescription>
                هل أنت متأكد من حذف المستخدم "{userToDelete?.username}"؟
                لا يمكن التراجع عن هذا الإجراء.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setUserToDelete(null);
                }}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
              >
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserManagementPage;
