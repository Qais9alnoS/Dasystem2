import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { HistoricalBalance } from '@/types/school';
import { financeManagerApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface BalanceHistoryModalProps {
  open: boolean;
  onClose: () => void;
  studentId: number;
}

export const BalanceHistoryModal: React.FC<BalanceHistoryModalProps> = ({
  open,
  onClose,
  studentId
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoricalBalance[]>([]);

  useEffect(() => {
    if (open && studentId) {
      loadHistory();
    }
  }, [open, studentId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await financeManagerApi.getStudentBalanceHistory(studentId);
      setHistory(response.data);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل تاريخ الأرصدة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = history.reduce((sum, h) => sum + h.outstanding_amount, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            تاريخ الأرصدة
          </DialogTitle>
        </DialogHeader>

        {loading && <div className="text-center py-8">جاري التحميل...</div>}

        {!loading && (
          <div className="space-y-4">
            {/* Total Summary */}
            <Card className="ios-card border-2 border-blue-500">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">الرصيد الكلي</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {totalBalance.toLocaleString('ar-SY')} ل.س
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* History List */}
            {history.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  لا يوجد تاريخ أرصدة سابقة لهذا الطالب
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {history
                  .sort((a, b) => b.year_name.localeCompare(a.year_name))
                  .map((item, idx) => (
                    <Card
                      key={idx}
                      className={`ios-card border-r-4 ${
                        item.outstanding_amount > 0
                          ? 'border-r-red-500'
                          : item.outstanding_amount < 0
                          ? 'border-r-blue-500'
                          : 'border-r-green-500'
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {item.year_name}
                              </span>
                              <Badge
                                variant={item.outstanding_amount > 0 ? 'destructive' : 'default'}
                                className="text-xs"
                              >
                                {item.balance_type === 'receivable'
                                  ? 'دين للمدرسة'
                                  : item.balance_type === 'payable'
                                  ? 'دين على المدرسة'
                                  : 'متساوي'}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex justify-between">
                                <span>المبلغ المطلوب:</span>
                                <span className="font-medium">
                                  {item.total_owed.toLocaleString('ar-SY')} ل.س
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>المبلغ المدفوع:</span>
                                <span className="font-medium">
                                  {item.total_paid.toLocaleString('ar-SY')} ل.س
                                </span>
                              </div>
                            </div>

                            {item.notes && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                {item.notes}
                              </div>
                            )}
                          </div>

                          <div className="text-left ml-4">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">الرصيد</div>
                            <div className={`text-xl font-bold ${
                              item.outstanding_amount > 0
                                ? 'text-red-600 dark:text-red-400'
                                : item.outstanding_amount < 0
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {item.outstanding_amount > 0 && '+'}
                              {item.outstanding_amount.toLocaleString('ar-SY')}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Information */}
            {history.length > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
                <p className="font-medium mb-1">معلومات:</p>
                <ul className="space-y-1">
                  <li>• الأرقام الموجبة (+) تمثل ديون مستحقة للمدرسة</li>
                  <li>• الأرقام السالبة (-) تمثل ديون مستحقة على المدرسة</li>
                  <li>• يتم ترحيل الأرصدة تلقائياً من سنة لأخرى</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BalanceHistoryModal;

