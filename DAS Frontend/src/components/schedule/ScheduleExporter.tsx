import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  FileSpreadsheet,
  FileText,
  Image,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileArchive
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ScheduleExporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId?: number;
  scheduleIds?: number[]; // For bulk export
  scheduleName?: string;
}

type ExportFormat = 'excel' | 'pdf' | 'image';
type ExportOrientation = 'portrait' | 'landscape';
type ImageFormat = 'PNG' | 'JPG';

const FORMAT_OPTIONS = [
  {
    value: 'excel',
    label: 'Excel (xlsx)',
    description: 'جدول إلكتروني قابل للتعديل',
    icon: FileSpreadsheet,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'مستند احترافي للطباعة',
    icon: FileText,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    value: 'image',
    label: 'صورة (PNG/JPG)',
    description: 'صورة للمشاركة السريعة',
    icon: Image,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  }
];

export const ScheduleExporter: React.FC<ScheduleExporterProps> = ({
  open,
  onOpenChange,
  scheduleId,
  scheduleIds,
  scheduleName = 'الجدول'
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel');
  const [orientation, setOrientation] = useState<ExportOrientation>('landscape');
  const [imageFormat, setImageFormat] = useState<ImageFormat>('PNG');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const isBulkExport = scheduleIds && scheduleIds.length > 1;

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);

    try {
      let url: string;
      let filename: string;

      if (isBulkExport && scheduleIds) {
        // Bulk export
        url = 'http://localhost:8000/api/schedules/bulk-export';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('das_token')}`
          },
          body: JSON.stringify({
            schedule_ids: scheduleIds,
            format: selectedFormat,
            include_logo: includeLogo,
            include_notes: includeNotes,
            orientation: selectedFormat === 'pdf' ? orientation : undefined,
            image_format: selectedFormat === 'image' ? imageFormat : undefined
          })
        });

        if (!response.ok) {
          throw new Error('فشل التصدير');
        }

        const blob = await response.blob();
        filename = `schedules_bulk_${Date.now()}.zip`;
        downloadBlob(blob, filename);
      } else if (scheduleId) {
        // Single export
        const formatParams = new URLSearchParams();
        if (includeLogo) formatParams.append('include_logo', 'true');
        if (includeNotes) formatParams.append('include_notes', 'true');

        if (selectedFormat === 'excel') {
          url = `http://localhost:8000/api/schedules/${scheduleId}/export/excel?${formatParams}`;
          filename = `${scheduleName}_${Date.now()}.xlsx`;
        } else if (selectedFormat === 'pdf') {
          formatParams.append('orientation', orientation);
          url = `http://localhost:8000/api/schedules/${scheduleId}/export/pdf?${formatParams}`;
          filename = `${scheduleName}_${Date.now()}.pdf`;
        } else {
          formatParams.append('format', imageFormat);
          url = `http://localhost:8000/api/schedules/${scheduleId}/export/image?${formatParams}`;
          filename = `${scheduleName}_${Date.now()}.${imageFormat.toLowerCase()}`;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('das_token')}`
          }
        });

        if (!response.ok) {
          throw new Error('فشل التصدير');
        }

        const blob = await response.blob();
        downloadBlob(blob, filename);
      }

      setExportProgress(100);
      toast({
        title: 'تم التصدير بنجاح',
        description: `تم حفظ الملف: ${filename}`
      });

      // Close dialog after success
      setTimeout(() => {
        onOpenChange(false);
        setExporting(false);
        setExportProgress(0);
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'خطأ في التصدير',
        description: error.message || 'حدث خطأ أثناء تصدير الجدول',
        variant: 'destructive'
      });
      setExporting(false);
      setExportProgress(0);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const selectedFormatOption = FORMAT_OPTIONS.find(f => f.value === selectedFormat);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Download className="h-5 w-5" />
            تصدير {isBulkExport ? `${scheduleIds?.length} جداول` : 'الجدول'}
          </DialogTitle>
          <DialogDescription>
            اختر صيغة التصدير والإعدادات المطلوبة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Bulk Export Notice */}
          {isBulkExport && (
            <Alert className="bg-blue-50 border-blue-200">
              <FileArchive className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                سيتم تصدير {scheduleIds?.length} جداول في ملف مضغوط (ZIP)
              </AlertDescription>
            </Alert>
          )}

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">اختر الصيغة</Label>
            <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ExportFormat)}>
              <div className="space-y-2">
                {FORMAT_OPTIONS.map((format) => {
                  const Icon = format.icon;
                  const isSelected = selectedFormat === format.value;

                  return (
                    <Card
                      key={format.value}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? `${format.borderColor} ${format.bgColor} shadow-md`
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedFormat(format.value as ExportFormat)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={format.value} id={format.value} />
                          <div className={`p-2 rounded-lg ${format.bgColor}`}>
                            <Icon className={`h-6 w-6 ${format.color}`} />
                          </div>
                          <div className="flex-1">
                            <Label
                              htmlFor={format.value}
                              className="font-semibold cursor-pointer"
                            >
                              {format.label}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format.description}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className={`h-5 w-5 ${format.color}`} />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Format-specific Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">خيارات إضافية</Label>

            {/* PDF Orientation */}
            {selectedFormat === 'pdf' && (
              <div className="space-y-2">
                <Label className="text-sm">اتجاه الصفحة</Label>
                <RadioGroup value={orientation} onValueChange={(value) => setOrientation(value as ExportOrientation)}>
                  <div className="grid grid-cols-2 gap-2">
                    <Card
                      className={`cursor-pointer ${orientation === 'landscape' ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setOrientation('landscape')}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="landscape" id="landscape" />
                          <Label htmlFor="landscape" className="cursor-pointer">أفقي (Landscape)</Label>
                        </div>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer ${orientation === 'portrait' ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setOrientation('portrait')}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="portrait" id="portrait" />
                          <Label htmlFor="portrait" className="cursor-pointer">عمودي (Portrait)</Label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Image Format */}
            {selectedFormat === 'image' && (
              <div className="space-y-2">
                <Label className="text-sm">صيغة الصورة</Label>
                <RadioGroup value={imageFormat} onValueChange={(value) => setImageFormat(value as ImageFormat)}>
                  <div className="grid grid-cols-2 gap-2">
                    <Card
                      className={`cursor-pointer ${imageFormat === 'PNG' ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setImageFormat('PNG')}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="PNG" id="PNG" />
                          <Label htmlFor="PNG" className="cursor-pointer">PNG (جودة عالية)</Label>
                        </div>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer ${imageFormat === 'JPG' ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setImageFormat('JPG')}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="JPG" id="JPG" />
                          <Label htmlFor="JPG" className="cursor-pointer">JPG (حجم أصغر)</Label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Common Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id="include-logo"
                  checked={includeLogo}
                  onCheckedChange={(checked) => setIncludeLogo(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="include-logo" className="cursor-pointer font-medium">
                    تضمين شعار المدرسة
                  </Label>
                  <p className="text-xs text-muted-foreground">إضافة شعار المدرسة في رأس الجدول</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id="include-notes"
                  checked={includeNotes}
                  onCheckedChange={(checked) => setIncludeNotes(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="include-notes" className="cursor-pointer font-medium">
                    تضمين الملاحظات
                  </Label>
                  <p className="text-xs text-muted-foreground">عرض ملاحظات الحصص إن وجدت</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          {selectedFormatOption && (
            <Alert className={`${selectedFormatOption.bgColor} ${selectedFormatOption.borderColor}`}>
              <AlertCircle className={`h-4 w-4 ${selectedFormatOption.color}`} />
              <AlertDescription className="text-sm">
                <div className="space-y-1">
                  <p className="font-medium">سيتم تصدير الجدول بالمواصفات التالية:</p>
                  <ul className="list-disc list-inside text-xs space-y-0.5 mr-2">
                    <li>الصيغة: {selectedFormatOption.label}</li>
                    {selectedFormat === 'pdf' && <li>الاتجاه: {orientation === 'landscape' ? 'أفقي' : 'عمودي'}</li>}
                    {selectedFormat === 'image' && <li>النوع: {imageFormat}</li>}
                    <li>الشعار: {includeLogo ? 'مُضمّن' : 'غير مُضمّن'}</li>
                    <li>الملاحظات: {includeNotes ? 'مُضمّنة' : 'غير مُضمّنة'}</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Export Progress */}
          {exporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>جاري التصدير...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || (!scheduleId && !isBulkExport)}
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

