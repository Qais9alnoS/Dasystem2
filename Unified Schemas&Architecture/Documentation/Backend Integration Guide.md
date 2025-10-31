# School Management System - Backend Integration Guide

## Overview

This document provides a comprehensive guide for frontend developers to integrate with the School Management System backend API. The system is built with FastAPI and uses SQLite as the database. It provides RESTful endpoints for managing all aspects of a school including students, teachers, academic years, classes, subjects, schedules, finance, and activities.

## System Architecture

### Technologies Used
- **Framework**: FastAPI (Python)
- **Database**: SQLite
- **Authentication**: JWT Tokens
- **Security**: Password hashing with bcrypt, rate limiting
- **File Storage**: Local file system for uploads/backups

### Core Modules
1. Authentication & User Management
2. Academic Management (Years, Classes, Subjects)
3. Student Management
4. Teacher Management
5. Schedule Management
6. Finance Management
7. Activities Management
8. Search System
9. System Administration & Monitoring

## Authentication System

### Login Process
To access any protected endpoint, you must first authenticate:

**Endpoint**: `POST /api/auth/login`
**Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Using the Token
Include the token in the Authorization header for all subsequent requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Roles
- **director**: Full access to all system features
- **finance**: Access to financial modules
- **morning_school**: Access to morning session data
- **evening_school**: Access to evening session data

