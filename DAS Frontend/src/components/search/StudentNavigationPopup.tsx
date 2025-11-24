import React from 'react';
import { User, GraduationCap, DollarSign, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface StudentNavigationPopupProps {
  open: boolean;
  onClose: () => void;
  studentName: string;
  userRole: string;
  onNavigate: (destination: 'personal' | 'academic' | 'finance') => void;
}

export const StudentNavigationPopup: React.FC<StudentNavigationPopupProps> = ({
  open,
  onClose,
  studentName,
  userRole,
  onNavigate
}) => {
  const handleNavigation = (destination: 'personal' | 'academic' | 'finance') => {
    onNavigate(destination);
    onClose();
  };

  // Determine which options to show based on user role
  const showPersonalInfo = ['director', 'morning_school', 'evening_school', 'morning_supervisor', 'evening_supervisor'].includes(userRole);
  const showAcademicInfo = ['director', 'morning_school', 'evening_school', 'morning_supervisor', 'evening_supervisor'].includes(userRole);
  const showFinanceInfo = ['director', 'finance'].includes(userRole);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-lg text-muted-foreground">الطالب</div>
              <div className="text-xl">{studentName}</div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            اختر نوع المعلومات التي تريد عرضها
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {showPersonalInfo && (
            <Button
              onClick={() => handleNavigation('personal')}
              variant="outline"
              className="h-auto py-4 px-6 justify-start rounded-2xl hover:bg-primary/5 hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-4 w-full">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 text-right">
                  <div className="font-semibold text-base">معلومات شخصية</div>
                  <div className="text-sm text-muted-foreground">البيانات الشخصية والعائلية للطالب</div>
                </div>
              </div>
            </Button>
          )}

          {showAcademicInfo && (
            <Button
              onClick={() => handleNavigation('academic')}
              variant="outline"
              className="h-auto py-4 px-6 justify-start rounded-2xl hover:bg-primary/5 hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-4 w-full">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 text-right">
                  <div className="font-semibold text-base">معلومات دراسية</div>
                  <div className="text-sm text-muted-foreground">العلامات والنشاط الدراسي</div>
                </div>
              </div>
            </Button>
          )}

          {showFinanceInfo && (
            <Button
              onClick={() => handleNavigation('finance')}
              variant="outline"
              className="h-auto py-4 px-6 justify-start rounded-2xl hover:bg-primary/5 hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-4 w-full">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1 text-right">
                  <div className="font-semibold text-base">معلومات مالية</div>
                  <div className="text-sm text-muted-foreground">الأقساط والمدفوعات</div>
                </div>
              </div>
            </Button>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={onClose}
            variant="ghost"
            className="rounded-xl"
          >
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
