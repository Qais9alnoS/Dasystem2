import React from 'react';
import { Bell, Settings, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '../ui/theme-toggle';
import { UserRole } from '@/types/school';

const getRoleDisplay = (role?: UserRole): string => {
    switch (role) {
        case 'director': return 'مدير المدرسة';
        case 'finance': return 'المالية';
        case 'morning_school': return 'فترة صباحية';
        case 'evening_school': return 'فترة مسائية';
        default: return 'مدير';
    }
};

interface NavigationBarProps {
    onMenuToggle?: () => void;
    showMenuButton?: boolean;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
    onMenuToggle,
    showMenuButton = false
}) => {
    const { state, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="flex items-center justify-between h-14 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4">
            {/* Left side - App branding and menu */}
            <div className="flex items-center space-x-4 space-x-reverse">
                {/* Menu button for mobile/collapsed sidebar */}
                {showMenuButton && (
                    <Button variant="ghost" size="sm" onClick={onMenuToggle}>
                        <Menu className="h-4 w-4" />
                    </Button>
                )}

                {/* App Logo and Title */}
                <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-bold">DAS</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-foreground">نظام إدارة المدرسة</span>
                        <span className="text-xs text-muted-foreground">DAS Management System</span>
                    </div>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Status Indicator */}
                <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">متصل</span>
                </div>
            </div>

            {/* Right side - User controls */}
            <div className="flex items-center space-x-3 space-x-reverse">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="relative">
                            <Bell className="h-4 w-4" />
                            <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                            >
                                3
                            </Badge>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-medium">طالب جديد مسجل</span>
                                <span className="text-xs text-muted-foreground">منذ 5 دقائق</span>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-medium">تحديث في الجدول الدراسي</span>
                                <span className="text-xs text-muted-foreground">منذ ساعة</span>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-medium">رسالة من المدير</span>
                                <span className="text-xs text-muted-foreground">منذ ساعتين</span>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Separator orientation="vertical" className="h-6" />

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center space-x-2 space-x-reverse">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-sm bg-blue-600 text-white">
                                    {state.user?.username?.charAt(0) || 'م'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-medium">{state.user?.username || 'المستخدم'}</span>
                                <span className="text-xs text-muted-foreground">{getRoleDisplay(state.user?.role) || 'مدير'}</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>الملف الشخصي</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>الإعدادات</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                            <span>تسجيل الخروج</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};