## API Endpoints Overview

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/reset-password` - Reset user password (Director only)
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Academic Management
- `GET /api/academic/years` - Get all academic years
- `POST /api/academic/years` - Create academic year (Director only)
- `PUT /api/academic/years/{year_id}` - Update academic year (Director only)
- `DELETE /api/academic/years/{year_id}` - Delete academic year (Director only)
- `GET /api/academic/classes` - Get all classes
- `POST /api/academic/classes` - Create class
- `GET /api/academic/subjects` - Get all subjects
- `POST /api/academic/subjects` - Create subject

### Student Management
- `GET /api/students/` - Get students with filters
- `POST /api/students/` - Create new student
- `GET /api/students/{student_id}` - Get student by ID
- `PUT /api/students/{student_id}` - Update student
- `DELETE /api/students/{student_id}` - Deactivate student
- `GET /api/students/{student_id}/finances` - Get student finances
- `POST /api/students/{student_id}/finances` - Create student finance record
- `GET /api/students/{student_id}/payments` - Get student payments
- `POST /api/students/{student_id}/payments` - Record student payment
- `GET /api/students/{student_id}/academics` - Get student academic records
- `POST /api/students/{student_id}/academics` - Create student academic record
- `PUT /api/students/{student_id}/academics/{academic_id}` - Update student academic record
- `GET /api/students/search/` - Search students by name

### Teacher Management
- `GET /api/teachers/` - Get all teachers
- `POST /api/teachers/` - Create teacher (Director only)
- `GET /api/teachers/{teacher_id}` - Get teacher by ID
- `PUT /api/teachers/{teacher_id}` - Update teacher (Director only)
- `DELETE /api/teachers/{teacher_id}` - Delete teacher (Director only)
- `GET /api/teachers/{teacher_id}/assignments` - Get teacher assignments
- `POST /api/teachers/{teacher_id}/assignments` - Assign subject to teacher
- `DELETE /api/teachers/assignments/{assignment_id}` - Remove teacher assignment
- `GET /api/teachers/{teacher_id}/attendance` - Get teacher attendance
- `POST /api/teachers/{teacher_id}/attendance` - Record teacher attendance
- `PUT /api/teachers/attendance/{attendance_id}` - Update teacher attendance
- `GET /api/teachers/{teacher_id}/finance` - Get teacher finance records
- `POST /api/teachers/{teacher_id}/finance` - Create teacher finance record
- `PUT /api/teachers/finance/{finance_id}` - Update teacher finance record
- `GET /api/teachers/{teacher_id}/schedule` - Get teacher schedule
- `GET /api/teachers/search/` - Search teachers

### Schedule Management
- `GET /api/schedules/` - Get schedules
- `POST /api/schedules/` - Create schedule entry (Director only)
- `GET /api/schedules/{schedule_id}` - Get schedule entry
- `PUT /api/schedules/{schedule_id}` - Update schedule entry (Director only)
- `DELETE /api/schedules/{schedule_id}` - Delete schedule entry (Director only)
- `GET /api/schedules/constraints/` - Get schedule constraints
- `POST /api/schedules/constraints/` - Create schedule constraint (Director only)
- `GET /api/schedules/constraints/{constraint_id}` - Get schedule constraint
- `PUT /api/schedules/constraints/{constraint_id}` - Update schedule constraint (Director only)
- `DELETE /api/schedules/constraints/{constraint_id}` - Delete schedule constraint (Director only)
- `GET /api/schedules/constraint-templates/` - Get constraint templates
- `POST /api/schedules/constraint-templates/` - Create constraint template (Director only)
- `GET /api/schedules/constraint-templates/{template_id}` - Get constraint template
- `PUT /api/schedules/constraint-templates/{template_id}` - Update constraint template (Director only)
- `DELETE /api/schedules/constraint-templates/{template_id}` - Delete constraint template (Director only)
- `GET /api/schedules/weekly-view` - Get weekly schedule view
- `GET /api/schedules/analysis/conflicts` - Analyze schedule conflicts

### Finance Management
- `GET /api/finance/transactions` - Get finance transactions
- `POST /api/finance/transactions` - Create finance transaction
- `GET /api/finance/transactions/{transaction_id}` - Get finance transaction
- `PUT /api/finance/transactions/{transaction_id}` - Update finance transaction
- `DELETE /api/finance/transactions/{transaction_id}` - Delete finance transaction
- `GET /api/finance/budgets` - Get budgets
- `POST /api/finance/budgets` - Create budget (Director only)
- `PUT /api/finance/budgets/{budget_id}` - Update budget (Director only)
- `GET /api/finance/reports/summary` - Get financial summary
- `GET /api/finance/reports/monthly/{year}/{month}` - Get monthly financial report
- `GET /api/finance/expense-categories` - Get expense categories
- `POST /api/finance/expense-categories` - Create expense category (Director only)
- `GET /api/finance/income-categories` - Get income categories
- `POST /api/finance/income-categories` - Create income category (Director only)
- `GET /api/finance/payment-methods` - Get payment methods
- `POST /api/finance/payment-methods` - Create payment method (Director only)

### Activities Management
- `GET /api/activities/` - Get all activities
- `POST /api/activities/` - Create activity (Director only)
- `GET /api/activities/{activity_id}` - Get activity by ID
- `PUT /api/activities/{activity_id}` - Update activity (Director only)
- `DELETE /api/activities/{activity_id}` - Delete activity (Director only)
- `GET /api/activities/{activity_id}/registrations` - Get activity registrations
- `POST /api/activities/{activity_id}/registrations` - Register student for activity
- `PUT /api/activities/registrations/{registration_id}` - Update activity registration
- `GET /api/activities/{activity_id}/schedule` - Get activity schedule
- `POST /api/activities/{activity_id}/schedule` - Create activity schedule (Director only)
- `PUT /api/activities/schedule/{schedule_id}` - Update activity schedule (Director only)
- `DELETE /api/activities/schedule/{schedule_id}` - Delete activity schedule (Director only)
- `GET /api/activities/registrations/{registration_id}/attendance` - Get activity attendance
- `POST /api/activities/registrations/{registration_id}/attendance` - Record activity attendance
- `PUT /api/activities/attendance/{attendance_id}` - Update activity attendance
- `GET /api/activities/reports/participation` - Get activity participation report
- `GET /api/activities/search/` - Search activities

### Search System
- `GET /api/search/universal` - Universal search across all modules
- `GET /api/search/quick` - Quick search for autocomplete
- `GET /api/search/students` - Search students
- `GET /api/search/teachers` - Search teachers
- `GET /api/search/classes` - Search classes
- `GET /api/search/subjects` - Search subjects
- `GET /api/search/activities` - Search activities
- `GET /api/search/finance` - Search finance (Director only)

### System Administration
- `POST /api/system/backup/database` - Create database backup (Director only)
- `POST /api/system/backup/files` - Create files backup (Director only)
- `POST /api/system/backup/full` - Create full system backup (Director only)
- `GET /api/system/backup/list` - List backups (Director only)
- `POST /api/system/backup/restore/{backup_name}` - Restore backup (Director only)
- `DELETE /api/system/backup/cleanup` - Clean up old backups (Director only)
- `GET /api/system/backup/stats` - Get backup statistics (Director only)
- `POST /api/system/notification/send` - Send notification (Director only)
- `GET /api/system/notification/test` - Test Telegram connection (Director only)
- `POST /api/system/notification/daily-summary` - Send daily summary (Director only)
- `GET /api/system/status` - Get system status
- `GET /api/system/health` - System health check

### Monitoring
- `GET /api/monitoring/health` - System health metrics
- `GET /api/monitoring/metrics` - Performance metrics (Director only)
- `GET /api/monitoring/logs` - System logs (Director only)
- `POST /api/monitoring/logs/cleanup` - Clean up old logs (Director only)
- `GET /api/monitoring/analytics/dashboard` - Analytics dashboard
- `GET /api/monitoring/analytics/financial` - Financial analytics
- `GET /api/monitoring/analytics/academic` - Academic analytics
- `GET /api/monitoring/analytics/usage` - System usage statistics (Director only)
- `POST /api/monitoring/events/log` - Log custom event

## Data Models

### User Model
```json
{
  "id": 1,
  "username": "admin",
  "role": "director",
  "is_active": true,
  "last_login": "2023-01-01T10:00:00"
}
```

### Academic Year Model
```json
{
  "id": 1,
  "year_name": "2023-2024",
  "description": "Academic year 2023-2024",
  "is_active": true,
  "created_at": "2023-01-01T10:00:00",
  "updated_at": "2023-01-01T10:00:00"
}
```

### Class Model
```json
{
  "id": 1,
  "academic_year_id": 1,
  "session_type": "morning",
  "grade_level": "primary",
  "grade_number": 1,
  "section_count": 3,
  "max_students_per_section": 30,
  "created_at": "2023-01-01T10:00:00"
}
```

### Student Model
```json
{
  "id": 1,
  "academic_year_id": 1,
  "full_name": "Ahmad Ali",
  "has_special_needs": false,
  "father_name": "Ali Hassan",
  "grandfather_name": "Hassan Mohammed",
  "mother_name": "Fatima Khalid",
  "birth_date": "2010-05-15",
  "gender": "male",
  "transportation_type": "walking",
  "grade_level": "primary",
  "grade_number": 1,
  "session_type": "morning",
  "is_active": true,
  "created_at": "2023-01-01T10:00:00",
  "updated_at": "2023-01-01T10:00:00"
}
```

### Teacher Model
```json
{
  "id": 1,
  "academic_year_id": 1,
  "full_name": "Dr. Sarah Johnson",
  "gender": "female",
  "phone": "123456789",
  "nationality": "American",
  "qualifications": "PhD in Mathematics",
  "is_active": true,
  "created_at": "2023-01-01T10:00:00",
  "updated_at": "2023-01-01T10:00:00"
}
```

### Subject Model
```json
{
  "id": 1,
  "class_id": 1,
  "subject_name": "Mathematics",
  "weekly_hours": 5,
  "created_at": "2023-01-01T10:00:00"
}
```

### Schedule Model
```json
{
  "id": 1,
  "academic_year_id": 1,
  "session_type": "morning",
  "class_id": 1,
  "section": "A",
  "day_of_week": 1,
  "period_number": 1,
  "subject_id": 1,
  "teacher_id": 1,
  "created_at": "2023-01-01T10:00:00",
  "updated_at": "2023-01-01T10:00:00"
}
```

## Integration Plan

### Phase 1: Authentication & User Management
1. Implement login screen with username/password fields
2. Store JWT token in localStorage/sessionStorage
3. Create authentication interceptor for API requests
4. Implement logout functionality
5. Create user profile page

### Phase 2: Academic Management
1. Create academic year management interface
2. Implement class management (CRUD operations)
3. Develop subject management features
4. Add academic year selection functionality

### Phase 3: Student Management
1. Build student registration form with all required fields
2. Implement student search and filtering
3. Create student profile view/edit interface
4. Develop student financial management screens
5. Implement student academic records management
6. Add student attendance tracking

### Phase 4: Teacher Management
1. Create teacher registration form
2. Implement teacher search and filtering
3. Develop teacher profile management
4. Create teacher assignment interface
5. Implement teacher attendance tracking
6. Add teacher financial management

### Phase 5: Schedule Management
1. Build schedule creation interface
2. Implement weekly schedule view
3. Add schedule conflict detection
4. Create schedule constraint management
5. Develop teacher availability tracking

### Phase 6: Finance Management
1. Implement transaction recording interface
2. Create financial reporting dashboard
3. Add budget management features
4. Implement category management
5. Develop payment tracking system

### Phase 7: Activities Management
1. Build activity creation interface
2. Implement activity registration system
3. Create activity scheduling features
4. Add attendance tracking for activities
5. Develop activity reporting

### Phase 8: Search & Analytics
1. Implement universal search functionality
2. Create analytics dashboard
3. Add reporting features
4. Implement system monitoring views

### Phase 9: System Administration
1. Create backup management interface
2. Implement system notification system
3. Add user management features
4. Create system configuration screens

## Best Practices for Frontend Integration

### Error Handling
- Always handle HTTP error responses (400, 401, 403, 404, 500)
- Implement retry logic for network failures
- Display user-friendly error messages

### Security
- Never store passwords in localStorage
- Always use HTTPS in production
- Implement proper input validation
- Sanitize all user inputs

### Performance
- Implement pagination for large data sets
- Use caching for frequently accessed data
- Optimize API calls with proper filtering
- Implement loading states for better UX

### User Experience
- Provide real-time feedback for user actions
- Implement proper form validation
- Use consistent UI patterns
- Provide clear navigation

## Common API Usage Examples

### Creating a Student
```javascript
const studentData = {
  academic_year_id: 1,
  full_name: "Ahmad Ali",
  father_name: "Ali Hassan",
  // ... other required fields
};

fetch('/api/students/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(studentData)
})
.then(response => response.json())
.then(data => console.log(data));
```

### Searching Students
```javascript
fetch(`/api/students/search/?q=Ahmad&academic_year_id=1`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### Getting Student Details
```javascript
fetch(`/api/students/1`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Check if token is valid and not expired
2. **403 Forbidden**: Verify user has required permissions
3. **422 Validation Error**: Check request data against schema requirements
4. **500 Server Error**: Contact backend team with error details

### Debugging Tips
1. Use browser developer tools to inspect network requests
2. Check API documentation for required fields
3. Verify data types match schema requirements
4. Test endpoints with tools like Postman before implementing

## Support

For any integration issues or questions:
- Contact the backend development team
- Check the API documentation
- Review the source code in `/backend/app/`
- Refer to the test files in `/backend/tests/`

This guide should provide everything needed to successfully integrate a frontend application with the School Management System backend.