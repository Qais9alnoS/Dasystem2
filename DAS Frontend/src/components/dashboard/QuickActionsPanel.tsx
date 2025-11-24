import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  GraduationCap,
  Trophy,
  Calendar,
  DollarSign,
  FileText,
  UserCog,
  ClipboardList,
  Folder,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { directorApi } from "@/services/api";

interface QuickActionsPanelProps {
  loading?: boolean;
  academicYearId?: number;
}

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  loading = false,
  academicYearId,
}) => {
  const navigate = useNavigate();
  const [recentFolders, setRecentFolders] = useState<
    Array<{ id: number; name: string; count: number; category: string }>
  >([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Using app's main colors: blue, amber, coral-orange
  const quickActions: QuickAction[] = [
    {
      label: "التحليلات الشاملة",
      icon: BarChart3,
      path: "/analytics",
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "إدارة الطلاب",
      icon: Users,
      path: "/students/personal-info",
      color: "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "إدارة المعلمين",
      icon: GraduationCap,
      path: "/teachers",
      color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "نشاط جديد",
      icon: Trophy,
      path: "/activities",
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "جدول جديد",
      icon: Calendar,
      path: "/schedules",
      color: "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "قيد مالي جديد",
      icon: DollarSign,
      path: "/finance",
      color:
        "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950",
    },
    {
      label: "ملاحظات المدير",
      icon: FileText,
      path: "/director/notes",
      color:
        "text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950",
    },
    {
      label: "إدارة المستخدمين",
      icon: UserCog,
      path: "/user-management",
      color: "text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "الصفحة اليومية",
      icon: ClipboardList,
      path: "/daily",
      color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950",
    },
  ];

  // Fetch real folders from director notes API
  useEffect(() => {
    const fetchRecentFolders = async () => {
      if (!academicYearId) return;

      setLoadingFolders(true);
      try {
        const categories = ["goals", "projects", "blogs", "educational_admin"];
        const allFolders: Array<{
          id: number;
          name: string;
          count: number;
          category: string;
        }> = [];

        // Fetch folders from all categories
        for (const category of categories) {
          try {
            const response = await directorApi.listFolderContents(
              academicYearId,
              category
            );
            if (response.success && response.data?.items) {
              // Filter only folders (is_folder === true)
              const folders = response.data.items
                .filter((item: any) => item.is_folder === true)
                .map((folder: any) => ({
                  id: folder.id,
                  name: folder.title,
                  count: 0, // We'll count files if needed
                  category: category,
                }));
              allFolders.push(...folders);
            }
          } catch (error) {
            console.warn(`Failed to fetch folders for ${category}:`, error);
          }
        }

        // Take first 3 folders (since we don't have file counts)
        const topFolders = allFolders.slice(0, 3);

        setRecentFolders(topFolders);
      } catch (error) {
        console.error("Error fetching folders:", error);
        setRecentFolders([]);
      } finally {
        setLoadingFolders(false);
      }
    };

    fetchRecentFolders();
  }, [academicYearId]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>اختصارات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">اختصارات سريعة</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 overflow-auto">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`h-auto flex-col gap-2 p-3 hover:scale-105 transition-transform ${action.color} border border-transparent hover:border-current`}
              onClick={() => navigate(action.path)}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium text-center leading-tight">
                {action.label}
              </span>
            </Button>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border my-3"></div>

        {/* Recent Notes Folders */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Folder className="h-4 w-4" />
              مجلدات حديثة
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={() => navigate("/director/notes")}
            >
              عرض الكل ←
            </Button>
          </div>
          <div className="space-y-1.5">
            {loadingFolders ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : recentFolders.length > 0 ? (
              recentFolders.map((folder) => (
                <button
                  key={folder.id}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-right"
                  onClick={() =>
                    navigate(`/director/notes/browse/${folder.category}`, {
                      state: {
                        folderId: folder.id,
                        folderData: {
                          title: folder.name,
                        },
                      },
                    })
                  }
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium">{folder.name}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-xs text-center text-muted-foreground py-2">
                لا توجد مجلدات
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-3"></div>

        {/* Quick Create Grid - 4x4 with + cards */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4" />
            إنشاء سريع
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {/* نشاط - Opens activity page with add popup */}
            <Button
              variant="outline"
              size="lg"
              className="h-20 flex-col gap-2 border-dashed border-2 hover:bg-amber-50 dark:hover:bg-amber-950 hover:border-amber-400 transition-all"
              onClick={() =>
                navigate("/activities", {
                  state: { openAddDialog: true },
                })
              }
            >
              <Plus className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                نشاط
              </span>
            </Button>

            {/* جدول - Opens schedules page in "اختيار الصف" section */}
            <Button
              variant="outline"
              size="lg"
              className="h-20 flex-col gap-2 border-dashed border-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400 transition-all"
              onClick={() =>
                navigate("/schedules", {
                  state: { scrollToClassSelection: true },
                })
              }
            >
              <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                جدول
              </span>
            </Button>

            {/* كارد مالي - Opens finance page with add card popup */}
            <Button
              variant="outline"
              size="lg"
              className="h-20 flex-col gap-2 border-dashed border-2 hover:bg-orange-50 dark:hover:bg-orange-950 hover:border-orange-400 transition-all"
              onClick={() =>
                navigate("/finance", {
                  state: { openAddCardDialog: true },
                })
              }
            >
              <Plus className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                كارد مالي
              </span>
            </Button>

            {/* ملاحظة - Same as before */}
            <Button
              variant="outline"
              size="lg"
              className="h-20 flex-col gap-2 border-dashed border-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400 transition-all"
              onClick={() =>
                navigate("/director/notes", {
                  state: { openAddDialog: true },
                })
              }
            >
              <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                ملاحظة
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
