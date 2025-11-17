import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Info, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Subject } from "@/types/school";
import { subjectsApi, schedulesApi } from "@/services/api";

interface ConstraintManagerProps {
  data: {
    academicYearId: number;
    classId: number;
  };
  onContinue: () => void;
}

interface Constraint {
  id: string;
  subject_id: number;
  subject_name: string;
  constraint_type: "no_consecutive" | "before_after" | "subject_per_day";
  priority_level: number;
  reference_subject_id?: number;
  reference_subject_name?: string;
  placement?: "before" | "after";
  description: string;
}

const PRIORITY_LEVELS = [
  { value: 1, label: "منخفض", color: "bg-blue-100 text-blue-800" },
  { value: 2, label: "متوسط", color: "bg-yellow-100 text-yellow-800" },
  { value: 3, label: "عالي", color: "bg-orange-100 text-orange-800" },
  { value: 4, label: "حرج", color: "bg-red-100 text-red-800" },
];

export const ConstraintManager: React.FC<ConstraintManagerProps> = ({
  data,
  onContinue,
}) => {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [hasSignaledReady, setHasSignaledReady] = useState(false);

  // New constraint form
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [constraintType, setConstraintType] = useState<
    "no_consecutive" | "before_after" | "subject_per_day"
  >("no_consecutive");
  const [priorityLevel, setPriorityLevel] = useState(2);
  const [referenceSubject, setReferenceSubject] = useState<number | null>(null);
  const [placement, setPlacement] = useState<"before" | "after">("before");

  useEffect(() => {
    loadSubjects();
  }, [data.classId]);

  // Mark this step as ready as soon as it loads (optional step)
  useEffect(() => {
    if (hasSignaledReady) return;
    onContinue();
    setHasSignaledReady(true);
  }, [hasSignaledReady, onContinue]);

  const loadSubjects = async () => {
    try {
      const response = await subjectsApi.getAll({ class_id: data.classId });
      if (response.success && response.data) {
        setSubjects(response.data);
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل تحميل المواد",
        variant: "destructive",
      });
    }
  };

  const handleAddConstraint = () => {
    if (!selectedSubject) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار المادة",
        variant: "destructive",
      });
      return;
    }

    if (constraintType === "before_after" && !referenceSubject) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار المادة المرجعية",
        variant: "destructive",
      });
      return;
    }

    const subject = subjects.find((s) => s.id === selectedSubject);
    const refSubject = referenceSubject
      ? subjects.find((s) => s.id === referenceSubject)
      : null;

    if (!subject) return;

    let description = "";
    if (constraintType === "no_consecutive") {
      description = `${subject.subject_name}: لا يجب أن تكون الحصص متتالية`;
    } else {
      const placementText = placement === "before" ? "قبل" : "بعد";
      description = `${subject.subject_name}: يجب أن تكون ${placementText} ${refSubject?.subject_name}`;
    }

    const newConstraint: Constraint = {
      id: Date.now().toString(),
      subject_id: selectedSubject,
      subject_name: subject.subject_name,
      constraint_type: constraintType,
      priority_level: priorityLevel,
      reference_subject_id: referenceSubject || undefined,
      reference_subject_name: refSubject?.subject_name,
      placement: constraintType === "before_after" ? placement : undefined,
      description,
    };

    setConstraints([...constraints, newConstraint]);

    // Reset form
    setSelectedSubject(null);
    setConstraintType("no_consecutive");
    setPriorityLevel(2);
    setReferenceSubject(null);
    setPlacement("before");
    setShowAddDialog(false);

    toast({
      title: "تم الإضافة",
      description: "تم إضافة القيد بنجاح",
    });
  };

  const handleDeleteConstraint = (id: string) => {
    setConstraints(constraints.filter((c) => c.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف القيد",
    });
  };

  const getPriorityBadge = (level: number) => {
    const priority = PRIORITY_LEVELS.find((p) => p.value === level);
    return priority ? (
      <Badge className={priority.color}>{priority.label}</Badge>
    ) : null;
  };

  const getConstraintTypeLabel = (type: string) => {
    switch (type) {
      case "no_consecutive":
        return "عدم التتالي";
      case "before_after":
        return "الترتيب";
      case "subject_per_day":
        return "مادة كل يوم";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Info Alert */}
      <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-300" />
        <AlertDescription className="text-blue-800 dark:text-blue-100">
          القيود هي شروط اختيارية تساعد في تحسين جودة الجدول. يمكنك تخطي هذه
          الخطوة إذا لم تكن بحاجة لقيود محددة.
        </AlertDescription>
      </Alert>

      {/* Constraints List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>القيود المحددة ({constraints.length})</CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة قيد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة قيد جديد</DialogTitle>
                  <DialogDescription>
                    حدد المادة ونوع القيد الذي تريد تطبيقه
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Subject Selection */}
                  <div className="space-y-2">
                    <Label>المادة</Label>
                    <Select
                      value={selectedSubject?.toString() || ""}
                      onValueChange={(value) =>
                        setSelectedSubject(parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem
                            key={subject.id}
                            value={subject.id.toString()}
                          >
                            {subject.subject_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Constraint Type */}
                  <div className="space-y-2">
                    <Label>نوع القيد</Label>
                    <Select
                      value={constraintType}
                      onValueChange={(value) =>
                        setConstraintType(
                          value as
                            | "no_consecutive"
                            | "before_after"
                            | "subject_per_day"
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_consecutive">
                          <div className="flex flex-col items-start">
                            <span>عدم التتالي</span>
                            <span className="text-xs text-muted-foreground">
                              لا تكون حصتين متتاليتين
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="before_after">
                          <div className="flex flex-col items-start">
                            <span>الترتيب (قبل/بعد)</span>
                            <span className="text-xs text-muted-foreground">
                              يجب أن تكون قبل أو بعد مادة معينة
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="subject_per_day">
                          <div className="flex flex-col items-start">
                            <span>مادة كل يوم</span>
                            <span className="text-xs text-muted-foreground">
                              توزيع المادة على جميع الأيام (اختياري)
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Before/After Options (conditional) */}
                  {constraintType === "before_after" && (
                    <>
                      <div className="space-y-2">
                        <Label>الموضع</Label>
                        <Select
                          value={placement}
                          onValueChange={(value) =>
                            setPlacement(value as "before" | "after")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="before">قبل</SelectItem>
                            <SelectItem value="after">بعد</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>المادة المرجعية</Label>
                        <Select
                          value={referenceSubject?.toString() || ""}
                          onValueChange={(value) =>
                            setReferenceSubject(parseInt(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المادة" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects
                              .filter((s) => s.id !== selectedSubject)
                              .map((subject) => (
                                <SelectItem
                                  key={subject.id}
                                  value={subject.id.toString()}
                                >
                                  {subject.subject_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Priority Level */}
                  <div className="space-y-2">
                    <Label>مستوى الأولوية</Label>
                    <Select
                      value={priorityLevel.toString()}
                      onValueChange={(value) =>
                        setPriorityLevel(parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_LEVELS.map((level) => (
                          <SelectItem
                            key={level.value}
                            value={level.value.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <span>{level.label}</span>
                              {level.value === 4 && (
                                <span className="text-xs text-muted-foreground">
                                  (يجب التقيد به)
                                </span>
                              )}
                              {level.value < 4 && (
                                <span className="text-xs text-muted-foreground">
                                  (يمكن تجاوزه)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {priorityLevel === 4
                        ? "القيود الحرجة (4) يجب تحقيقها وإلا سيتم منع نشر الجدول"
                        : "القيود غير الحرجة (1-3) ستظهر كتحذيرات ويمكن تجاوزها"}
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    إلغاء
                  </Button>
                  <Button onClick={handleAddConstraint}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {constraints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد قيود محددة</p>
              <p className="text-sm">
                يمكنك إضافة قيود لتحسين الجدول أو المتابعة بدون قيود
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {constraints.map((constraint) => (
                <div
                  key={constraint.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">
                          {getConstraintTypeLabel(constraint.constraint_type)}
                        </Badge>
                        {getPriorityBadge(constraint.priority_level)}
                        <span className="text-sm font-medium">
                          {constraint.subject_name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {constraint.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteConstraint(constraint.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {constraints.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">
                  {constraints.length}
                </p>
                <p className="text-blue-600">إجمالي القيود</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-900">
                  {constraints.filter((c) => c.priority_level === 4).length}
                </p>
                <p className="text-red-600">قيود حرجة</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-900">
                  {constraints.filter((c) => c.priority_level === 3).length}
                </p>
                <p className="text-orange-600">قيود عالية</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-900">
                  {constraints.filter((c) => c.priority_level <= 2).length}
                </p>
                <p className="text-yellow-600">قيود منخفضة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* لا توجد أزرار تنقّل هنا؛ الانتقال يتم عبر زر "التالي" في الـ Wizard */}
    </div>
  );
};
