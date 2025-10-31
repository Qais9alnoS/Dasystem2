# Enhanced Frontend Integration Guide for School Management System

## Table of Contents
1. [Introduction](#introduction)
2. [System Architecture Overview](#system-architecture-overview)
3. [API Base URL and Headers](#api-base-url-and-headers)
4. [Authentication Flow](#authentication-flow)
5. [User Management](#user-management)
6. [Student Management](#student-management)
7. [Teacher Management](#teacher-management)
8. [Academic Management](#academic-management)
9. [Financial Management](#financial-management)
10. [Activity Management](#activity-management)
11. [Schedule Management](#schedule-management)
12. [System Administration](#system-administration)
13. [Search Functionality](#search-functionality)
14. [Monitoring and Analytics](#monitoring-and-analytics)
15. [Error Handling](#error-handling)
16. [Rate Limiting](#rate-limiting)
17. [Data Validation](#data-validation)
18. [Security Best Practices](#security-best-practices)
19. [Performance Optimization](#performance-optimization)
20. [Sample Implementation](#sample-implementation)
21. [Testing Strategy](#testing-strategy)
22. [Deployment Considerations](#deployment-considerations)

## Introduction

This comprehensive guide provides detailed instructions for frontend developers to integrate their applications with the School Management System backend API. The API is built using FastAPI and follows REST principles with JSON request/response formats.

The system is organized into modules, each with specific endpoints:
- Authentication and User Management
- Student Management
- Teacher Management
- Academic Management
- Financial Management
- Activity Management
- Schedule Management
- System Administration
- Monitoring and Analytics

This guide includes detailed endpoint documentation, request/response examples, error handling patterns, security considerations, and sample implementation code.

## System Architecture Overview

The School Management System follows a modular architecture with clear separation of concerns:

```
Frontend Applications
        ↓
    REST API
        ↓
   FastAPI Layer
        ↓
  Business Logic
        ↓
   Data Access
        ↓
    SQLite Database
```

Key architectural components:
- **Frontend Applications**: Web, mobile, or desktop applications that consume the API
- **REST API**: JSON-based API endpoints organized by functional modules
- **FastAPI Layer**: High-performance Python web framework handling HTTP requests
- **Business Logic**: Service layer implementing core application functionality
- **Data Access**: SQLAlchemy ORM for database operations
- **SQLite Database**: Lightweight relational database for data storage

## API Base URL and Headers

### Base URL
```
http://localhost:8000/api
```

For production deployments, this will typically be:
```
https://your-domain.com/api
```

### Required Headers
All authenticated requests must include:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Optional Headers
```
Accept: application/json
X-Requested-With: XMLHttpRequest
```

### Common Response Format
All API responses follow a consistent structure:
```json
{
  "data": {},
  "message": "Success message",
  "status": "success",
  "timestamp": "2023-01-01T10:00:00Z"
}
```

For list responses:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  },
  "message": "Records retrieved successfully",
  "status": "success"
}
```

## Authentication Flow

### 1. User Login
**Endpoint:** `POST /auth/login`
**Description:** Authenticates a user and returns a JWT access token

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: System error

**Implementation Steps:**
1. Validate user input (username and password)
2. Send login credentials to `/auth/login`
3. Handle success and error responses appropriately
4. Store the returned access token securely
5. Include the token in the Authorization header for all subsequent requests

### 2. Token Refresh
**Endpoint:** `POST /auth/refresh`
**Description:** Refreshes an existing JWT access token

**Headers:** Include Authorization header with current token
**Response (200 OK):** New access token

**Implementation Steps:**
1. Check if current token is about to expire
2. Call refresh endpoint before token expiration
3. Update stored token with new token
4. Handle token refresh failures by redirecting to login

### 3. Get Current User Info
**Endpoint:** `GET /auth/me`
**Description:** Retrieves information about the currently authenticated user

**Headers:** Include Authorization header
**Response (200 OK):**
```json
{
  "id": 1,
  "username": "admin",
  "role": "director",
  "is_active": true,
  "last_login": "2023-01-01T10:00:00",
  "created_at": "2023-01-01T10:00:00",
  "updated_at": "2023-01-01T10:00:00"
}
```

### 4. Change Password
**Endpoint:** `POST /auth/change-password`
**Description:** Allows a user to change their password

**Request Body:**
```json
{
  "current_password": "old_password",
  "new_password": "new_password"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Validation Requirements for New Password:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 5. Reset Password (Director Only)
**Endpoint:** `POST /auth/reset-password`
**Description:** Allows directors to reset any user's password to a default value

**Request Body:**
```json
{
  "username": "teacher1",
  "role": "morning_school"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully. Notification sent via Telegram."
}
```

### 6. Logout
**Endpoint:** `POST /auth/logout`
**Description:** Invalidates the current user session

**Headers:** Include Authorization header
**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

## User Management

### User Roles and Permissions
The system supports these roles with specific permissions:

#### Director (Full Access)
- All system functionality
- User management
- System configuration
- Financial oversight
- Academic planning

#### Finance Staff
- Financial transactions
- Budget management
- Financial reporting
- Student payment processing

#### Morning School Staff
- Morning session student management
- Morning session teacher management
- Morning session academic records
- Morning session activities

#### Evening School Staff
- Evening session student management
- Evening session teacher management
- Evening session academic records
- Evening session activities

### Get User Information
**Endpoint:** `GET /auth/me`
**Description:** Retrieves information about the currently authenticated user

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "admin",
  "role": "director",
  "is_active": true,
  "last_login": "2023-01-01T10:00:00",
  "created_at": "2023-01-01T10:00:00",
  "updated_at": "2023-01-01T10:00:00"
}
```

### Reset User Password (Director Only)
**Endpoint:** `POST /auth/reset-password`
**Description:** Allows directors to reset any user's password to a default value

**Request Body:**
```json
{
  "username": "teacher1",
  "role": "morning_school"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully. Notification sent via Telegram."
}
```

## Student Management

### 1. List Students
**Endpoint:** `GET /students/`
**Description:** Retrieves a list of students with optional filtering

**Query Parameters:**
- `academic_year_id` (optional): Filter by academic year ID
- `session_type` (optional): Filter by session type (morning/evening)
- `grade_level` (optional): Filter by grade level (primary, intermediate, secondary)
- `grade_number` (optional): Filter by grade number (1-12)
- `class_id` (optional): Filter by class ID
- `section` (optional): Filter by section
- `has_special_needs` (optional): Filter by special needs status
- `transportation_type` (optional): Filter by transportation type
- `is_active` (optional): Filter by active status (default: true)
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional): Number of records (default: 100, max: 1000)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "academic_year_id": 1,
    "class_id": 5,
    "full_name": "Ahmad Ali",
    "has_special_needs": false,
    "father_name": "Ali Hassan",
    "grandfather_name": "Hassan Mahmoud",
    "mother_name": "Fatima Mahmoud",
    "birth_date": "2010-05-15",
    "birth_place": "Amman",
    "nationality": "Jordanian",
    "father_occupation": "Engineer",
    "mother_occupation": "Teacher",
    "religion": "Muslim",
    "gender": "male",
    "transportation_type": "walking",
    "bus_number": null,
    "landline_phone": "061234567",
    "father_phone": "0791234567",
    "mother_phone": "0797654321",
    "additional_phone": null,
    "detailed_address": "123 Main Street, Amman",
    "previous_school": "Al-Noor Elementary",
    "grade_level": "primary",
    "grade_number": 5,
    "section": "A",
    "session_type": "morning",
    "ninth_grade_total": null,
    "notes": "Excellent student",
    "is_active": true,
    "created_at": "2023-01-01T10:00:00",
    "updated_at": "2023-01-01T10:00:00"
  }
]
```

### 2. Create Student
**Endpoint:** `POST /students/`
**Description:** Creates a new student record

**Request Body:**
```json
{
  "academic_year_id": 1,
  "full_name": "Ahmad Ali",
  "has_special_needs": false,
  "father_name": "Ali Hassan",
  "grandfather_name": "Hassan Mahmoud",
  "mother_name": "Fatima Mahmoud",
  "birth_date": "2010-05-15",
  "birth_place": "Amman",
  "nationality": "Jordanian",
  "father_occupation": "Engineer",
  "mother_occupation": "Teacher",
  "religion": "Muslim",
  "gender": "male",
  "transportation_type": "walking",
  "grade_level": "primary",
  "grade_number": 5,
  "section": "A",
  "session_type": "morning"
}
```

**Response (201 Created):** Complete student object

### 3. Get Student Details
**Endpoint:** `GET /students/{student_id}`
**Description:** Retrieves detailed information about a specific student

**Response (200 OK):** Complete student information

### 4. Update Student
**Endpoint:** `PUT /students/{student_id}`
**Description:** Updates an existing student record

**Request Body:** Partial student information to update

**Response (200 OK):** Updated student object

### 5. Deactivate Student
**Endpoint:** `DELETE /students/{student_id}`
**Description:** Soft deletes a student by setting is_active to false

**Response (200 OK):**
```json
{
  "message": "Student deactivated successfully"
}
```

### 6. Student Financial Information
**Get Finances:** `GET /students/{student_id}/finances`
**Description:** Retrieves financial information for a student

**Create Finance Record:** `POST /students/{student_id}/finances`
**Description:** Creates a new financial record for a student

### 7. Student Payments
**Get Payments:** `GET /students/{student_id}/payments`
**Description:** Retrieves payment history for a student

**Record Payment:** `POST /students/{student_id}/payments`
**Description:** Records a new payment for a student

### 8. Student Academic Records
**Get Academics:** `GET /students/{student_id}/academics`
**Description:** Retrieves academic records for a student

**Create Academic Record:** `POST /students/{student_id}/academics`
**Description:** Creates a new academic record for a student

**Update Academic Record:** `PUT /students/{student_id}/academics/{academic_id}`
**Description:** Updates an existing academic record

### 9. Search Students
**Endpoint:** `GET /students/search/`
**Description:** Searches students by name or other criteria

**Query Parameters:**
- `q`: Search query (minimum 3 characters)
- `academic_year_id` (optional)
- `session_type` (optional)
- `limit` (optional, default: 20, max: 100)

## Teacher Management

### 1. List Teachers
**Endpoint:** `GET /teachers/`
**Description:** Retrieves a list of teachers with optional filtering

**Query Parameters:**
- `academic_year_id` (optional): Filter by academic year
- `subject_id` (optional): Filter by subject
- `nationality` (optional): Filter by nationality
- `transportation_type` (optional): Filter by transportation type
- `is_active` (optional): Filter by active status (default: true)
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional): Number of records (default: 100, max: 1000)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "academic_year_id": 1,
    "full_name": "Dr. Sarah Johnson",
    "gender": "female",
    "birth_date": "1985-03-15",
    "phone": "+962123456789",
    "nationality": "Jordanian",
    "detailed_address": "456 Education Street, Amman",
    "transportation_type": "walking",
    "qualifications": "MSc in Mathematics",
    "experience": "5 years teaching experience",
    "free_time_slots": "[1,2,3,4,5]",
    "notes": "Excellent math teacher",
    "is_active": true,
    "created_at": "2023-01-01T10:00:00",
    "updated_at": "2023-01-01T10:00:00"
  }
]
```

### 2. Create Teacher
**Endpoint:** `POST /teachers/`
**Description:** Creates a new teacher record

**Request Body:**
```json
{
  "academic_year_id": 1,
  "full_name": "Dr. Sarah Johnson",
  "gender": "female",
  "birth_date": "1985-03-15",
  "phone": "+962123456789",
  "nationality": "Jordanian",
  "detailed_address": "456 Education Street, Amman",
  "transportation_type": "walking",
  "qualifications": "MSc in Mathematics",
  "experience": "5 years teaching experience",
  "is_active": true
}
```

**Response (201 Created):** Complete teacher object

### 3. Get Teacher Details
**Endpoint:** `GET /teachers/{teacher_id}`
**Description:** Retrieves detailed information about a specific teacher

**Response (200 OK):** Complete teacher information

### 4. Update Teacher
**Endpoint:** `PUT /teachers/{teacher_id}`
**Description:** Updates an existing teacher record

**Request Body:** Partial teacher information to update

**Response (200 OK):** Updated teacher object

### 5. Deactivate Teacher
**Endpoint:** `DELETE /teachers/{teacher_id}`
**Description:** Soft deletes a teacher by setting is_active to false

**Response (200 OK):**
```json
{
  "message": "Teacher deactivated successfully"
}
```

### 6. Teacher Subject Assignments
**Get Assignments:** `GET /teachers/{teacher_id}/assignments`
**Description:** Retrieves all subject assignments for a teacher

**Assign Subject:** `POST /teachers/{teacher_id}/assignments`
**Description:** Assigns a subject to a teacher

**Request Body:**
```json
{
  "class_id": 5,
  "subject_id": 3,
  "section": "A"
}
```

**Remove Assignment:** `DELETE /teachers/assignments/{assignment_id}`
**Description:** Removes a subject assignment from a teacher

### 7. Teacher Attendance
**Get Attendance:** `GET /teachers/{teacher_id}/attendance`
**Description:** Retrieves attendance records for a teacher

**Query Parameters:**
- `start_date` (optional): Filter by start date
- `end_date` (optional): Filter by end date

**Record Attendance:** `POST /teachers/{teacher_id}/attendance`
**Description:** Records attendance for a teacher on a specific date

**Request Body:**
```json
{
  "attendance_date": "2023-10-15",
  "classes_attended": 4,
  "extra_classes": 1,
  "notes": "Covered extra material"
}
```

**Update Attendance:** `PUT /teachers/attendance/{attendance_id}`
**Description:** Updates an existing attendance record

### 8. Teacher Finance
**Get Finance Records:** `GET /teachers/{teacher_id}/finance`
**Description:** Retrieves financial records for a teacher

**Query Parameters:**
- `academic_year_id` (optional): Filter by academic year

**Create Finance Record:** `POST /teachers/{teacher_id}/finance`
**Description:** Creates a new financial record for a teacher

**Request Body:**
```json
{
  "academic_year_id": 1,
  "base_salary": "1200.00",
  "bonuses": "200.00",
  "deductions": "50.00",
  "payment_status": "pending",
  "notes": "October salary"
}
```

**Update Finance Record:** `PUT /teachers/finance/{finance_id}`
**Description:** Updates an existing financial record

**Delete Finance Record:** `DELETE /teachers/finance/{finance_id}`
**Description:** Deletes a financial record

### 9. Teacher Schedule
**Endpoint:** `GET /teachers/{teacher_id}/schedule`
**Description:** Retrieves the schedule for a specific teacher

**Query Parameters:**
- `academic_year_id` (optional): Filter by academic year

**Response (200 OK):**
```json
{
  "teacher_id": 1,
  "teacher_name": "Dr. Sarah Johnson",
  "assignments": [
    {
      "assignment_id": 1,
      "class": "primary 5",
      "subject": "Mathematics",
      "section": "A",
      "schedule_entries": [
        {
          "day_of_week": 1,
          "period_number": 2,
          "session_type": "morning"
        }
      ]
    }
  ]
}
```

### 10. Search Teachers
**Endpoint:** `GET /teachers/search/`
**Description:** Searches teachers by name, phone, or nationality

**Query Parameters:**
- `q`: Search query (minimum 1 character)
- `academic_year_id` (optional)
- `skip` (optional, default: 0)
- `limit` (optional, default: 50, max: 200)

## Academic Management

### 1. Academic Years
**List Years:** `GET /academic/years`
**Description:** Retrieves a list of academic years

**Query Parameters:**
- `is_active` (optional): Filter by active status
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional): Number of records (default: 100, max: 1000)

**Create Year:** `POST /academic/years`
**Description:** Creates a new academic year

**Request Body:**
```json
{
  "year_name": "2023-2024",
  "description": "Academic year 2023-2024",
  "is_active": false
}
```

**Get Year:** `GET /academic/years/{year_id}`
**Description:** Retrieves details of a specific academic year

**Update Year:** `PUT /academic/years/{year_id}`
**Description:** Updates an academic year

**Activate Year:** `POST /academic/years/{year_id}/activate`
**Description:** Activates an academic year and deactivates others

**Delete Year:** `DELETE /academic/years/{year_id}`
**Description:** Deletes an academic year (only if no associated data exists)

### 2. Classes
**List Classes:** `GET /academic/classes`
**Description:** Retrieves a list of classes

**Query Parameters:**
- `academic_year_id` (optional)
- `session_type` (optional)
- `grade_level` (optional)
- `grade_number` (optional)

**Create Class:** `POST /academic/classes`
**Description:** Creates a new class

**Request Body:**
```json
{
  "academic_year_id": 1,
  "session_type": "morning",
  "grade_level": "primary",
  "grade_number": 5,
  "section_count": 3,
  "max_students_per_section": 30
}
```

**Get Class:** `GET /academic/classes/{class_id}`
**Description:** Retrieves details of a specific class

**Update Class:** `PUT /academic/classes/{class_id}`
**Description:** Updates a class

**Delete Class:** `DELETE /academic/classes/{class_id}`
**Description:** Deletes a class (only if no students are assigned)

### 3. Subjects
**List Subjects:** `GET /academic/subjects`
**Description:** Retrieves a list of subjects

**Query Parameters:**
- `class_id` (optional)

**Create Subject:** `POST /academic/subjects`
**Description:** Creates a new subject

**Request Body:**
```json
{
  "class_id": 5,
  "subject_name": "Mathematics",
  "weekly_hours": 5
}
```

**Get Subject:** `GET /academic/subjects/{subject_id}`
**Description:** Retrieves details of a specific subject

**Update Subject:** `PUT /academic/subjects/{subject_id}`
**Description:** Updates a subject

**Delete Subject:** `DELETE /academic/subjects/{subject_id}`
**Description:** Deletes a subject (only if no assignments exist)

## Financial Management

### 1. Finance Categories
**List Categories:** `GET /finance/categories`
**Description:** Retrieves a list of finance categories

**Create Category:** `POST /finance/categories`
**Description:** Creates a new finance category

**Request Body:**
```json
{
  "category_name": "Tuition Fees",
  "category_type": "income",
  "is_default": true,
  "is_active": true
}
```

**Get Category:** `GET /finance/categories/{category_id}`
**Description:** Retrieves details of a specific finance category

**Update Category:** `PUT /finance/categories/{category_id}`
**Description:** Updates a finance category

**Delete Category:** `DELETE /finance/categories/{category_id}`
**Description:** Deletes a finance category (only if no transactions exist)

### 2. Transactions
**List Transactions:** `GET /finance/transactions`
**Description:** Retrieves a list of financial transactions

**Query Parameters:**
- `academic_year_id` (optional)
- `category_id` (optional)
- `transaction_type` (optional)
- `start_date` (optional)
- `end_date` (optional)
- `skip` (optional)
- `limit` (optional)

**Create Transaction:** `POST /finance/transactions`
**Description:** Creates a new financial transaction

**Request Body:**
```json
{
  "academic_year_id": 1,
  "category_id": 3,
  "transaction_type": "income",
  "amount": "1500.00",
  "transaction_date": "2023-10-15",
  "description": "Tuition payment for October",
  "reference_id": 123,
  "reference_type": "student",
  "receipt_number": "REC-2023-001",
  "created_by": 1
}
```

**Get Transaction:** `GET /finance/transactions/{transaction_id}`
**Description:** Retrieves details of a specific transaction

**Update Transaction:** `PUT /finance/transactions/{transaction_id}`
**Description:** Updates a transaction

**Delete Transaction:** `DELETE /finance/transactions/{transaction_id}`
**Description:** Deletes a transaction

### 3. Budgets
**List Budgets:** `GET /finance/budgets`
**Description:** Retrieves a list of budgets

**Create Budget:** `POST /finance/budgets`
**Description:** Creates a new budget

**Request Body:**
```json
{
  "academic_year_id": 1,
  "category": "Salaries",
  "budgeted_amount": "15000.00",
  "period_type": "annual",
  "description": "Teacher salaries for the academic year"
}
```

**Get Budget:** `GET /finance/budgets/{budget_id}`
**Description:** Retrieves details of a specific budget

**Update Budget:** `PUT /finance/budgets/{budget_id}`
**Description:** Updates a budget

**Delete Budget:** `DELETE /finance/budgets/{budget_id}`
**Description:** Deletes a budget

### 4. Reports
**Summary Report:** `GET /finance/reports/summary`
**Description:** Retrieves a financial summary report

**Query Parameters:**
- `academic_year_id` (optional)
- `start_date` (optional)
- `end_date` (optional)

**Detailed Report:** `GET /finance/reports/detailed`
**Description:** Retrieves a detailed financial report

**Category Report:** `GET /finance/reports/category`
**Description:** Retrieves a category-based financial report

**Monthly Report:** `GET /finance/reports/monthly/{year}/{month}`
**Description:** Retrieves a monthly financial report

**Query Parameters:**
- `academic_year_id` (required)

**Annual Report:** `GET /finance/reports/annual/{year}`
**Description:** Retrieves an annual financial report

**Query Parameters:**
- `academic_year_id` (required)

## Activity Management

### 1. Activities
**List Activities:** `GET /activities/`
**Description:** Retrieves a list of activities

**Query Parameters:**
- `academic_year_id` (optional)
- `activity_type` (optional)
- `session_type` (optional)
- `target_grade` (optional)
- `instructor_name` (optional)
- `location` (optional)
- `is_active` (optional)
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional): Number of records (default: 100, max: 1000)

**Create Activity:** `POST /activities/`
**Description:** Creates a new activity

**Request Body:**
```json
{
  "academic_year_id": 1,
  "name": "Science Fair",
  "description": "Annual science fair for all students",
  "activity_type": "academic",
  "session_type": "mixed",
  "target_grades": ["primary", "intermediate", "secondary"],
  "max_participants": 100,
  "cost_per_student": "10.00",
  "start_date": "2023-11-15",
  "end_date": "2023-11-16",
  "registration_deadline": "2023-11-10",
  "location": "School Auditorium",
  "instructor_name": "Dr. Smith",
  "requirements": "Lab coat required",
  "is_active": true
}
```

**Get Activity:** `GET /activities/{activity_id}`
**Description:** Retrieves details of a specific activity

**Update Activity:** `PUT /activities/{activity_id}`
**Description:** Updates an activity

**Delete Activity:** `DELETE /activities/{activity_id}`
**Description:** Deletes an activity

**Activate Activity:** `POST /activities/{activity_id}/activate`
**Description:** Activates an activity

### 2. Participants
**List Participants:** `GET /activities/{activity_id}/participants`
**Description:** Retrieves a list of participants for an activity

**Add Participant:** `POST /activities/{activity_id}/participants`
**Description:** Adds a participant to an activity

**Request Body:**
```json
{
  "class_id": 5,
  "section": "A",
  "is_participating": true
}
```

**Remove Participant:** `DELETE /activities/{activity_id}/participants/{participant_id}`
**Description:** Removes a participant from an activity

### 3. Registrations
**List Registrations:** `GET /activities/{activity_id}/registrations`
**Description:** Retrieves a list of registrations for an activity

**Query Parameters:**
- `payment_status` (optional)

**Create Registration:** `POST /activities/{activity_id}/registrations`
**Description:** Creates a new registration for an activity

**Request Body:**
```json
{
  "student_id": 123,
  "registration_date": "2023-10-20",
  "payment_status": "pending",
  "payment_amount": "10.00",
  "notes": "Early registration"
}
```

**Get Registration:** `GET /activities/{activity_id}/registrations/{registration_id}`
**Description:** Retrieves details of a specific registration

**Update Registration:** `PUT /activities/{activity_id}/registrations/{registration_id}`
**Description:** Updates a registration

**Delete Registration:** `DELETE /activities/{activity_id}/registrations/{registration_id}`
**Description:** Deletes a registration

### 4. Schedule
**List Schedule:** `GET /activities/{activity_id}/schedule`
**Description:** Retrieves schedule entries for an activity

**Create Schedule Entry:** `POST /activities/{activity_id}/schedule`
**Description:** Creates a new schedule entry for an activity

**Update Schedule Entry:** `PUT /activities/schedule/{schedule_id}`
**Description:** Updates a schedule entry

**Delete Schedule Entry:** `DELETE /activities/schedule/{schedule_id}`
**Description:** Deletes a schedule entry

### 5. Attendance
**List Attendance:** `GET /activities/{activity_id}/attendance`
**Description:** Retrieves attendance records for an activity

**Record Attendance:** `POST /activities/{activity_id}/attendance`
**Description:** Records attendance for an activity

**Request Body:**
```json
{
  "registration_id": 456,
  "activity_id": 123,
  "attendance_date": "2023-11-15",
  "status": "present",
  "notes": "Participated actively"
}
```

**Update Attendance:** `PUT /activities/{activity_id}/attendance/{attendance_id}`
**Description:** Updates an attendance record

### 5. Reports
**Participation Report:** `GET /activities/reports/participation`
**Description:** Retrieves an activity participation report

**Query Parameters:**
- `academic_year_id` (optional)
- `activity_type` (optional)

## Schedule Management

### 1. Schedules
**List Schedules:** `GET /schedules/`
**Description:** Retrieves a list of schedules

**Query Parameters:**
- `academic_year_id` (optional)
- `session_type` (optional)
- `is_active` (optional)

**Create Schedule:** `POST /schedules/`
**Description:** Creates a new schedule

**Get Schedule:** `GET /schedules/{schedule_id}`
**Description:** Retrieves details of a specific schedule

**Update Schedule:** `PUT /schedules/{schedule_id}`
**Description:** Updates a schedule

**Delete Schedule:** `DELETE /schedules/{schedule_id}`
**Description:** Deletes a schedule

### 2. Generate Schedule
**Endpoint:** `POST /schedules/generate`
**Description:** Generates a new schedule automatically

**Request Body:**
```json
{
  "academic_year_id": 1,
  "session_type": "morning",
  "name": "First Semester Schedule",
  "start_date": "2023-09-01",
  "end_date": "2024-01-31",
  "periods_per_day": 8,
  "session_start_time": "08:00:00",
  "period_duration": 45,
  "break_periods": [4],
  "break_duration": 15,
  "working_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "auto_assign_teachers": true,
  "avoid_teacher_conflicts": true,
  "balance_teacher_load": true,
  "prefer_subject_continuity": true
}
```

**Response (200 OK):**
```json
{
  "schedule_id": 1,
  "generation_status": "completed",
  "total_periods_created": 200,
  "total_assignments_created": 150,
  "conflicts_detected": 2,
  "warnings": [],
  "generation_time": 15.5,
  "summary": {
    "classes_scheduled": 25,
    "teachers_assigned": 15,
    "subjects_covered": 10,
    "optimization_rounds": 3
  }
}
```

### 3. Constraints
**List Constraints:** `GET /schedules/constraints`
**Description:** Retrieves a list of schedule constraints

**Create Constraint:** `POST /schedules/constraints`
**Description:** Creates a new schedule constraint

**Request Body:**
```json
{
  "academic_year_id": 1,
  "constraint_type": "forbidden",
  "class_id": 5,
  "subject_id": 3,
  "teacher_id": 12,
  "day_of_week": 1,
  "period_number": 5,
  "session_type": "morning",
  "priority_level": 3,
  "description": "Math class cannot be scheduled on Monday period 5"
}
```

**Get Constraint:** `GET /schedules/constraints/{constraint_id}`
**Description:** Retrieves details of a specific constraint

**Update Constraint:** `PUT /schedules/constraints/{constraint_id}`
**Description:** Updates a constraint

**Delete Constraint:** `DELETE /schedules/constraints/{constraint_id}`
**Description:** Deletes a constraint

### 4. Templates
**List Templates:** `GET /schedules/templates`
**Description:** Retrieves a list of constraint templates

**Create Template:** `POST /schedules/templates`
**Description:** Creates a new constraint template

**Request Body:**
```json
{
  "template_name": "No Double Booking",
  "template_description": "Prevents teachers from being assigned to multiple classes at the same time",
  "constraint_config": {
    "type": "no_double_booking",
    "priority": 4
  },
  "is_system_template": false
}
```

### 5. Conflicts
**List Conflicts:** `GET /schedules/conflicts`
**Description:** Retrieves a list of schedule conflicts

**Query Parameters:**
- `schedule_id` (optional)
- `is_resolved` (optional)
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional): Number of records (default: 100, max: 1000)

**Resolve Conflict:** `POST /schedules/conflicts/{conflict_id}/resolve`
**Description:** Marks a conflict as resolved

### 6. Weekly View
**Get Weekly View:** `GET /schedules/weekly-view`
**Description:** Retrieves a weekly schedule view

**Query Parameters:**
- `academic_year_id` (required)
- `session_type` (required)
- `class_id` (optional)
- `teacher_id` (optional)

### 7. Conflict Analysis
**Analyze Conflicts:** `GET /schedules/analysis/conflicts`
**Description:** Analyzes schedule for conflicts

**Query Parameters:**
- `academic_year_id` (required)
- `session_type` (required)

## System Administration

### 1. Settings
**Get Settings:** `GET /system/settings`
**Description:** Retrieves system configuration settings

**Update Settings:** `PUT /system/settings`
**Description:** Updates system configuration settings

**Request Body:**
```json
{
  "setting_key": "max_students_per_class",
  "setting_value": "30",
  "description": "Maximum number of students allowed per class"
}
```

### 2. Backups
**List Backups:** `GET /system/backups`
**Description:** Retrieves a list of backup records

**Create Backup:** `POST /system/backups`
**Description:** Creates a new backup

**Request Body:**
```json
{
  "backup_type": "full",
  "backup_name": "Daily Backup 2023-10-15"
}
```

**Restore Backup:** `POST /system/backups/{backup_id}/restore`
**Description:** Restores a backup

**Delete Backup:** `DELETE /system/backups/{backup_id}`
**Description:** Deletes a backup file

### 3. Logs
**Get System Logs:** `GET /system/logs`
**Description:** Retrieves system log entries

**Query Parameters:**
- `level` (optional): Filter by log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `start_date` (optional)
- `end_date` (optional)
- `limit` (optional)

**Get Audit Logs:** `GET /system/audit`
**Description:** Retrieves audit log entries

**Query Parameters:**
- `user_id` (optional)
- `action` (optional)
- `table_name` (optional)
- `start_date` (optional)
- `end_date` (optional)

### 4. Notifications
**Get Notifications:** `GET /system/notifications`
**Description:** Retrieves system notifications for the current user

**Query Parameters:**
- `unread_only` (optional): Filter by unread status

**Mark as Read:** `PUT /system/notifications/{notification_id}/read`
**Description:** Marks a notification as read

### 5. Health Check
**Endpoint:** `GET /system/health`
**Description:** Checks system health status

**Response (200 OK):**
```

```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0"
}
```

### 6. Metrics
**Endpoint:** `GET /system/metrics`
**Description:** Retrieves system performance metrics

**Response (200 OK):**
```json
{
  "cpu_usage": 25.5,
  "memory_usage": 45.2,
  "disk_usage": 60.1,
  "active_users": 15,
  "total_requests": 1250,
  "error_rate": 0.5
}
```

### 7. File Management
**Upload File:** `POST /system/files/upload`
**Description:** Uploads a file to the system

**Form Data:**
- `file`: The file to upload
- `related_entity_type`: Entity type (student, teacher, activity, etc.)
- `related_entity_id`: Entity ID

**Download File:** `GET /system/files/{file_id}`
**Description:** Downloads a file

**Delete File:** `DELETE /system/files/{file_id}`
**Description:** Deletes a file

### 8. Database Management
**Create Database Backup:** `POST /system/backup/database`
**Description:** Creates a database backup

**Request Body:**
```json
{
  "backup_name": "Daily Backup 2023-10-15"
}
```

**Create Files Backup:** `POST /system/backup/files`
**Description:** Creates a files backup

**Create Full Backup:** `POST /system/backup/full`
**Description:** Creates a full system backup

**List Backups:** `GET /system/backup/list`
**Description:** Lists available backups

**Query Parameters:**
- `backup_type` (optional): Filter by backup type

**Restore Backup:** `POST /system/backup/restore/{backup_name}`
**Description:** Restores a database from backup

**Cleanup Old Backups:** `DELETE /system/backup/cleanup`
**Description:** Cleans up old backup files

**Query Parameters:**
- `keep_days` (optional): Days to keep backups (default: 30)

**Get Backup Stats:** `GET /system/backup/stats`
**Description:** Gets backup system statistics

### 9. Notification Management
**Send Notification:** `POST /system/notification/send`
**Description:** Sends a custom notification

**Request Body:**
```json
{
  "title": "System Alert",
  "message": "This is a system alert message",
  "severity": "info"
}
```

**Test Telegram Connection:** `GET /system/notification/test`
**Description:** Tests Telegram bot connection

**Send Daily Summary:** `POST /system/notification/daily-summary`
**Description:** Sends daily summary report

### 10. System Status
**Get System Status:** `GET /system/status`
**Description:** Gets system status and statistics

## Search Functionality

### Universal Search
**Endpoint:** `GET /search/universal`
**Description:** Searches across all entity types with advanced filtering and sorting

**Query Parameters:**
- `query`: Search query (required)
- `scope` (optional): Search scope (all, students, teachers, classes, subjects, activities, finance)
- `mode` (optional): Search mode (fuzzy, exact)
- `academic_year_id` (optional)
- `session_type` (optional)
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional, default: 50, max: 100)
- `sort_by` (optional): Sort by field (relevance, created_at, name)
- `sort_order` (optional): Sort order (asc, desc)

**Response (200 OK):**
```json
[
  {
    "entity_type": "student",
    "entity_id": 123,
    "title": "Ahmad Ali",
    "description": "Student in primary grade 5",
    "url": "/students/123"
  },
  {
    "entity_type": "teacher",
    "entity_id": 456,
    "title": "Dr. Sarah Johnson",
    "description": "Mathematics teacher",
    "url": "/teachers/456"
  }
]
```

### Quick Search
**Endpoint:** `GET /search/quick`
**Description:** Quick search for autocomplete suggestions

**Query Parameters:**
- `query`: Quick search query (required)
- `limit` (optional, default: 10, max: 20)

### Entity-Specific Search
**Search Students:** `GET /search/students`
**Description:** Searches specifically in students module

**Query Parameters:**
- `query`: Search query (required)
- `academic_year_id` (optional)
- `class_id` (optional)
- `skip` (optional)
- `limit` (optional)

**Search Teachers:** `GET /search/teachers`
**Description:** Searches specifically in teachers module

**Query Parameters:**
- `query`: Search query (required)
- `subject_id` (optional)
- `skip` (optional)
- `limit` (optional)

**Search Classes:** `GET /search/classes`
**Description:** Searches specifically in classes module

**Query Parameters:**
- `query`: Search query (required)
- `academic_year_id` (optional)
- `grade` (optional)
- `skip` (optional)
- `limit` (optional)

**Search Subjects:** `GET /search/subjects`
**Description:** Searches specifically in subjects module

**Query Parameters:**
- `query`: Search query (required)
- `grade` (optional)
- `skip` (optional)
- `limit` (optional)

**Search Activities:** `GET /search/activities`
**Description:** Searches specifically in activities module

**Query Parameters:**
- `query`: Search query (required)
- `activity_type` (optional)
- `academic_year_id` (optional)
- `skip` (optional)
- `limit` (optional)

**Search Finance:** `GET /search/finance`
**Description:** Searches specifically in finance module (admin only)

**Query Parameters:**
- `query`: Search query (required)
- `payment_type` (optional)
- `academic_year_id` (optional)
- `skip` (optional)
- `limit` (optional)

### Advanced Search
**Endpoint:** `POST /search/advanced`
**Description:** Performs an advanced search with filters

**Request Body:**
```json
{
  "query": "ali",
  "filters": {
    "entity_types": ["student", "teacher"],
    "academic_year_id": 1,
    "session_type": "morning",
    "grade_level": "primary"
  },
  "sort_by": "created_at",
  "sort_order": "desc",
  "limit": 50
}
```

## Monitoring and Analytics

### System Health
**Endpoint:** `GET /monitoring/health`
**Description:** Retrieves system health metrics

**Response (200 OK):**
```json
{
  "uptime": "7 days, 3:45:22",
  "version": "1.0.0",
  "database_status": "healthy",
  "api_status": "healthy",
  "last_backup": "2023-10-15T02:00:00Z"
}
```

### Performance Metrics
**Endpoint:** `GET /monitoring/metrics`
**Description:** Retrieves system performance metrics

**Query Parameters:**
- `metric_name` (optional): Specific metric to retrieve
- `start_date` (optional): Start date for metrics
- `end_date` (optional): End date for metrics

**Response (200 OK):**
```json
{
  "response_times": {
    "avg": 125,
    "min": 45,
    "max": 350,
    "p95": 220
  },
  "throughput": {
    "requests_per_minute": 120,
    "peak_requests_per_minute": 250
  },
  "resource_usage": {
    "cpu_percent": 25.5,
    "memory_percent": 45.2,
    "disk_percent": 60.1
  }
}
```

### Security Metrics
**Endpoint:** `GET /monitoring/security`
**Description:** Retrieves security-related metrics

### System Logs
**Endpoint:** `GET /monitoring/logs`
**Description:** Retrieves system logs with filtering

**Query Parameters:**
- `level` (optional): Filter by log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `module` (optional): Filter by module
- `start_date` (optional): Start date filter
- `end_date` (optional): End date filter
- `search_term` (optional): Search term in log messages
- `skip` (optional): Pagination offset
- `limit` (optional): Number of records (default: 100)

### Analytics Dashboard
**Endpoint:** `GET /monitoring/analytics/dashboard`
**Description:** Retrieves system analytics dashboard data

### Financial Analytics
**Endpoint:** `GET /monitoring/analytics/financial`
**Description:** Retrieves financial analytics

**Query Parameters:**
- `academic_year_id` (required)
- `start_date` (optional)
- `end_date` (optional)

### Academic Analytics
**Endpoint:** `GET /monitoring/analytics/academic`
**Description:** Retrieves academic performance analytics

**Query Parameters:**
- `academic_year_id` (required)

### System Usage Statistics
**Endpoint:** `GET /monitoring/analytics/usage`
**Description:** Retrieves system usage statistics

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

### Custom Event Logging
**Endpoint:** `POST /monitoring/events/log`
**Description:** Logs custom system event

**Request Body:**
```json
{
  "level": "info",
  "message": "Custom event message",
  "module": "custom_module",
  "additional_data": {"key": "value"}
}
```

**Response (200 OK):**
```json
{
  "login_attempts_today": 45,
  "failed_logins_today": 3,
  "active_sessions": 15,
  "audit_events_week": 1250,
  "success_rate": 93.3
}
```

### Usage Statistics
**Endpoint:** `GET /monitoring/usage`
**Description:** Retrieves system usage statistics

**Response (200 OK):**
```json
{
  "active_users": {
    "daily": 25,
    "weekly": 45,
    "monthly": 65
  },
  "api_calls": {
    "today": 1250,
    "this_week": 8750,
    "this_month": 35000
  },
  "most_used_endpoints": [
    {
      "endpoint": "/students/",
      "calls": 350
    },
    {
      "endpoint": "/teachers/",
      "calls": 220
    }
  ]
}
```

## Error Handling

### Common HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created successfully
- `204 No Content`: Success with no response body
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### Error Response Format
```json
{
  "detail": "Error message",
  "type": "error_type",
  "status_code": 400,
  "timestamp": "2023-01-01T10:00:00Z"
}
```

### Validation Error Response
```json
{
  "detail": "Validation error",
  "errors": [
    {
      "loc": ["body", "username"],
      "msg": "field required",
      "type": "value_error.missing"
    },
    {
      "loc": ["body", "password"],
      "msg": "Password must be at least 8 characters long",
      "type": "value_error.password"
    }
  ],
  "type": "validation_error",
  "status_code": 422
}
```

### Business Logic Error Response
```json
{
  "detail": "Student already exists in this academic year",
  "type": "business_logic_error",
  "status_code": 422
}
```

### Error Handling Best Practices
1. Always check the HTTP status code
2. Parse error responses appropriately
3. Display user-friendly error messages
4. Log errors for debugging purposes
5. Implement retry logic for transient errors
6. Handle rate limiting gracefully

## Rate Limiting

### Rate Limit Policies
The API implements rate limiting to prevent abuse:

| Endpoint Category | Requests per Minute | Requests per Hour |
|-------------------|---------------------|-------------------|
| Authentication | 5 | 100 |
| General API | 100 | 2000 |
| File Upload | 10 | 200 |
| Search | 50 | 1000 |
| Reports | 20 | 400 |

### Rate Limit Response
When rate limit is exceeded, the API returns:
```json
{
  "detail": "Rate limit exceeded. Please try again later.",
  "retry_after": 60,
  "type": "rate_limit_error",
  "status_code": 429
}
```

### Rate Limit Headers
All responses include rate limit information:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697385600
```

### Rate Limiting Best Practices
1. Check rate limit headers on each response
2. Implement exponential backoff for retries
3. Queue requests when rate limit is approaching
4. Display user-friendly messages when rate limited
5. Cache responses when appropriate to reduce API calls

## Data Validation

### Input Validation
All API endpoints validate input data according to defined schemas. Common validation rules include:

#### String Fields
- Minimum and maximum length requirements
- Allowed character sets
- Pattern matching (e.g., email format)

#### Numeric Fields
- Minimum and maximum values
- Decimal precision limits
- Required vs. optional

#### Date Fields
- Valid date format (ISO 8601)
- Date range validation
- Future/past date restrictions

#### Enum Fields
- Valid value constraints
- Case sensitivity rules

### Output Validation
All API responses are validated to ensure:
- Correct data types
- Required fields are present
- Data integrity constraints
- Consistent formatting

### Validation Error Handling
When validation fails:
1. The API returns a 422 status code
2. Detailed error information is provided
3. Field-specific error messages are included
4. The response includes error location information

## Security Best Practices

### Authentication Security
1. Always use HTTPS in production
2. Store tokens securely (HttpOnly cookies or secure storage)
3. Implement token refresh mechanisms
4. Validate tokens before each request
5. Handle token expiration gracefully

### Data Security
1. Never log sensitive information
2. Encrypt sensitive data at rest
3. Validate all input data
4. Sanitize output data
5. Implement proper access controls

### API Security
1. Implement rate limiting
2. Use strong authentication mechanisms
3. Validate user permissions for each request
4. Log security-relevant events
5. Regularly update dependencies

### Frontend Security
1. Implement Content Security Policy (CSP)
2. Prevent Cross-Site Scripting (XSS)
3. Prevent Cross-Site Request Forgery (CSRF)
4. Validate data before sending to API
5. Handle errors securely

## Performance Optimization

### API Call Optimization
1. Use pagination for large datasets
2. Implement caching for frequently accessed data
3. Batch requests when possible
4. Use appropriate HTTP methods
5. Minimize payload size

### Data Loading Strategies
1. Implement lazy loading for non-critical data
2. Use progressive loading for large datasets
3. Implement data prefetching for anticipated needs
4. Cache user-specific data appropriately
5. Use background data synchronization

### Network Optimization
1. Compress API responses
2. Minimize HTTP requests
3. Use connection pooling
4. Implement request prioritization
5. Monitor network performance

## Sample Implementation

### 1. Authentication Service
```javascript
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
    this.token = localStorage.getItem('access_token');
  }

  async login(username, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.access_token;
        localStorage.setItem('access_token', this.token);
        return { success: true, data };
      } else {
        const error = await response.json();
        return { success: false, error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  getAuthToken() {
    return this.token;
  }

  async apiCall(endpoint, options = {}) {
    // Refresh token if needed
    if (this.isTokenExpiringSoon()) {
      await this.refreshToken();
    }

    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      defaultHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.apiCall(endpoint, options);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  isTokenExpiringSoon() {
    if (!this.token) return true;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const expiration = payload.exp * 1000;
      const now = Date.now();
      // Refresh if token expires in less than 5 minutes
      return expiration - now < 5 * 60 * 1000;
    } catch (error) {
      return true;
    }
  }

  async refreshToken() {
    try {
      const response = await this.apiCall('/auth/refresh', {
        method: 'POST'
      });

      if (response.access_token) {
        this.token = response.access_token;
        localStorage.setItem('access_token', this.token);
        return true;
      }
      return false;
    } catch (error) {
      this.logout();
      return false;
    }
  }
}
```

### 2. Student Service
```javascript
class StudentService {
  constructor(authService) {
    this.auth = authService;
  }

  async getStudents(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/students/${queryParams ? `?${queryParams}` : ''}`;
      const response = await this.auth.apiCall(endpoint);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  async createStudent(studentData) {
    try {
      const response = await this.auth.apiCall('/students/', {
        method: 'POST',
        body: JSON.stringify(studentData)
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getStudent(studentId) {
    try {
      const response = await this.auth.apiCall(`/students/${studentId}`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  async updateStudent(studentId, studentData) {
    try {
      const response = await this.auth.apiCall(`/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(studentData)
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  async deactivateStudent(studentId) {
    try {
      const response = await this.auth.apiCall(`/students/${studentId}`, {
        method: 'DELETE'
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getStudentFinances(studentId, academicYearId = null) {
    try {
      const queryParams = academicYearId ? `?academic_year_id=${academicYearId}` : '';
      const response = await this.auth.apiCall(`/students/${studentId}/finances${queryParams}`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  async createStudentFinance(studentId, financeData) {
    try {
      const response = await this.auth.apiCall(`/students/${studentId}/finances`, {
        method: 'POST',
        body: JSON.stringify(financeData)
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getStudentPayments(studentId, academicYearId = null) {
    try {
      const queryParams = academicYearId ? `?academic_year_id=${academicYearId}` : '';
      const response = await this.auth.apiCall(`/students/${studentId}/payments${queryParams}`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  async recordStudentPayment(studentId, paymentData) {
    try {
      const response = await this.auth.apiCall(`/students/${studentId}/payments`, {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getStudentAcademics(studentId, filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/students/${studentId}/academics${queryParams ? `?${queryParams}` : ''}`;
      const response = await this.auth.apiCall(endpoint);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  async createStudentAcademic(studentId, academicData) {
    try {
      const response = await this.auth.apiCall(`/students/${studentId}/academics`, {
        method: 'POST',
        body: JSON.stringify(academicData)
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  async updateStudentAcademic(studentId, academicId, academicData) {
    try {
      const response = await this.auth.apiCall(`/students/${studentId}/academics/${academicId}`, {
        method: 'PUT',
        body: JSON.stringify(academicData)
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }

  async searchStudents(query, filters = {}) {
    try {
      const allFilters = { q: query, ...filters };
      const queryParams = new URLSearchParams(allFilters).toString();
      const response = await this.auth.apiCall(`/students/search/?${queryParams}`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error };
    }
  }
}
```

### 3. Error Handling Wrapper
```javascript
async function handleApiCall(apiCall) {
  try {
    const response = await apiCall();
    
    // Handle successful responses
    if (response.success) {
      return { success: true, data: response.data };
    }
    
    // Handle API errors
    return { success: false, error: response.error };
    
  } catch (error) {
    // Handle network errors and other exceptions
    console.error('API Error:', error);
    
    // Check for specific error types
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { success: false, error: 'Network connection failed. Please check your internet connection.' };
    }
    
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

// Usage example:
// const result = await handleApiCall(() => studentService.getStudents());
// if (result.success) {
//   console.log('Students:', result.data);
// } else {
//   console.error('Error:', result.error);
// }
```

### 4. Pagination Helper
```javascript
class PaginationHelper {
  constructor(service, endpoint, pageSize = 20) {
    this.service = service;
    this.endpoint = endpoint;
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalPages = 0;
    this.totalItems = 0;
    this.items = [];
  }

  async loadPage(page = 1) {
    try {
      const filters = {
        skip: (page - 1) * this.pageSize,
        limit: this.pageSize
      };

      const result = await this.service.getStudents(filters);
      
      if (result.success) {
        this.currentPage = page;
        this.items = result.data.data || result.data;
        // Assuming the API returns pagination info in result.data.pagination
        if (result.data.pagination) {
          this.totalPages = result.data.pagination.total_pages;
          this.totalItems = result.data.pagination.total;
        }
        return { success: true, data: this.items };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error };
    }
  }

  async nextPage() {
    if (this.currentPage < this.totalPages) {
      return await this.loadPage(this.currentPage + 1);
    }
    return { success: false, error: 'No more pages' };
  }

  async previousPage() {
    if (this.currentPage > 1) {
      return await this.loadPage(this.currentPage - 1);
    }
    return { success: false, error: 'Already on first page' };
  }

  hasNextPage() {
    return this.currentPage < this.totalPages;
  }

  hasPreviousPage() {
    return this.currentPage > 1;
  }
}
```

### 5. Data Caching Layer
```javascript
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes default TTL
  }

  set(key, data, ttl = this.ttl) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Cache student data
  cacheStudent(studentId, studentData) {
    this.set(`student_${studentId}`, studentData);
  }

  getCachedStudent(studentId) {
    return this.get(`student_${studentId}`);
  }

  // Cache student list
  cacheStudentList(filters, studentList) {
    const key = `students_${JSON.stringify(filters)}`;
    this.set(key, studentList);
  }

  getCachedStudentList(filters) {
    const key = `students_${JSON.stringify(filters)}`;
    return this.get(key);
  }
}
```

## Testing Strategy

### Unit Testing
1. Test individual service methods
2. Mock API responses
3. Test error handling
4. Test edge cases
5. Validate data transformations

### Integration Testing
1. Test API endpoint integration
2. Test authentication flows
3. Test data validation
4. Test pagination
5. Test search functionality

### End-to-End Testing
1. Test complete user workflows
2. Test role-based access control
3. Test data consistency
4. Test error recovery
5. Test performance under load

### Testing Tools
1. Jest for unit testing
2. Cypress for end-to-end testing
3. Mock Service Worker for API mocking
4. Postman for API testing
5. Load testing tools like Artillery

## Deployment Considerations

### Environment Configuration
1. Different configurations for development, staging, and production
2. Environment-specific API endpoints
3. Secure handling of secrets
4. Feature flags for gradual rollouts

### Performance Monitoring
1. Implement application performance monitoring (APM)
2. Monitor API response times
3. Track user experience metrics
4. Set up alerts for performance degradation

### Security Monitoring
1. Monitor authentication attempts
2. Track suspicious activities
3. Implement security scanning
4. Regular security audits

### Backup and Recovery
1. Regular automated backups
2. Test backup restoration procedures
3. Monitor backup success
4. Implement disaster recovery procedures

## Conclusion

This enhanced frontend integration guide provides comprehensive documentation for integrating with the School Management System backend API. It covers all aspects of the API including:

1. Detailed endpoint documentation with request/response examples
2. Comprehensive authentication and authorization flows
3. Role-based access control implementation
4. Error handling and validation patterns
5. Rate limiting and performance optimization
6. Security best practices
7. Sample implementation code
8. Testing strategies
9. Deployment considerations

The guide is designed to help frontend developers quickly and effectively integrate their applications with the backend API while following best practices for security, performance, and maintainability. By following this guide, developers can build robust, secure, and high-performing frontend applications that fully leverage the capabilities of the School Management System.