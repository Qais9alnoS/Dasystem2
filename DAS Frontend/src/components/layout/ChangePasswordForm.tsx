import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';
import { authApi } from '@/services/api';

export const ChangePasswordForm: React.FC = () => {
  const { state, refreshToken } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
    }
    
    if (!/\d/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    // Validation
    if (!currentPassword) {
      setMessage({ type: 'error', text: 'يرجى إدخال كلمة المرور الحالية' });
      return;
    }
    
    if (!newPassword) {
      setMessage({ type: 'error', text: 'يرجى إدخال كلمة المرور الجديدة' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمات المرور الجديدة غير متطابقة' });
      return;
    }
    
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setMessage({ 
        type: 'error', 
        text: `أخطاء في كلمة المرور الجديدة: ${validation.errors.join(', ')}` 
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the auth API to change password
      const response = await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      
      if (response.success) {
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
        
        // Refresh token after password change
        await refreshToken();
      } else {
        throw new Error(response.message || 'فشل في تغيير كلمة المرور');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'فشل في تغيير كلمة المرور' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تغيير كلمة المرور</CardTitle>
        <CardDescription>
          قم بتغيير كلمة مرور حسابك بشكل آمن
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
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="text-right"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="text-right"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص
            </p>
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="text-right"
              required
            />
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};