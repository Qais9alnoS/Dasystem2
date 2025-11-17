import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  MoreVertical
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ScheduleAssignment {
  id: number;
  time_slot_id: number;
  day_of_week: number;
  period_number: number;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  teacher_name: string;
  room?: string;
  notes?: string;
  has_conflict?: boolean;
  conflict_type?: string;
}

interface WeeklyScheduleGridProps {
  scheduleId?: number;
  data?: {
    classId: number;
    academicYearId: number;
    sessionType: string;
  };
  assignments: ScheduleAssignment[];
  onAssignmentClick?: (assignment: ScheduleAssignment) => void;
  onAssignmentEdit?: (assignment: ScheduleAssignment) => void;
  onAssignmentDelete?: (assignmentId: number) => void;
  readOnly?: boolean;
}

const DAYS = [
  { value: 1, label: 'الأحد', short: 'أحد' },
  { value: 2, label: 'الاثنين', short: 'إثنين' },
  { value: 3, label: 'الثلاثاء', short: 'ثلاثاء' },
  { value: 4, label: 'الأربعاء', short: 'أربعاء' },
  { value: 5, label: 'الخميس', short: 'خميس' }
];

const PERIODS = [
  { number: 1, start: '08:00', end: '08:45' },
  { number: 2, start: '08:50', end: '09:35' },
  { number: 3, start: '09:40', end: '10:25' },
  { number: 4, start: '10:30', end: '11:15' },
  { number: 5, start: '11:20', end: '12:05' },
  { number: 6, start: '12:10', end: '12:55' }
];

