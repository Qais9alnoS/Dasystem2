/**
 * Attendance Data Debugger Utility
 * 
 * This utility helps debug attendance data by:
 * 1. Fetching raw data from backend API
 * 2. Showing what frontend receives and processes
 * 3. Comparing backend vs frontend data
 */

import api from '../services/api';

interface AttendanceRecord {
  date: string;
  total: number;
  present: number;
  absent: number;
  attendance_rate: number;
}

interface DebugResult {
  backend: {
    morning: AttendanceRecord[];
    evening: AttendanceRecord[];
  };
  frontend: {
    processed: any[];
  };
  comparison: {
    date: string;
    morning_backend: number | null;
    morning_frontend: number | null;
    morning_match: boolean;
    evening_backend: number | null;
    evening_frontend: number | null;
    evening_match: boolean;
  }[];
  issues: string[];
}

export async function debugAttendanceData(
  academicYearId: number,
  periodType: string = 'monthly'
): Promise<DebugResult> {
  const issues: string[] = [];
  
  try {
    console.log('🔍 Starting Attendance Data Debug...');
    console.log(`Academic Year ID: ${academicYearId}, Period: ${periodType}`);
    
    // 1. Fetch raw backend data for morning
    console.log('\n📡 Fetching MORNING data from backend...');
    const morningParams = new URLSearchParams({
      academic_year_id: academicYearId.toString(),
      period_type: periodType,
      session_type: 'morning'
    });
    const morningResponse = await api.get(`/analytics/attendance?${morningParams}`);
    const morningData = (morningResponse.data as any)?.student_attendance || [];
    console.log('Morning Backend Data:', morningData);
    
    // 2. Fetch raw backend data for evening
    console.log('\n📡 Fetching EVENING data from backend...');
    const eveningParams = new URLSearchParams({
      academic_year_id: academicYearId.toString(),
      period_type: periodType,
      session_type: 'evening'
    });
    const eveningResponse = await api.get(`/analytics/attendance?${eveningParams}`);
    const eveningData = (eveningResponse.data as any)?.student_attendance || [];
    console.log('Evening Backend Data:', eveningData);
    
    // 3. Simulate frontend processing (what DashboardPage.tsx does)
    console.log('\n⚙️ Simulating Frontend Processing...');
    const dateMap = new Map();
    
    morningData.forEach((record: AttendanceRecord) => {
      dateMap.set(record.date, {
        date: record.date,
        morning_rate: record.attendance_rate,
        morning_total: record.total,
        morning_present: record.present,
        morning_absent: record.absent
      });
    });
    
    eveningData.forEach((record: AttendanceRecord) => {
      const existing = dateMap.get(record.date);
      if (existing) {
        existing.evening_rate = record.attendance_rate;
        existing.evening_total = record.total;
        existing.evening_present = record.present;
        existing.evening_absent = record.absent;
      } else {
        dateMap.set(record.date, {
          date: record.date,
          evening_rate: record.attendance_rate,
          evening_total: record.total,
          evening_present: record.present,
          evening_absent: record.absent
        });
      }
    });
    
    const processedData = Array.from(dateMap.values()).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    console.log('Frontend Processed Data:', processedData);
    
    // 4. Compare backend vs frontend
    console.log('\n🔎 Comparing Backend vs Frontend...');
    const comparison = processedData.map(record => {
      const morningBackend = morningData.find((r: AttendanceRecord) => r.date === record.date);
      const eveningBackend = eveningData.find((r: AttendanceRecord) => r.date === record.date);
      
      const morningBackendRate = morningBackend?.attendance_rate ?? null;
      const morningFrontendRate = record.morning_rate ?? null;
      const morningMatch = morningBackendRate === morningFrontendRate;
      
      const eveningBackendRate = eveningBackend?.attendance_rate ?? null;
      const eveningFrontendRate = record.evening_rate ?? null;
      const eveningMatch = eveningBackendRate === eveningFrontendRate;
      
      if (!morningMatch) {
        issues.push(`❌ Date ${record.date}: Morning mismatch - Backend: ${morningBackendRate}%, Frontend: ${morningFrontendRate}%`);
      }
      
      if (!eveningMatch) {
        issues.push(`❌ Date ${record.date}: Evening mismatch - Backend: ${eveningBackendRate}%, Frontend: ${eveningFrontendRate}%`);
      }
      
      return {
        date: record.date,
        morning_backend: morningBackendRate,
        morning_frontend: morningFrontendRate,
        morning_match: morningMatch,
        evening_backend: eveningBackendRate,
        evening_frontend: eveningFrontendRate,
        evening_match: eveningMatch
      };
    });
    
    // 5. Print comparison table
    console.log('\n📊 Comparison Table:');
    console.table(comparison);
    
    // 6. Print issues
    if (issues.length > 0) {
      console.log('\n⚠️ Issues Found:');
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('\n✅ No issues found! Backend and Frontend data match.');
    }
    
    // 7. Additional checks
    console.log('\n🔬 Additional Checks:');
    
    // Check for missing dates
    const allDates = new Set([
      ...morningData.map((r: AttendanceRecord) => r.date),
      ...eveningData.map((r: AttendanceRecord) => r.date)
    ]);
    
    allDates.forEach(date => {
      const hasMorning = morningData.some((r: AttendanceRecord) => r.date === date);
      const hasEvening = eveningData.some((r: AttendanceRecord) => r.date === date);
      
      if (!hasMorning) {
        issues.push(`⚠️ Date ${date}: Missing morning data`);
        console.log(`⚠️ Date ${date}: Missing morning data`);
      }
      if (!hasEvening) {
        issues.push(`⚠️ Date ${date}: Missing evening data`);
        console.log(`⚠️ Date ${date}: Missing evening data`);
      }
    });
    
    return {
      backend: {
        morning: morningData,
        evening: eveningData
      },
      frontend: {
        processed: processedData
      },
      comparison,
      issues
    };
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
    throw error;
  }
}

// Helper function to print a summary report
export function printDebugSummary(result: DebugResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('📋 ATTENDANCE DEBUG SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n📊 Data Counts:`);
  console.log(`  Morning records: ${result.backend.morning.length}`);
  console.log(`  Evening records: ${result.backend.evening.length}`);
  console.log(`  Processed records: ${result.frontend.processed.length}`);
  
  console.log(`\n🎯 Accuracy:`);
  const totalComparisons = result.comparison.length * 2; // morning + evening
  const matches = result.comparison.filter(c => c.morning_match && c.evening_match).length * 2;
  const accuracy = totalComparisons > 0 ? (matches / totalComparisons * 100).toFixed(2) : 0;
  console.log(`  Match rate: ${accuracy}%`);
  
  if (result.issues.length > 0) {
    console.log(`\n⚠️ Total Issues: ${result.issues.length}`);
  } else {
    console.log(`\n✅ All checks passed!`);
  }
  
  console.log('\n' + '='.repeat(60));
}

// Quick debug function to run from browser console
(window as any).debugAttendance = async (academicYearId: number) => {
  const result = await debugAttendanceData(academicYearId);
  printDebugSummary(result);
  return result;
};

console.log('💡 Attendance Debugger loaded! Run: debugAttendance(YOUR_ACADEMIC_YEAR_ID)');
