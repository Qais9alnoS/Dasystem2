import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Plus, Edit, Trash2, ArrowLeft, Calendar, User, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { directorApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

interface Reward {
  id: number;
  academic_year_id: number;
  title: string;
  reward_date: string;
  recipient_name: string;
  recipient_type: string;
  amount: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

const RewardsManager: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    reward_date: new Date().toISOString().split('T')[0],
    recipient_name: '',
    recipient_type: 'student',
    amount: '',
    description: ''
  });

  const academicYearId = parseInt(localStorage.getItem('selected_academic_year_id') || '0');

  useEffect(() => {
    if (academicYearId) {
      fetchRewards();
    }
  }, [academicYearId]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await directorApi.getRewards(academicYearId);
      if (response.success && response.data) {
        setRewards(response.data);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل المكافئات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const rewardData = {
        ...formData,
        amount: parseFloat(formData.amount),
        academic_year_id: academicYearId,
      };

      if (editingReward) {
        await directorApi.updateReward(editingReward.id, rewardData);
        toast({ title: 'نجاح', description: 'تم تحديث المكافأة' });
      } else {
        await directorApi.createReward(rewardData as any);
        toast({ title: 'نجاح', description: 'تم إضافة المكافأة' });
      }

      setShowDialog(false);
      resetForm();
      fetchRewards();
    } catch (error) {
      console.error('Error saving reward:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ المكافأة',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      title: reward.title,
      reward_date: reward.reward_date,
      recipient_name: reward.recipient_name,
      recipient_type: reward.recipient_type,
      amount: reward.amount.toString(),
      description: reward.description || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المكافأة؟')) return;

    try {
      await directorApi.deleteReward(id);
      toast({ title: 'نجاح', description: 'تم حذف المكافأة' });
      fetchRewards();
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المكافأة',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      reward_date: new Date().toISOString().split('T')[0],
      recipient_name: '',
      recipient_type: 'student',
      amount: '',
      description: ''
    });
    setEditingReward(null);
  };

  const totalAmount = rewards.reduce((sum, reward) => sum + reward.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/director/notes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Award className="h-8 w-8 text-yellow-500" />
              المكافئات
            </h1>
            <p className="text-muted-foreground">إدارة مكافئات الطلاب والمعلمين</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة مكافأة
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ملخص المكافئات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المكافئات</p>
              <p className="text-2xl font-bold">{rewards.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المبلغ</p>
              <p className="text-2xl font-bold">{totalAmount.toLocaleString()} ليرة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards List */}
      <div className="space-y-4">
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>لا توجد مكافئات مسجلة</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة أول مكافأة
              </Button>
            </CardContent>
          </Card>
        ) : (
          rewards.map((reward) => (
            <Card key={reward.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{reward.title}</CardTitle>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {reward.recipient_name} ({reward.recipient_type === 'student' ? 'طالب' : reward.recipient_type === 'teacher' ? 'معلم' : 'آخر'})
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(reward.reward_date).toLocaleDateString('ar-SA')}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {reward.amount.toLocaleString()} ليرة
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(reward)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(reward.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {reward.description && (
                <CardContent>
                  <p className="text-sm">{reward.description}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingReward ? 'تحرير المكافأة' : 'إضافة مكافأة جديدة'}</DialogTitle>
            <DialogDescription>
              املأ المعلومات التالية
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient_name">اسم المستفيد</Label>
                <Input
                  id="recipient_name"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient_type">نوع المستفيد</Label>
                <Select value={formData.recipient_type} onValueChange={(v) => setFormData({ ...formData, recipient_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">طالب</SelectItem>
                    <SelectItem value="teacher">معلم</SelectItem>
                    <SelectItem value="other">آخر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reward_date">التاريخ</Label>
                <Input
                  id="reward_date"
                  type="date"
                  value={formData.reward_date}
                  onChange={(e) => setFormData({ ...formData, reward_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">المبلغ</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>
              {editingReward ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RewardsManager;

