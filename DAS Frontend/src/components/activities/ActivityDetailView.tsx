import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { activitiesApi } from '@/services/api';
import { Activity } from '@/types/school';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  User,
  Loader2,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface ActivityDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity;
  onEdit: () => void;
  onManageParticipants: () => void;
}

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({
  open,
  onOpenChange,
  activity,
  onEdit,
  onManageParticipants,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (open && activity.id) {
      loadRegistrations();
    }
  }, [open, activity.id]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const response = await activitiesApi.getRegistrations(activity.id!);
      if (response.success && response.data) {
        setRegistrations(response.data);
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getActivityTypeLabel = (type: string) => {
    const labels = {
      academic: 'أكاديمي',
      sports: 'رياضي',
      cultural: 'ثقافي',
      social: 'اجتماعي',
      trip: 'رحلة',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'outline' as const, label: 'قيد الانتظار', icon: Clock },
      paid: { variant: 'default' as const, label: 'مدفوع', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, label: 'ملغي', icon: XCircle },
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Calculate statistics
  const stats = {
    totalRegistered: registrations.length,
    paid: registrations.filter((r) => r.payment_status === 'paid').length,
    pending: registrations.filter((r) => r.payment_status === 'pending').length,
    cancelled: registrations.filter((r) => r.payment_status === 'cancelled').length,
    totalRevenue: registrations
      .filter((r) => r.payment_status === 'paid')
      .reduce((sum, r) => sum + (parseFloat(r.payment_amount) || 0), 0),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex-1">
            <DialogTitle className="text-2xl mb-2">{activity.name}</DialogTitle>
            <DialogDescription className="sr-only">
              عرض تفاصيل النشاط الكاملة
            </DialogDescription>
            <div className="flex items-center gap-2">
              <Badge>{getActivityTypeLabel(activity.activity_type)}</Badge>
              {activity.is_active ? (
                <Badge variant="default">نشط</Badge>
              ) : (
                <Badge variant="outline">غير نشط</Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">معلومات</TabsTrigger>
            <TabsTrigger value="participants">
              المشاركون ({stats.totalRegistered})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-4">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>معلومات النشاط</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activity.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">الوصف</p>
                      <p className="text-sm">{activity.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">تاريخ البداية</p>
                        <p className="text-sm">{formatDate(activity.start_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">تاريخ النهاية</p>
                        <p className="text-sm">{formatDate(activity.end_date)}</p>
                      </div>
                    </div>

                    {activity.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">المكان</p>
                          <p className="text-sm">{activity.location}</p>
                        </div>
                      </div>
                    )}

                    {activity.instructor_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">المشرف</p>
                          <p className="text-sm">{activity.instructor_name}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">التكلفة</p>
                        <p className="text-sm">{activity.cost_per_student} ل.س / طالب</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">الحد الأقصى</p>
                        <p className="text-sm">
                          {activity.max_participants ? `${activity.max_participants} طالب` : 'غير محدد'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {activity.requirements && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">المتطلبات</p>
                      <p className="text-sm whitespace-pre-wrap">{activity.requirements}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={onEdit} className="flex-1">
                  تعديل النشاط
                </Button>
                <Button onClick={onManageParticipants} variant="outline" className="flex-1">
                  إدارة المشاركين
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="participants">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : registrations.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا يوجد مشاركون</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      لم يتم تسجيل أي طالب في هذا النشاط بعد
                    </p>
                    <Button onClick={onManageParticipants}>
                      <Users className="h-4 w-4 ml-2" />
                      إضافة مشاركين
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>قائمة المشاركين</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>اسم الطالب</TableHead>
                          <TableHead>تاريخ التسجيل</TableHead>
                          <TableHead>المبلغ</TableHead>
                          <TableHead>حالة الدفع</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((registration) => (
                          <TableRow key={registration.id}>
                            <TableCell className="font-medium">
                              {registration.student_name}
                            </TableCell>
                            <TableCell>
                              {formatDate(registration.registration_date)}
                            </TableCell>
                            <TableCell>{registration.payment_amount} ل.س</TableCell>
                            <TableCell>
                              {getPaymentStatusBadge(registration.payment_status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

