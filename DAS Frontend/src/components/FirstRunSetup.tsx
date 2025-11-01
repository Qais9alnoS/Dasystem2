import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { academicYearsApi } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, School, CheckCircle, Settings } from 'lucide-react';
import { IOSNavbar } from '@/components/ui/ios-navbar';

interface FirstRunSetupProps {
  onComplete: () => void;
}

export function FirstRunSetup({ onComplete }: FirstRunSetupProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    year_name: '',
    description: ''
  });
  const [autoOpenYear, setAutoOpenYear] = useState(true);

  // Check if this is first run on component mount
  useEffect(() => {
    const checkFirstRun = async () => {
      try {
        const response = await academicYearsApi.checkFirstRun();
        // Handle both response formats
        if (response.success && response.data) {
          setIsFirstRun(response.data.is_first_run);
        } else {
          // Direct data format
          setIsFirstRun((response as any).is_first_run);
        }
      } catch (error) {
        console.error('Error checking first run status:', error);
        toast({
          title: "Error",
          description: "Failed to check first run status",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    checkFirstRun();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.year_name.trim()) {
      toast({
        title: "Error",
        description: "Please enter the academic year name",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const response = await academicYearsApi.initializeFirstYear({
        year_name: formData.year_name,
        description: formData.description,
        is_active: true
      });

      // Handle both response formats
      let resultData;
      if (response.success && response.data) {
        resultData = response.data;
      } else {
        // Direct data format
        resultData = response as any;
      }

      if (resultData) {
        // Save the auto-open preference to localStorage instead
        if (autoOpenYear) {
          localStorage.setItem('auto_open_academic_year', 'true');
        }

        toast({
          title: "Success",
          description: "First academic year created successfully"
        });
        
        // Mark first run as complete
        localStorage.setItem('first_run_completed', 'true');
        
        // Call onComplete callback to indicate setup is complete
        onComplete();
      } else {
        throw new Error(response.message || 'Failed to create first academic year');
      }
    } catch (error: any) {
      console.error('Error creating first academic year:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create first academic year",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not first run, redirect to academic years page
  if (isFirstRun === false) {
    onComplete();
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <IOSNavbar title="First Run Setup" largeTitle={true} />
      
      <div className="p-4 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3 space-x-reverse">
              <School className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>Initial Setup</CardTitle>
                <CardDescription>
                  Let's get started by creating your first academic year
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  This is your first time using the system. Let's create your first academic year to get started.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="year_name">Academic Year Name *</Label>
                <Input
                  id="year_name"
                  value={formData.year_name}
                  onChange={(e) => handleInputChange('year_name', e.target.value)}
                  placeholder="e.g., 2025-2026"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Format: Current Year - Next Year (e.g., 2025-2026)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of this academic year"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Auto-open Academic Year</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically open the last active academic year on startup
                  </p>
                </div>
                <Switch
                  checked={autoOpenYear}
                  onCheckedChange={setAutoOpenYear}
                />
              </div>

              <div className="flex space-x-3 space-x-reverse">
                <Button 
                  type="submit" 
                  disabled={creating}
                  className="flex-1"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create First Academic Year
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}