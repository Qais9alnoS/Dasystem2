"""
Validation Service for Schedule Prerequisites
Checks teacher availability sufficiency and other prerequisites before schedule generation
"""

from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.academic import Class, Subject, AcademicYear
from ..models.teachers import Teacher, TeacherAssignment
from ..services.teacher_availability_service import TeacherAvailabilityService


class ValidationService:
    """Service for validating schedule prerequisites"""
    
    def __init__(self, db: Session):
        self.db = db
        self.availability_service = TeacherAvailabilityService(db)
    
    def validate_schedule_prerequisites(
        self,
        academic_year_id: int,
        class_id: int,
        section: Optional[str] = None,
        session_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive validation of all prerequisites for schedule generation
        
        Args:
            academic_year_id: Academic year ID
            class_id: Class ID
            section: Section/division
            session_type: morning or evening
            
        Returns:
            Validation results with detailed report
        """
        errors = []
        warnings = []
        missing_items = []
        suggestions = []
        
        # Check if academic year exists and is active
        academic_year = self.db.query(AcademicYear).filter(
            AcademicYear.id == academic_year_id
        ).first()
        
        if not academic_year:
            errors.append("السنة الدراسية غير موجودة")
            return {
                "is_valid": False,
                "can_proceed": False,
                "errors": errors,
                "warnings": warnings,
                "missing_items": missing_items,
                "suggestions": suggestions
            }
        
        if not academic_year.is_active:
            warnings.append("السنة الدراسية غير نشطة")
        
        # Check if class exists
        class_obj = self.db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            errors.append("الصف غير موجود")
            return {
                "is_valid": False,
                "can_proceed": False,
                "errors": errors,
                "warnings": warnings,
                "missing_items": missing_items,
                "suggestions": suggestions
            }
        
        # Get class subjects
        subjects = self.db.query(Subject).filter(
            Subject.class_id == class_id,
            Subject.is_active == True
        ).all()
        
        if not subjects:
            errors.append("لا توجد مواد معرفة لهذا الصف")
            missing_items.append("مواد دراسية")
            suggestions.append("قم بإضافة المواد الدراسية للصف")
            return {
                "is_valid": False,
                "can_proceed": False,
                "errors": errors,
                "warnings": warnings,
                "missing_items": missing_items,
                "suggestions": suggestions
            }
        
        # Check teacher assignments for each subject
        unassigned_subjects = []
        insufficient_availability = []
        subject_details = []
        
        # First pass: collect all subjects and their teacher assignments
        # Group subjects by teacher to calculate total required periods per teacher
        teacher_subjects_map = {}  # teacher_id -> list of (subject, required_periods)
        teacher_info_map = {}  # teacher_id -> teacher object
        subject_assignment_map = {}  # subject_id -> (teacher, assignment)
        
        for subject in subjects:
            # Get teacher assignment for this subject
            assignment = None
            
            if section:
                # Look for section-specific assignment first
                assignment = self.db.query(TeacherAssignment).filter(
                    TeacherAssignment.class_id == class_id,
                    TeacherAssignment.subject_id == subject.id,
                    TeacherAssignment.section == section
                ).first()
            
            # If no section-specific assignment found (or no section provided), 
            # look for a general assignment (section is NULL or empty)
            if not assignment:
                assignment = self.db.query(TeacherAssignment).filter(
                    TeacherAssignment.class_id == class_id,
                    TeacherAssignment.subject_id == subject.id,
                    (TeacherAssignment.section == None) | (TeacherAssignment.section == '')
                ).first()
            
            if not assignment:
                unassigned_subjects.append(subject.subject_name)
                subject_details.append({
                    "subject_id": subject.id,
                    "subject_name": subject.subject_name,
                    "required_periods": subject.weekly_hours,
                    "has_teacher": False,
                    "teacher_availability": "not_assigned",
                    "status": "error"
                })
                continue
            
            # Check teacher exists
            teacher = self.db.query(Teacher).filter(
                Teacher.id == assignment.teacher_id
            ).first()
            
            if not teacher:
                unassigned_subjects.append(subject.subject_name)
                subject_details.append({
                    "subject_id": subject.id,
                    "subject_name": subject.subject_name,
                    "required_periods": subject.weekly_hours,
                    "has_teacher": False,
                    "teacher_availability": "teacher_not_found",
                    "status": "error"
                })
                continue
            
            # Store mapping for second pass
            subject_assignment_map[subject.id] = (teacher, assignment)
            teacher_info_map[teacher.id] = teacher
            
            # Group by teacher
            if teacher.id not in teacher_subjects_map:
                teacher_subjects_map[teacher.id] = []
            teacher_subjects_map[teacher.id].append({
                "subject": subject,
                "required_periods": subject.weekly_hours
            })
        
        # Second pass: Check availability considering ALL subjects per teacher
        teacher_availability_cache = {}  # teacher_id -> {total_required, available_slots, is_sufficient}
        
        for teacher_id, subjects_list in teacher_subjects_map.items():
            # Calculate TOTAL required periods for this teacher across ALL their subjects
            total_required = sum(item["required_periods"] for item in subjects_list)
            
            # Get teacher's available slots
            availability_check = self.availability_service.check_teacher_sufficient_availability(
                teacher_id=teacher_id,
                required_periods=total_required
            )
            
            teacher_availability_cache[teacher_id] = {
                "total_required": total_required,
                "available_slots": availability_check["available_slots"],
                "is_sufficient": availability_check["is_sufficient"],
                "subjects_count": len(subjects_list)
            }
            
            # If insufficient, add to warnings
            if not availability_check["is_sufficient"]:
                teacher = teacher_info_map[teacher_id]
                subject_names = [item["subject"].subject_name for item in subjects_list]
                insufficient_availability.append({
                    "teacher": teacher.full_name,
                    "subjects": subject_names,
                    "total_required": total_required,
                    "available": availability_check["available_slots"]
                })
        
        # Third pass: Build subject details with corrected availability info
        for subject in subjects:
            if subject.id not in subject_assignment_map:
                continue  # Already handled as unassigned
            
            teacher, assignment = subject_assignment_map[subject.id]
            teacher_avail = teacher_availability_cache.get(teacher.id, {})
            
            subject_detail = {
                "subject_id": subject.id,
                "subject_name": subject.subject_name,
                "required_periods": subject.weekly_hours,
                "has_teacher": True,
                "teacher_id": teacher.id,
                "teacher_name": teacher.full_name,
                "available_slots": teacher_avail.get("available_slots", 0),
                "teacher_total_required": teacher_avail.get("total_required", subject.weekly_hours),
                "teacher_subjects_count": teacher_avail.get("subjects_count", 1),
                "is_sufficient": teacher_avail.get("is_sufficient", False),
                "teacher_availability": "sufficient" if teacher_avail.get("is_sufficient", False) else "insufficient"
            }
            
            if not teacher_avail.get("is_sufficient", False):
                subject_detail["status"] = "warning"
            else:
                subject_detail["status"] = "ok"
            
            subject_details.append(subject_detail)
        
        # Build error and warning messages
        if unassigned_subjects:
            errors.append(f"المواد التالية ليس لها معلم معين: {', '.join(unassigned_subjects)}")
            missing_items.extend(unassigned_subjects)
            suggestions.append("قم بتعيين معلمين لجميع المواد في صفحة إدارة المعلمين")
        
        if insufficient_availability:
            for item in insufficient_availability:
                subjects_str = "، ".join(item['subjects'])
                if len(item['subjects']) > 1:
                    warnings.append(
                        f"المعلم {item['teacher']} لديه {item['available']} فترة متاحة فقط "
                        f"لكنه يدرس {len(item['subjects'])} مواد ({subjects_str}) تحتاج إجمالي {item['total_required']} حصة"
                    )
                else:
                    warnings.append(
                        f"المعلم {item['teacher']} لديه {item['available']} فترة متاحة فقط "
                        f"لكن مادة {subjects_str} تحتاج {item['total_required']} حصة"
                    )
            suggestions.append("قم بتحديث أوقات الفراغ للمعلمين في صفحة إدارة المعلمين")
        
        # Calculate totals
        total_subjects = len(subjects)
        total_assigned = len([s for s in subject_details if s.get("has_teacher")])
        total_sufficient = len([s for s in subject_details if s.get("is_sufficient", False)])
        total_periods_needed = sum(s.weekly_hours for s in subjects)
        
        # Determine if we can proceed
        can_proceed = len(unassigned_subjects) == 0
        is_valid = can_proceed and len(insufficient_availability) == 0
        
        return {
            "is_valid": is_valid,
            "can_proceed": can_proceed,
            "has_warnings": len(warnings) > 0,
            "errors": errors,
            "warnings": warnings,
            "missing_items": missing_items,
            "suggestions": suggestions,
            "summary": {
                "total_subjects": total_subjects,
                "subjects_with_teachers": total_assigned,
                "teachers_with_sufficient_time": total_sufficient,
                "total_periods_needed": total_periods_needed,
                "unassigned_count": len(unassigned_subjects),
                "insufficient_availability_count": len(insufficient_availability)
            },
            "subject_details": subject_details,
            "academic_year": {
                "id": academic_year.id,
                "name": academic_year.year_name,
                "is_active": academic_year.is_active
            },
            "class_info": {
                "id": class_obj.id,
                "grade_number": class_obj.grade_number,
                "grade_level": class_obj.grade_level,
                "session_type": class_obj.session_type
            }
        }
    
    def check_subject_teacher_assignment(
        self,
        class_id: int,
        subject_id: int,
        section: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check if a subject has a teacher assigned
        
        Args:
            class_id: Class ID
            subject_id: Subject ID
            section: Section/division
            
        Returns:
            Assignment check result
        """
        # First, try to find a section-specific assignment if section is provided
        assignment = None
        
        if section:
            # Look for section-specific assignment first
            assignment = self.db.query(TeacherAssignment).filter(
                TeacherAssignment.class_id == class_id,
                TeacherAssignment.subject_id == subject_id,
                TeacherAssignment.section == section
            ).first()
        
        # If no section-specific assignment found (or no section provided), 
        # look for a general assignment (section is NULL or empty)
        if not assignment:
            assignment = self.db.query(TeacherAssignment).filter(
                TeacherAssignment.class_id == class_id,
                TeacherAssignment.subject_id == subject_id,
                (TeacherAssignment.section == None) | (TeacherAssignment.section == '')
            ).first()
        
        if not assignment:
            return {
                "has_teacher": False,
                "message": "لا يوجد معلم معين لهذه المادة"
            }
        
        teacher = self.db.query(Teacher).filter(
            Teacher.id == assignment.teacher_id
        ).first()
        
        if not teacher:
            return {
                "has_teacher": False,
                "message": "المعلم المعين غير موجود في النظام"
            }
        
        return {
            "has_teacher": True,
            "teacher_id": teacher.id,
            "teacher_name": teacher.full_name,
            "assignment_id": assignment.id
        }
    
    def get_class_schedule_requirements(
        self,
        class_id: int
    ) -> Dict[str, Any]:
        """
        Get schedule requirements for a class
        
        Args:
            class_id: Class ID
            
        Returns:
            Requirements summary
        """
        class_obj = self.db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            return {
                "success": False,
                "error": "الصف غير موجود"
            }
        
        subjects = self.db.query(Subject).filter(
            Subject.class_id == class_id,
            Subject.is_active == True
        ).all()
        
        total_periods = sum(s.weekly_hours for s in subjects)
        
        # Assuming 5 days x 6 periods = 30 slots per week
        max_periods = 30
        utilization_percentage = (total_periods / max_periods) * 100 if max_periods > 0 else 0
        
        return {
            "success": True,
            "class_id": class_id,
            "grade_number": class_obj.grade_number,
            "grade_level": class_obj.grade_level,
            "total_subjects": len(subjects),
            "total_periods_per_week": total_periods,
            "max_available_periods": max_periods,
            "utilization_percentage": round(utilization_percentage, 1),
            "subjects": [
                {
                    "id": s.id,
                    "name": s.subject_name,
                    "weekly_hours": s.weekly_hours
                }
                for s in subjects
            ]
        }
    
    def validate_multiple_classes(
        self,
        academic_year_id: int,
        class_ids: List[int],
        session_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate prerequisites for multiple classes at once
        
        Args:
            academic_year_id: Academic year ID
            class_ids: List of class IDs
            session_type: morning or evening
            
        Returns:
            Validation results for all classes
        """
        results = []
        overall_valid = True
        overall_can_proceed = True
        total_errors = 0
        total_warnings = 0
        
        for class_id in class_ids:
            validation = self.validate_schedule_prerequisites(
                academic_year_id=academic_year_id,
                class_id=class_id,
                session_type=session_type
            )
            
            results.append({
                "class_id": class_id,
                "class_info": validation.get("class_info"),
                "is_valid": validation["is_valid"],
                "can_proceed": validation["can_proceed"],
                "errors_count": len(validation["errors"]),
                "warnings_count": len(validation["warnings"]),
                "summary": validation["summary"]
            })
            
            if not validation["is_valid"]:
                overall_valid = False
            
            if not validation["can_proceed"]:
                overall_can_proceed = False
            
            total_errors += len(validation["errors"])
            total_warnings += len(validation["warnings"])
        
        return {
            "overall_valid": overall_valid,
            "overall_can_proceed": overall_can_proceed,
            "total_classes": len(class_ids),
            "valid_classes": sum(1 for r in results if r["is_valid"]),
            "classes_can_proceed": sum(1 for r in results if r["can_proceed"]),
            "total_errors": total_errors,
            "total_warnings": total_warnings,
            "class_results": results
        }
    
    def check_schedule_conflicts(
        self,
        academic_year_id: int,
        session_type: str,
        proposed_assignments: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Check for potential conflicts in proposed schedule assignments
        
        Args:
            academic_year_id: Academic year ID
            session_type: morning or evening
            proposed_assignments: List of proposed assignments
            
        Returns:
            Conflict check results
        """
        conflicts = []
        
        # Check for teacher double-booking
        teacher_slots = {}
        for assignment in proposed_assignments:
            teacher_id = assignment.get("teacher_id")
            day = assignment.get("day_of_week")
            period = assignment.get("period_number")
            
            if teacher_id and day and period:
                key = (teacher_id, day, period)
                if key in teacher_slots:
                    conflicts.append({
                        "type": "teacher_conflict",
                        "severity": "critical",
                        "description": f"المعلم معين لصفين في نفس الوقت",
                        "teacher_id": teacher_id,
                        "day": day,
                        "period": period,
                        "conflicting_classes": [
                            teacher_slots[key].get("class_id"),
                            assignment.get("class_id")
                        ]
                    })
                else:
                    teacher_slots[key] = assignment
        
        return {
            "has_conflicts": len(conflicts) > 0,
            "conflict_count": len(conflicts),
            "conflicts": conflicts
        }

