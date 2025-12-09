import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LineChart from '@/components/analytics/LineChart';
import { analyticsApi } from '@/services/api';

interface GradeData {
  assignment_type: string;
  assignment_number: number;
  morning_average: number;
  evening_average: number;
  subject_name: string;
}

interface SchoolGradesChartProps {
  academicYearId: number;
  sessionFilter: 'morning' | 'evening' | 'both';
}

const SchoolGradesChart: React.FC<SchoolGradesChartProps> = ({
  academicYearId,
  sessionFilter
}) => {
  const [loading, setLoading] = useState(true);
  const [gradesData, setGradesData] = useState<GradeData[]>([]);

  useEffect(() => {
    fetchSchoolGrades();
  }, [academicYearId, sessionFilter]);

  const fetchSchoolGrades = async () => {
    setLoading(true);
    try {
      const response = await analyticsApi.getSchoolGrades(academicYearId);
      const data = response.data as GradeData[] || [];

      // Process and sort data
      const processedData = data.map(item => ({
        ...item,
        morning_average: Math.round(item.morning_average * 100) / 100,
        evening_average: Math.round(item.evening_average * 100) / 100
      }));
      setGradesData(processedData);

    } catch (error) {

      // Set empty data when backend fails
      setGradesData([]);
    } finally {
      setLoading(false);
    }
  };

  // Group data by assignment type and number, then combine all subjects
  const groupedData = gradesData.reduce((acc, item) => {
    const key = `${item.assignment_type}_${item.assignment_number}`;
    if (!acc[key]) {
      acc[key] = {
        assignment_type: item.assignment_type,
        assignment_number: item.assignment_number,
        morning_averages: [],
        evening_averages: [],
        subjects: []
      };
    }
    acc[key].morning_averages.push(item.morning_average);
    acc[key].evening_averages.push(item.evening_average);
    acc[key].subjects.push(item.subject_name);
    return acc;
  }, {} as Record<string, any>);

  // Calculate overall averages and sort
  const processedGroups = Object.values(groupedData).map((group: any) => ({
    ...group,
    morning_average: group.morning_averages.reduce((sum: number, val: number) => sum + val, 0) / group.morning_averages.length,
    evening_average: group.evening_averages.reduce((sum: number, val: number) => sum + val, 0) / group.evening_averages.length,
    subject_count: group.subjects.length
  })).sort((a: any, b: any) => {
    // Sort by assignment type (مذاكرة first, then امتحان)
    if (a.assignment_type !== b.assignment_type) {
      return a.assignment_type === 'مذاكرة' ? -1 : 1;
    }
    // Then by assignment number
    return a.assignment_number - b.assignment_number;
  });

  // Prepare data for LineChart - fix DataPoint interface
  const chartData = processedGroups.map((group: any) => ({
    name: `${group.assignment_type} ${group.assignment_number}`,
    value: 0 // Placeholder value since we use series data
  }));

  const morningColor = '#F59E0B'; // Amber/Yellow
  const eveningColor = '#3B82F6'; // Blue

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-8 rounded"></div>
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-32 rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Sun className="h-5 w-5 text-amber-500" />
            <Moon className="h-5 w-5 text-blue-500" />
          </div>
          علامات المدرسة
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          متوسط علامات جميع الطلاب في جميع المواد لكل مذاكرة وامتحان (من 100)
        </p>
      </CardHeader>

      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">لا توجد بيانات علامات متاحة</p>
          </div>
        ) : (
          <div>
            {sessionFilter === 'both' && (
              <LineChart
                data={chartData}
                series={[
                  {
                    name: 'صباحي',
                    data: processedGroups.map(g => Math.round(g.morning_average * 10) / 10),
                    color: morningColor
                  },
                  {
                    name: 'مسائي',
                    data: processedGroups.map(g => Math.round(g.evening_average * 10) / 10),
                    color: eveningColor
                  }
                ]}
                height="400px"
                smooth
                loading={loading}
                yAxisLabel="متوسط العلامات (%)"
              />
            )}

            {sessionFilter === 'morning' && (
              <LineChart
                data={chartData}
                series={[
                  {
                    name: 'صباحي',
                    data: processedGroups.map(g => Math.round(g.morning_average * 10) / 10),
                    color: morningColor
                  }
                ]}
                height="400px"
                smooth
                loading={loading}
                yAxisLabel="متوسط العلامات (%)"
              />
            )}

            {sessionFilter === 'evening' && (
              <LineChart
                data={chartData}
                series={[
                  {
                    name: 'مسائي',
                    data: processedGroups.map(g => Math.round(g.evening_average * 10) / 10),
                    color: eveningColor
                  }
                ]}
                height="400px"
                smooth
                loading={loading}
                yAxisLabel="متوسط العلامات (%)"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SchoolGradesChart;
