import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, FolderOpen, Target, Briefcase, BookOpen, 
  GraduationCap, Award, Heart, Search, Plus, ChevronRight, SlidersHorizontal, X 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<{
    notes: boolean;
    rewards: boolean;
    assistance: boolean;
  }>({
    notes: true,
    rewards: true,
    assistance: true,
  });
  const [filterOpen, setFilterOpen] = useState(false);

  // Static categories - no backend API calls, just display
  const categories = [
    { category: 'goals', display_name: 'الأهداف', description: 'إدارة الأهداف والخطط' },
    { category: 'projects', display_name: 'المشاريع', description: 'تتبع المشاريع والمبادرات' },
    { category: 'blogs', display_name: 'مدونات', description: 'كتابة المدونات والمقالات' },
    { category: 'educational_admin', display_name: 'الأمور التعليمية والإدارية', description: 'الشؤون التعليمية والإدارية' },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'goals':
        return <Target className="h-6 w-6 text-primary" />;
      case 'projects':
        return <Briefcase className="h-6 w-6 text-green-500" />;
      case 'blogs':
        return <BookOpen className="h-6 w-6 text-purple-500" />;
      case 'educational_admin':
        return <GraduationCap className="h-6 w-6 text-secondary" />;
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
      const params = new URLSearchParams({ q: searchQuery });
      
      // Add type filter based on selected filters
      if (!searchFilters.notes && !searchFilters.rewards && !searchFilters.assistance) {
        toast({
          title: 'تنبيه',
          description: 'يجب اختيار نوع واحد على الأقل للبحث',
          variant: 'default',
        });
        return;
      }
      
      // Determine search type
      if (searchFilters.notes && !searchFilters.rewards && !searchFilters.assistance) {
        params.append('type', 'note');
      } else if (!searchFilters.notes && searchFilters.rewards && !searchFilters.assistance) {
        params.append('type', 'reward');
      } else if (!searchFilters.notes && !searchFilters.rewards && searchFilters.assistance) {
        params.append('type', 'assistance');
      }
      
      navigate(`/director/notes/search?${params.toString()}`);
    } else {
      toast({
        title: 'تنبيه',
        description: 'يجب إدخال 3 أحرف على الأقل للبحث',
        variant: 'default',
      });
    }
  };

  const activeFiltersCount = Object.values(searchFilters).filter(Boolean).length;
  const allFiltersActive = activeFiltersCount === 3;

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
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <SlidersHorizontal className="h-4 w-4 ml-2" />
                  تصفية
                  {!allFiltersActive && activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" dir="rtl">
                <SheetHeader>
                  <SheetTitle>تصفية البحث</SheetTitle>
                  <SheetDescription>
                    اختر أنواع المحتوى للبحث فيها
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  {/* Filter Checkboxes */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">البحث في</Label>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="filter-notes"
                        checked={searchFilters.notes}
                        onCheckedChange={(checked) => 
                          setSearchFilters(prev => ({ ...prev, notes: !!checked }))
                        }
                      />
                      <label
                        htmlFor="filter-notes"
                        className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <FileText className="h-4 w-4 text-primary" />
                        الملاحظات
                      </label>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="filter-rewards"
                        checked={searchFilters.rewards}
                        onCheckedChange={(checked) => 
                          setSearchFilters(prev => ({ ...prev, rewards: !!checked }))
                        }
                      />
                      <label
                        htmlFor="filter-rewards"
                        className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <Award className="h-4 w-4 text-accent" />
                        المكافآت
                      </label>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="filter-assistance"
                        checked={searchFilters.assistance}
                        onCheckedChange={(checked) => 
                          setSearchFilters(prev => ({ ...prev, assistance: !!checked }))
                        }
                      />
                      <label
                        htmlFor="filter-assistance"
                        className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <Heart className="h-4 w-4 text-red-500" />
                        المساعدات
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button onClick={() => setFilterOpen(false)} className="flex-1">
                      تطبيق
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchFilters({ notes: true, rewards: true, assistance: true });
                      }} 
                      className="flex-1"
                    >
                      <X className="h-4 w-4 ml-2" />
                      إعادة تعيين
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 ml-2" />
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid - 2 Column Layout */}
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
                      {cat.description}
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

      {/* Rewards and Assistance Section - 2 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rewards Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          onClick={handleRewardsClick}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-accent" />
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

