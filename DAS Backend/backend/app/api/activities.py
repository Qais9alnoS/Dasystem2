from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, date, time
from decimal import Decimal

from ..database import get_db
from ..models.activities import (
    Activity, ActivityParticipant, StudentActivityParticipation,
    ActivityRegistration, ActivitySchedule, ActivityAttendance
)
from ..models.students import Student
from ..models.users import User
from ..schemas.activities import (
    ActivityCreate, ActivityUpdate, ActivityResponse,
    ActivityRegistrationCreate, ActivityRegistrationUpdate, ActivityRegistrationResponse,
    ActivityScheduleCreate, ActivityScheduleUpdate, ActivityScheduleResponse,
    ActivityAttendanceCreate, ActivityAttendanceUpdate, ActivityAttendanceResponse,
    ActivityParticipationReport, StudentActivityReport, ActivitySummaryReport
)
from ..core.dependencies import get_current_user, get_director_user, get_school_user

router = APIRouter(tags=["activities"])

# Activity Management
@router.get("/", response_model=List[ActivityResponse])
async def get_activities(
    academic_year_id: Optional[int] = Query(None),
    activity_type: Optional[str] = Query(None),
    session_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get all activities with optional filtering"""
    query = db.query(Activity)  
    
    if academic_year_id is not None:
        query = query.filter(Activity.academic_year_id == academic_year_id)  
    
    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)  
    
    if session_type:
        query = query.filter(  
            (Activity.session_type == session_type) | 
            (Activity.session_type == "both")
        )
    
    if is_active is not None:
        query = query.filter(Activity.is_active == is_active)  
    
    activities = query.offset(skip).limit(limit).all()  
    
    # Create response objects with current participants count
    response_activities = []
    for activity in activities:
        participant_count = db.query(ActivityRegistration).filter(  
            and_(
                ActivityRegistration.activity_id == activity.id,
                ActivityRegistration.payment_status != "cancelled"
            )
        ).count()
        
        # Create a response object with the current_participants attribute
        activity_dict = {
            "id": activity.id,
            "academic_year_id": activity.academic_year_id,
            "name": activity.name,
            "description": activity.description,
            "activity_type": activity.activity_type,
            "session_type": activity.session_type,
            "target_grades": activity.target_grades,
            "max_participants": activity.max_participants,
            "cost_per_student": activity.cost_per_student,
            "start_date": activity.start_date,
            "end_date": activity.end_date,
            "registration_deadline": activity.registration_deadline,
            "location": activity.location,
            "instructor_name": activity.instructor_name,
            "requirements": activity.requirements,
            "is_active": activity.is_active,
            "current_participants": participant_count,
            "images": activity.images,
            "created_at": activity.created_at,
            "updated_at": activity.updated_at
        }
        response_activities.append(ActivityResponse(**activity_dict))
    
    return response_activities

@router.post("/", response_model=ActivityResponse)
async def create_activity(
    activity: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Create a new activity"""
    # Check if activity with same name already exists in the academic year
    existing_activity = db.query(Activity).filter(  
        and_(
            Activity.name == activity.name,
            Activity.academic_year_id == activity.academic_year_id
        )
    ).first()
    
    if existing_activity:
        raise HTTPException(status_code=400, detail="Activity with this name already exists in this academic year")
    
    db_activity = Activity(**activity.dict())
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    
    # Create response object with current participants set to 0
    activity_dict = {
        "id": db_activity.id,
        "academic_year_id": db_activity.academic_year_id,
        "name": db_activity.name,
        "description": db_activity.description,
        "activity_type": db_activity.activity_type,
        "session_type": db_activity.session_type,
        "target_grades": db_activity.target_grades,
        "max_participants": db_activity.max_participants,
        "cost_per_student": db_activity.cost_per_student,
        "start_date": db_activity.start_date,
        "end_date": db_activity.end_date,
        "registration_deadline": db_activity.registration_deadline,
        "location": db_activity.location,
        "instructor_name": db_activity.instructor_name,
        "requirements": db_activity.requirements,
        "is_active": db_activity.is_active,
        "current_participants": 0,
        "images": db_activity.images,
        "created_at": db_activity.created_at,
        "updated_at": db_activity.updated_at
    }
    return ActivityResponse(**activity_dict)

@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get a specific activity by ID"""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()  
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Add current participants count
    participant_count = db.query(ActivityRegistration).filter(  
        and_(
            ActivityRegistration.activity_id == activity_id,
            ActivityRegistration.payment_status != "cancelled"
        )
    ).count()
    
    # Create response object with current participants count
    activity_dict = {
        "id": activity.id,
        "academic_year_id": activity.academic_year_id,
        "name": activity.name,
        "description": activity.description,
        "activity_type": activity.activity_type,
        "session_type": activity.session_type,
        "target_grades": activity.target_grades,
        "max_participants": activity.max_participants,
        "cost_per_student": activity.cost_per_student,
        "start_date": activity.start_date,
        "end_date": activity.end_date,
        "registration_deadline": activity.registration_deadline,
        "location": activity.location,
        "instructor_name": activity.instructor_name,
        "requirements": activity.requirements,
        "is_active": activity.is_active,
        "current_participants": participant_count,
        "images": activity.images,
        "created_at": activity.created_at,
        "updated_at": activity.updated_at
    }
    return ActivityResponse(**activity_dict)

@router.put("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: int,
    activity_update: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Update an activity"""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()  
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    update_data = activity_update.dict(exclude_unset=True)
    
    # Check for unique name constraint if name is being updated
    if "name" in update_data:
        existing_activity = db.query(Activity).filter(  
            and_(
                Activity.name == update_data["name"],
                Activity.academic_year_id == activity.academic_year_id,
                Activity.id != activity_id
            )
        ).first()
        if existing_activity:
            raise HTTPException(status_code=400, detail="Activity name already exists in this academic year")
    
    for field, value in update_data.items():
        setattr(activity, field, value)
    
    db.commit()
    db.refresh(activity)
    
    # Add current participants count to response
    participant_count = db.query(ActivityRegistration).filter(  
        and_(
            ActivityRegistration.activity_id == activity_id,
            ActivityRegistration.payment_status != "cancelled"
        )
    ).count()
    
    # Create response object with current participants count
    activity_dict = {
        "id": activity.id,
        "academic_year_id": activity.academic_year_id,
        "name": activity.name,
        "description": activity.description,
        "activity_type": activity.activity_type,
        "session_type": activity.session_type,
        "target_grades": activity.target_grades,
        "max_participants": activity.max_participants,
        "cost_per_student": activity.cost_per_student,
        "start_date": activity.start_date,
        "end_date": activity.end_date,
        "registration_deadline": activity.registration_deadline,
        "location": activity.location,
        "instructor_name": activity.instructor_name,
        "requirements": activity.requirements,
        "is_active": activity.is_active,
        "current_participants": participant_count,
        "images": activity.images,
        "created_at": activity.created_at,
        "updated_at": activity.updated_at
    }
    return ActivityResponse(**activity_dict)

@router.delete("/{activity_id}")
async def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Delete an activity (soft delete by setting is_active to False)"""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()  
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    activity.is_active = False
    db.commit()
    return {"message": "Activity deleted successfully"}

# Activity Registration Management
@router.get("/{activity_id}/registrations", response_model=List[ActivityRegistrationResponse])
async def get_activity_registrations(
    activity_id: int,
    payment_status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get all registrations for an activity"""
    query = db.query(ActivityRegistration).join(Student).filter(  
        ActivityRegistration.activity_id == activity_id
    )
    
    if payment_status:
        query = query.filter(ActivityRegistration.payment_status == payment_status)  
    
    registrations = query.all()
    
    # Create response objects with student and activity names
    response_registrations = []
    for registration in registrations:
        student = db.query(Student).filter(Student.id == registration.student_id).first()  
        activity = db.query(Activity).filter(Activity.id == registration.activity_id).first()  
        
        # Create a response object with the names
        registration_dict = {
            "id": registration.id,
            "student_id": registration.student_id,
            "activity_id": registration.activity_id,
            "registration_date": registration.registration_date,
            "payment_status": registration.payment_status,
            "payment_amount": registration.payment_amount,
            "notes": registration.notes,
            "student_name": f"{student.full_name}" if student else "Unknown",
            "activity_name": activity.name if activity else "Unknown",
            "created_at": registration.created_at,
            "updated_at": registration.updated_at
        }
        response_registrations.append(ActivityRegistrationResponse(**registration_dict))
    
    return response_registrations

@router.post("/{activity_id}/registrations", response_model=ActivityRegistrationResponse)
async def register_student_for_activity(
    activity_id: int,
    registration: ActivityRegistrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Register a student for an activity"""
    # Check if activity exists
    activity = db.query(Activity).filter(Activity.id == activity_id).first()  
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Check if student exists
    student = db.query(Student).filter(Student.id == registration.student_id).first()  
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if registration deadline has passed
    if activity.registration_deadline and registration.registration_date > activity.registration_deadline:
        raise HTTPException(status_code=400, detail="Registration deadline has passed")
    
    # Check if activity has reached max participants
    if activity.max_participants:
        current_participants = db.query(ActivityRegistration).filter(  
            and_(
                ActivityRegistration.activity_id == activity_id,
                ActivityRegistration.payment_status != "cancelled"
            )
        ).count()
        
        if current_participants >= activity.max_participants:
            raise HTTPException(status_code=400, detail="Activity has reached maximum participants")
    
    # Check if student is already registered
    existing_registration = db.query(ActivityRegistration).filter(  
        and_(
            ActivityRegistration.student_id == registration.student_id,
            ActivityRegistration.activity_id == activity_id,
            ActivityRegistration.payment_status != "cancelled"
        )
    ).first()
    
    if existing_registration:
        raise HTTPException(status_code=400, detail="Student is already registered for this activity")
    
    # Check if student's grade is in target grades
    if hasattr(activity, 'target_grades') and activity.target_grades:
        if student.grade_level not in activity.target_grades:
            raise HTTPException(status_code=400, detail="Student's grade is not eligible for this activity")
    
    registration_data = registration.dict()
    registration_data['activity_id'] = activity_id
    registration_data['payment_amount'] = activity.cost_per_student
    
    db_registration = ActivityRegistration(**registration_data)
    db.add(db_registration)
    db.commit()
    db.refresh(db_registration)
    
    # Create response object with names
    registration_dict = {
        "id": db_registration.id,
        "student_id": db_registration.student_id,
        "activity_id": db_registration.activity_id,
        "registration_date": db_registration.registration_date,
        "payment_status": db_registration.payment_status,
        "payment_amount": db_registration.payment_amount,
        "notes": db_registration.notes,
        "student_name": f"{student.full_name}" if student else "Unknown",
        "activity_name": activity.name if activity else "Unknown",
        "created_at": db_registration.created_at,
        "updated_at": db_registration.updated_at
    }
    return ActivityRegistrationResponse(**registration_dict)

@router.put("/registrations/{registration_id}", response_model=ActivityRegistrationResponse)
async def update_activity_registration(
    registration_id: int,
    registration_update: ActivityRegistrationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Update an activity registration"""
    registration = db.query(ActivityRegistration).filter(ActivityRegistration.id == registration_id).first()  
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    update_data = registration_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(registration, field, value)
    
    db.commit()
    db.refresh(registration)
    
    # Add student and activity names to response
    student = db.query(Student).filter(Student.id == registration.student_id).first()  
    activity = db.query(Activity).filter(Activity.id == registration.activity_id).first()  
    
    # Create response object with names
    registration_dict = {
        "id": registration.id,
        "student_id": registration.student_id,
        "activity_id": registration.activity_id,
        "registration_date": registration.registration_date,
        "payment_status": registration.payment_status,
        "payment_amount": registration.payment_amount,
        "notes": registration.notes,
        "student_name": f"{student.full_name}" if student else "Unknown",
        "activity_name": activity.name if activity else "Unknown",
        "created_at": registration.created_at,
        "updated_at": registration.updated_at
    }
    return ActivityRegistrationResponse(**registration_dict)

# Activity Schedule Management
@router.get("/{activity_id}/schedule", response_model=List[ActivityScheduleResponse])
async def get_activity_schedule(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get schedule for an activity"""
    schedules = db.query(ActivitySchedule).filter(ActivitySchedule.activity_id == activity_id).all()  
    
    # Create response objects with activity name and day name
    response_schedules = []
    for schedule in schedules:
        activity = db.query(Activity).filter(Activity.id == activity_id).first()  
        
        # Create a response object with the names
        schedule_dict = {
            "id": schedule.id,
            "activity_id": schedule.activity_id,
            "day_of_week": schedule.day_of_week,
            "start_time": schedule.start_time,
            "end_time": schedule.end_time,
            "location": schedule.location,
            "instructor_name": schedule.instructor_name,
            "notes": schedule.notes,
            "activity_name": activity.name if activity else "Unknown",
            "day_name": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][schedule.day_of_week] if 0 <= schedule.day_of_week <= 6 else "Unknown",
            "created_at": schedule.created_at,
            "updated_at": schedule.updated_at
        }
        response_schedules.append(ActivityScheduleResponse(**schedule_dict))
    
    return response_schedules

@router.post("/{activity_id}/schedule", response_model=ActivityScheduleResponse)
async def create_activity_schedule(
    activity_id: int,
    schedule: ActivityScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Create a schedule for an activity"""
    # Check if activity exists
    activity = db.query(Activity).filter(Activity.id == activity_id).first()  
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Check if schedule already exists for this day
    existing_schedule = db.query(ActivitySchedule).filter(  
        and_(
            ActivitySchedule.activity_id == activity_id,
            ActivitySchedule.day_of_week == schedule.day_of_week
        )
    ).first()
    
    if existing_schedule:
        raise HTTPException(status_code=400, detail="Schedule already exists for this day")
    
    schedule_data = schedule.dict()
    schedule_data['activity_id'] = activity_id
    db_schedule = ActivitySchedule(**schedule_data)
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    # Create response object with names
    schedule_dict = {
        "id": db_schedule.id,
        "activity_id": db_schedule.activity_id,
        "day_of_week": db_schedule.day_of_week,
        "start_time": db_schedule.start_time,
        "end_time": db_schedule.end_time,
        "location": db_schedule.location,
        "instructor_name": db_schedule.instructor_name,
        "notes": db_schedule.notes,
        "activity_name": activity.name if activity else "Unknown",
        "day_name": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][schedule.day_of_week] if 0 <= schedule.day_of_week <= 6 else "Unknown",
        "created_at": db_schedule.created_at,
        "updated_at": db_schedule.updated_at
    }
    return ActivityScheduleResponse(**schedule_dict)

@router.put("/schedule/{schedule_id}", response_model=ActivityScheduleResponse)
async def update_activity_schedule(
    schedule_id: int,
    schedule_update: ActivityScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Update an activity schedule"""
    schedule = db.query(ActivitySchedule).filter(ActivitySchedule.id == schedule_id).first()  
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    update_data = schedule_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)
    
    db.commit()
    db.refresh(schedule)
    
    # Add activity name and day name to response
    activity = db.query(Activity).filter(Activity.id == schedule.activity_id).first()  
    
    # Create response object with names
    schedule_dict = {
        "id": schedule.id,
        "activity_id": schedule.activity_id,
        "day_of_week": schedule.day_of_week,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "location": schedule.location,
        "instructor_name": schedule.instructor_name,
        "notes": schedule.notes,
        "activity_name": activity.name if activity else "Unknown",
        "day_name": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][schedule.day_of_week] if 0 <= schedule.day_of_week <= 6 else "Unknown",
        "created_at": schedule.created_at,
        "updated_at": schedule.updated_at
    }
    return ActivityScheduleResponse(**schedule_dict)

@router.delete("/schedule/{schedule_id}")
async def delete_activity_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_director_user)
):
    """Delete an activity schedule"""
    schedule = db.query(ActivitySchedule).filter(ActivitySchedule.id == schedule_id).first()  
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted successfully"}

# Activity Attendance
@router.get("/registrations/{registration_id}/attendance", response_model=List[ActivityAttendanceResponse])
async def get_activity_attendance(
    registration_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get attendance records for a registration"""
    query = db.query(ActivityAttendance).filter(ActivityAttendance.registration_id == registration_id)  
    
    if start_date:
        query = query.filter(ActivityAttendance.attendance_date >= start_date)  
    
    if end_date:
        query = query.filter(ActivityAttendance.attendance_date <= end_date)  
    
    attendance_records = query.order_by(ActivityAttendance.attendance_date.desc()).all()
    
    # Create response objects with student and activity names
    response_attendance = []
    for attendance in attendance_records:
        registration = db.query(ActivityRegistration).filter(ActivityRegistration.id == registration_id).first()  
        if registration:
            student = db.query(Student).filter(Student.id == registration.student_id).first()  
            activity = db.query(Activity).filter(Activity.id == registration.activity_id).first()  
            
            # Create a response object with the names
            attendance_dict = {
                "id": attendance.id,
                "registration_id": attendance.registration_id,
                "attendance_date": attendance.attendance_date,
                "status": attendance.status,
                "notes": attendance.notes,
                "student_name": f"{student.full_name}" if student else "Unknown",
                "activity_name": activity.name if activity else "Unknown",
                "created_at": attendance.created_at,
                "updated_at": attendance.updated_at
            }
            response_attendance.append(ActivityAttendanceResponse(**attendance_dict))
        else:
            # If registration not found, still create response object
            attendance_dict = {
                "id": attendance.id,
                "registration_id": attendance.registration_id,
                "attendance_date": attendance.attendance_date,
                "status": attendance.status,
                "notes": attendance.notes,
                "student_name": "Unknown",
                "activity_name": "Unknown",
                "created_at": attendance.created_at,
                "updated_at": attendance.updated_at
            }
            response_attendance.append(ActivityAttendanceResponse(**attendance_dict))
    
    return response_attendance

@router.post("/registrations/{registration_id}/attendance", response_model=ActivityAttendanceResponse)
async def record_activity_attendance(
    registration_id: int,
    attendance: ActivityAttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Record attendance for an activity registration"""
    # Check if registration exists
    registration = db.query(ActivityRegistration).filter(ActivityRegistration.id == registration_id).first()  
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    # Check if attendance already recorded for this date
    existing_attendance = db.query(ActivityAttendance).filter(  
        and_(
            ActivityAttendance.registration_id == registration_id,
            ActivityAttendance.attendance_date == attendance.attendance_date
        )
    ).first()
    
    if existing_attendance:
        raise HTTPException(status_code=400, detail="Attendance already recorded for this date")
    
    attendance_data = attendance.dict()
    attendance_data['registration_id'] = registration_id
    db_attendance = ActivityAttendance(**attendance_data)
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    
    # Add student and activity names
    student = db.query(Student).filter(Student.id == registration.student_id).first()  
    activity = db.query(Activity).filter(Activity.id == registration.activity_id).first()  
    
    # Create response object with names
    attendance_dict = {
        "id": db_attendance.id,
        "registration_id": db_attendance.registration_id,
        "attendance_date": db_attendance.attendance_date,
        "status": db_attendance.status,
        "notes": db_attendance.notes,
        "student_name": f"{student.full_name}" if student else "Unknown",
        "activity_name": activity.name if activity else "Unknown",
        "created_at": db_attendance.created_at,
        "updated_at": db_attendance.updated_at
    }
    return ActivityAttendanceResponse(**attendance_dict)

@router.put("/attendance/{attendance_id}", response_model=ActivityAttendanceResponse)
async def update_activity_attendance(
    attendance_id: int,
    attendance_update: ActivityAttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Update an activity attendance record"""
    attendance = db.query(ActivityAttendance).filter(ActivityAttendance.id == attendance_id).first()  
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    update_data = attendance_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attendance, field, value)
    
    db.commit()
    db.refresh(attendance)
    
    # Add student and activity names to response
    registration = db.query(ActivityRegistration).filter(ActivityRegistration.id == attendance.registration_id).first()  
    if registration:
        student = db.query(Student).filter(Student.id == registration.student_id).first()  
        activity = db.query(Activity).filter(Activity.id == registration.activity_id).first()  
        
        # Create response object with names
        attendance_dict = {
            "id": attendance.id,
            "registration_id": attendance.registration_id,
            "attendance_date": attendance.attendance_date,
            "status": attendance.status,
            "notes": attendance.notes,
            "student_name": f"{student.full_name}" if student else "Unknown",
            "activity_name": activity.name if activity else "Unknown",
            "created_at": attendance.created_at,
            "updated_at": attendance.updated_at
        }
        return ActivityAttendanceResponse(**attendance_dict)
    else:
        # If registration not found, still create response object
        attendance_dict = {
            "id": attendance.id,
            "registration_id": attendance.registration_id,
            "attendance_date": attendance.attendance_date,
            "status": attendance.status,
            "notes": attendance.notes,
            "student_name": "Unknown",
            "activity_name": "Unknown",
            "created_at": attendance.created_at,
            "updated_at": attendance.updated_at
        }
        return ActivityAttendanceResponse(**attendance_dict)

# Activity Reports
@router.get("/reports/participation", response_model=List[ActivityParticipationReport])
async def get_activity_participation_report(
    academic_year_id: int,
    activity_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Get participation report for activities"""
    query = db.query(Activity).filter(Activity.academic_year_id == academic_year_id)  
    
    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)  
    
    activities = query.all()
    reports = []
    
    for activity in activities:
        # Count registrations
        total_registered = db.query(ActivityRegistration).filter(  
            and_(
                ActivityRegistration.activity_id == activity.id,
                ActivityRegistration.payment_status != "cancelled"
            )
        ).count()
        
        total_paid = db.query(ActivityRegistration).filter(  
            and_(
                ActivityRegistration.activity_id == activity.id,
                ActivityRegistration.payment_status == "paid"
            )
        ).count()
        
        # Count attendance
        total_attendance = db.query(ActivityAttendance).join(ActivityRegistration).filter(  
            and_(
                ActivityRegistration.activity_id == activity.id,
                ActivityAttendance.status == "present"
            )
        ).count()
        
        # Calculate attendance rate
        total_possible_attendance = db.query(ActivityAttendance).join(ActivityRegistration).filter(  
            ActivityRegistration.activity_id == activity.id
        ).count()
        
        attendance_rate = (total_attendance / total_possible_attendance * 100) if total_possible_attendance > 0 else 0
        
        # Calculate revenue
        revenue_result = db.query(func.sum(ActivityRegistration.payment_amount)).filter(  
            and_(
                ActivityRegistration.activity_id == activity.id,
                ActivityRegistration.payment_status == "paid"
            )
        ).scalar()
        revenue_generated = revenue_result or Decimal('0.00')
        
        reports.append(ActivityParticipationReport(
            activity_id=activity.id,
            activity_name=activity.name,
            activity_type=activity.activity_type,
            total_registered=total_registered,
            total_paid=total_paid,
            total_attendance=total_attendance,
            attendance_rate=attendance_rate,
            revenue_generated=revenue_generated
        ))
    
    return reports

# Search Activities
@router.get("/search/", response_model=List[ActivityResponse])
async def search_activities(
    q: str = Query(..., min_length=1),
    activity_type: Optional[str] = Query(None),
    session_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_school_user)
):
    """Search activities by name, description, or instructor"""
    query = db.query(Activity).filter(Activity.is_active == True)  
    
    # Search in multiple fields
    search_filter = (  
        Activity.name.ilike(f"%{q}%") |
        Activity.description.ilike(f"%{q}%") |
        Activity.instructor_name.ilike(f"%{q}%") |
        Activity.location.ilike(f"%{q}%")
    )
    
    query = query.filter(search_filter)  
    
    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)  
    
    if session_type:
        query = query.filter(  
            (Activity.session_type == session_type) | 
            (Activity.session_type == "both")
        )
    
    activities = query.offset(skip).limit(limit).all()  
    
    # Create response objects with current participants count
    response_activities = []
    for activity in activities:
        participant_count = db.query(ActivityRegistration).filter(  
            and_(
                ActivityRegistration.activity_id == activity.id,
                ActivityRegistration.payment_status != "cancelled"
            )
        ).count()
        
        # Create a response object with the current_participants attribute
        activity_dict = {
            "id": activity.id,
            "academic_year_id": activity.academic_year_id,
            "name": activity.name,
            "description": activity.description,
            "activity_type": activity.activity_type,
            "session_type": activity.session_type,
            "target_grades": activity.target_grades,
            "max_participants": activity.max_participants,
            "cost_per_student": activity.cost_per_student,
            "start_date": activity.start_date,
            "end_date": activity.end_date,
            "registration_deadline": activity.registration_deadline,
            "location": activity.location,
            "instructor_name": activity.instructor_name,
            "requirements": activity.requirements,
            "is_active": activity.is_active,
            "current_participants": participant_count,
            "images": activity.images,
            "created_at": activity.created_at,
            "updated_at": activity.updated_at
        }
        response_activities.append(ActivityResponse(**activity_dict))
    
    return response_activities