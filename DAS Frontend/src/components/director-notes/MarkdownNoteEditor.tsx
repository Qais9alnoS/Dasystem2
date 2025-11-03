import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Code, Quote, Link as LinkIcon, Minus,
  Eye, Edit, Columns, Save, ArrowLeft, Clock, Table
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { directorApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const MarkdownNoteEditor: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');

  useEffect(() => {
    if (fileId) {
      loadFile();
    }
  }, [fileId]);

  useEffect(() => {
    // Auto-save after 3 seconds of inactivity
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (fileId && !loading) {
        handleSave(true);
      }
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, title]);

  const loadFile = async () => {
    if (!fileId) return;

    try {
      setLoading(true);
      const response = await directorApi.getFile(parseInt(fileId));

      if (response.success && response.data) {
        setTitle(response.data.title || '');
        setContent(response.data.content || '');
        setNoteDate(response.data.note_date || new Date().toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الملف',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (isAutoSave: boolean = false) => {
    if (!fileId) return;

    try {
      if (!isAutoSave) setSaving(true);

      await directorApi.updateFile(
        parseInt(fileId),
        title,
        content,
        noteDate
      );

      setLastSaved(new Date());

      if (!isAutoSave) {
        toast({
          title: 'نجاح',
          description: 'تم حفظ التغييرات',
        });
      }
    } catch (error) {
      console.error('Error saving file:', error);
      if (!isAutoSave) {
        toast({
          title: 'خطأ',
          description: 'فشل في حفظ التغييرات',
          variant: 'destructive',
        });
      }
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertTable = () => {
    const tableMarkdown = '\n| العنوان 1 | العنوان 2 | العنوان 3 |\n|----------|----------|----------|\n| خلية 1   | خلية 2   | خلية 3   |\n| خلية 4   | خلية 5   | خلية 6   |\n';
    insertMarkdown(tableMarkdown);
  };

  const renderPreview = () => {
    // Simple markdown rendering - will be enhanced with react-markdown
    let html = content;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Strikethrough
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-500 underline">$1</a>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
    
    return html;
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">تحرير الملاحظة</h1>
            {lastSaved && (
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3" />
                آخر حفظ: {lastSaved.toLocaleTimeString('ar-SA')}
              </p>
            )}
          </div>
        </div>
        <Button onClick={() => handleSave(false)} disabled={saving}>
          <Save className="h-4 w-4 ml-2" />
          {saving ? 'جارٍ الحفظ...' : 'حفظ'}
        </Button>
      </div>

      {/* Title and Date */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">العنوان</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان الملاحظة..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">التاريخ</Label>
            <Input
              id="date"
              type="date"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
            <div className="border-b p-2">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="edit">
                    <Edit className="h-4 w-4 ml-2" />
                    تحرير
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="h-4 w-4 ml-2" />
                    معاينة
                  </TabsTrigger>
                  <TabsTrigger value="split">
                    <Columns className="h-4 w-4 ml-2" />
                    مقسم
                  </TabsTrigger>
                </TabsList>

                {/* Markdown Toolbar */}
                {viewMode !== 'preview' && (
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant="ghost" onClick={() => insertMarkdown('**', '**')} title="غامق">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => insertMarkdown('*', '*')} title="مائل">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => insertMarkdown('~~', '~~')} title="يتوسطه خط">
                      <Strikethrough className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => insertMarkdown('# ', '')} title="عنوان 1">
                      <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => insertMarkdown('## ', '')} title="عنوان 2">
                      <Heading2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => insertMarkdown('### ', '')} title="عنوان 3">
                      <Heading3 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => insertMarkdown('- ', '')} title="قائمة نقطية">
                      <List className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => insertMarkdown('1. ', '')} title="قائمة مرقمة">
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => insertMarkdown('`', '`')} title="كود">
                      <Code className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => insertMarkdown('> ', '')} title="اقتباس">
                      <Quote className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => insertMarkdown('[', '](url)')} title="رابط">
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => insertMarkdown('---\n', '')} title="خط أفقي">
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={insertTable} title="جدول">
                      <Table className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <TabsContent value="edit" className="m-0">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ابدأ الكتابة هنا... يمكنك استخدام Markdown للتنسيق"
                className="min-h-[600px] border-0 rounded-none resize-none focus-visible:ring-0"
              />
            </TabsContent>

            <TabsContent value="preview" className="m-0">
              <div 
                className="prose prose-slate max-w-none p-6 min-h-[600px]"
                dangerouslySetInnerHTML={{ __html: renderPreview() }}
              />
            </TabsContent>

            <TabsContent value="split" className="m-0">
              <div className="grid grid-cols-2 gap-4 p-4">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="ابدأ الكتابة هنا..."
                  className="min-h-[600px] resize-none"
                />
                <div 
                  className="prose prose-slate max-w-none border rounded-md p-4 min-h-[600px] overflow-auto"
                  dangerouslySetInnerHTML={{ __html: renderPreview() }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Word Count */}
      <div className="mt-4 text-sm text-muted-foreground text-center">
        عدد الكلمات: {content.split(/\s+/).filter(word => word.length > 0).length} | 
        عدد الأحرف: {content.length}
      </div>
    </div>
  );
};

export default MarkdownNoteEditor;

