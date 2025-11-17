"""
Teacher Availability Service
Manages automatic updates to teacher free_time_slots when schedules are created/deleted
"""

import json
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.teachers import Teacher
from ..models.schedules import Schedule, ScheduleAssignment
from ..models.academic import Subject, Class


class TeacherAvailabilityService:
    """Service for managing teacher availability and auto-updating free_time_slots"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_teacher_availability(self, teacher_id: int) -> Dict[str, Any]:
        """
        Get teacher's current availability from free_time_slots JSON
        
        Returns:
            Dict with structure: {
                "slots": [{"day": 0, "period": 0, "status": "free/assigned/unavailable", "assignment": {...}}],
                "total_free": int,
                "total_assigned": int,
                "total_unavailable": int
            }
        """
        teacher = self.db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            raise ValueError(f"Teacher with ID {teacher_id} not found")
        
        # Parse free_time_slots JSON
        try:
            slots_data = json.loads(teacher.free_time_slots) if teacher.free_time_slots else []
        except (json.JSONDecodeError, TypeError):
            slots_data = []
        
        # Initialize default structure if empty
        if not slots_data:
            slots_data = self._initialize_empty_slots()
        
        # Count statuses
        # A slot is truly free only if: status='free' AND is_free=True AND no assignment exists
        total_free = sum(
            1 for s in slots_data 
            if s.get("status") == "free" 
            and s.get("is_free", s.get("status") == "free") 
            and not s.get("assignment")
        )
        total_assigned = sum(1 for s in slots_data if s.get("status") == "assigned")
        total_unavailable = sum(1 for s in slots_data if s.get("status") == "unavailable")
        
        return {
            "slots": slots_data,
            "total_free": total_free,
            "total_assigned": total_assigned,
            "total_unavailable": total_unavailable
        }
    
    def mark_slot_as_assigned(
        self, 
        teacher_id: int, 
        day: int, 
        period: int, 
        subject_id: int,
        class_id: int,
        section: Optional[str] = None,
        schedule_id: Optional[int] = None
    ) -> bool:
        """
        Mark a specific time slot as assigned for a teacher
        
        Args:
            teacher_id: Teacher ID
            day: Day of week (0-4, Sunday-Thursday)
            period: Period number (0-5)
            subject_id: Subject being taught
            class_id: Class being taught
            section: Section/division
            schedule_id: Associated schedule ID
            
        Returns:
            True if successfully marked, False otherwise
        """
        teacher = self.db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            return False
        
        # Get current slots
        try:
            slots_data = json.loads(teacher.free_time_slots) if teacher.free_time_slots else []
        except (json.JSONDecodeError, TypeError):
            slots_data = []
        
        if not slots_data:
            slots_data = self._initialize_empty_slots()
        
        # Get subject and class info for display
        subject = self.db.query(Subject).filter(Subject.id == subject_id).first()
        class_obj = self.db.query(Class).filter(Class.id == class_id).first()
        
        # Find and update the specific slot
        slot_index = day * 6 + period
        if 0 <= slot_index < len(slots_data):
            slots_data[slot_index].update({
                "day": day,
                "period": period,
                "status": "assigned",
                "is_free": False,
                "assignment": {
                    "subject_id": subject_id,
                    "subject_name": subject.subject_name if subject else "Unknown",
                    "class_id": class_id,
                    "class_name": self._get_class_display_name(class_obj) if class_obj else "Unknown",
                    "section": section,
                    "schedule_id": schedule_id
                }
            })
            
            # Save updated slots
            teacher.free_time_slots = json.dumps(slots_data)
            self.db.commit()
            return True
        
        return False
    
    def mark_slot_as_free(self, teacher_id: int, day: int, period: int) -> bool:
        """
        Mark a specific time slot as free (remove assignment)
        
        Args:
            teacher_id: Teacher ID
            day: Day of week (0-4)
            period: Period number (0-5)
            
        Returns:
            True if successfully marked as free, False otherwise
        """
        teacher = self.db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            return False
        
        # Get current slots
        try:
            slots_data = json.loads(teacher.free_time_slots) if teacher.free_time_slots else []
        except (json.JSONDecodeError, TypeError):
            slots_data = []
        
        if not slots_data:
            return False
        
        # Find and update the specific slot
        slot_index = day * 6 + period
        if 0 <= slot_index < len(slots_data):
            # Check if it was assigned (don't change manually set unavailable slots)
            if slots_data[slot_index].get("status") == "assigned":
                slots_data[slot_index] = {
                    "day": day,
                    "period": period,
                    "status": "free",
                    "is_free": True,
                    "assignment": None
                }
                
                # Save updated slots
                teacher.free_time_slots = json.dumps(slots_data)
                self.db.commit()
                return True
        
        return False
    
    def update_teacher_availability_on_schedule_save(self, schedule_id: int) -> Dict[str, Any]:
        """
        Update all teachers' availability when a schedule is saved
        
        Args:
            schedule_id: The schedule that was saved
            
        Returns:
            Dict with update results
        """
        schedule = self.db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            return {"success": False, "error": "Schedule not found"}
        
        # Get all assignments for this schedule
        assignments = self.db.query(ScheduleAssignment).filter(
            ScheduleAssignment.schedule_id == schedule_id
        ).all()
        
        updated_teachers = []
        errors = []
        
        for assignment in assignments:
            if not assignment.teacher_id:
                continue
            
            # Get the time slot info
            if assignment.time_slot_id:
                from ..models.schedules import TimeSlot
                time_slot = self.db.query(TimeSlot).filter(TimeSlot.id == assignment.time_slot_id).first()
                if time_slot:
                    day = time_slot.day_of_week - 1  # Convert 1-7 to 0-6
                    period = time_slot.period_number - 1  # Convert 1-based to 0-based
                    
                    success = self.mark_slot_as_assigned(
                        teacher_id=assignment.teacher_id,
                        day=day,
                        period=period,
                        subject_id=assignment.subject_id,
                        class_id=assignment.class_id,
                        section=schedule.section,
                        schedule_id=schedule_id
                    )
                    
                    if success:
                        if assignment.teacher_id not in updated_teachers:
                            updated_teachers.append(assignment.teacher_id)
                    else:
                        errors.append(f"Failed to update teacher {assignment.teacher_id}")
        
        return {
            "success": True,
            "updated_teachers": updated_teachers,
            "total_assignments": len(assignments),
            "errors": errors
        }
    
    def update_teacher_availability_on_schedule_delete(self, schedule_id: int) -> Dict[str, Any]:
        """
        Restore teachers' availability when a schedule is deleted
        
        Args:
            schedule_id: The schedule being deleted
            
        Returns:
            Dict with update results
        """
        # Get all assignments for this schedule before deletion
        assignments = self.db.query(ScheduleAssignment).filter(
            ScheduleAssignment.schedule_id == schedule_id
        ).all()
        
        restored_teachers = []
        errors = []
        
        for assignment in assignments:
            if not assignment.teacher_id:
                continue
            
            # Get the time slot info
            if assignment.time_slot_id:
                from ..models.schedules import TimeSlot
                time_slot = self.db.query(TimeSlot).filter(TimeSlot.id == assignment.time_slot_id).first()
                if time_slot:
                    day = time_slot.day_of_week - 1  # Convert 1-7 to 0-6
                    period = time_slot.period_number - 1  # Convert 1-based to 0-based
                    
                    success = self.mark_slot_as_free(
                        teacher_id=assignment.teacher_id,
                        day=day,
                        period=period
                    )
                    
                    if success:
                        if assignment.teacher_id not in restored_teachers:
                            restored_teachers.append(assignment.teacher_id)
                    else:
                        errors.append(f"Failed to restore teacher {assignment.teacher_id}")
        
        return {
            "success": True,
            "restored_teachers": restored_teachers,
            "total_assignments": len(assignments),
            "errors": errors
        }
    
    def check_teacher_sufficient_availability(
        self, 
        teacher_id: int, 
        required_periods: int
    ) -> Dict[str, Any]:
        """
        Check if teacher has sufficient free slots for the required periods
        
        Args:
            teacher_id: Teacher ID
            required_periods: Number of periods needed per week
            
        Returns:
            Dict with availability check result
        """
        availability = self.get_teacher_availability(teacher_id)
        
        is_sufficient = availability["total_free"] >= required_periods
        
        return {
            "teacher_id": teacher_id,
            "required_periods": required_periods,
            "available_slots": availability["total_free"],
            "is_sufficient": is_sufficient,
            "message": (
                f"كافي - المعلم لديه {availability['total_free']} فترة متاحة" 
                if is_sufficient 
                else f"غير كافي - يحتاج {required_periods} فترة ولكن لديه {availability['total_free']} فقط"
            )
        }
    
    def get_teachers_availability_for_class(
        self, 
        class_id: int, 
        section: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get availability status for all teachers assigned to a class
        
        Args:
            class_id: Class ID
            section: Section/division (optional)
            
        Returns:
            List of teacher availability statuses
        """
        from ..models.teachers import TeacherAssignment
        
        # Get all teacher assignments for this class
        query = self.db.query(TeacherAssignment).filter(
            TeacherAssignment.class_id == class_id
        )
        
        if section:
            query = query.filter(TeacherAssignment.section == section)
        
        assignments = query.all()
        
        results = []
        for assignment in assignments:
            teacher = self.db.query(Teacher).filter(Teacher.id == assignment.teacher_id).first()
            subject = self.db.query(Subject).filter(Subject.id == assignment.subject_id).first()
            
            if not teacher or not subject:
                continue
            
            availability_check = self.check_teacher_sufficient_availability(
                teacher_id=teacher.id,
                required_periods=subject.weekly_hours
            )
            
            results.append({
                "teacher_id": teacher.id,
                "teacher_name": teacher.full_name,
                "subject_id": subject.id,
                "subject_name": subject.subject_name,
                "required_periods": subject.weekly_hours,
                "available_slots": availability_check["available_slots"],
                "is_sufficient": availability_check["is_sufficient"],
                "status": "sufficient" if availability_check["is_sufficient"] else "insufficient",
                "message": availability_check["message"]
            })
        
        return results
    
    def _initialize_empty_slots(self) -> List[Dict[str, Any]]:
        """Initialize empty time slots structure (5 days x 6 periods)"""
        slots = []
        for day in range(5):  # Sunday to Thursday
            for period in range(6):  # 6 periods per day
                slots.append({
                    "day": day,
                    "period": period,
                    "status": "unavailable",  # Changed from "free" to "unavailable"
                    "is_free": False,  # Changed from True to False
                    "assignment": None
                })
        return slots
    
    def _get_class_display_name(self, class_obj: Class) -> str:
        """Get display name for a class"""
        grade_level_ar = {
            "primary": "ابتدائي",
            "intermediate": "متوسط",
            "secondary": "ثانوي"
        }
        
        level = grade_level_ar.get(class_obj.grade_level, class_obj.grade_level)
        return f"الصف {class_obj.grade_number} {level}"

