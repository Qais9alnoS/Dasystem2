import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground">مرحباً بك في نظام إدارة المدرسة</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>الطلاب</CardTitle>
            <CardDescription>إدارة بيانات الطلاب</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/students')} className="w-full">
              عرض الطلاب
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>المعلمين</CardTitle>
            <CardDescription>إدارة بيانات المعلمين</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/teachers')} className="w-full">
              عرض المعلمين
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>السنوات الدراسية</CardTitle>
            <CardDescription>إدارة السنوات الدراسية</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/academic-years')} className="w-full">
              عرض السنوات
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};