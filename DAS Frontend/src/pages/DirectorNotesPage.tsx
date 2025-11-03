import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, FolderOpen, Target, Briefcase, BookOpen, 
  GraduationCap, Award, Heart, Search, Plus, ChevronRight 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { directorApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

interface CategoryInfo {
  category: string;
  display_name: string;
  total_files: number;
  total_folders: number;
}

const DirectorNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Get current academic year from localStorage
  const academicYearId = parseInt(localStorage.getItem('selected_academic_year_id') || '0');

  useEffect(() => {
    if (academicYearId) {
      fetchCategories();
    }
  }, [academicYearId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await directorApi.getNotesCategories(academicYearId);
      if (response.success && response.data) {
        const responseData = response.data as any;
        setCategories(responseData.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الفئات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'goals':
        return <Target className="h-6 w-6 text-blue-500" />;
      case 'projects':
        return <Briefcase className="h-6 w-6 text-green-500" />;
      case 'blogs':
        return <BookOpen className="h-6 w-6 text-purple-500" />;
      case 'educational_admin':
        return <GraduationCap className="h-6 w-6 text-orange-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/director/notes/browse/${category}`);
  };

  const handleRewardsClick = () => {
    navigate('/director/notes/rewards');
  };

  const handleAssistanceClick = () => {
    navigate('/director/notes/assistance');
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length >= 3) {
      navigate(`/director/notes/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      toast({
        title: 'تنبيه',
        description: 'يجب إدخال 3 أحرف على الأقل للبحث',
        variant: 'default',
      });
    }
  };

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
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">ملاحظات المدير</h1>
        <p className="text-muted-foreground">إدارة الملاحظات والمشاريع والأهداف</p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="بحث في الملاحظات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 ml-2" />
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {categories.map((cat) => (
          <Card 
            key={cat.category}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            onClick={() => handleCategoryClick(cat.category)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(cat.category)}
                  <div>
                    <CardTitle className="text-xl">{cat.display_name}</CardTitle>
                    <CardDescription className="mt-1">
                      {cat.total_files} ملف • {cat.total_folders} مجلد
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCategoryClick(cat.category);
                }}
                className="w-full"
              >
                <FolderOpen className="h-4 w-4 ml-2" />
                فتح المجلد
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rewards and Assistance Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rewards Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          onClick={handleRewardsClick}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-yellow-500" />
                <div>
                  <CardTitle className="text-xl">المكافئات</CardTitle>
                  <CardDescription className="mt-1">
                    إدارة مكافئات الطلاب والمعلمين
                  </CardDescription>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRewardsClick();
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 ml-2" />
              عرض المكافئات
            </Button>
          </CardContent>
        </Card>

        {/* Assistance Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          onClick={handleAssistanceClick}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="h-6 w-6 text-red-500" />
                <div>
                  <CardTitle className="text-xl">المساعدات</CardTitle>
                  <CardDescription className="mt-1">
                    تسجيل المساعدات والدعم المقدم
                  </CardDescription>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAssistanceClick();
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 ml-2" />
              عرض المساعدات
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DirectorNotesPage;

