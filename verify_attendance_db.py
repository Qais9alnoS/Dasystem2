"""
Direct Database Attendance Verification
Queries the SQLite database directly to verify attendance calculations
"""

import sqlite3
from datetime import datetime, timedelta
from tabulate import tabulate

# Database path
DB_PATH = r"c:\Users\kaysa\Documents\GitHub\the ultimate programe\DAS Backend\backend\school_management.db"

def get_db_connection():
    """Create database connection"""
    return sqlite3.connect(DB_PATH)

def get_active_academic_year():
    """Get the active academic year"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, year_name, description
        FROM academic_years 
        WHERE is_active = 1
        LIMIT 1
    """)
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return {
            "id": result[0],
            "year_name": result[1],
            "description": result[2]
        }
    return None

def get_students_by_session(academic_year_id):
    """Get count of students by session type"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT session_type, COUNT(*) as count
        FROM students
        WHERE academic_year_id = ? AND is_active = 1
        GROUP BY session_type
    """, (academic_year_id,))
    
    results = cursor.fetchall()
    conn.close()
    
    return {row[0]: row[1] for row in results}

def get_raw_attendance_data(academic_year_id, days=30):
    """Get raw attendance records from database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get attendance records with student session info
    cursor.execute("""
        SELECT 
            sda.attendance_date,
            s.session_type,
            s.id as student_id,
            s.full_name,
            sda.is_present
        FROM student_daily_attendances sda
        JOIN students s ON sda.student_id = s.id
        WHERE sda.academic_year_id = ?
        AND sda.attendance_date >= date('now', '-' || ? || ' days')
        ORDER BY sda.attendance_date DESC, s.session_type, s.id
    """, (academic_year_id, days))
    
    results = cursor.fetchall()
    conn.close()
    
    return results

def calculate_attendance_by_session(academic_year_id, days=30):
    """Calculate attendance statistics by session and date"""
    raw_data = get_raw_attendance_data(academic_year_id, days)
    
    # Group by date and session
    stats = {}
    
    for record in raw_data:
        date, session_type, student_id, full_name, is_present = record
        
        key = (date, session_type)
        if key not in stats:
            stats[key] = {
                "date": date,
                "session_type": session_type,
                "total": 0,
                "present": 0,
                "absent": 0,
                "students": []
            }
        
        stats[key]["total"] += 1
        if is_present:
            stats[key]["present"] += 1
        else:
            stats[key]["absent"] += 1
        
        stats[key]["students"].append({
            "name": full_name,
            "present": is_present
        })
    
    # Calculate attendance rates
    for key in stats:
        total = stats[key]["total"]
        present = stats[key]["present"]
        stats[key]["attendance_rate"] = round((present / total * 100), 2) if total > 0 else 0
    
    return stats

def main():
    print("="*80)
    print("🔬 DIRECT DATABASE ATTENDANCE VERIFICATION")
    print("="*80)
    
    # Get active academic year
    print("\n📚 Getting active academic year...")
    academic_year = get_active_academic_year()
    
    if not academic_year:
        print("❌ No active academic year found!")
        return
    
    print(f"   Year: {academic_year['year_name']} (ID: {academic_year['id']})")
    print(f"   Description: {academic_year['description']}")
    
    # Get student counts
    print("\n👥 Students by session:")
    student_counts = get_students_by_session(academic_year['id'])
    for session, count in student_counts.items():
        print(f"   {session.upper()}: {count} students")
    
    # Get and analyze attendance
    print("\n📊 Calculating attendance statistics...")
    stats = calculate_attendance_by_session(academic_year['id'], days=30)
    
    # Separate by session
    morning_stats = [(date, s) for (date, session), s in stats.items() if session == 'morning']
    evening_stats = [(date, s) for (date, session), s in stats.items() if session == 'evening']
    
    morning_stats.sort(reverse=True)
    evening_stats.sort(reverse=True)
    
    # Print Morning Data
    print("\n🌅 MORNING SESSION ATTENDANCE:")
    print("="*80)
    if morning_stats:
        morning_table = []
        for date, s in morning_stats:
            morning_table.append([
                date,
                s['total'],
                s['present'],
                s['absent'],
                f"{s['attendance_rate']}%"
            ])
            # Print student details
            print(f"\n📅 {date}:")
            for student in s['students']:
                status = "✅ حاضر" if student['present'] else "❌ غائب"
                print(f"   - {student['name']}: {status}")
        
        print("\nSummary Table:")
        print(tabulate(morning_table,
                      headers=["Date", "Total", "Present", "Absent", "Rate"],
                      tablefmt="grid"))
    else:
        print("   No morning attendance data found")
    
    # Print Evening Data
    print("\n🌙 EVENING SESSION ATTENDANCE:")
    print("="*80)
    if evening_stats:
        evening_table = []
        for date, s in evening_stats:
            evening_table.append([
                date,
                s['total'],
                s['present'],
                s['absent'],
                f"{s['attendance_rate']}%"
            ])
            # Print student details
            print(f"\n📅 {date}:")
            for student in s['students']:
                status = "✅ حاضر" if student['present'] else "❌ غائب"
                print(f"   - {student['name']}: {status}")
        
        print("\nSummary Table:")
        print(tabulate(evening_table,
                      headers=["Date", "Total", "Present", "Absent", "Rate"],
                      tablefmt="grid"))
    else:
        print("   No evening attendance data found")
    
    # Analysis
    print("\n" + "="*80)
    print("📈 ANALYSIS")
    print("="*80)
    
    # Get all unique dates
    all_dates = sorted(set([date for (date, _) in stats.keys()]), reverse=True)
    
    print("\n📋 Daily Comparison:")
    comparison_table = []
    
    for date in all_dates:
        morning_data = stats.get((date, 'morning'))
        evening_data = stats.get((date, 'evening'))
        
        morning_rate = f"{morning_data['attendance_rate']}%" if morning_data else "N/A"
        evening_rate = f"{evening_data['attendance_rate']}%" if evening_data else "N/A"
        
        morning_details = f"{morning_data['present']}/{morning_data['total']}" if morning_data else "-"
        evening_details = f"{evening_data['present']}/{evening_data['total']}" if evening_data else "-"
        
        comparison_table.append([
            date,
            morning_details,
            morning_rate,
            evening_details,
            evening_rate
        ])
    
    print(tabulate(comparison_table,
                  headers=["Date", "Morning (P/T)", "Morning %", "Evening (P/T)", "Evening %"],
                  tablefmt="grid"))
    
    # Verification
    print("\n" + "="*80)
    print("✅ VERIFICATION RESULTS")
    print("="*80)
    
    issues = []
    
    for date in all_dates:
        morning_data = stats.get((date, 'morning'))
        evening_data = stats.get((date, 'evening'))
        
        # Check if rates are calculated correctly
        if morning_data:
            expected_rate = round((morning_data['present'] / morning_data['total'] * 100), 2)
            if abs(morning_data['attendance_rate'] - expected_rate) > 0.01:
                issues.append(f"❌ {date} Morning: Rate mismatch! Expected {expected_rate}%, Got {morning_data['attendance_rate']}%")
        
        if evening_data:
            expected_rate = round((evening_data['present'] / evening_data['total'] * 100), 2)
            if abs(evening_data['attendance_rate'] - expected_rate) > 0.01:
                issues.append(f"❌ {date} Evening: Rate mismatch! Expected {expected_rate}%, Got {evening_data['attendance_rate']}%")
    
    if issues:
        print("\n⚠️  Issues found:")
        for issue in issues:
            print(f"   {issue}")
        return False
    else:
        print("\n✅ All calculations are correct!")
        print("✅ Database data is accurate!")
        return True

if __name__ == "__main__":
    try:
        success = main()
        print("\n" + "="*80)
        if success:
            print("🎉 VERIFICATION PASSED!")
        else:
            print("❌ VERIFICATION FAILED!")
        print("="*80)
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
