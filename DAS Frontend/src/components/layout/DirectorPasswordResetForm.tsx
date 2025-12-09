import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Key } from 'lucide-react';
import { authApi } from '@/services/api';

export const DirectorPasswordResetForm: React.FC = () => {
  const { state } = useAuth();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'director' | 'finance' | 'morning_school' | 'evening_school'>('morning_school');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'يرجى إدخال اسم المستخدم' });
      return;
    }

    if (!role) {
      setMessage({ type: 'error', text: 'يرجى اختيار الدور' });
      return;
    }

    setIsLoading(true);

    try {
      // Call the auth API to reset password
      const response = await authApi.resetPassword({
        username,
        role
      });

      if (response.success) {
        // Reset form
        setUsername('');
        setMessage({ type: 'success', text: 'تم إعادة تعيين كلمة المرور بنجاح وتم إرسال الإشعار عبر تيليجرام' });
      } else {
        throw new Error(response.message || 'فشل في إعادة تعيين كلمة المرور');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'فشل في إعادة تعيين كلمة المرور'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          إعادة تعيين كلمة المرور
        </CardTitle>
        <CardDescription>
          كمدير، يمكنك إعادة تعيين كلمة مرور أي مستخدم في النظام
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert className={`mb-4 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-right"
              placeholder="أدخل اسم المستخدم"
              required
            />
          </div>

          <div>
            <Label htmlFor="role">الدور</Label>
            <Select value={role} onValueChange={(value: any) => setRole(value)}>
              <SelectTrigger className="text-right">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="director">مدير</SelectItem>
                <SelectItem value="finance">مالي</SelectItem>
                <SelectItem value="morning_school">مدرسة صباحية</SelectItem>
                <SelectItem value="evening_school">مدرسة مسائية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور'}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ملاحظة:</strong> سيتم إعادة تعيين كلمة المرور إلى القيمة الافتراضية وإرسال إشعار عبر تيليجرام إلى المستخدم.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};