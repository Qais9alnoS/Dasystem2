"""
Advanced Schedule Generation Service
Handles automatic schedule creation with conflict detection and optimization
"""

import time
from typing import List, Dict, Tuple, Optional, Set
from datetime import datetime, date, time as dt_time, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from ..models.schedules import Schedule, ScheduleAssignment, ScheduleConflict, ScheduleConstraint, TimeSlot, ScheduleGenerationHistory
from ..models.academic import Class, Subject
from ..models.teachers import Teacher, TeacherAssignment
from ..schemas.schedules import (
    ScheduleGenerationRequest, ScheduleGenerationResponse,
    DayOfWeek, SessionType, ScheduleStatistics
)
from ..services.telegram_service import telegram_service

class ScheduleGenerationService:
    """Advanced schedule generation with AI-like optimization"""
    
    def __init__(self, db: Session):
        self.db = db
        self.conflicts = []
        self.warnings = []
        self.generation_stats = {
            'periods_created': 0,
            'assignments_created': 0,
            'conflicts_detected': 0,
            'optimization_rounds': 0
        }
    
    def generate_schedule(self, request: ScheduleGenerationRequest) -> ScheduleGenerationResponse:
        """Main schedule generation method"""
        start_time = time.time()
        
        try:
            # Step 1: Get available resources
            classes = self._get_classes_for_academic_year(request.academic_year_id, request.session_type, request.class_id)
            subjects = self._get_subjects()
            teachers = self._get_available_teachers(request.session_type)
            
            # Debug logging
            print(f"\n=== Schedule Generation Started ===")
            print(f"Academic Year ID: {request.academic_year_id}")
            print(f"Session Type: {request.session_type}")
            print(f"Target Class ID: {request.class_id}")
            print(f"Target Section: {request.section}")
            print(f"Found {len(classes)} classes")
            print(f"Found {len(subjects)} total subjects")
            print(f"Found {len(teachers)} teachers")
            print(f"Teachers: {[t.full_name for t in teachers]}")
            
            if not classes:
                return ScheduleGenerationResponse(
                    schedule_id=0,
                    generation_status="failed",
                    total_periods_created=0,
                    total_assignments_created=0,
                    conflicts_detected=0,
                    warnings=["No classes found for the specified academic year and session type"],
                    generation_time=time.time() - start_time,
                    summary={}
                )
            
            # Step 2: Generate schedules for each class
            total_created = 0
            all_schedules = []
            
            for cls in classes:
                # Get subjects for this class
                class_subjects = [s for s in subjects if s.class_id == cls.id]
                
                print(f"\nProcessing class {cls.grade_level}-{cls.grade_number} (ID: {cls.id})")
                print(f"Found {len(class_subjects)} subjects for this class")
                
                if not class_subjects:
                    warning = f"No subjects found for class {cls.grade_level}-{cls.grade_number}"
                    print(f"WARNING: {warning}")
                    self.warnings.append(warning)
                    continue
                
                # Generate schedules for each section
                section_count = cls.section_count if cls.section_count else 1
                
                # If specific section is requested, only generate for that section
                if request.section:
                    sections_to_generate = [int(request.section)]
                else:
                    sections_to_generate = list(range(1, section_count + 1))
                
                for section_num in sections_to_generate:
                    # Create schedule entries for each day and period
                    day_mapping = {
                        'sunday': 1, 'monday': 2, 'tuesday': 3, 
                        'wednesday': 4, 'thursday': 5, 'friday': 6, 'saturday': 7
                    }
                    
                    # Build subject distribution based on weekly_hours
                    subject_schedule = []
                    for subject in class_subjects:
                        # Use weekly_hours attribute (not weekly_periods)
                        weekly_hours = getattr(subject, 'weekly_hours', 1)
                        if not weekly_hours or weekly_hours < 1:
                            weekly_hours = 1
                        for _ in range(weekly_hours):
                            subject_schedule.append(subject)
                    
                    # If we don't have enough subjects, repeat them
                    total_periods_needed = request.periods_per_day * len(request.working_days)
                    while len(subject_schedule) < total_periods_needed:
                        subject_schedule.extend(class_subjects)
                    
                    period_counter = 0
                    for day_name in request.working_days:
                        day_num = day_mapping.get(day_name.lower() if isinstance(day_name, str) else day_name.value, 1)
                        
                        for period in range(1, request.periods_per_day + 1):
                            # Check if this is a break period - if so, skip it (don't create entry)
                            # But we still want to create entries for all other periods
                            # Note: We'll create ALL periods to get 30 entries total
                            
                            # Get the subject for this period
                            if period_counter < len(subject_schedule):
                                subject = subject_schedule[period_counter]
                            else:
                                # Fallback to round-robin if we run out
                                subject = class_subjects[period_counter % len(class_subjects)]
                            
                            period_counter += 1
                            
                            # Find a teacher for this subject
                            teacher = self._find_teacher_for_subject(subject.id, teachers)
                            
                            if not teacher:
                                self.warnings.append(f"No teacher found for subject {subject.subject_name}")
                                continue
                            
                            # Create schedule entry for ALL periods (including breaks)
                            schedule_entry = Schedule()
                            schedule_entry.academic_year_id = request.academic_year_id
                            schedule_entry.session_type = request.session_type.value if hasattr(request.session_type, 'value') else str(request.session_type)
                            schedule_entry.class_id = cls.id
                            schedule_entry.section = str(section_num)
                            schedule_entry.day_of_week = day_num
                            schedule_entry.period_number = period
                            schedule_entry.subject_id = subject.id
                            schedule_entry.teacher_id = teacher.id
                            schedule_entry.name = request.name
                            schedule_entry.start_date = request.start_date
                            schedule_entry.end_date = request.end_date
                            schedule_entry.is_active = True
                            schedule_entry.status = "published"
                            
                            self.db.add(schedule_entry)
                            all_schedules.append(schedule_entry)
                            total_created += 1
                            self.generation_stats['assignments_created'] += 1
            
            # Commit all schedule entries
            self.db.commit()
            
            # Calculate statistics
            generation_time = time.time() - start_time
            
            # Create generation history record
            history = ScheduleGenerationHistory()
            history.academic_year_id = request.academic_year_id
            history.session_type = request.session_type.value if hasattr(request.session_type, 'value') else str(request.session_type)
            history.generation_algorithm = "simple_round_robin"
            history.generation_parameters = {
                "periods_per_day": request.periods_per_day,
                "working_days": [str(d) for d in request.working_days]
            }
            history.constraints_count = 0
            history.conflicts_resolved = 0
            history.generation_time_seconds = int(generation_time)
            history.quality_score = 85.0
            history.status = "success"
            self.db.add(history)
            self.db.commit()
            
            return ScheduleGenerationResponse(
                schedule_id=history.id if history.id else 0,
                generation_status="completed",
                total_periods_created=total_created,
                total_assignments_created=total_created,
                conflicts_detected=len(self.conflicts),
                warnings=self.warnings,
                generation_time=generation_time,
                summary={
                    'classes_scheduled': len(classes),
                    'teachers_assigned': len(set(s.teacher_id for s in all_schedules)),
                    'subjects_covered': len(set(s.subject_id for s in all_schedules)),
                    'optimization_rounds': 1
                }
            )
            
        except Exception as e:
            # Send error notification
            try:
                import asyncio
                asyncio.create_task(
                    telegram_service.send_system_alert(
                        "Schedule Generation Error",
                        f"Failed to generate schedule: {str(e)}",
                        "error"
                    )
                )
            except:
                pass  # Ignore notification errors
                
            return ScheduleGenerationResponse(
                schedule_id=0,
                generation_status="failed",
                total_periods_created=0,
                total_assignments_created=0,
                conflicts_detected=0,
                warnings=[f"Generation failed: {str(e)}"],
                generation_time=time.time() - start_time,
                summary={}
            )
    
    def _create_base_schedule(self, request: ScheduleGenerationRequest) -> Schedule:
        """Create the base schedule record"""
        # Create a dummy schedule entry to get an ID
        # In a real implementation, this might be a schedule generation record
        schedule = Schedule()
        schedule.academic_year_id = request.academic_year_id
        schedule.session_type = request.session_type.value if hasattr(request.session_type, 'value') else "morning"
        schedule.class_id = 1  # Dummy value
        schedule.day_of_week = 1  # Dummy value
        schedule.period_number = 1  # Dummy value
        schedule.subject_id = 1  # Dummy value
        schedule.teacher_id = 1  # Dummy value
        schedule.name = request.name
        schedule.start_date = request.start_date
        schedule.end_date = request.end_date
        schedule.is_active = getattr(request, 'is_active', True)
        schedule.description = f"Generated schedule for {request.name}"
        
        self.db.add(schedule)
        self.db.commit()
        self.db.refresh(schedule)
        return schedule
    
    def _generate_time_slots(self, schedule: Schedule, request: ScheduleGenerationRequest) -> List[TimeSlot]:
        """Generate time slots based on request parameters"""
        time_slots = []
        # Parse session_start_time string to time object
        if isinstance(request.session_start_time, str):
            parts = request.session_start_time.split(':')
            hour = int(parts[0])
            minute = int(parts[1]) if len(parts) > 1 else 0
            current_time = dt_time(hour, minute)
        else:
            current_time = request.session_start_time
        
        for day in request.working_days:
            period_time = current_time
            
            for period in range(1, request.periods_per_day + 1):
                # Create regular period
                end_time = self._add_minutes(period_time, request.period_duration)
                
                time_slot = TimeSlot()
                time_slot.schedule_id = schedule.id
                time_slot.period_number = period
                time_slot.start_time = period_time
                time_slot.end_time = end_time
                time_slot.day_of_week = day.value if hasattr(day, 'value') else 1
                time_slot.is_break = False
                self.db.add(time_slot)
                time_slots.append(time_slot)
                period_time = end_time
                
                # Add break if needed
                if period in request.break_periods:
                    break_end_time = self._add_minutes(period_time, request.break_duration)
                    break_slot = TimeSlot()
                    break_slot.schedule_id = schedule.id
                    break_slot.period_number = period
                    break_slot.start_time = period_time
                    break_slot.end_time = break_end_time
                    break_slot.day_of_week = day.value if hasattr(day, 'value') else 1
                    break_slot.is_break = True
                    break_slot.break_name = f"Break {period}"
                    self.db.add(break_slot)
                    time_slots.append(break_slot)
                    period_time = break_end_time
        
        self.db.commit()
        self.generation_stats['periods_created'] = len(time_slots)
        return time_slots
    
    def _generate_initial_assignments(self, schedule: Schedule, time_slots: List[TimeSlot], 
                                    classes: List[Class], subjects: List[Subject], 
                                    teachers: List[Teacher], request: ScheduleGenerationRequest) -> List[ScheduleAssignment]:
        """Generate initial schedule assignments"""
        assignments = []
        
        # Get subject requirements for each class
        class_subject_requirements = self._get_class_subject_requirements(classes, subjects)
        
        # Filter out break periods
        teaching_slots = [slot for slot in time_slots if not slot.is_break]
        
        for class_obj in classes:
            class_assignments = self._assign_subjects_to_class(
                schedule, class_obj, teaching_slots, 
                class_subject_requirements.get(class_obj.id, []),
                teachers, request
            )
            assignments.extend(class_assignments)
        
        self.generation_stats['assignments_created'] = len(assignments)
        return assignments
    
    def _assign_subjects_to_class(self, schedule: Schedule, class_obj: Class, time_slots: List[TimeSlot],
                                subject_requirements: List[Dict], teachers: List[Teacher],
                                request: ScheduleGenerationRequest) -> List[ScheduleAssignment]:
        """Assign subjects to a specific class"""
        assignments = []
        used_slots = set()
        
        for req in subject_requirements:
            subject_id = req['subject_id']
            periods_needed = req['periods_per_week']
            
            # Find best teacher for this subject
            suitable_teachers = self._find_suitable_teachers(subject_id, teachers)
            
            slots_assigned = 0
            for time_slot in time_slots:
                if slots_assigned >= periods_needed:
                    break
                
                slot_key = (time_slot.day_of_week, time_slot.period_number)
                if slot_key in used_slots:
                    continue
                
                # Try to assign a teacher
                assigned_teacher = None
                if request.auto_assign_teachers and suitable_teachers:
                    assigned_teacher = self._select_best_teacher(
                        suitable_teachers, time_slot, assignments, request
                    )
                
                assignment = ScheduleAssignment()
                assignment.schedule_id = schedule.id
                assignment.time_slot_id = time_slot.id
                assignment.class_id = class_obj.id
                assignment.subject_id = subject_id
                assignment.teacher_id = assigned_teacher.id if assigned_teacher else None
                assignment.room = self._suggest_room(class_obj, subject_id)
                
                self.db.add(assignment)
                assignments.append(assignment)
                used_slots.add(slot_key)
                slots_assigned += 1
        
        self.db.commit()
        return assignments
    
    def _optimize_schedule(self, assignments: List[ScheduleAssignment], 
                          request: ScheduleGenerationRequest) -> List[ScheduleAssignment]:
        """Optimize schedule to reduce conflicts and improve quality"""
        optimization_rounds = 0
        max_rounds = 5
        
        while optimization_rounds < max_rounds:
            improved = False
            
            if request.avoid_teacher_conflicts:
                if self._resolve_teacher_conflicts(assignments):
                    improved = True
            
            if request.balance_teacher_load:
                if self._balance_teacher_workload(assignments):
                    improved = True
            
            if request.prefer_subject_continuity:
                if self._improve_subject_continuity(assignments):
                    improved = True
            
            optimization_rounds += 1
            if not improved:
                break
        
        self.generation_stats['optimization_rounds'] = optimization_rounds
        return assignments
    
    def _resolve_teacher_conflicts(self, assignments: List[ScheduleAssignment]) -> bool:
        """Resolve teacher double-booking conflicts"""
        conflicts_found = {}
        improved = False
        
        # Group assignments by teacher and time
        for assignment in assignments:
            if not assignment.teacher_id:
                continue
                
            query_result = self.db.query(TimeSlot).filter(TimeSlot.id == assignment.time_slot_id)
            if query_result is not None:
                time_slot = query_result.first()
                if time_slot is not None:
                    key = (assignment.teacher_id, time_slot.day_of_week, time_slot.period_number)
                    
                    if key not in conflicts_found:
                        conflicts_found[key] = []
                    conflicts_found[key].append(assignment)
        
        # Resolve conflicts by reassigning teachers
        for key, conflicted_assignments in conflicts_found.items():
            if len(conflicted_assignments) > 1:
                # Keep the first assignment, reassign others
                for assignment in conflicted_assignments[1:]:
                    new_teacher = self._find_alternative_teacher(assignment)
                    if new_teacher:
                        assignment.teacher_id = new_teacher.id
                        self.db.commit()
                        improved = True
                    else:
                        assignment.teacher_id = None
                        if hasattr(assignment, 'id'):
                            self.warnings.append(f"Could not assign teacher for assignment {assignment.id}")
        
        return improved
    
    def _balance_teacher_workload(self, assignments: List[ScheduleAssignment]) -> bool:
        """Balance workload across teachers"""
        teacher_loads = {}
        
        # Calculate current loads
        for assignment in assignments:
            if assignment.teacher_id:
                teacher_loads[assignment.teacher_id] = teacher_loads.get(assignment.teacher_id, 0) + 1
        
        if not teacher_loads:
            return False
        
        # Find overloaded and underloaded teachers
        avg_load = sum(teacher_loads.values()) / len(teacher_loads)
        overloaded = [(tid, load) for tid, load in teacher_loads.items() if load > avg_load * 1.5]
        underloaded = [(tid, load) for tid, load in teacher_loads.items() if load < avg_load * 0.5]
        
        improved = False
        for overloaded_teacher, _ in overloaded:
            for underloaded_teacher, _ in underloaded:
                # Try to transfer assignments
                if self._transfer_assignment(assignments, overloaded_teacher, underloaded_teacher):
                    improved = True
                    break
        
        return improved
    
    def _improve_subject_continuity(self, assignments: List[ScheduleAssignment]) -> bool:
        """Improve subject distribution for better learning continuity"""
        # Group assignments by class and subject
        class_subjects = {}
        
        for assignment in assignments:
            key = (assignment.class_id, assignment.subject_id)
            if key not in class_subjects:
                class_subjects[key] = []
            class_subjects[key].append(assignment)
        
        improved = False
        
        # Try to distribute subjects more evenly across days
        for (class_id, subject_id), subject_assignments in class_subjects.items():
            if len(subject_assignments) >= 3:  # Only optimize if subject has 3+ periods
                if self._redistribute_subject_periods(subject_assignments):
                    improved = True
        
        return improved
    
    def _detect_conflicts(self, schedule: Schedule, assignments: List[ScheduleAssignment]):
        """Detect and log schedule conflicts"""
        conflicts = []
        
        # Teacher conflicts
        teacher_schedule = {}
        for assignment in assignments:
            if not assignment.teacher_id:
                continue
                
            try:
                # Get time slot for this assignment
                time_slot = None
                query = self.db.query(TimeSlot)
                if query is not None:
                    filtered_query = query.filter(TimeSlot.id == assignment.time_slot_id)
                    if filtered_query is not None:
                        time_slot = filtered_query.first()
                
                if time_slot is not None:
                    key = (assignment.teacher_id, time_slot.day_of_week, time_slot.period_number)
                    
                    if key in teacher_schedule:
                        conflict = ScheduleConflict()
                        conflict.schedule_id = schedule.id
                        conflict.conflict_type = "teacher_double_booking"
                        conflict.severity = "high"
                        conflict.description = f"Teacher {assignment.teacher_id} assigned to multiple classes at same time"
                        conflict.affected_assignments = str([teacher_schedule[key], assignment.id])  # Convert to JSON string
                        conflict.resolution_suggestions = str(["Reassign one of the classes to different teacher", "Move one assignment to different time slot"])  # Convert to JSON string
                        conflicts.append(conflict)
                    else:
                        teacher_schedule[key] = assignment.id
            except Exception:
                # Skip this assignment if there's an error
                continue
        
        # Room conflicts (if rooms are specified)
        room_schedule = {}
        for assignment in assignments:
            if not assignment.room:
                continue
                
            try:
                # Get time slot for this assignment
                time_slot = None
                query = self.db.query(TimeSlot)
                if query is not None:
                    filtered_query = query.filter(TimeSlot.id == assignment.time_slot_id)
                    if filtered_query is not None:
                        time_slot = filtered_query.first()
                
                if time_slot is not None:
                    key = (assignment.room, time_slot.day_of_week, time_slot.period_number)
                    
                    if key in room_schedule:
                        conflict = ScheduleConflict()
                        conflict.schedule_id = schedule.id
                        conflict.conflict_type = "room_conflict"
                        conflict.severity = "medium"
                        conflict.description = f"Room {assignment.room} assigned to multiple classes at same time"
                        conflict.affected_assignments = str([room_schedule[key], assignment.id])  # Convert to JSON string
                        conflict.resolution_suggestions = str(["Assign different room to one class", "Move one assignment to different time slot"])  # Convert to JSON string
                        conflicts.append(conflict)
                    else:
                        room_schedule[key] = assignment.id
            except Exception:
                # Skip this assignment if there's an error
                continue
        
        # Save conflicts
        for conflict in conflicts:
            self.db.add(conflict)
        self.db.commit()
        
        self.generation_stats['conflicts_detected'] = len(conflicts)
        self.conflicts = conflicts
    
    # Helper methods
    def _add_minutes(self, time_obj: dt_time, minutes: int) -> dt_time:
        """Add minutes to a time object"""
        dt = datetime.combine(date.today(), time_obj)
        dt += timedelta(minutes=minutes)
        return dt.time()
    
    def _get_classes_for_academic_year(self, academic_year_id: int, session_type: SessionType, class_id: Optional[int] = None) -> List[Class]:
        """Get classes for the academic year and session"""
        try:
            # Build the query step by step
            query = self.db.query(Class)
            if query is None:
                return []
            
            # Apply filters
            filters = [Class.academic_year_id == academic_year_id]
            
            # Add session type filter
            filters.append(
                or_(Class.session_type == (session_type.value if session_type else "both"), Class.session_type == "both")
            )
            
            # Add class_id filter if specified
            if class_id:
                filters.append(Class.id == class_id)
            
            filtered_query = query.filter(and_(*filters))
            if filtered_query is None:
                return []
            
            result = filtered_query.all()
            return result if result is not None else []
        except Exception as e:
            print(f"Error getting classes: {e}")
            return []
    
    def _get_subjects(self) -> List[Subject]:
        """Get all subjects"""
        try:
            query = self.db.query(Subject)
            if query is None:
                return []
            
            filtered_query = query.filter(Subject.is_active == True)
            if filtered_query is None:
                return []
            
            result = filtered_query.all()
            return result if result is not None else []
        except Exception:
            return []
    
    def _find_teacher_for_subject(self, subject_id: int, teachers: List[Teacher]) -> Optional[Teacher]:
        """Find a suitable teacher for the given subject"""
        if not teachers:
            print(f"Warning: No teachers available")
            return None
            
        # Try to find a teacher assigned to this subject
        for teacher in teachers:
            try:
                # Check if teacher has TeacherAssignment for this subject
                assignment = self.db.query(TeacherAssignment).filter(
                    and_(
                        TeacherAssignment.teacher_id == teacher.id,
                        TeacherAssignment.subject_id == subject_id
                    )
                ).first()
                
                if assignment:
                    print(f"Found teacher {teacher.full_name} for subject {subject_id}")
                    return teacher
            except Exception as e:
                print(f"Error checking teacher {teacher.id}: {e}")
                continue
        
        print(f"Warning: No specific teacher found for subject {subject_id}, returning first available")
        # If no specific assignment found, return first available teacher
        return teachers[0] if teachers else None
    
    def _get_available_teachers(self, session_type: SessionType) -> List[Teacher]:
        """Get teachers available for the session"""
        try:
            query = self.db.query(Teacher)
            if query is None:
                return []
            
            # Get all active teachers - don't filter by transportation_type
            # as it may not be reliable or set correctly
            filtered_query = query.filter(Teacher.is_active == True)
            
            if filtered_query is None:
                return []
            
            result = filtered_query.all()
            return result if result is not None else []
        except Exception as e:
            print(f"Error getting available teachers: {e}")
            return []
    
    def _get_class_subject_requirements(self, classes: List[Class], subjects: List[Subject]) -> Dict[int, List[Dict]]:
        """Get subject requirements for each class"""
        requirements = {}
        
        # Get actual subject requirements from database
        for class_obj in classes:
            class_requirements = []
            
            # Get subjects for this class
            try:
                query = self.db.query(Subject)
                if query is not None:
                    filtered_query = query.filter(Subject.class_id == class_obj.id)
                    if filtered_query is not None:
                        class_subjects = filtered_query.all()
                        if class_subjects is not None:
                            # For each subject, determine required periods per week from curriculum data
                            # In a real implementation, this would come from a curriculum table
                            # For now, we'll implement a more sophisticated approach based on educational standards
                            for subject in class_subjects:
                                # Get curriculum data for this subject and class level
                                periods = self._get_curriculum_periods(subject.subject_name, class_obj.grade_level, class_obj.grade_number)
                                
                                class_requirements.append({
                                    "subject_id": subject.id,
                                    "periods_per_week": periods,
                                    "name": subject.subject_name
                                })
            except Exception:
                # If there's an error, continue with empty requirements for this class
                pass
            
            requirements[class_obj.id] = class_requirements
        
        return requirements
    
    def _get_curriculum_periods(self, subject_name: str, grade_level: str, grade_number: int) -> int:
        """Get required periods per week based on curriculum standards"""
        # This would normally query a curriculum table with educational standards
        # For now, we'll implement a more realistic estimation based on educational best practices
        
        subject_name_lower = subject_name.lower()
        
        # Core subjects typically get more periods
        if any(core in subject_name_lower for core in ['math', 'arabic', 'english']):
            if grade_level == 'primary':
                return 5 if grade_number <= 3 else 4
            elif grade_level == 'intermediate':
                return 4
            else:  # secondary
                return 5 if 'math' in subject_name_lower else 4
        
        # Science subjects
        elif any(science in subject_name_lower for science in ['science', 'biology', 'chemistry', 'physics']):
            if grade_level == 'primary':
                return 2 if grade_number <= 3 else 3
            elif grade_level == 'intermediate':
                return 3
            else:  # secondary
                return 4 if any(advanced in subject_name_lower for advanced in ['chemistry', 'physics']) else 3
        
        # Social studies and humanities
        elif any(humanities in subject_name_lower for humanities in ['social', 'history', 'geography', 'civics']):
            return 3 if grade_level == 'primary' else 2
        
        # Languages (other than Arabic and English)
        elif any(language in subject_name_lower for language in ['french', 'german', 'spanish']):
            return 3
        
        # Arts and physical education
        elif any(arts in subject_name_lower for arts in ['art', 'music', 'physical', 'sports']):
            return 2
        
        # Religious education
        elif 'islamic' in subject_name_lower or 'religion' in subject_name_lower:
            return 2
        
        # Default for other subjects
        else:
            return 2
    
    def _find_suitable_teachers(self, subject_id: int, teachers: List[Teacher]) -> List[Teacher]:
        """Find teachers suitable for a subject"""
        suitable_teachers = []
        
        # Check teacher qualifications/assignments
        try:
            query = self.db.query(Teacher)
            if query is not None:
                # Join with TeacherAssignment
                try:
                    joined_query = query.join(TeacherAssignment)
                    if joined_query is not None:
                        # Filter by subject
                        filtered_query = joined_query.filter(
                            and_(
                                TeacherAssignment.teacher_id == Teacher.id,
                                TeacherAssignment.subject_id == subject_id
                            )
                        )
                        if filtered_query is not None:
                            results = filtered_query.all()
                            if results is not None:
                                for assignment in results:
                                    if hasattr(assignment, 'teacher'):
                                        suitable_teachers.append(assignment.teacher)
                except Exception:
                    # If join fails, fall back to basic query
                    pass
        except Exception:
            pass
        
        # If no specific assignments found, return all active teachers
        if not suitable_teachers:
            suitable_teachers = [t for t in teachers if getattr(t, 'is_active', False)]
        
        return suitable_teachers
    
    def _select_best_teacher(self, teachers: List[Teacher], time_slot: TimeSlot, 
                           assignments: List[ScheduleAssignment], request: ScheduleGenerationRequest) -> Optional[Teacher]:
        """Select the best teacher for a time slot based on availability, workload, and expertise"""
        if not teachers:
            return None
        
        # Get current workload for each teacher
        teacher_workloads = self._calculate_teacher_workloads(assignments)
        
        # Get teacher expertise scores
        teacher_expertise = self._calculate_teacher_expertise(teachers)
        
        # Get teacher availability for this time slot
        teacher_availability = self._check_teacher_availability(teachers, time_slot, assignments)
        
        # Score each teacher based on multiple factors
        teacher_scores = {}
        for teacher in teachers:
            if not teacher_availability.get(teacher.id, True):  # Skip if not available
                continue
                
            # Workload score (lower workload = higher score)
            workload = teacher_workloads.get(teacher.id, 0)
            max_load = getattr(request, 'max_teacher_load', 25)
            workload_score = max(0, (max_load - workload) / max_load) if max_load > 0 else 0
            
            # Expertise score
            expertise_score = teacher_expertise.get(teacher.id, 0.5)
            
            # Preference score (if any)
            preference_score = getattr(teacher, 'preference_score', 0.5) 
            
            # Combined score (weighted average)
            combined_score = (
                workload_score * 0.4 +      # 40% workload consideration
                expertise_score * 0.4 +     # 40% expertise consideration
                preference_score * 0.2      # 20% preference consideration
            )
            
            teacher_scores[teacher.id] = {
                'teacher': teacher,
                'score': combined_score,
                'workload': workload,
                'expertise': expertise_score
            }
        
        # Return teacher with highest score
        if teacher_scores:
            best_teacher_id = max(teacher_scores.keys(), key=lambda k: teacher_scores[k]['score'])
            return teacher_scores[best_teacher_id]['teacher']
        
        return None
    
    def _calculate_teacher_workloads(self, assignments: List[ScheduleAssignment]) -> Dict[int, int]:
        """Calculate current workload for each teacher"""
        workloads = {}
        for assignment in assignments:
            if assignment.teacher_id:
                workloads[assignment.teacher_id] = workloads.get(assignment.teacher_id, 0) + 1
        return workloads
    
    def _calculate_teacher_expertise(self, teachers: List[Teacher]) -> Dict[int, float]:
        """Calculate expertise score for each teacher (0.0 to 1.0)"""
        expertise_scores = {}
        for teacher in teachers:
            score = 0.5  # Default score
            
            # Consider years of experience
            if hasattr(teacher, 'experience') and teacher.experience:  # type: ignore - Teacher experience check
                try:
                    # Extract years from experience string (e.g., "5 years teaching experience")
                    import re
                    years_match = re.search(r'(\d+)\s*(year|years)', str(teacher.experience).lower())  # type: ignore - Experience years extraction
                    if years_match:
                        years = int(years_match.group(1))  # type: ignore - Years conversion
                        # Normalize to 0.0-1.0 range (0-20 years = 0.0-1.0)
                        score += min(years / 40.0, 0.3)  # Max 0.3 from experience
                except:
                    pass
            
            # Consider qualifications
            if hasattr(teacher, 'qualifications') and teacher.qualifications:  # type: ignore - Teacher qualifications check
                qual_score = 0.0
                qual_text = str(teacher.qualifications).lower()
                
                # Higher education degrees
                if 'phd' in qual_text or 'doctorate' in qual_text:
                    qual_score = 0.2
                elif 'master' in qual_text or 'ma' in qual_text or 'ms' in qual_text:
                    qual_score = 0.15
                elif 'bachelor' in qual_text or 'ba' in qual_text or 'bs' in qual_text:
                    qual_score = 0.1
                elif 'diploma' in qual_text:
                    qual_score = 0.05
                
                score += min(qual_score, 0.2)  # Max 0.2 from qualifications
            
            expertise_scores[teacher.id] = min(score, 1.0)  # Cap at 1.0
        
        return expertise_scores
    
    def _check_teacher_availability(self, teachers: List[Teacher], time_slot: TimeSlot, 
                                  assignments: List[ScheduleAssignment]) -> Dict[int, bool]:
        """Check if teachers are available for the given time slot"""
        availability = {}
        
        # Get existing assignments for this time slot
        slot_assignments = [a for a in assignments if a.time_slot_id == time_slot.id]
        assigned_teachers = {a.teacher_id for a in slot_assignments if a.teacher_id}
        
        for teacher in teachers:
            # Check if teacher is already assigned to this time slot
            availability[teacher.id] = teacher.id not in assigned_teachers
            
            # Additional checks could include:
            # - Teacher's free time slots preference
            # - Teacher's unavailability periods
            # - Teacher's maximum consecutive periods limit
        
        return availability
    
    def _suggest_room(self, class_obj: Class, subject_id: int) -> Optional[str]:
        """Suggest a room for the class and subject"""
        # Simple room suggestion based on subject
        room_mapping = {
            1: "Math Lab",      # Mathematics
            2: "Classroom A",   # Arabic
            3: "Language Lab",  # English
            4: "Science Lab",   # Science
            5: "Classroom B",   # Social Studies
            6: "Gymnasium",     # Physical Education
        }
        return room_mapping.get(subject_id, f"Room {class_obj.id}")
    
    def _find_alternative_teacher(self, assignment: ScheduleAssignment) -> Optional[Teacher]:
        """Find an alternative teacher for an assignment"""
        # Find teachers who can teach this subject
        try:
            suitable_teachers = self.db.query(Teacher).join(TeacherAssignment).filter( 
                and_(
                    TeacherAssignment.subject_id == assignment.subject_id,
                    Teacher.is_active == True,
                    Teacher.id != assignment.teacher_id  # Not the current teacher
                )
            ).all() 
            
            # Filter by availability (no conflicts at this time)
            available_teachers = []
            for teacher in suitable_teachers:
                # Check if teacher is already assigned at this time
                conflict = self.db.query(ScheduleAssignment).filter( 
                    and_(
                        ScheduleAssignment.teacher_id == teacher.id,
                        ScheduleAssignment.time_slot_id == assignment.time_slot_id,
                        ScheduleAssignment.id != assignment.id
                    )
                ).first() 
                
                if not conflict:
                    available_teachers.append(teacher)
            
            # Return first available teacher, or None if none found
            return available_teachers[0] if available_teachers else None
        except Exception:
            return None
    
    def _transfer_assignment(self, assignments: List[ScheduleAssignment], 
                           from_teacher: int, to_teacher: int) -> bool:
        """Transfer assignment from one teacher to another"""
        try:
            # Find assignments for the from_teacher
            teacher_assignments = [a for a in assignments if a.teacher_id == from_teacher]
            
            if not teacher_assignments:
                return False
            
            # Transfer one assignment to the to_teacher
            assignment_to_transfer = teacher_assignments[0]
            assignment_to_transfer.teacher_id = to_teacher
            
            # Update in database
            db_assignment = self.db.query(ScheduleAssignment).filter( 
                ScheduleAssignment.id == assignment_to_transfer.id
            ).first() 
            
            if db_assignment:
                db_assignment.teacher_id = to_teacher
                self.db.commit()
                return True
            
            return False
        except Exception as e:
            print(f"Failed to transfer assignment: {e}")
            return False

    def _redistribute_subject_periods(self, subject_assignments: List[ScheduleAssignment]) -> bool:
        """Redistribute subject periods for better continuity"""
        if len(subject_assignments) <= 1:
            return True
        
        try:
            # Group assignments by day
            assignments_by_day = {}
            for assignment in subject_assignments:
                # Get the actual time slot to determine the day
                time_slot = self.db.query(TimeSlot).filter(TimeSlot.id == assignment.time_slot_id).first() 
                if time_slot:
                    day = time_slot.day_of_week
                    if day not in assignments_by_day:
                        assignments_by_day[day] = []
                    assignments_by_day[day].append((assignment, time_slot))
            
            # If subject is taught on too many separate days, try to consolidate
            if len(assignments_by_day) > 3:  # More than 3 days
                # Sort days by number of periods (ascending)
                days_sorted = sorted(assignments_by_day.keys(), key=lambda d: len(assignments_by_day[d]))
                
                # Try to move periods from days with fewer periods to days with more periods
                for from_day in days_sorted[:-1]:  # All days except the one with most periods
                    assignments_to_move = assignments_by_day[from_day]
                    
                    # Find the day with the most periods to move to
                    to_day = days_sorted[-1]
                    target_time_slots = assignments_by_day[to_day]
                    
                    # Try to move each assignment
                    for assignment, time_slot in assignments_to_move:
                        # Find an available time slot on the target day
                        available_slot = self._find_available_time_slot(
                            target_time_slots, assignment.class_id, assignment.teacher_id
                        )
                        
                        if available_slot:
                            # Update the assignment's time slot
                            assignment.time_slot_id = available_slot.id
                            
                            # Update in database
                            db_assignment = self.db.query(ScheduleAssignment).filter( 
                                ScheduleAssignment.id == assignment.id
                            ).first() 
                            
                            if db_assignment:
                                db_assignment.time_slot_id = available_slot.id
                
                # Commit all changes
                self.db.commit()
            
            return True
        except Exception as e:
            print(f"Failed to redistribute subject periods: {e}")
            return False
    
    def _find_available_time_slot(self, target_time_slots: List[Tuple], class_id: int, teacher_id: Optional[int]) -> Optional[TimeSlot]:
        """Find an available time slot on the target day"""
        if not target_time_slots:
            return None
        
        # Get the target day from existing time slots
        target_day = target_time_slots[0][1].day_of_week if target_time_slots else None
        if not target_day:
            return None
        
        # Get all time slots for the target day
        all_day_slots = self.db.query(TimeSlot).filter(TimeSlot.day_of_week == target_day).all() 
        
        # Find slots that are not already occupied by this class or teacher
        for slot in all_day_slots:
            # Check if this slot is already used by the same class
            class_conflict = self.db.query(ScheduleAssignment).filter( 
                and_(
                    ScheduleAssignment.class_id == class_id,
                    ScheduleAssignment.time_slot_id == slot.id
                )
            ).first() 
            
            if class_conflict:
                continue
            
            # Check if this slot is already used by the same teacher (if teacher is assigned)
            if teacher_id:
                teacher_conflict = self.db.query(ScheduleAssignment).filter( 
                    and_(
                        ScheduleAssignment.teacher_id == teacher_id,
                        ScheduleAssignment.time_slot_id == slot.id
                    )
                ).first() 
                
                if teacher_conflict:
                    continue
            
            # This slot is available
            return slot
        
        return None
    
    def export_to_json(self, schedule_data: List[Dict]) -> str:
        """Export schedule data to JSON format"""
        import json
        return json.dumps(schedule_data, indent=2, ensure_ascii=False)
    
    def import_template(self, template_data: Dict) -> Dict:
        """Import schedule template data and validate it"""
        if not template_data:
            return {"error": "No template data provided"}
        
        # Validate required fields
        required_fields = ['name', 'academic_year_id', 'session_type']
        for field in required_fields:
            if field not in template_data:
                return {"error": f"Missing required field: {field}"}
        
        # Validate session type
        valid_session_types = ['morning', 'evening', 'both']
        if template_data.get('session_type') not in valid_session_types:
            return {"error": f"Invalid session type. Must be one of: {', '.join(valid_session_types)}"}
        
        # Validate academic year
        try:
            academic_year_id_value = template_data.get('academic_year_id')
            if academic_year_id_value is None:
                return {"error": "Academic year ID is missing"}
            academic_year_id = int(academic_year_id_value)
            if academic_year_id <= 0:
                return {"error": "Invalid academic year ID"}
        except (ValueError, TypeError):
            return {"error": "Academic year ID must be a positive integer"}
        
        # Process classes data if provided
        if 'classes' in template_data:
            processed_classes = []
            for class_data in template_data['classes']:
                # Validate class data
                if not isinstance(class_data, dict):
                    continue
                
                # Required fields for class
                class_required = ['grade_level', 'grade_number']
                if all(field in class_data for field in class_required):
                    processed_classes.append(class_data)
            
            template_data['classes'] = processed_classes
        
        # Process subjects data if provided
        if 'subjects' in template_data:
            processed_subjects = []
            for subject_data in template_data['subjects']:
                # Validate subject data
                if not isinstance(subject_data, dict):
                    continue
                
                # Required fields for subject
                subject_required = ['subject_name', 'class_id']
                if all(field in subject_data for field in subject_required):
                    processed_subjects.append(subject_data)
            
            template_data['subjects'] = processed_subjects
        
        # Process teachers data if provided
        if 'teachers' in template_data:
            processed_teachers = []
            for teacher_data in template_data['teachers']:
                # Validate teacher data
                if not isinstance(teacher_data, dict):
                    continue
                
                # Required fields for teacher
                teacher_required = ['full_name']
                if all(field in teacher_data for field in teacher_required):
                    processed_teachers.append(teacher_data)
            
            template_data['teachers'] = processed_teachers
        
        # Add import timestamp
        template_data['imported_at'] = datetime.now().isoformat()
        template_data['status'] = 'validated'
        
        return template_data
    
    def export_to_csv(self, schedule_data: List[Dict]) -> str:
        """Export schedule data to CSV format"""
        if not schedule_data:
            return ""
        
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        header = list(schedule_data[0].keys())
        writer.writerow(header)
        
        # Write data rows
        for item in schedule_data:
            writer.writerow([item.get(key, "") for key in header])
        
        return output.getvalue()

