import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useToast } from '@/hooks/use-toast';
import { activitiesApi } from '@/services/api';
import { Activity } from '@/types/school';
import { ActivityFormDialog } from '@/components/activities/ActivityFormDialog';
import { ParticipantSelectionDialog } from '@/components/activities/ParticipantSelectionDialog';
import { ActivityDetailView } from '@/components/activities/ActivityDetailView';
import { 
  Plus, 
  Search, 
  Grid3x3, 
  List, 
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Loader2,
  Edit,
  Trash2,
  Eye,
  TrendingUp
} from 'lucide-react';

const ActivitiesManagementPage: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();

  // State
  const [activeTab, setActiveTab] = useState<'activities' | 'reports'>('activities');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSession, setFilterSession] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);

  // Load selected academic year from localStorage on mount
  useEffect(() => {
    const yearId = localStorage.getItem('selected_academic_year_id');
    if (yearId) {
      const parsedId = parseInt(yearId, 10);
      if (!isNaN(parsedId)) {
        setSelectedAcademicYear(parsedId);
      }
    }
  }, []);

  // Check if we should open add dialog from navigation state
  useEffect(() => {
    if (location.state?.openAddDialog) {
      setFormDialogOpen(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch activities
  useEffect(() => {
    if (selectedAcademicYear) {
      fetchActivities();
    }
  }, [selectedAcademicYear, filterType, filterSession, filterStatus]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params: any = {
        academic_year_id: selectedAcademicYear,
        is_active: filterStatus === 'active' ? true : filterStatus === 'inactive' ? false : undefined,
      };

      if (filterType !== 'all') {
        params.activity_type = filterType;
      }

      if (filterSession !== 'all') {
        params.session_type = filterSession;
      }

      const response = await activitiesApi.getAll(params);
      if (response.success && response.data) {
        setActivities(response.data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل النشاطات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter activities by search query
  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleAddActivity = () => {
    setSelectedActivity(null);
    setFormDialogOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setFormDialogOpen(true);
  };

  const handleManageParticipants = (activity: Activity) => {
    setSelectedActivity(activity);
    setParticipantsDialogOpen(true);
  };

  const handleViewDetails = (activity: Activity) => {
    setSelectedActivity(activity);
    setDetailViewOpen(true);
  };

  const handleSaveActivity = async (activityData: Partial<Activity>) => {
    try {
      if (selectedActivity?.id) {
        // Update existing activity
        const response = await activitiesApi.update(selectedActivity.id, activityData);
        if (response.success) {
          toast({
            title: 'نجاح',
            description: 'تم تحديث النشاط بنجاح',
          });
          fetchActivities();
        }
      } else {
        // Create new activity
        const response = await activitiesApi.create(activityData as any);
        if (response.success) {
          toast({
            title: 'نجاح',
            description: 'تم إضافة النشاط بنجاح',
          });
          fetchActivities();
        }
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      throw error;
    }
  };

  // Activity type options
  const activityTypeOptions = [
    { value: 'all', label: 'جميع الأنواع' },
    { value: 'academic', label: 'أكاديمي' },
    { value: 'sports', label: 'رياضي' },
    { value: 'cultural', label: 'ثقافي' },
    { value: 'social', label: 'اجتماعي' },
    { value: 'trip', label: 'رحلة' },
  ];

  const sessionTypeOptions = [
    { value: 'all', label: 'جميع الدوامات' },
    { value: 'morning', label: 'صباحي' },
    { value: 'evening', label: 'مسائي' },
    { value: 'both', label: 'كلاهما' },
  ];

  const getActivityTypeLabel = (type: string) => {
    const option = activityTypeOptions.find(opt => opt.value === type);
    return option?.label || type;
  };

  const getActivityTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'academic':
        return 'default';
      case 'sports':
        return 'destructive';
      case 'cultural':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="p-4 space-y-4">
          {/* Title and Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">إدارة النشاطات</h1>
              <p className="text-sm text-muted-foreground">
                إدارة النشاطات المدرسية والفعاليات
              </p>
            </div>
            <Button size="lg" className="gap-2" onClick={handleAddActivity}>
              <Plus className="h-5 w-5" />
              نشاط جديد
            </Button>
          </div>

          {/* Tabs */}
          <SegmentedControl
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'activities' | 'reports')}
            options={[
              { value: 'activities', label: 'النشاطات' },
              { value: 'reports', label: 'التقارير' },
            ]}
          />

          {/* Filters - Only show on activities tab */}
          {activeTab === 'activities' && (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث عن نشاط..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterSession} onValueChange={setFilterSession}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشطة</SelectItem>
                    <SelectItem value="inactive">غير نشطة</SelectItem>
                    <SelectItem value="all">الكل</SelectItem>
                  </SelectContent>
                </Select>

                <div className="mr-auto flex gap-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'activities' ? (
          loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد نشاطات</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {searchQuery ? 'لم يتم العثور على نشاطات تطابق البحث' : 'ابدأ بإضافة نشاط جديد'}
                </p>
                <Button onClick={handleAddActivity}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة نشاط
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }
            >
              {filteredActivities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-2 truncate">
                          {activity.name}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getActivityTypeBadgeVariant(activity.activity_type)}>
                            {getActivityTypeLabel(activity.activity_type)}
                          </Badge>
                          {!activity.is_active && (
                            <Badge variant="outline">غير نشط</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetails(activity)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activity.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(activity.start_date)}</span>
                      </div>

                      {activity.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{activity.location}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {activity.current_participants || 0}
                          {activity.max_participants && ` / ${activity.max_participants}`} مشارك
                        </span>
                      </div>

                      {activity.cost_per_student > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>{activity.cost_per_student} ل.س / طالب</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditActivity(activity)}>
                        <Edit className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleManageParticipants(activity)}>
                        <Users className="h-4 w-4 ml-1" />
                        المشاركون
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          // Reports Tab
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                تقارير النشاطات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">قريباً</h3>
                <p className="text-sm text-muted-foreground text-center">
                  سيتم إضافة التقارير والإحصائيات قريباً
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activity Form Dialog */}
      {selectedAcademicYear && (
        <ActivityFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          activity={selectedActivity}
          academicYearId={selectedAcademicYear}
          onSave={handleSaveActivity}
        />
      )}

      {/* Participants Selection Dialog */}
      {selectedAcademicYear && selectedActivity && (
        <ParticipantSelectionDialog
          open={participantsDialogOpen}
          onOpenChange={setParticipantsDialogOpen}
          activity={selectedActivity}
          academicYearId={selectedAcademicYear}
          onSave={() => {
            fetchActivities();
          }}
        />
      )}

      {/* Activity Detail View */}
      {selectedActivity && (
        <ActivityDetailView
          open={detailViewOpen}
          onOpenChange={setDetailViewOpen}
          activity={selectedActivity}
          onEdit={() => {
            setDetailViewOpen(false);
            handleEditActivity(selectedActivity);
          }}
          onManageParticipants={() => {
            setDetailViewOpen(false);
            handleManageParticipants(selectedActivity);
          }}
        />
      )}
    </div>
  );
};

export default ActivitiesManagementPage;

