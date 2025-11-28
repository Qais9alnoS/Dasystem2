"""
Attendance Data Verification Script
Tests the backend API directly and compares morning vs evening data
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from tabulate import tabulate

# API Configuration
BASE_URL = "http://localhost:8000/api"
USERNAME = "director"  # Change if needed
PASSWORD = "director123"  # Change if needed

class AttendanceDataTester:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        
    def login(self) -> bool:
        """Login to get authentication token"""
        try:
            response = self.session.post(
                f"{BASE_URL}/auth/login",
                json={"username": USERNAME, "password": PASSWORD}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.session.headers.update({
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "application/json"
                })
                print("✅ Login successful!")
                return True
            else:
                print(f"❌ Login failed: {response.status_code}")
                print(response.text)
                return False
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
    
    def get_academic_years(self) -> List[Dict]:
        """Get list of academic years"""
        try:
            response = self.session.get(f"{BASE_URL}/academic/years")
            if response.status_code == 200:
                data = response.json()
                return data.get("data", [])
            return []
        except Exception as e:
            print(f"❌ Error getting academic years: {e}")
            return []
    
    def get_attendance_data(self, academic_year_id: int, session_type: str = None, period_type: str = "monthly") -> Dict:
        """Get attendance data from backend"""
        try:
            params = {
                "academic_year_id": academic_year_id,
                "period_type": period_type
            }
            if session_type:
                params["session_type"] = session_type
            
            response = self.session.get(f"{BASE_URL}/analytics/attendance", params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("data", {})
            else:
                print(f"❌ Error getting attendance data: {response.status_code}")
                print(response.text)
                return {}
        except Exception as e:
            print(f"❌ Error: {e}")
            return {}
    
    def test_attendance_accuracy(self, academic_year_id: int):
        """Test and verify attendance data accuracy"""
        print("\n" + "="*80)
        print(f"🔬 TESTING ATTENDANCE DATA FOR ACADEMIC YEAR ID: {academic_year_id}")
        print("="*80)
        
        # Get morning data
        print("\n📡 Fetching MORNING attendance data...")
        morning_data = self.get_attendance_data(academic_year_id, "morning")
        morning_attendance = morning_data.get("student_attendance", [])
        print(f"   Found {len(morning_attendance)} morning records")
        
        # Get evening data
        print("\n📡 Fetching EVENING attendance data...")
        evening_data = self.get_attendance_data(academic_year_id, "evening")
        evening_attendance = evening_data.get("student_attendance", [])
        print(f"   Found {len(evening_attendance)} evening records")
        
        # Get combined data (what happens when session_type is not specified)
        print("\n📡 Fetching COMBINED attendance data...")
        combined_data = self.get_attendance_data(academic_year_id, None)
        combined_attendance = combined_data.get("student_attendance", [])
        print(f"   Found {len(combined_attendance)} combined records")
        
        # Analysis
        print("\n" + "="*80)
        print("📊 DETAILED ANALYSIS")
        print("="*80)
        
        # Print morning data
        if morning_attendance:
            print("\n🌅 MORNING SESSION DATA:")
            morning_table = [[
                r["date"],
                r["total"],
                r["present"],
                r["absent"],
                f"{r['attendance_rate']}%"
            ] for r in morning_attendance]
            print(tabulate(morning_table, 
                          headers=["Date", "Total", "Present", "Absent", "Rate"],
                          tablefmt="grid"))
        else:
            print("\n🌅 MORNING SESSION: No data found")
        
        # Print evening data
        if evening_attendance:
            print("\n🌙 EVENING SESSION DATA:")
            evening_table = [[
                r["date"],
                r["total"],
                r["present"],
                r["absent"],
                f"{r['attendance_rate']}%"
            ] for r in evening_attendance]
            print(tabulate(evening_table,
                          headers=["Date", "Total", "Present", "Absent", "Rate"],
                          tablefmt="grid"))
        else:
            print("\n🌙 EVENING SESSION: No data found")
        
        # Print combined data
        if combined_attendance:
            print("\n🔄 COMBINED DATA (no session filter):")
            combined_table = [[
                r["date"],
                r["total"],
                r["present"],
                r["absent"],
                f"{r['attendance_rate']}%"
            ] for r in combined_attendance]
            print(tabulate(combined_table,
                          headers=["Date", "Total", "Present", "Absent", "Rate"],
                          tablefmt="grid"))
        
        # Comparison and Issues
        print("\n" + "="*80)
        print("🔍 COMPARISON & ISSUES")
        print("="*80)
        
        issues = []
        
        # Create date sets
        morning_dates = {r["date"] for r in morning_attendance}
        evening_dates = {r["date"] for r in evening_attendance}
        combined_dates = {r["date"] for r in combined_attendance}
        all_dates = morning_dates | evening_dates | combined_dates
        
        # Comparison table
        comparison_data = []
        for date in sorted(all_dates):
            morning_record = next((r for r in morning_attendance if r["date"] == date), None)
            evening_record = next((r for r in evening_attendance if r["date"] == date), None)
            combined_record = next((r for r in combined_attendance if r["date"] == date), None)
            
            morning_rate = morning_record["attendance_rate"] if morning_record else "N/A"
            evening_rate = evening_record["attendance_rate"] if evening_record else "N/A"
            combined_rate = combined_record["attendance_rate"] if combined_record else "N/A"
            
            comparison_data.append([
                date,
                f"{morning_rate}%" if morning_rate != "N/A" else morning_rate,
                f"{evening_rate}%" if evening_rate != "N/A" else evening_rate,
                f"{combined_rate}%" if combined_rate != "N/A" else combined_rate
            ])
            
            # Check for issues
            if morning_record and evening_record and combined_record:
                # Both sessions have data, but combined might be wrong
                expected_combined_total = morning_record["total"] + evening_record["total"]
                expected_combined_present = morning_record["present"] + evening_record["present"]
                expected_combined_rate = round((expected_combined_present / expected_combined_total * 100), 2) if expected_combined_total > 0 else 0
                
                if abs(combined_record["attendance_rate"] - expected_combined_rate) > 0.01:
                    issues.append(f"⚠️ Date {date}: Combined rate mismatch! Expected {expected_combined_rate}%, Got {combined_record['attendance_rate']}%")
                    issues.append(f"   Morning: {morning_record['present']}/{morning_record['total']} = {morning_rate}%")
                    issues.append(f"   Evening: {evening_record['present']}/{evening_record['total']} = {evening_rate}%")
        
        print("\n📋 Comparison Table:")
        print(tabulate(comparison_data,
                      headers=["Date", "Morning Rate", "Evening Rate", "Combined Rate"],
                      tablefmt="grid"))
        
        # Print issues
        if issues:
            print("\n⚠️  ISSUES FOUND:")
            for issue in issues:
                print(issue)
        else:
            print("\n✅ No issues found! Data looks good.")
        
        # Frontend simulation
        print("\n" + "="*80)
        print("🖥️  FRONTEND SIMULATION (What frontend should receive)")
        print("="*80)
        
        # Merge data like frontend does
        date_map = {}
        for record in morning_attendance:
            date_map[record["date"]] = {
                "date": record["date"],
                "morning_rate": record["attendance_rate"],
                "morning_total": record["total"],
                "morning_present": record["present"],
                "morning_absent": record["absent"]
            }
        
        for record in evening_attendance:
            if record["date"] in date_map:
                date_map[record["date"]]["evening_rate"] = record["attendance_rate"]
                date_map[record["date"]]["evening_total"] = record["total"]
                date_map[record["date"]]["evening_present"] = record["present"]
                date_map[record["date"]]["evening_absent"] = record["absent"]
            else:
                date_map[record["date"]] = {
                    "date": record["date"],
                    "evening_rate": record["attendance_rate"],
                    "evening_total": record["total"],
                    "evening_present": record["present"],
                    "evening_absent": record["absent"]
                }
        
        frontend_data = sorted(date_map.values(), key=lambda x: x["date"])
        
        if frontend_data:
            frontend_table = []
            for record in frontend_data:
                morning_rate = f"{record.get('morning_rate', 'N/A')}%" if record.get('morning_rate') is not None else "N/A"
                evening_rate = f"{record.get('evening_rate', 'N/A')}%" if record.get('evening_rate') is not None else "N/A"
                frontend_table.append([
                    record["date"],
                    morning_rate,
                    evening_rate
                ])
            
            print("\nFrontend Merged Data (for 'both' view):")
            print(tabulate(frontend_table,
                          headers=["Date", "Morning Rate", "Evening Rate"],
                          tablefmt="grid"))
            
            print("\n📝 Frontend Data Structure:")
            for record in frontend_data:
                print(f"\n{record['date']}:")
                print(f"  {json.dumps(record, indent=2)}")
        
        return {
            "morning": morning_attendance,
            "evening": evening_attendance,
            "combined": combined_attendance,
            "frontend": frontend_data,
            "issues": issues
        }

def main():
    """Main test function"""
    tester = AttendanceDataTester()
    
    # Login
    if not tester.login():
        print("Cannot proceed without authentication")
        return
    
    # Get academic years
    print("\n📚 Getting academic years...")
    academic_years = tester.get_academic_years()
    
    if not academic_years:
        print("No academic years found")
        return
    
    print(f"Found {len(academic_years)} academic year(s):")
    for year in academic_years:
        print(f"  - ID: {year['id']}, Name: {year['year_name']}, Active: {year.get('is_active', False)}")
    
    # Test with the first (or active) academic year
    active_year = next((y for y in academic_years if y.get('is_active')), academic_years[0])
    
    print(f"\n🎯 Testing with Academic Year: {active_year['year_name']} (ID: {active_year['id']})")
    
    # Run the test
    results = tester.test_attendance_accuracy(active_year['id'])
    
    # Summary
    print("\n" + "="*80)
    print("📊 SUMMARY")
    print("="*80)
    print(f"Morning records: {len(results['morning'])}")
    print(f"Evening records: {len(results['evening'])}")
    print(f"Combined records: {len(results['combined'])}")
    print(f"Frontend merged records: {len(results['frontend'])}")
    print(f"Issues found: {len(results['issues'])}")
    
    if results['issues']:
        print("\n❌ TESTING FAILED - Issues detected")
        return False
    else:
        print("\n✅ TESTING PASSED - All data is correct!")
        return True

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
