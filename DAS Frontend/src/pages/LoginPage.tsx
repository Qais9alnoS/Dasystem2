import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types/school';
import { Eye, EyeOff, School, User, DollarSign, Sun, Moon } from 'lucide-react';
import { IOSNavbar } from '@/components/ui/ios-navbar';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { state, login, clearError } = useAuth();
    const [activeTab, setActiveTab] = useState("login");

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: '' as UserRole | ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const from = location.state?.from?.pathname || '/';

    // Redirect if already authenticated
    useEffect(() => {
        if (state.isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [state.isAuthenticated, navigate, from]);

    // Clear error when component mounts - run only once
    useEffect(() => {
        clearError();
    }, []);

    const roleOptions = [
        {
            value: 'director' as UserRole,
            label: 'مدير المدرسة',
            description: 'صلاحيات كاملة لإدارة النظام',
            icon: School,
            color: 'text-primary',
            bgColor: 'bg-primary/10'
        },
        {
            value: 'finance' as UserRole,
            label: 'المسؤول المالي',
            description: 'إدارة الشؤون المالية والمحاسبة',
            icon: DollarSign,
            color: 'text-secondary',
            bgColor: 'bg-secondary/10'
        },
        {
            value: 'morning_school' as UserRole,
            label: 'إدارة الفترة الصباحية',
            description: 'إدارة الطلاب والمعلمين في الفترة الصباحية',
            icon: Sun,
            color: 'text-accent',
            bgColor: 'bg-accent/10'
        },
        {
            value: 'evening_school' as UserRole,
            label: 'إدارة الفترة المسائية',
            description: 'إدارة الطلاب والمعلمين في الفترة المسائية',
            icon: Moon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.username || !formData.password || !formData.role) {
            return;
        }

        await login({
            username: formData.username,
            password: formData.password,
            role: formData.role
        });
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const selectedRole = roleOptions.find(role => role.value === formData.role);

    return (
        <div className="min-h-screen bg-background">
            {/* iOS Navigation Bar */}
            <IOSNavbar 
                title="تسجيل الدخول" 
                largeTitle={true}
            />
            
            <div className="p-4">
                <div className="w-full max-w-md mx-auto">
                    {/* App Logo and Title */}
                    <div className="text-center mb-8 mt-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl mb-4">
                            <span className="text-white text-xl font-bold">DAS</span>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">
                            نظام إدارة المدرسة
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            تسجيل الدخول إلى النظام
                        </p>
                    </div>

                    <Card className="rounded-3xl border-0 shadow-ios w-full">
                        <CardHeader className="space-y-1 p-4">
                            <CardTitle className="text-xl text-center">تسجيل الدخول</CardTitle>
                            <CardDescription className="text-center">
                                اختر صلاحيتك وأدخل بيانات الدخول
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6 p-4">
                            {state.error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{state.error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="role">الصلاحية</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value) => handleInputChange('role', value)}
                                    >
                                        <SelectTrigger className="w-full rounded-2xl">
                                            <SelectValue placeholder="اختر صلاحيتك في النظام" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roleOptions.map((role) => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    <div className="flex items-center space-x-3 space-x-reverse">
                                                        <div className={`p-2 rounded-md ${role.bgColor}`}>
                                                            <role.icon className={`h-4 w-4 ${role.color}`} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="font-medium">{role.label}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {role.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Username */}
                                <div className="space-y-2">
                                    <Label htmlFor="username">اسم المستخدم</Label>
                                    <div className="relative">
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="أدخل اسم المستخدم"
                                            value={formData.username}
                                            onChange={(e) => handleInputChange('username', e.target.value)}
                                            className="pl-10 rounded-2xl"
                                            required
                                        />
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    </div>
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
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            className="pl-10 rounded-2xl"
                                            required
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
                                </div>

                                {/* Selected Role Preview */}
                                {selectedRole && (
                                    <div className={`p-4 rounded-2xl ${selectedRole.bgColor} border`}>
                                        <div className="flex items-start space-x-4 space-x-reverse">
                                            <selectedRole.icon className={`h-5 w-5 ${selectedRole.color} mt-0.5`} />
                                            <div>
                                                <div className="font-medium text-sm">{selectedRole.label}</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {selectedRole.description}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full rounded-full"
                                    disabled={state.isLoading || !formData.username || !formData.password || !formData.role}
                                >
                                    {state.isLoading ? (
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>جاري تسجيل الدخول...</span>
                                        </div>
                                    ) : (
                                        'تسجيل الدخول'
                                    )}
                                </Button>
                            </form>

                            {/* Demo Credentials */}
                            <div className="mt-6 p-4 bg-muted rounded-2xl">
                                <h4 className="text-sm font-medium mb-2">بيانات تجريبية للاختبار:</h4>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <div>• مدير: director / director123</div>
                                    <div>• مالي: finance / finance123</div>
                                    <div>• صباحي: morning / morning123</div>
                                    <div>• مسائي: evening / evening123</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="text-center mt-8 text-sm text-muted-foreground">
                        <p>© 2025 نظام DAS لإدارة المدارس</p>
                        <p>جميع الحقوق محفوظة</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default LoginPage;