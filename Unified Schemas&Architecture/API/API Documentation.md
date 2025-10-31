# School Management System - API Documentation

## Overview

This document provides comprehensive documentation for the School Management System RESTful API. The API is built with FastAPI and provides endpoints for managing all aspects of school operations including authentication, academic management, student and teacher management, scheduling, finance, and activities.

## Base URL

```
http://localhost:8000/api
```

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### Refresh Token
```
POST /auth/refresh
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### Change Password
```
POST /auth/change-password
```

**Request Body:**
```json
{
  "current_password": "string",
  "new_password": "string"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

### Reset Password (Director Only)
```
POST /auth/reset-password
```

**Request Body:**
```json
{
  "username": "string",
  "role": "string"
}
```

**Response:**
```json
{
  "message": "Password reset successfully. Notification sent via Telegram."
}
```

### Get Current User
```
GET /auth/me
```

**Response:**
```json
{
  "id": 0,
  "username": "string",
  "role": "string",
  "is_active": true
}
```

### Logout
```
POST /auth/logout
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Academic Management

### Academic Years

#### Get All Academic Years
```
GET /academic/years
```

**Response:**
```json
[
  {
    "id": 0,
    "year_name": "string",
    "description": "string",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```

#### Create Academic Year (Director Only)
```
POST /academic/years
```

**Request Body:**
```json
{
  "year_name": "string",
  "description": "string",
  "is_active": true
}
```

**Response:**
```json
{
  "id": 0,
  "year_name": "string",
  "description": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Update Academic Year (Director Only)
```
PUT /academic/years/{year_id}
```

**Request Body:**
```json
{
  "year_name": "string",
  "description": "string",
  "is_active": true
}
```

**Response:**
```json
{
  "id": 0,
  "year_name": "string",
  "description": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Delete Academic Year (Director Only)
```
DELETE /academic/years/{year_id}
```

**Response:**
```json
{
  "message": "Academic year deleted successfully"
}
```

### Classes

#### Get All Classes
```
GET /academic/classes
```

**Query Parameters:**
- `academic_year_id` (integer, optional)

**Response:**
```json
[
  {
    "id": 0,
    "academic_year_id": 0,
    "session_type": "string",
    "grade_level": "string",
    "grade_number": 0,
    "section_count": 0,
    "max_students_per_section": 0,
    "created_at": "2023-01-01T00:00:00"
  }
]
```

#### Create Class
```
POST /academic/classes
```

**Request Body:**
```json
{
  "academic_year_id": 0,
  "session_type": "string",
  "grade_level": "string",
  "grade_number": 0,
  "section_count": 0,
  "max_students_per_section": 0
}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "session_type": "string",
  "grade_level": "string",
  "grade_number": 0,
  "section_count": 0,
  "max_students_per_section": 0,
  "created_at": "2023-01-01T00:00:00"
}
```

### Subjects

#### Get All Subjects
```
GET /academic/subjects
```

**Query Parameters:**
- `class_id` (integer, optional)

**Response:**
```json
[
  {
    "id": 0,
    "class_id": 0,
    "subject_name": "string",
    "weekly_hours": 0,
    "created_at": "2023-01-01T00:00:00"
  }
]
```

#### Create Subject
```
POST /academic/subjects
```

**Request Body:**
```json
{
  "class_id": 0,
  "subject_name": "string",
  "weekly_hours": 0
}
```

**Response:**
```json
{
  "id": 0,
  "class_id": 0,
  "subject_name": "string",
  "weekly_hours": 0,
  "created_at": "2023-01-01T00:00:00"
}
```

## Student Management

### Students

#### Get Students
```
GET /students/
```

**Query Parameters:**
- `academic_year_id` (integer, optional)
- `session_type` (string, optional)
- `grade_level` (string, optional)
- `grade_number` (integer, optional)
- `is_active` (boolean, optional, default: true)
- `skip` (integer, optional, default: 0)
- `limit` (integer, optional, default: 100, max: 1000)

**Response:**
```json
[
  {
    "id": 0,
    "academic_year_id": 0,
    "full_name": "string",
    "has_special_needs": true,
    "special_needs_details": "string",
    "father_name": "string",
    "grandfather_name": "string",
    "mother_name": "string",
    "birth_date": "2023-01-01",
    "birth_place": "string",
    "nationality": "string",
    "father_occupation": "string",
    "mother_occupation": "string",
    "religion": "string",
    "gender": "string",
    "transportation_type": "string",
    "bus_number": "string",
    "landline_phone": "string",
    "father_phone": "string",
    "mother_phone": "string",
    "additional_phone": "string",
    "detailed_address": "string",
    "previous_school": "string",
    "grade_level": "string",
    "grade_number": 0,
    "section": "string",
    "session_type": "string",
    "ninth_grade_total": 0,
    "notes": "string",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```

#### Create Student
```
POST /students/
```

**Request Body:**
```json
{
  "academic_year_id": 0,
  "full_name": "string",
  "has_special_needs": true,
  "special_needs_details": "string",
  "father_name": "string",
  "grandfather_name": "string",
  "mother_name": "string",
  "birth_date": "2023-01-01",
  "birth_place": "string",
  "nationality": "string",
  "father_occupation": "string",
  "mother_occupation": "string",
  "religion": "string",
  "gender": "string",
  "transportation_type": "string",
  "bus_number": "string",
  "landline_phone": "string",
  "father_phone": "string",
  "mother_phone": "string",
  "additional_phone": "string",
  "detailed_address": "string",
  "previous_school": "string",
  "grade_level": "string",
  "grade_number": 0,
  "section": "string",
  "session_type": "string",
  "ninth_grade_total": 0,
  "notes": "string"
}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "full_name": "string",
  "has_special_needs": true,
  "special_needs_details": "string",
  "father_name": "string",
  "grandfather_name": "string",
  "mother_name": "string",
  "birth_date": "2023-01-01",
  "birth_place": "string",
  "nationality": "string",
  "father_occupation": "string",
  "mother_occupation": "string",
  "religion": "string",
  "gender": "string",
  "transportation_type": "string",
  "bus_number": "string",
  "landline_phone": "string",
  "father_phone": "string",
  "mother_phone": "string",
  "additional_phone": "string",
  "detailed_address": "string",
  "previous_school": "string",
  "grade_level": "string",
  "grade_number": 0,
  "section": "string",
  "session_type": "string",
  "ninth_grade_total": 0,
  "notes": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Get Student by ID
```
GET /students/{student_id}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "full_name": "string",
  "has_special_needs": true,
  "special_needs_details": "string",
  "father_name": "string",
  "grandfather_name": "string",
  "mother_name": "string",
  "birth_date": "2023-01-01",
  "birth_place": "string",
  "nationality": "string",
  "father_occupation": "string",
  "mother_occupation": "string",
  "religion": "string",
  "gender": "string",
  "transportation_type": "string",
  "bus_number": "string",
  "landline_phone": "string",
  "father_phone": "string",
  "mother_phone": "string",
  "additional_phone": "string",
  "detailed_address": "string",
  "previous_school": "string",
  "grade_level": "string",
  "grade_number": 0,
  "section": "string",
  "session_type": "string",
  "ninth_grade_total": 0,
  "notes": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Update Student
```
PUT /students/{student_id}
```

**Request Body:**
```json
{
  "full_name": "string",
  "has_special_needs": true,
  "special_needs_details": "string",
  "father_name": "string",
  "grandfather_name": "string",
  "mother_name": "string",
  "birth_date": "2023-01-01",
  "birth_place": "string",
  "nationality": "string",
  "father_occupation": "string",
  "mother_occupation": "string",
  "religion": "string",
  "gender": "string",
  "transportation_type": "string",
  "bus_number": "string",
  "landline_phone": "string",
  "father_phone": "string",
  "mother_phone": "string",
  "additional_phone": "string",
  "detailed_address": "string",
  "previous_school": "string",
  "grade_level": "string",
  "grade_number": 0,
  "section": "string",
  "session_type": "string",
  "ninth_grade_total": 0,
  "notes": "string",
  "is_active": true
}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "full_name": "string",
  "has_special_needs": true,
  "special_needs_details": "string",
  "father_name": "string",
  "grandfather_name": "string",
  "mother_name": "string",
  "birth_date": "2023-01-01",
  "birth_place": "string",
  "nationality": "string",
  "father_occupation": "string",
  "mother_occupation": "string",
  "religion": "string",
  "gender": "string",
  "transportation_type": "string",
  "bus_number": "string",
  "landline_phone": "string",
  "father_phone": "string",
  "mother_phone": "string",
  "additional_phone": "string",
  "detailed_address": "string",
  "previous_school": "string",
  "grade_level": "string",
  "grade_number": 0,
  "section": "string",
  "session_type": "string",
  "ninth_grade_total": 0,
  "notes": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Deactivate Student
```
DELETE /students/{student_id}
```

**Response:**
```json
{
  "message": "Student deactivated successfully"
}
```

### Student Finances

#### Get Student Finances
```
GET /students/{student_id}/finances
```

**Query Parameters:**
- `academic_year_id` (integer, optional)

**Response:**
```json
{
  "id": 0,
  "student_id": 0,
  "academic_year_id": 0,
  "school_fee": 0,
  "school_fee_discount": 0,
  "bus_fee": 0,
  "bus_fee_discount": 0,
  "other_revenues": 0,
  "payment_notes": "string",
  "created_at": "2023-01-01T00:00:00",
  "total_amount": 0
}
```

#### Create Student Finance Record
```
POST /students/{student_id}/finances
```

**Request Body:**
```json
{
  "academic_year_id": 0,
  "school_fee": 0,
  "school_fee_discount": 0,
  "bus_fee": 0,
  "bus_fee_discount": 0,
  "other_revenues": 0,
  "payment_notes": "string"
}
```

**Response:**
```json
{
  "id": 0,
  "student_id": 0,
  "academic_year_id": 0,
  "school_fee": 0,
  "school_fee_discount": 0,
  "bus_fee": 0,
  "bus_fee_discount": 0,
  "other_revenues": 0,
  "payment_notes": "string",
  "created_at": "2023-01-01T00:00:00",
  "total_amount": 0
}
```

### Student Payments

#### Get Student Payments
```
GET /students/{student_id}/payments
```

**Query Parameters:**
- `academic_year_id` (integer, optional)

**Response:**
```json
[
  {
    "id": 0,
    "student_id": 0,
    "academic_year_id": 0,
    "payment_amount": 0,
    "payment_date": "2023-01-01",
    "receipt_number": "string",
    "payment_method": "string",
    "payment_status": "string",
    "notes": "string",
    "created_at": "2023-01-01T00:00:00"
  }
]
```

#### Record Student Payment
```
POST /students/{student_id}/payments
```

**Request Body:**
```json
{
  "academic_year_id": 0,
  "payment_amount": 0,
  "payment_date": "2023-01-01",
  "receipt_number": "string",
  "payment_method": "string",
  "payment_status": "string",
  "notes": "string"
}
```

**Response:**
```json
{
  "id": 0,
  "student_id": 0,
  "academic_year_id": 0,
  "payment_amount": 0,
  "payment_date": "2023-01-01",
  "receipt_number": "string",
  "payment_method": "string",
  "payment_status": "string",
  "notes": "string",
  "created_at": "2023-01-01T00:00:00"
}
```

### Student Academic Records

#### Get Student Academic Records
```
GET /students/{student_id}/academics
```

**Query Parameters:**
- `academic_year_id` (integer, optional)
- `subject_id` (integer, optional)

**Response:**
```json
[
  {
    "id": 0,
    "student_id": 0,
    "academic_year_id": 0,
    "subject_id": 0,
    "board_grades": 0,
    "recitation_grades": 0,
    "first_exam_grades": 0,
    "midterm_grades": 0,
    "second_exam_grades": 0,
    "final_exam_grades": 0,
    "behavior_grade": 0,
    "activity_grade": 0,
    "absence_days": 0,
    "absence_dates": "string",
    "created_at": "2023-01-01T00:00:00"
  }
]
```

#### Create Student Academic Record
```
POST /students/{student_id}/academics
```

**Request Body:**
```json
{
  "academic_year_id": 0,
  "subject_id": 0,
  "board_grades": 0,
  "recitation_grades": 0,
  "first_exam_grades": 0,
  "midterm_grades": 0,
  "second_exam_grades": 0,
  "final_exam_grades": 0,
  "behavior_grade": 0,
  "activity_grade": 0,
  "absence_days": 0,
  "absence_dates": "string"
}
```

**Response:**
```json
{
  "id": 0,
  "student_id": 0,
  "academic_year_id": 0,
  "subject_id": 0,
  "board_grades": 0,
  "recitation_grades": 0,
  "first_exam_grades": 0,
  "midterm_grades": 0,
  "second_exam_grades": 0,
  "final_exam_grades": 0,
  "behavior_grade": 0,
  "activity_grade": 0,
  "absence_days": 0,
  "absence_dates": "string",
  "created_at": "2023-01-01T00:00:00"
}
```

#### Update Student Academic Record
```
PUT /students/{student_id}/academics/{academic_id}
```

**Request Body:**
```json
{
  "board_grades": 0,
  "recitation_grades": 0,
  "first_exam_grades": 0,
  "midterm_grades": 0,
  "second_exam_grades": 0,
  "final_exam_grades": 0,
  "behavior_grade": 0,
  "activity_grade": 0,
  "absence_days": 0,
  "absence_dates": "string"
}
```

**Response:**
```json
{
  "id": 0,
  "student_id": 0,
  "academic_year_id": 0,
  "subject_id": 0,
  "board_grades": 0,
  "recitation_grades": 0,
  "first_exam_grades": 0,
  "midterm_grades": 0,
  "second_exam_grades": 0,
  "final_exam_grades": 0,
  "behavior_grade": 0,
  "activity_grade": 0,
  "absence_days": 0,
  "absence_dates": "string",
  "created_at": "2023-01-01T00:00:00"
}
```

### Search Students
```
GET /students/search/
```

**Query Parameters:**
- `q` (string, required, min length: 3) - Search query
- `academic_year_id` (integer, optional)
- `session_type` (string, optional)
- `limit` (integer, optional, default: 20, max: 100)

**Response:**
```json
[
  {
    "id": 0,
    "academic_year_id": 0,
    "full_name": "string",
    "has_special_needs": true,
    "special_needs_details": "string",
    "father_name": "string",
    "grandfather_name": "string",
    "mother_name": "string",
    "birth_date": "2023-01-01",
    "birth_place": "string",
    "nationality": "string",
    "father_occupation": "string",
    "mother_occupation": "string",
    "religion": "string",
    "gender": "string",
    "transportation_type": "string",
    "bus_number": "string",
    "landline_phone": "string",
    "father_phone": "string",
    "mother_phone": "string",
    "additional_phone": "string",
    "detailed_address": "string",
    "previous_school": "string",
    "grade_level": "string",
    "grade_number": 0,
    "section": "string",
    "session_type": "string",
    "ninth_grade_total": 0,
    "notes": "string",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```

## Teacher Management

### Teachers

#### Get Teachers
```
GET /teachers/
```

**Query Parameters:**
- `academic_year_id` (integer, optional)
- `is_active` (boolean, optional, default: true)
- `skip` (integer, optional, default: 0)
- `limit` (integer, optional, default: 100, max: 1000)

**Response:**
```json
[
  {
    "id": 0,
    "academic_year_id": 0,
    "full_name": "string",
    "gender": "string",
    "birth_date": "2023-01-01",
    "phone": "string",
    "nationality": "string",
    "detailed_address": "string",
    "transportation_type": "string",
    "qualifications": "string",
    "experience": "string",
    "free_time_slots": "string",
    "notes": "string",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```

#### Create Teacher (Director Only)
```
POST /teachers/
```

**Request Body:**
```json
{
  "academic_year_id": 0,
  "full_name": "string",
  "gender": "string",
  "birth_date": "2023-01-01",
  "phone": "string",
  "nationality": "string",
  "detailed_address": "string",
  "transportation_type": "string",
  "qualifications": "string",
  "experience": "string",
  "free_time_slots": "string",
  "notes": "string",
  "is_active": true
}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "full_name": "string",
  "gender": "string",
  "birth_date": "2023-01-01",
  "phone": "string",
  "nationality": "string",
  "detailed_address": "string",
  "transportation_type": "string",
  "qualifications": "string",
  "experience": "string",
  "free_time_slots": "string",
  "notes": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Get Teacher by ID
```
GET /teachers/{teacher_id}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "full_name": "string",
  "gender": "string",
  "birth_date": "2023-01-01",
  "phone": "string",
  "nationality": "string",
  "detailed_address": "string",
  "transportation_type": "string",
  "qualifications": "string",
  "experience": "string",
  "free_time_slots": "string",
  "notes": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Update Teacher (Director Only)
```
PUT /teachers/{teacher_id}
```

**Request Body:**
```json
{
  "full_name": "string",
  "gender": "string",
  "birth_date": "2023-01-01",
  "phone": "string",
  "nationality": "string",
  "detailed_address": "string",
  "transportation_type": "string",
  "qualifications": "string",
  "experience": "string",
  "free_time_slots": "string",
  "notes": "string",
  "is_active": true
}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "full_name": "string",
  "gender": "string",
  "birth_date": "2023-01-01",
  "phone": "string",
  "nationality": "string",
  "detailed_address": "string",
  "transportation_type": "string",
  "qualifications": "string",
  "experience": "string",
  "free_time_slots": "string",
  "notes": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Delete Teacher (Director Only)
```
DELETE /teachers/{teacher_id}
```

**Response:**
```json
{
  "message": "Teacher deactivated successfully"
}
```

### Teacher Subject Assignments

#### Get Teacher Assignments
```
GET /teachers/{teacher_id}/assignments
```

**Query Parameters:**
- `academic_year_id` (integer, optional)

**Response:**
```json
[
  {
    "id": 0,
    "teacher_id": 0,
    "class_id": 0,
    "class_name": "string",
    "subject_id": 0,
    "subject_name": "string",
    "section": "string",
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```

#### Assign Subject to Teacher
```
POST /teachers/{teacher_id}/assignments
```

**Request Body:**
```json
{
  "class_id": 0,
  "subject_id": 0,
  "section": "string"
}
```

**Response:**
```json
{
  "id": 0,
  "teacher_id": 0,
  "class_id": 0,
  "class_name": "string",
  "subject_id": 0,
  "subject_name": "string",
  "section": "string",
  "message": "Subject assigned successfully"
}
```

#### Remove Teacher Assignment
```
DELETE /teachers/assignments/{assignment_id}
```

**Response:**
```json
{
  "message": "Assignment removed successfully"
}
```

### Teacher Attendance

#### Get Teacher Attendance
```
GET /teachers/{teacher_id}/attendance
```

**Query Parameters:**
- `start_date` (string, format: date, optional)
- `end_date` (string, format: date, optional)

**Response:**
```json
[
  {
    "id": 0,
    "teacher_id": 0,
    "attendance_date": "2023-01-01",
    "classes_attended": 0,
    "extra_classes": 0,
    "notes": "string",
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```

#### Record Teacher Attendance
```
POST /teachers/{teacher_id}/attendance
```

**Request Body:**
```json
{
  "attendance_date": "2023-01-01",
  "classes_attended": 0,
  "extra_classes": 0,
  "notes": "string"
}
```

**Response:**
```json
{
  "id": 0,
  "teacher_id": 0,
  "attendance_date": "2023-01-01",
  "classes_attended": 0,
  "extra_classes": 0,
  "notes": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Update Teacher Attendance
```
PUT /teachers/attendance/{attendance_id}
```

**Request Body:**
```json
{
  "classes_attended": 0,
  "extra_classes": 0,
  "notes": "string"
}
```

**Response:**
```json
{
  "id": 0,
  "teacher_id": 0,
  "attendance_date": "2023-01-01",
  "classes_attended": 0,
  "extra_classes": 0,
  "notes": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

### Teacher Finance

#### Get Teacher Finance Records
```
GET /teachers/{teacher_id}/finance
```

**Query Parameters:**
- `academic_year_id` (integer, optional)

**Response:**
```json
[
  {
    "id": 0,
    "teacher_id": 0,
    "academic_year_id": 0,
    "base_salary": 0,
    "bonuses": 0,
    "deductions": 0,
    "total_amount": 0,
    "payment_status": "string",
    "payment_date": "2023-01-01",
    "notes": "string",
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```

#### Create Teacher Finance Record
```
POST /teachers/{teacher_id}/finance
```

**Request Body:**
```json
{
  "academic_year_id": 0,
  "base_salary": 0,
  "bonuses": 0,
  "deductions": 0,
  "total_amount": 0,
  "payment_status": "string",
  "payment_date": "2023-01-01",
  "notes": "string"
}
```

**Response:**
```json
{
  "id": 0,
  "teacher_id": 0,
  "academic_year_id": 0,
  "base_salary": 0,
  "bonuses": 0,
  "deductions": 0,
  "total_amount": 0,
  "payment_status": "string",
  "payment_date": "2023-01-01",
  "notes": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Update Teacher Finance Record
```
PUT /teachers/finance/{finance_id}
```

**Request Body:**
```json
{
  "base_salary": 0,
  "bonuses": 0,
  "deductions": 0,
  "total_amount": 0,
  "payment_status": "string",
  "payment_date": "2023-01-01",
  "notes": "string"
}
```

**Response:**
```json
{
  "id": 0,
  "teacher_id": 0,
  "academic_year_id": 0,
  "base_salary": 0,
  "bonuses": 0,
  "deductions": 0,
  "total_amount": 0,
  "payment_status": "string",
  "payment_date": "2023-01-01",
  "notes": "string",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

### Teacher Schedule

#### Get Teacher Schedule
```
GET /teachers/{teacher_id}/schedule
```

**Query Parameters:**
- `academic_year_id` (integer, optional)

**Response:**
```json
{
  "teacher_id": 0,
  "teacher_name": "string",
  "assignments": [
    {
      "assignment_id": 0,
      "class": "string",
      "subject": "string",
      "section": "string",
      "schedule_entries": [
        {
          "day_of_week": 0,
          "period_number": 0,
          "session_type": "string"
        }
      ]
    }
  ]
}
```

### Search Teachers
```
GET /teachers/search/
```

**Query Parameters:**
- `q` (string, required, min length: 1) - Search query
- `academic_year_id` (integer, optional)
- `skip` (integer, optional, default: 0)
- `limit` (integer, optional, default: 50, max: 200)

**Response:**
```json
[
  {
    "id": 0,
    "academic_year_id": 0,
    "full_name": "string",
    "gender": "string",
    "birth_date": "2023-01-01",
    "phone": "string",
    "nationality": "string",
    "detailed_address": "string",
    "transportation_type": "string",
    "qualifications": "string",
    "experience": "string",
    "free_time_slots": "string",
    "notes": "string",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```

## Schedule Management

### Schedules

#### Get Schedules
```
GET /schedules/
```

**Query Parameters:**
- `academic_year_id` (integer, optional)
- `session_type` (string, optional)
- `class_id` (integer, optional)
- `teacher_id` (integer, optional)
- `skip` (integer, optional, default: 0)
- `limit` (integer, optional, default: 100, max: 1000)

**Response:**
```json
[
  {
    "id": 0,
    "academic_year_id": 0,
    "session_type": "string",
    "class_id": 0,
    "section": "string",
    "day_of_week": 0,
    "period_number": 0,
    "subject_id": 0,
    "teacher_id": 0,
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```

#### Create Schedule Entry (Director Only)
```
POST /schedules/
```

**Request Body:**
```json
{
  "academic_year_id": 0,
  "session_type": "string",
  "class_id": 0,
  "section": "string",
  "day_of_week": 0,
  "period_number": 0,
  "subject_id": 0,
  "teacher_id": 0
}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "session_type": "string",
  "class_id": 0,
  "section": "string",
  "day_of_week": 0,
  "period_number": 0,
  "subject_id": 0,
  "teacher_id": 0,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Get Schedule Entry
```
GET /schedules/{schedule_id}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "session_type": "string",
  "class_id": 0,
  "section": "string",
  "day_of_week": 0,
  "period_number": 0,
  "subject_id": 0,
  "teacher_id": 0,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Update Schedule Entry (Director Only)
```
PUT /schedules/{schedule_id}
```

**Request Body:**
```json
{
  "session_type": "string",
  "class_id": 0,
  "section": "string",
  "day_of_week": 0,
  "period_number": 0,
  "subject_id": 0,
  "teacher_id": 0
}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "session_type": "string",
  "class_id": 0,
  "section": "string",
  "day_of_week": 0,
  "period_number": 0,
  "subject_id": 0,
  "teacher_id": 0,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Delete Schedule Entry (Director Only)
```
DELETE /schedules/{schedule_id}
```

**Response:**
```json
{
  "message": "Schedule entry deleted successfully"
}
```

### Schedule Constraints

#### Get Schedule Constraints
```
GET /schedules/constraints/
```

**Query Parameters:**
- `academic_year_id` (integer, optional)
- `constraint_type` (string, optional)
- `is_active` (boolean, optional, default: true)
- `skip` (integer, optional, default: 0)
- `limit` (integer, optional, default: 100, max: 1000)

**Response:**
```json
[
  {
    "id": 0,
    "academic_year_id": 0,
    "constraint_type": "string",
    "class_id": 0,
    "subject_id": 0,
    "teacher_id": 0,
    "day_of_week": 0,
    "period_number": 0,
    "time_range_start": 0,
    "time_range_end": 0,
    "max_consecutive_periods": 0,
    "min_consecutive_periods": 0,
    "applies_to_all_sections": true,
    "session_type": "string",
    "priority_level": 0,
    "description": "string",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00",
    "updated_at": "2023-01-01T00:00:00"
  }
]
```

#### Create Schedule Constraint (Director Only)
```
POST /schedules/constraints/
```

**Request Body:**
```json
{
  "academic_year_id": 0,
  "constraint_type": "string",
  "class_id": 0,
  "subject_id": 0,
  "teacher_id": 0,
  "day_of_week": 0,
  "period_number": 0,
  "time_range_start": 0,
  "time_range_end": 0,
  "max_consecutive_periods": 0,
  "min_consecutive_periods": 0,
  "applies_to_all_sections": true,
  "session_type": "string",
  "priority_level": 0,
  "description": "string",
  "is_active": true
}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "constraint_type": "string",
  "class_id": 0,
  "subject_id": 0,
  "teacher_id": 0,
  "day_of_week": 0,
  "period_number": 0,
  "time_range_start": 0,
  "time_range_end": 0,
  "max_consecutive_periods": 0,
  "min_consecutive_periods": 0,
  "applies_to_all_sections": true,
  "session_type": "string",
  "priority_level": 0,
  "description": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Get Schedule Constraint
```
GET /schedules/constraints/{constraint_id}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "constraint_type": "string",
  "class_id": 0,
  "subject_id": 0,
  "teacher_id": 0,
  "day_of_week": 0,
  "period_number": 0,
  "time_range_start": 0,
  "time_range_end": 0,
  "max_consecutive_periods": 0,
  "min_consecutive_periods": 0,
  "applies_to_all_sections": true,
  "session_type": "string",
  "priority_level": 0,
  "description": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Update Schedule Constraint (Director Only)
```
PUT /schedules/constraints/{constraint_id}
```

**Request Body:**
```json
{
  "constraint_type": "string",
  "class_id": 0,
  "subject_id": 0,
  "teacher_id": 0,
  "day_of_week": 0,
  "period_number": 0,
  "time_range_start": 0,
  "time_range_end": 0,
  "max_consecutive_periods": 0,
  "min_consecutive_periods": 0,
  "applies_to_all_sections": true,
  "session_type": "string",
  "priority_level": 0,
  "description": "string",
  "is_active": true
}
```

**Response:**
```json
{
  "id": 0,
  "academic_year_id": 0,
  "constraint_type": "string",
  "class_id": 0,
  "subject_id": 0,
  "teacher_id": 0,
  "day_of_week": 0,
  "period_number": 0,
  "time_range_start": 0,
  "time_range_end": 0,
  "max_consecutive_periods": 0,
  "min_consecutive_periods": 0,
  "applies_to_all_sections": true,
  "session_type": "string",
  "priority_level": 0,
  "description": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Delete Schedule Constraint (Director