import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types/school';
import { Eye, EyeOff, School, User, DollarSign, Sun, Moon, LogIn } from 'lucide-react';

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
            color: 'text-primary',
            bgColor: 'bg-primary/10'
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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* App Logo and Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-3xl mb-4 shadow-lg">
                        <span className="text-white text-2xl font-bold">DAS</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        نظام إدارة المدرسة
                    </h1>
                    <p className="text-muted-foreground">
                        مرحباً بك، قم بتسجيل الدخول للمتابعة
                    </p>
                </div>

                <Card className="rounded-3xl border-0 shadow-2xl backdrop-blur-sm bg-card/95">
                <CardHeader className="space-y-1 p-6 pb-4">
                    <CardTitle className="text-2xl text-center font-bold">تسجيل الدخول</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 p-6 pt-2">
                    {state.error && (
                        <Alert variant="destructive" className="rounded-2xl">
                            <AlertDescription>{state.error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Role Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-sm font-semibold">الصلاحية</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => handleInputChange('role', value)}
                            >
                                <SelectTrigger className="w-full h-12 rounded-2xl border-2 transition-all focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="اختر صلاحيتك" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {roleOptions.map((role) => (
                                        <SelectItem key={role.value} value={role.value} className="rounded-xl my-1">
                                            <div className="flex items-center space-x-3 space-x-reverse py-1">
                                                <div className={`p-2 rounded-lg ${role.bgColor}`}>
                                                    <role.icon className={`h-5 w-5 ${role.color}`} />
                                                </div>
                                                <div className="font-medium">{role.label}</div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-semibold">اسم المستخدم</Label>
                            <div className="relative">
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="أدخل اسم المستخدم"
                                    value={formData.username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    className="pl-10 h-12 rounded-2xl border-2 transition-all focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-semibold">كلمة المرور</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="أدخل كلمة المرور"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    className="pl-10 h-12 rounded-2xl border-2 transition-all focus:ring-2 focus:ring-primary/20"
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
                                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 rounded-full text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                            disabled={state.isLoading || !formData.username || !formData.password || !formData.role}
                        >
                            {state.isLoading ? (
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>جاري تسجيل الدخول...</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <LogIn className="h-5 w-5" />
                                    <span>تسجيل الدخول</span>
                                </div>
                            )}
                        </Button>
                    </form>
                </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-muted-foreground">
                    <p> 2025 نظام DAS لإدارة المدارس</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;