export const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({
  scheduleId,
  data,
  assignments,
  onAssignmentClick,
  onAssignmentEdit,
  onAssignmentDelete,
  readOnly = false
}) => {
  const [selectedCell, setSelectedCell] = useState<ScheduleAssignment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [draggedAssignment, setDraggedAssignment] = useState<ScheduleAssignment | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [isValidDrop, setIsValidDrop] = useState<boolean>(false);
  const viewMode = 'detailed'; // Always use detailed view

  // Create a grid map for quick lookup
  const gridMap = new Map<string, ScheduleAssignment>();
  assignments.forEach(assignment => {
    const key = `${assignment.day_of_week}-${assignment.period_number}`;
    gridMap.set(key, assignment);
  });

  const handleCellClick = (assignment: ScheduleAssignment) => {
    // Only show details in readonly mode, don't allow edit/delete
    if (readOnly) {
      setSelectedCell(assignment);
      setShowDetailsDialog(true);
      onAssignmentClick?.(assignment);
    }
  };

  const handleEdit = () => {
    if (selectedCell) {
      onAssignmentEdit?.(selectedCell);
      setShowDetailsDialog(false);
    }
  };

  const handleDelete = () => {
    if (selectedCell) {
      onAssignmentDelete?.(selectedCell.id);
      setShowDetailsDialog(false);
      setSelectedCell(null);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الحصة بنجاح'
      });
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, assignment: ScheduleAssignment) => {
    if (readOnly) return;
    setDraggedAssignment(assignment);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(assignment));
  };

  const handleDragOver = (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    if (readOnly || !draggedAssignment) return;

    const key = `${day}-${period}`;
    const targetAssignment = gridMap.get(key);
    
    // Check if drop is valid
    // Valid if: dropping on a different cell and target has an assignment
    const valid = targetAssignment !== undefined && 
                   !(draggedAssignment.day_of_week === day && draggedAssignment.period_number === period);
    
    setDragOverCell(key);
    setIsValidDrop(valid);
    e.dataTransfer.dropEffect = valid ? 'move' : 'none';
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
    setIsValidDrop(false);
  };

  const handleDrop = async (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    if (readOnly || !draggedAssignment) return;

    const key = `${day}-${period}`;
    const targetAssignment = gridMap.get(key);

    // Only allow swap if both cells have assignments
    if (!targetAssignment) {
      toast({
        title: 'غير مسموح',
        description: 'لا يمكن التبديل مع خانة فارغة',
        variant: 'destructive'
      });
      setDraggedAssignment(null);
      setDragOverCell(null);
      setIsValidDrop(false);
      return;
    }

    // Don't swap with itself
    if (draggedAssignment.id === targetAssignment.id) {
      setDraggedAssignment(null);
      setDragOverCell(null);
      setIsValidDrop(false);
      return;
    }

    // Call swap API using schedulesApi
    try {
      const { schedulesApi } = await import('@/services/api');
      const result = await schedulesApi.swap(draggedAssignment.id, targetAssignment.id);

      if (result.success) {
        toast({
          title: 'تم التبديل بنجاح',
          description: 'تم تبديل الحصص بنجاح',
        });
        // Trigger parent refresh
        window.location.reload(); // Simple refresh, can be optimized
      } else {
        throw new Error(result.message || 'حدث خطأ اثناء تبديل الحصص');
      }
    } catch (error: any) {
      console.error('Swap error:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'حدث خطأ اثناء تبديل الحصص';
      toast({
        title: 'خطأ',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setDraggedAssignment(null);
      setDragOverCell(null);
      setIsValidDrop(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedAssignment(null);
    setDragOverCell(null);
    setIsValidDrop(false);
  };

  const renderCell = (day: number, period: number) => {
    const key = `${day}-${period}`;
    const assignment = gridMap.get(key);
    const isDragOver = dragOverCell === key;
    const isDragging = draggedAssignment?.id === assignment?.id;

    if (!assignment) {
      return (
        <div 
          onDragOver={(e) => handleDragOver(e, day, period)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, day, period)}
          className={cn(
            "h-full min-h-[80px] p-2 border border-dashed border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors flex items-center justify-center",
            isDragOver && !isValidDrop && "bg-red-100 border-red-400 animate-pulse"
          )}
        >
          <span className="text-xs text-gray-400">فارغ</span>
        </div>
      );
    }

    const hasConflict = assignment.has_conflict;

    return (
      <div
        draggable={!readOnly}
        onDragStart={(e) => handleDragStart(e, assignment)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, day, period)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, day, period)}
        className={cn(
          "h-full min-h-[80px] p-3 rounded-xl transition-all duration-200 cursor-move group relative",
          "shadow-sm hover:shadow-md",
          hasConflict
            ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/40 border-2 border-red-300 dark:border-red-700"
            : "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40 border border-blue-200 dark:border-blue-700",
          !readOnly && "hover:scale-[1.02]",
          isDragging && "opacity-50 scale-95",
          isDragOver && isValidDrop && "animate-wiggle border-green-500 dark:border-green-400 border-4 bg-green-100 dark:bg-green-900/40",
          isDragOver && !isValidDrop && "border-red-500 dark:border-red-400 border-4 bg-red-100 dark:bg-red-900/40"
        )}
        style={{
          animation: isDragOver && isValidDrop ? 'wiggle 0.5s ease-in-out infinite' : undefined
        }}
      >
        {/* Conflict Indicator */}
        {hasConflict && (
          <div className="absolute -top-1 -right-1">
            <div className="bg-red-500 text-white rounded-full p-1">
              <AlertTriangle className="h-3 w-3" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-2">
          {/* Subject Name */}
          <div className="font-semibold text-sm text-gray-900 line-clamp-1">
            {assignment.subject_name}
          </div>

          {/* Teacher Name */}
          {viewMode === 'detailed' && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{assignment.teacher_name}</span>
            </div>
          )}

          {/* Room (if exists) */}
          {viewMode === 'detailed' && assignment.room && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span>{assignment.room}</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-1 mt-2">
            {hasConflict ? (
              <Badge variant="destructive" className="text-[10px] py-0 h-4">
                تعارض
              </Badge>
            ) : (
              <Badge className="bg-green-500 text-white text-[10px] py-0 h-4">
                <CheckCircle2 className="h-2 w-2 ml-1" />
                صحيح
              </Badge>
            )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">الجدول الأسبوعي</h3>
        </div>
      </div>

      {/* Schedule Grid - Columns: Periods, Rows: Days */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <th className="p-3 text-white font-semibold text-sm border-l border-blue-500 min-w-[100px]">
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4" />
                      اليوم
                    </div>
                  </th>
                  {PERIODS.map((period) => (
                    <th
                      key={period.number}
                      className="p-3 text-white font-semibold text-sm border-l border-blue-500 last:border-l-0"
                    >
                      <div className="text-center">
                        <div>الحصة {period.number}</div>
                        <div className="text-xs font-normal mt-1 opacity-90">
                          {period.start} - {period.end}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, dayIndex) => (
                  <tr
                    key={day.value}
                    className={cn(
                      "border-b border-gray-200",
                      dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    )}
                  >
                    {/* Day Column */}
                    <td className="p-3 border-l border-gray-200 bg-gray-100">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">
                          {day.label}
                        </div>
                      </div>
                    </td>

                    {/* Period Cells */}
                    {PERIODS.map((period) => (
                      <td
                        key={period.number}
                        className="p-2 border-l border-gray-200 last:border-l-0"
                      >
                        {renderCell(day.value, period.number)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Footer */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {assignments.length}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-300">إجمالي الحصص</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {assignments.filter(a => !a.has_conflict).length}
              </div>
              <div className="text-xs text-green-600 dark:text-green-300">حصص صحيحة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {assignments.filter(a => a.has_conflict).length}
              </div>
              <div className="text-xs text-red-600 dark:text-red-300">تعارضات</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {new Set(assignments.map(a => a.teacher_id)).size}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-300">معلمين</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الحصة</DialogTitle>
          </DialogHeader>
          {selectedCell && (
            <div className="space-y-4">
              {/* Subject */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">المادة</div>
                <div className="text-lg font-semibold text-blue-900">
                  {selectedCell.subject_name}
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">اليوم</div>
                  <div className="font-medium">
                    {DAYS.find(d => d.value === selectedCell.day_of_week)?.label}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">الحصة</div>
                  <div className="font-medium">
                    الحصة {selectedCell.period_number}
                  </div>
                </div>
              </div>

              {/* Teacher */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 mb-1 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  المعلم
                </div>
                <div className="text-lg font-semibold text-green-900">
                  {selectedCell.teacher_name}
                </div>
              </div>

              {/* Room */}
              {selectedCell.room && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    القاعة
                  </div>
                  <div className="font-medium text-purple-900">{selectedCell.room}</div>
                </div>
              )}

              {/* Notes */}
              {selectedCell.notes && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-600 mb-1">ملاحظات</div>
                  <div className="text-sm text-yellow-900">{selectedCell.notes}</div>
                </div>
              )}

              {/* Conflict Warning */}
              {selectedCell.has_conflict && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    تحذير: يوجد تعارض
                  </div>
                  <div className="text-sm text-red-600">
                    {selectedCell.conflict_type || 'تعارض في الجدول'}
                  </div>
                </div>
              )}

              {/* Actions */}
              {!readOnly && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleEdit} className="flex-1">
                    <Edit2 className="h-4 w-4 ml-2" />
                    تعديل
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

