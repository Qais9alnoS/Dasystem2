import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProject } from '@/contexts/ProjectContext';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Settings, 
  FileText, 
  AlertCircle 
} from 'lucide-react';

interface ProjectDashboardProps {
  projectId: number;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const { state } = useProject();
  
  const project = state.projects.find(p => p.id === projectId);
  
  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <AlertCircle className="mx-auto h-12 w-12 mb-4" />
              <p>المشروع غير موجود</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboardCards = [
    {
      title: 'إدارة المواد',
      description: 'إضافة وتعديل المواد الدراسية',
      icon: BookOpen,
      route: '/project/subjects',
      color: 'text-blue-600'
    },
    {
      title: 'إدارة الأساتذة',
      description: 'إضافة وتعديل معلومات الأساتذة',
      icon: Users,
      route: '/project/teachers',
      color: 'text-green-600'
    },
    {
      title: 'إدارة الصفوف',
      description: 'تكوين الصفوف والشعب',
      icon: Users,
      route: '/project/classes',
      color: 'text-purple-600'
    },
    {
      title: 'القيود والشروط',
      description: 'إدارة القيود والشروط الخاصة بالجدولة',
      icon: Calendar,
      route: '/project/constraints',
      color: 'text-orange-600'
    },
    {
      title: 'الإعدادات',
      description: 'تعديل الإعدادات الافتراضية',
      icon: Settings,
      route: '/project/settings',
      color: 'text-gray-600'
    },
    {
      title: 'إنشاء الجداول',
      description: 'تشغيل الخوارزمية وإنشاء الجداول',
      icon: FileText,
      route: '/project/generate',
      color: 'text-red-600'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary text-right">
          {project.name}
        </h1>
        <p className="text-muted-foreground text-right mt-2">
          لوحة التحكم لإدارة مشروع الجدولة الدراسية
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="actions">الإجراءات</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardCards.map((card, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-right">
                    {card.title}
                  </CardTitle>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground text-right">
                    {card.description}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate(card.route)}
                  >
                    الانتقال
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="actions">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">الإجراءات السريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => navigate('/project/generate')}
                  >
                    تشغيل الجدولة الآن
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/project/settings')}
                  >
                    تعديل الإعدادات
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};