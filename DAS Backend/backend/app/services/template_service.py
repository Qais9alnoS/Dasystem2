"""
Schedule Template Service
Handles saving, loading, and applying schedule templates
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

from ..models.schedule_templates import ScheduleTemplate
from ..models.schedules import Schedule, ScheduleAssignment, TimeSlot, ScheduleConstraint
from ..models.academic import Class, Subject
from ..models.teachers import Teacher

class TemplateService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_template_from_schedule(
        self,
        schedule_id: int,
        template_name: str,
        description: Optional[str] = None,
        user_id: Optional[int] = None,
        is_public: bool = False
    ) -> ScheduleTemplate:
        """Create a reusable template from an existing schedule"""
        
        # Get the schedule
        schedule = self.db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise ValueError("Schedule not found")
        
        # Get class information
        class_obj = self.db.query(Class).filter(Class.id == schedule.class_id).first()
        if not class_obj:
            raise ValueError("Class not found")
        
        # Get all assignments for this schedule
        assignments = self.db.query(ScheduleAssignment).filter(
            ScheduleAssignment.schedule_id == schedule_id
        ).all()
        
        # Get all constraints for this schedule
        constraints = self.db.query(ScheduleConstraint).filter(
            ScheduleConstraint.academic_year_id == schedule.academic_year_id
        ).all()
        
        # Serialize template data
        template_data = {
            "assignments": [
                {
                    "subject_id": a.subject_id,
                    "day_of_week": self._get_time_slot_day(a.time_slot_id),
                    "period_number": self._get_time_slot_period(a.time_slot_id),
                    "room": a.room,
                    "notes": a.notes
                } for a in assignments
            ],
            "total_periods": len(assignments),
            "unique_subjects": len(set(a.subject_id for a in assignments if a.subject_id))
        }
        
        # Serialize constraints
        constraint_settings = [
            {
                "constraint_type": c.constraint_type,
                "subject_id": c.subject_id,
                "priority_level": c.priority_level,
                "day_of_week": c.day_of_week,
                "period_number": c.period_number,
                "description": c.description
            } for c in constraints
        ]
        
        # Calculate quality metrics
        quality_metrics = self._calculate_template_quality(assignments, constraints)
        
        # Create template
        template = ScheduleTemplate(
            template_name=template_name,
            description=description or f"Template created from schedule {schedule_id}",
            grade_level=class_obj.grade_level,
            grade_number=class_obj.grade_number,
            session_type=schedule.session_type,
            template_data=template_data,
            constraint_settings=constraint_settings,
            optimization_settings={},
            created_by_id=user_id,
            is_public=is_public,
            quality_metrics=quality_metrics,
            success_rate=quality_metrics.get("overall_score", 100)
        )
        
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        
        return template
    
    def apply_template(
        self,
        template_id: int,
        academic_year_id: int,
        class_id: int,
        section: Optional[str] = None
    ) -> Schedule:
        """Apply a template to create a new schedule"""
        
        # Get template
        template = self.db.query(ScheduleTemplate).filter(
            ScheduleTemplate.id == template_id
        ).first()
        if not template:
            raise ValueError("Template not found")
        
        # Get class
        class_obj = self.db.query(Class).filter(Class.id == class_id).first()
        if not class_obj:
            raise ValueError("Class not found")
        
        # Validate template compatibility
        if (template.grade_level != class_obj.grade_level or 
            template.grade_number != class_obj.grade_number):
            raise ValueError("Template is not compatible with this class")
        
        # Create new schedule
        schedule = Schedule(
            academic_year_id=academic_year_id,
            session_type=template.session_type,
            class_id=class_id,
            section=section,
            name=f"{template.template_name} - {class_obj.grade_level} {class_obj.grade_number}",
            status="draft",  # Start as draft
            description=f"Created from template: {template.template_name}"
        )
        
        self.db.add(schedule)
        self.db.flush()  # Get schedule ID
        
        # Create time slots if they don't exist
        time_slots_map = self._ensure_time_slots(academic_year_id, template.session_type)
        
        # Create assignments from template
        template_assignments = template.template_data.get("assignments", [])
        created_assignments = []
        
        for template_assignment in template_assignments:
            # Get time slot
            day = template_assignment.get("day_of_week")
            period = template_assignment.get("period_number")
            time_slot = time_slots_map.get((day, period))
            
            if not time_slot:
                continue
            
            # Find appropriate teacher for this subject
            subject_id = template_assignment.get("subject_id")
            teacher = self._find_teacher_for_subject(subject_id, class_id)
            
            if not teacher:
                continue
            
            # Create assignment
            assignment = ScheduleAssignment(
                schedule_id=schedule.id,
                class_id=class_id,
                subject_id=subject_id,
                teacher_id=teacher.id,
                time_slot_id=time_slot.id,
                room=template_assignment.get("room"),
                notes=template_assignment.get("notes")
            )
            
            self.db.add(assignment)
            created_assignments.append(assignment)
        
        # Apply constraints from template
        constraint_settings = template.constraint_settings or []
        for constraint_setting in constraint_settings:
            constraint = ScheduleConstraint(
                academic_year_id=academic_year_id,
                constraint_type=constraint_setting.get("constraint_type"),
                subject_id=constraint_setting.get("subject_id"),
                priority_level=constraint_setting.get("priority_level", 2),
                day_of_week=constraint_setting.get("day_of_week"),
                period_number=constraint_setting.get("period_number"),
                description=constraint_setting.get("description"),
                is_active=True
            )
            self.db.add(constraint)
        
        # Update template usage statistics
        template.usage_count += 1
        template.last_used_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(schedule)
        
        return schedule
    
    def get_templates(
        self,
        grade_level: Optional[str] = None,
        grade_number: Optional[int] = None,
        session_type: Optional[str] = None,
        is_public: Optional[bool] = None,
        user_id: Optional[int] = None
    ) -> List[ScheduleTemplate]:
        """Get templates with filtering"""
        
        query = self.db.query(ScheduleTemplate).filter(ScheduleTemplate.is_active == True)
        
        if grade_level:
            query = query.filter(ScheduleTemplate.grade_level == grade_level)
        
        if grade_number:
            query = query.filter(ScheduleTemplate.grade_number == grade_number)
        
        if session_type:
            query = query.filter(ScheduleTemplate.session_type == session_type)
        
        if is_public is not None:
            if is_public:
                query = query.filter(ScheduleTemplate.is_public == True)
            elif user_id:
                # Show public templates and user's own templates
                query = query.filter(
                    or_(
                        ScheduleTemplate.is_public == True,
                        ScheduleTemplate.created_by_id == user_id
                    )
                )
        
        return query.order_by(ScheduleTemplate.usage_count.desc()).all()
    
    def update_template_quality(self, template_id: int, quality_metrics: Dict[str, Any]):
        """Update template quality metrics after usage"""
        
        template = self.db.query(ScheduleTemplate).filter(
            ScheduleTemplate.id == template_id
        ).first()
        
        if template:
            template.quality_metrics = quality_metrics
            template.success_rate = quality_metrics.get("overall_score", template.success_rate)
            self.db.commit()
    
    def delete_template(self, template_id: int):
        """Soft delete a template"""
        
        template = self.db.query(ScheduleTemplate).filter(
            ScheduleTemplate.id == template_id
        ).first()
        
        if template:
            template.is_active = False
            self.db.commit()
    
    # Helper methods
    
    def _get_time_slot_day(self, time_slot_id: int) -> Optional[int]:
        """Get day of week for a time slot"""
        time_slot = self.db.query(TimeSlot).filter(TimeSlot.id == time_slot_id).first()
        return time_slot.day_of_week if time_slot else None
    
    def _get_time_slot_period(self, time_slot_id: int) -> Optional[int]:
        """Get period number for a time slot"""
        time_slot = self.db.query(TimeSlot).filter(TimeSlot.id == time_slot_id).first()
        return time_slot.period_number if time_slot else None
    
    def _calculate_template_quality(
        self,
        assignments: List[ScheduleAssignment],
        constraints: List[ScheduleConstraint]
    ) -> Dict[str, Any]:
        """Calculate quality metrics for a template"""
        
        # Basic metrics
        total_assignments = len(assignments)
        unique_subjects = len(set(a.subject_id for a in assignments if a.subject_id))
        unique_teachers = len(set(a.teacher_id for a in assignments if a.teacher_id))
        
        # Check for conflicts
        conflicts = 0
        teacher_slots = set()
        for assignment in assignments:
            if assignment.teacher_id and assignment.time_slot_id:
                key = (assignment.teacher_id, assignment.time_slot_id)
                if key in teacher_slots:
                    conflicts += 1
                else:
                    teacher_slots.add(key)
        
        # Calculate overall score
        conflict_penalty = (conflicts / max(total_assignments, 1)) * 100
        overall_score = max(0, 100 - conflict_penalty)
        
        return {
            "total_assignments": total_assignments,
            "unique_subjects": unique_subjects,
            "unique_teachers": unique_teachers,
            "conflicts": conflicts,
            "constraint_count": len(constraints),
            "overall_score": int(overall_score)
        }
    
    def _ensure_time_slots(
        self,
        academic_year_id: int,
        session_type: str
    ) -> Dict[tuple, TimeSlot]:
        """Ensure time slots exist and return a map"""
        
        # Get existing time slots
        existing_slots = self.db.query(TimeSlot).filter(
            TimeSlot.academic_year_id == academic_year_id
        ).all()
        
        slots_map = {}
        for slot in existing_slots:
            slots_map[(slot.day_of_week, slot.period_number)] = slot
        
        # Create missing slots if needed
        for day in range(1, 6):  # Sunday to Thursday
            for period in range(1, 7):  # 6 periods
                if (day, period) not in slots_map:
                    # Create new time slot
                    new_slot = TimeSlot(
                        academic_year_id=academic_year_id,
                        day_of_week=day,
                        period_number=period,
                        start_time=f"{7 + period}:00",
                        end_time=f"{8 + period}:00"
                    )
                    self.db.add(new_slot)
                    self.db.flush()
                    slots_map[(day, period)] = new_slot
        
        self.db.commit()
        return slots_map
    
    def _find_teacher_for_subject(
        self,
        subject_id: int,
        class_id: int
    ) -> Optional[Teacher]:
        """Find an appropriate teacher for a subject"""
        
        # This would use TeacherAssignment to find teachers
        # For now, return None to allow manual assignment
        return None