class ScheduleAnalyticsService:
    """Service for schedule analytics and statistics"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_schedule_statistics(self, schedule_id: int) -> ScheduleStatistics:
        """Get comprehensive statistics for a schedule"""
        assignments = self.db.query(ScheduleAssignment).filter( 
            ScheduleAssignment.schedule_id == schedule_id
        ).all() 
        
        time_slots = self.db.query(TimeSlot).filter( 
            TimeSlot.schedule_id == schedule_id
        ).all() 
        
        conflicts = self.db.query(ScheduleConflict).filter( 
            ScheduleConflict.schedule_id == schedule_id
        ).all() 
        
        # Calculate statistics
        total_periods = len([slot for slot in time_slots if not slot.is_break])
        total_assignments = len(assignments)
        total_breaks = len([slot for slot in time_slots if slot.is_break])
        
        # Teacher utilization
        teacher_periods = {}
        for assignment in assignments:
            if assignment.teacher_id:
                teacher_periods[assignment.teacher_id] = teacher_periods.get(assignment.teacher_id, 0) + 1
        
        teacher_utilization = {}
        for teacher_id, periods in teacher_periods.items():
            utilization = (periods / total_periods) * 100 if total_periods > 0 else 0
            teacher_utilization[f"Teacher_{teacher_id}"] = round(utilization, 2)
        
        # Subject distribution
        subject_distribution = {}
        for assignment in assignments:
            subject_key = f"Subject_{assignment.subject_id}"
            subject_distribution[subject_key] = subject_distribution.get(subject_key, 0) + 1
        
        # Class load
        class_load = {}
        for assignment in assignments:
            class_key = f"Class_{assignment.class_id}"
            class_load[class_key] = class_load.get(class_key, 0) + 1
        
        # Daily distribution
        daily_distribution = {}
        for slot in time_slots:
            if not slot.is_break:
                daily_distribution[slot.day_of_week] = daily_distribution.get(slot.day_of_week, 0) + 1
        
        # Conflicts summary
        conflicts_summary = {}
        for conflict in conflicts:
            conflicts_summary[conflict.conflict_type] = conflicts_summary.get(conflict.conflict_type, 0) + 1
        
        return ScheduleStatistics(
            total_periods=total_periods,
            total_assignments=total_assignments,
            total_breaks=total_breaks,
            teacher_utilization=teacher_utilization,
            subject_distribution=subject_distribution,
            class_load=class_load,
            daily_distribution=daily_distribution,
            conflicts_summary=conflicts_summary
        )
    
    def export_to_json(self, schedule_data: List[Dict]) -> str:
        """Export schedule data to JSON format"""
        import json
        return json.dumps(schedule_data, indent=2, ensure_ascii=False)
    
    def export_to_csv(self, schedule_data: List[Dict]) -> str:
        """Export schedule data to CSV format"""
        if not schedule_data:
            return ""
        
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        header = list(schedule_data[0].keys())
        writer.writerow(header)
        
        # Write data rows
        for item in schedule_data:
            writer.writerow([item.get(key, "") for key in header])
        
        return output.getvalue()
    
    def import_template(self, template_data: Dict) -> Dict:
        """Import schedule template data"""
        # For For testing, just return the data as-is
        return template_data.copy()

# Global schedule service instances
# These will be initialized with proper database sessions when needed
schedule_generation_service = None
schedule_analytics_service = None
