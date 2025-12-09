import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, ShieldCheck, User, Clock } from 'lucide-react';

interface RoleBasedAccessControlProps {
  sessionType?: string; // "morning" or "evening"
  children: React.ReactNode;
  requiredRoles?: string[];
}

interface UserInfo {
  username: string;
  role: string;
  full_name?: string;
}

/**
 * Role-Based Access Control Component
 *
 * Restricts access based on user role and session type:
 * - Directors: Full access to all sessions
 * - Morning Supervisors: Access only to morning sessions
 * - Evening Supervisors: Access only to evening sessions
 */
export const RoleBasedAccessControl: React.FC<RoleBasedAccessControlProps> = ({
  sessionType,
  children,
  requiredRoles = ['director', 'morning_supervisor', 'evening_supervisor']
}) => {
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [accessMessage, setAccessMessage] = useState<string>('');

  useEffect(() => {
    checkAccess();
  }, [sessionType]);

  const checkAccess = async () => {
    setLoading(true);

    try {
      // Get current user info
      const token = localStorage.getItem('das_token');
      if (!token) {
        setHasAccess(false);
        setAccessMessage('يرجى تسجيل الدخول للوصول إلى إدارة الجداول');
        setLoading(false);
        return;
      }

      // In a real implementation, decode token or call API to get user info
      // For now, we'll simulate it
      const userInfo: UserInfo = {
        username: 'current_user',
        role: 'director', // This should come from actual authentication
        full_name: 'المستخدم الحالي'
      };

      setCurrentUser(userInfo);

      // Check role access
      if (!requiredRoles.includes(userInfo.role)) {
        setHasAccess(false);
        setAccessMessage('ليس لديك صلاحيات للوصول إلى إدارة الجداول');
        setLoading(false);
        return;
      }

      // Check session-specific access
      if (sessionType) {
        const canAccess = checkSessionAccess(userInfo.role, sessionType);
        setHasAccess(canAccess);

        if (!canAccess) {
          if (userInfo.role === 'morning_supervisor') {
            setAccessMessage('مشرفو الفترة الصباحية يمكنهم فقط الوصول إلى جداول الفترة الصباحية');
          } else if (userInfo.role === 'evening_supervisor') {
            setAccessMessage('مشرفو الفترة المسائية يمكنهم فقط الوصول إلى جداول الفترة المسائية');
          }
        } else {
          setAccessMessage('');
        }
      } else {
        setHasAccess(true);
      }
    } catch (error) {
      setHasAccess(false);
      setAccessMessage('حدث خطأ أثناء التحقق من الصلاحيات');
    }

    setLoading(false);
  };

  const checkSessionAccess = (role: string, session: string): boolean => {
    // Directors have access to everything
    if (role === 'director') {
      return true;
    }

    // Morning supervisor can only access morning sessions
    if (role === 'morning_supervisor' && session === 'morning') {
      return true;
    }

    // Evening supervisor can only access evening sessions
    if (role === 'evening_supervisor' && session === 'evening') {
      return true;
    }

    return false;
  };

  const getRoleDisplayName = (role: string): string => {
    const roleNames: Record<string, string> = {
      'director': 'مدير المدرسة',
      'morning_supervisor': 'مشرف الفترة الصباحية',
      'evening_supervisor': 'مشرف الفترة المسائية'
    };
    return roleNames[role] || role;
  };

  const getSessionDisplayName = (session: string): string => {
    return session === 'morning' ? 'صباحي' : 'مسائي';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Alert variant="destructive" className="mb-6">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">وصول محظور</AlertTitle>
          <AlertDescription>
            {accessMessage || 'ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة'}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>معلومات الصلاحيات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentUser && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">اسم المستخدم</p>
                    <p className="font-medium">{currentUser.full_name || currentUser.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">الدور الوظيفي</p>
                    <Badge variant="outline" className="mt-1">
                      {getRoleDisplayName(currentUser.role)}
                    </Badge>
                  </div>
                </div>

                {sessionType && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">الفترة المطلوبة</p>
                      <Badge className="mt-1">
                        {getSessionDisplayName(sessionType)}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                <p className="font-medium mb-2">قواعد الوصول:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>مدير المدرسة: وصول كامل لجميع الفترات</li>
                  <li>مشرف الفترة الصباحية: وصول فقط للجداول الصباحية</li>
                  <li>مشرف الفترة المسائية: وصول فقط للجداول المسائية</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access - render children
  return <>{children}</>;
};

/**
 * Hook to check user's allowed sessions
 */
export const useAllowedSessions = () => {
  const [allowedSessions, setAllowedSessions] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('das_token');
    if (!token) {
      setAllowedSessions([]);
      return;
    }

    // In a real implementation, decode token or call API
    const userRole = 'director'; // This should come from actual authentication
    setCurrentRole(userRole);

    // Determine allowed sessions based on role
    if (userRole === 'director') {
      setAllowedSessions(['morning', 'evening']);
    } else if (userRole === 'morning_supervisor') {
      setAllowedSessions(['morning']);
    } else if (userRole === 'evening_supervisor') {
      setAllowedSessions(['evening']);
    } else {
      setAllowedSessions([]);
    }
  }, []);

  return { allowedSessions, currentRole };
};

export default RoleBasedAccessControl;

