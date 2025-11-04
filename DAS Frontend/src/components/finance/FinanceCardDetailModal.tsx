import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Save,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Edit2
} from 'lucide-react';
import { FinanceCardDetailed, FinanceTransaction } from '@/types/school';
import { financeManagerApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface FinanceCardDetailModalProps {
  open: boolean;
  onClose: () => void;
  cardId: number;
  academicYearId: number;
  onUpdate?: () => void;
}

export const FinanceCardDetailModal: React.FC<FinanceCardDetailModalProps> = ({
  open,
  onClose,
  cardId,
  academicYearId,
  onUpdate
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState<FinanceCardDetailed | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // Transaction form state
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<'completed' | 'pending'>('completed');
  const [responsiblePerson, setResponsiblePerson] = useState('');

  useEffect(() => {
    if (open && cardId && academicYearId) {
      loadCardDetails();
    }
  }, [open, cardId, academicYearId]);

  const loadCardDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading card details:', { cardId, academicYearId });
      const response = await financeManagerApi.getFinanceCardDetailed(cardId, academicYearId);
      console.log('Card details loaded:', response.data);
      setCard(response.data);
    } catch (error) {
      console.error('Error loading card details:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل تفاصيل الكارد المالي',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      toast({
        title: 'تنبيه',
        description: 'يرجى إدخال مبلغ صحيح',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      await financeManagerApi.addFinanceTransaction(cardId, {
        academic_year_id: academicYearId,
        transaction_type: transactionType,
        amount: parseFloat(transactionAmount),
        transaction_date: transactionDate,
        description: transactionDescription,
        is_completed: transactionStatus === 'completed',
        responsible_person: responsiblePerson || undefined
      });

      toast({
        title: 'نجح',
        description: 'تم إضافة المعاملة بنجاح'
      });

      setTransactionAmount('');
      setTransactionDescription('');
      setResponsiblePerson('');
      setShowTransactionForm(false);
      loadCardDetails();
      onUpdate?.();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل إضافة المعاملة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTransactionStatus = async (transactionId: number, newStatus: boolean) => {
    try {
      setLoading(true);
      await financeManagerApi.updateFinanceTransaction(transactionId, {
        is_completed: newStatus
      });

      toast({
        title: 'نجح',
        description: 'تم تحديث حالة المعاملة'
      });

      loadCardDetails();
      onUpdate?.();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تحديث حالة المعاملة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!card && !loading) return null;

  const completedIncome = card?.transactions
    ?.filter(t => t.transaction_type === 'income' && t.is_completed)
    ?.reduce((sum, t) => sum + t.amount, 0) || 0;

  const completedExpense = card?.transactions
    ?.filter(t => t.transaction_type === 'expense' && t.is_completed)
    ?.reduce((sum, t) => sum + t.amount, 0) || 0;

  const pendingIncome = card?.transactions
    ?.filter(t => t.transaction_type === 'income' && !t.is_completed)
    ?.reduce((sum, t) => sum + t.amount, 0) || 0;

  const pendingExpense = card?.transactions
    ?.filter(t => t.transaction_type === 'expense' && !t.is_completed)
    ?.reduce((sum, t) => sum + t.amount, 0) || 0;

  const netAmount = completedIncome - completedExpense;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>{card?.card_name}</span>
            <Badge variant="outline" className="text-xs">
              {card?.card_type === 'income' ? 'دخل' : card?.card_type === 'expense' ? 'خرج' : 'دخل وخرج'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading && <div className="text-center py-8">جاري التحميل...</div>}

        {card && !loading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="ios-card border-t-4 border-t-green-500">
                <CardContent className="pt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3" />
                    الدخل المكتمل
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {completedIncome.toLocaleString('ar-SY')}
                  </div>
                </CardContent>
              </Card>

              <Card className="ios-card border-t-4 border-t-red-500">
                <CardContent className="pt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1 mb-1">
                    <TrendingDown className="w-3 h-3" />
                    الخرج المكتمل
                  </div>
                  <div className="text-xl font-bold text-red-600">
                    {completedExpense.toLocaleString('ar-SY')}
                  </div>
                </CardContent>
              </Card>

              <Card className="ios-card border-t-4 border-t-blue-500">
                <CardContent className="pt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">الصافي</div>
                  <div className={`text-xl font-bold ${
                    netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {netAmount >= 0 && '+'}
                    {netAmount.toLocaleString('ar-SY')}
                  </div>
                </CardContent>
              </Card>

              <Card className="ios-card border-t-4 border-t-orange-500">
                <CardContent className="pt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">غير مكتمل</div>
                  <div className="text-xl font-bold text-orange-600">
                    {(pendingIncome + pendingExpense).toLocaleString('ar-SY')}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Add Transaction Form */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-blue-600" />
                    إضافة معاملة مالية
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTransactionForm(!showTransactionForm)}
                  >
                    {showTransactionForm ? 'إلغاء' : <Plus className="w-4 h-4" />}
                  </Button>
                </div>

                {showTransactionForm && (
                  <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div>
                      <Label>نوع المعاملة</Label>
                      <SegmentedControl
                        value={transactionType}
                        onValueChange={(value) => setTransactionType(value as 'income' | 'expense')}
                        options={[
                          { label: 'دخل', value: 'income' },
                          { label: 'خرج', value: 'expense' }
                        ]}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>المبلغ</Label>
                        <Input
                          type="number"
                          value={transactionAmount}
                          onChange={(e) => setTransactionAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>التاريخ</Label>
                        <Input
                          type="date"
                          value={transactionDate}
                          onChange={(e) => setTransactionDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>الوصف</Label>
                      <Textarea
                        value={transactionDescription}
                        onChange={(e) => setTransactionDescription(e.target.value)}
                        rows={2}
                        placeholder="تفاصيل المعاملة..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>المسؤول</Label>
                        <Input
                          value={responsiblePerson}
                          onChange={(e) => setResponsiblePerson(e.target.value)}
                          placeholder="اسم المسؤول (اختياري)"
                        />
                      </div>
                      <div>
                        <Label>الحالة</Label>
                        <SegmentedControl
                          value={transactionStatus}
                          onValueChange={(value) => setTransactionStatus(value as 'completed' | 'pending')}
                          options={[
                            { label: 'مكتمل', value: 'completed' },
                            { label: 'معلق', value: 'pending' }
                          ]}
                        />
                      </div>
                    </div>

                    <Button onClick={handleAddTransaction} disabled={loading} className="w-full">
                      <Save className="w-4 h-4 ml-2" />
                      حفظ المعاملة
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Transactions List */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">سجل المعاملات</h3>

                {(!card.transactions || card.transactions.length === 0) ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      لا توجد معاملات بعد. قم بإضافة معاملة جديدة.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {card.transactions
                      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                      .map((transaction) => (
                        <Card
                          key={transaction.id}
                          className={`border-r-4 ${
                            transaction.transaction_type === 'income'
                              ? 'border-r-green-500'
                              : 'border-r-red-500'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {transaction.transaction_type === 'income' ? (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                  )}
                                  <span className="font-medium">
                                    {transaction.transaction_type === 'income' ? 'دخل' : 'خرج'}
                                  </span>
                                  <Badge
                                    variant={transaction.is_completed ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {transaction.is_completed ? (
                                      <CheckCircle className="w-3 h-3 ml-1 inline" />
                                    ) : (
                                      <AlertCircle className="w-3 h-3 ml-1 inline" />
                                    )}
                                    {transaction.is_completed ? 'مكتمل' : 'معلق'}
                                  </Badge>
                                </div>

                                <div className="text-sm text-gray-600 space-y-1">
                                  {transaction.description && (
                                    <div>{transaction.description}</div>
                                  )}
                                  {transaction.responsible_person && (
                                    <div className="text-xs">المسؤول: {transaction.responsible_person}</div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    {new Date(transaction.transaction_date).toLocaleDateString('ar-SY')}
                                  </div>
                                </div>
                              </div>

                              <div className="text-left ml-4">
                                <div className={`text-lg font-bold ${
                                  transaction.transaction_type === 'income'
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}>
                                  {transaction.amount.toLocaleString('ar-SY')} ل.س
                                </div>
                                {!transaction.is_completed && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2 text-xs"
                                    onClick={() => handleUpdateTransactionStatus(transaction.id, true)}
                                  >
                                    تمييز كمكتمل
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinanceCardDetailModal;

