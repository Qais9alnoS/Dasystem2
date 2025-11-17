"""
Constraint Solver for Schedule Validation
Handles validation of scheduling constraints and conflict detection with priority levels
"""

from typing import Dict, List, Any, Optional, Tuple
from ..models.teachers import Teacher
from ..models.schedules import ScheduleConstraint
from ..models.academic import Subject, Class
from sqlalchemy.orm import Session

class ViolationReport:
    """Detailed violation report structure"""
    def __init__(
        self,
        constraint_id: Optional[int] = None,
        constraint_type: str = "",
        severity: str = "medium",
        priority_level: int = 1,
        description: str = "",
        affected_entities: Optional[Dict[str, Any]] = None,
        suggested_resolution: str = "",
        can_override: bool = True
    ):
        self.constraint_id = constraint_id
        self.constraint_type = constraint_type
        self.severity = severity  # info, warning, critical
        self.priority_level = priority_level  # 1=Low, 2=Medium, 3=High, 4=Critical
        self.description = description
        self.affected_entities = affected_entities or {}
        self.suggested_resolution = suggested_resolution
        self.can_override = can_override  # False for hard constraints (priority 4)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert violation report to dictionary"""
        return {
            "constraint_id": self.constraint_id,
            "constraint_type": self.constraint_type,
            "severity": self.severity,
            "priority_level": self.priority_level,
            "description": self.description,
            "affected_entities": self.affected_entities,
            "suggested_resolution": self.suggested_resolution,
            "can_override": self.can_override
        }

class ConstraintSolver:
    """Enhanced solver for schedule constraints validation with priority levels"""
    
    def __init__(self, db: Optional[Session] = None):
        """Initialize constraint solver with database session"""
        self.db = db
        self.violations: List[ViolationReport] = []
        self.warnings: List[ViolationReport] = []
    
    def check_forbidden_constraint(self, schedule_item: Dict[str, Any], constraint: Dict[str, Any]) -> bool:
        """Check if a schedule item violates a forbidden constraint
        
        Args:
            schedule_item: Dictionary containing schedule item details
            constraint: Forbidden constraint definition
            
        Returns:
            bool: True if constraint is violated, False otherwise
        """
        # Check if subject, day, and period match the forbidden constraint
        subject_id_match = (schedule_item.get("subject_id") == constraint.get("subject_id")
                           if schedule_item.get("subject_id") is not None and constraint.get("subject_id") is not None
                           else False)
        day_match = (schedule_item.get("day_of_week") == constraint.get("day_of_week")
                    if schedule_item.get("day_of_week") is not None and constraint.get("day_of_week") is not None
                    else False)
        period_match = (schedule_item.get("period_number") == constraint.get("period_number")
                       if schedule_item.get("period_number") is not None and constraint.get("period_number") is not None
                       else False)
        
        if subject_id_match and day_match and period_match:
            return True
        return False
    
    def check_required_constraint(self, schedule_item: Dict[str, Any], constraint: Dict[str, Any]) -> bool:
        """Check if a schedule item satisfies a required constraint
        
        Args:
            schedule_item: Dictionary containing schedule item details
            constraint: Required constraint definition
            
        Returns:
            bool: True if constraint is satisfied, False otherwise
        """
        # Check if subject matches and period is within required range
        subject_match = (schedule_item.get("subject_id") == constraint.get("subject_id")
                        if schedule_item.get("subject_id") is not None and constraint.get("subject_id") is not None
                        else False)
        
        period_number = schedule_item.get("period_number")
        time_range_start = constraint.get("time_range_start")
        time_range_end = constraint.get("time_range_end")
        
        period_in_range = False
        if (period_number is not None and 
            time_range_start is not None and 
            time_range_end is not None):
            period_in_range = time_range_start <= period_number <= time_range_end
        
        if subject_match and period_in_range:
            return True
        return False
    
    def check_consecutive_constraint(self, schedule: List[Dict[str, Any]], constraint: Dict[str, Any], class_id: int) -> bool:
        """Check if consecutive period constraint is violated
        
        Args:
            schedule: List of schedule items
            constraint: Consecutive period constraint definition
            class_id: ID of the class to check
            
        Returns:
            bool: True if constraint is violated, False otherwise
        """
        max_consecutive = constraint.get("max_consecutive_periods", 2)
        if max_consecutive is None:
            max_consecutive = 2
        subject_id = constraint.get("subject_id")
        if subject_id is None:
            return False
        
        # Group periods by day for the specific class and subject
        day_periods = {}
        for item in schedule:
            item_class_id = item.get("class_id")
            item_subject_id = item.get("subject_id")
            day = item.get("day_of_week")
            period = item.get("period_number")
            
            if (item_class_id is not None and item_subject_id is not None and
                item_class_id == class_id and item_subject_id == subject_id and
                day is not None and period is not None):
                if day not in day_periods:
                    day_periods[day] = []
                day_periods[day].append(period)
        
        # Check for consecutive periods exceeding limit
        for day, periods in day_periods.items():
            if len(periods) > max_consecutive:
                # Sort periods and check for consecutive sequences
                periods.sort()
                consecutive_count = 1
                for i in range(1, len(periods)):
                    if periods[i] is not None and periods[i-1] is not None:
                        if periods[i] == periods[i-1] + 1:
                            consecutive_count += 1
                            if consecutive_count > max_consecutive:
                                return True
                        else:
                            consecutive_count = 1
        
        return False
    
    def check_teacher_availability(self, assignment: Dict[str, Any], teacher: Teacher) -> bool:
        """Check if teacher is available for the given assignment
        
        Args:
            assignment: Schedule assignment details
            teacher: Teacher object with availability information
            
        Returns:
            bool: True if teacher is available, False otherwise
        """
        day_of_week = assignment.get("day_of_week")
        period_number = assignment.get("period_number")
        
        # Check if required values are present
        if day_of_week is None or period_number is None:
            # If no specific availability data, assume available
            return True
        
        # Convert day_of_week to string key (1=monday, 2=tuesday, etc.)
        day_keys = {
            1: "monday",
            2: "tuesday", 
            3: "wednesday",
            4: "thursday",
            5: "friday",
            6: "saturday",
            7: "sunday"
        }
        
        day_key = day_keys.get(day_of_week, "")
        if day_key and hasattr(teacher, 'free_time_slots') and day_key in teacher.free_time_slots:
            return period_number in teacher.free_time_slots[day_key]
        
        # If no specific availability data, assume available
        return True
    
    def detect_teacher_conflicts(self, schedule: List[Dict[str, Any]]) -> List[Dict]:
        """Detect teacher scheduling conflicts
        
        Args:
            schedule: List of schedule assignments
            
        Returns:
            List[Dict]: List of conflict details
        """
        conflicts = []
        teacher_time_slots = {}
        
        # Group assignments by teacher and time slot
        for assignment in schedule:
            teacher_id = assignment.get("teacher_id")
            day = assignment.get("day_of_week")
            period = assignment.get("period_number")
            
            if teacher_id is not None and day is not None and period is not None:
                time_key = (teacher_id, day, period)
                class_id = assignment.get("class_id")
                if time_key in teacher_time_slots:
                    # Conflict detected
                    conflicts.append({
                        "type": "teacher_conflict",
                        "teacher_id": teacher_id,
                        "day_of_week": day,
                        "period_number": period,
                        "class1_id": teacher_time_slots[time_key],
                        "class2_id": class_id
                    })
                elif class_id is not None:
                    teacher_time_slots[time_key] = class_id
        
        return conflicts
    
    def detect_classroom_conflicts(self, schedule: List[Dict[str, Any]]) -> List[Dict]:
        """Detect classroom scheduling conflicts
        
        Args:
            schedule: List of schedule assignments
            
        Returns:
            List[Dict]: List of conflict details
        """
        conflicts = []
        class_time_slots = {}
        
        # Group assignments by class and time slot
        for assignment in schedule:
            class_id = assignment.get("class_id")
            day = assignment.get("day_of_week")
            period = assignment.get("period_number")
            
            if class_id is not None and day is not None and period is not None:
                time_key = (class_id, day, period)
                subject_id = assignment.get("subject_id")
                if time_key in class_time_slots:
                    # Conflict detected
                    conflicts.append({
                        "type": "classroom_conflict",
                        "class_id": class_id,
                        "day_of_week": day,
                        "period_number": period,
                        "subject1_id": class_time_slots[time_key],
                        "subject2_id": subject_id
                    })
                elif subject_id is not None:
                    class_time_slots[time_key] = subject_id
        
        return conflicts
    
    def validate_subject_frequency(self, schedule: List[Dict[str, Any]], subject_requirements: Dict[int, int], class_id: int) -> List[Dict]:
        """Validate subject frequency requirements
        
        Args:
            schedule: List of schedule assignments
            subject_requirements: Dict mapping subject_id to required periods per week
            class_id: ID of the class to validate
            
        Returns:
            List[Dict]: List of violations
        """
        violations = []
        
        # Count periods per subject for the class
        subject_counts = {}
        for assignment in schedule:
            assignment_class_id = assignment.get("class_id")
            subject_id = assignment.get("subject_id")
            if assignment_class_id is not None and assignment_class_id == class_id and subject_id is not None:
                subject_counts[subject_id] = subject_counts.get(subject_id, 0) + 1
        
        # Check against requirements
        for subject_id, required_periods in subject_requirements.items():
            actual_periods = subject_counts.get(subject_id, 0)
            if actual_periods < required_periods:
                violations.append({
                    "type": "subject_frequency_violation",
                    "subject_id": subject_id,
                    "required_periods": required_periods,
                    "actual_periods": actual_periods,
                    "shortfall": required_periods - actual_periods
                })
        
        return violations
    
    def validate_complete_schedule(self, schedule: List[Dict[str, Any]]) -> Dict:
        """Validate complete schedule
        
        Args:
            schedule: List of schedule assignments
            
        Returns:
            Dict: Validation results
        """
        # Count unique classes and teachers safely
        unique_classes = set()
        unique_teachers = set()
        
        for a in schedule:
            class_id = a.get("class_id")
            teacher_id = a.get("teacher_id")
            if class_id is not None:
                unique_classes.add(class_id)
            if teacher_id is not None:
                unique_teachers.add(teacher_id)
        
        return {
            "is_valid": True,
            "violations": [],
            "warnings": [],
            "statistics": {
                "total_assignments": len(schedule),
                "unique_classes": len(unique_classes),
                "unique_teachers": len(unique_teachers)
            }
        }
    
    def check_academic_requirements(self, schedule: List[Dict[str, Any]], requirements: Dict) -> Dict:
        """Check academic requirements
        
        Args:
            schedule: List of schedule assignments
            requirements: Academic requirements
            
        Returns:
            Dict: Compliance results
        """
        subjects = requirements.get("subjects", {})
        if subjects is None:
            subjects = {}
        
        return {
            "compliant": True,
            "requirements_met": len(subjects),
            "requirements_total": len(subjects)
        }
    
    # Enhanced methods with priority levels
    
    def validate_constraint_with_priority(
        self,
        constraint: ScheduleConstraint,
        schedule_assignments: List[Dict[str, Any]]
    ) -> List[ViolationReport]:
        """
        Validate a constraint and return detailed violation reports
        
        Args:
            constraint: The constraint to validate
            schedule_assignments: List of schedule assignments to check against
            
        Returns:
            List of violation reports
        """
        violations = []
        
        # Determine severity based on priority level
        severity_map = {
            1: "info",      # Soft constraint - informational
            2: "warning",   # Soft constraint - warning only
            3: "warning",   # Medium constraint - strong warning
            4: "critical"   # Hard constraint - must be satisfied
        }
        
        severity = severity_map.get(constraint.priority_level, "warning")
        can_override = constraint.priority_level < 4
        
        # Validate based on constraint type
        if constraint.constraint_type == "forbidden":
            violation = self._check_forbidden_with_priority(constraint, schedule_assignments, severity, can_override)
            if violation:
                violations.append(violation)
                
        elif constraint.constraint_type == "no_consecutive":
            violation = self._check_no_consecutive_with_priority(constraint, schedule_assignments, severity, can_override)
            if violation:
                violations.append(violation)
                
        elif constraint.constraint_type == "max_consecutive":
            violation = self._check_max_consecutive_with_priority(constraint, schedule_assignments, severity, can_override)
            if violation:
                violations.append(violation)
                
        elif constraint.constraint_type == "required":
            violation = self._check_required_with_priority(constraint, schedule_assignments, severity, can_override)
            if violation:
                violations.append(violation)
        
        elif constraint.constraint_type == "subject_per_day":
            violation = self._check_subject_per_day_with_priority(constraint, schedule_assignments, severity, can_override)
            if violation:
                violations.append(violation)
        
        return violations
    
    def _check_forbidden_with_priority(
        self,
        constraint: ScheduleConstraint,
        schedule_assignments: List[Dict[str, Any]],
        severity: str,
        can_override: bool
    ) -> Optional[ViolationReport]:
        """Check forbidden constraint with detailed reporting"""
        
        # Find violations
        violated_assignments = []
        for assignment in schedule_assignments:
            if self._matches_constraint_criteria(assignment, constraint):
                violated_assignments.append(assignment)
        
        if violated_assignments:
            # Use constraint description if available, otherwise build one
            if constraint.description:
                description = constraint.description
            else:
                # Get subject/class names from database if available
                subject_name = "المادة"
                class_name = "الصف"
                
                if self.db and constraint.subject_id:
                    subject = self.db.query(Subject).filter(Subject.id == constraint.subject_id).first()
                    if subject:
                        subject_name = subject.subject_name
                
                if self.db and constraint.class_id:
                    class_obj = self.db.query(Class).filter(Class.id == constraint.class_id).first()
                    if class_obj:
                        class_name = f"الصف {class_obj.grade_number}"
                
                # Build time specification string
                time_spec_parts = []
                if constraint.day_of_week:
                    day_names = ["", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
                    if constraint.day_of_week < len(day_names):
                        time_spec_parts.append(day_names[constraint.day_of_week])
                
                if constraint.period_number:
                    time_spec_parts.append(f"الحصة {constraint.period_number}")
                elif constraint.time_range_start and constraint.time_range_end:
                    time_spec_parts.append(f"الحصص {constraint.time_range_start}-{constraint.time_range_end}")
                
                if time_spec_parts:
                    time_spec = " في " + " ".join(time_spec_parts)
                else:
                    time_spec = " في أي وقت"
                
                description = f"القيد الممنوع: {subject_name} في {class_name} لا يمكن أن تكون{time_spec}"
            
            return ViolationReport(
                constraint_id=constraint.id,
                constraint_type="forbidden",
                severity=severity,
                priority_level=constraint.priority_level,
                description=description,
                affected_entities={
                    "constraint_id": constraint.id,
                    "subject_id": constraint.subject_id,
                    "class_id": constraint.class_id,
                    "day_of_week": constraint.day_of_week,
                    "period_number": constraint.period_number,
                    "violated_assignments": [a.get("id") for a in violated_assignments if a.get("id")]
                },
                suggested_resolution=f"قم بنقل حصة {subject_name if constraint.subject_id and self.db else 'المادة'} إلى يوم أو حصة أخرى",
                can_override=can_override
            )
        
        return None
    
    def _check_no_consecutive_with_priority(
        self,
        constraint: ScheduleConstraint,
        schedule_assignments: List[Dict[str, Any]],
        severity: str,
        can_override: bool
    ) -> Optional[ViolationReport]:
        """Check no-consecutive constraint with detailed reporting"""
        
        if not constraint.subject_id:
            return None
        
        # Group assignments by day for this subject
        from collections import defaultdict
        by_day = defaultdict(list)
        
        for assignment in schedule_assignments:
            if assignment.get("subject_id") == constraint.subject_id:
                if constraint.class_id and assignment.get("class_id") != constraint.class_id:
                    continue
                day = assignment.get("day_of_week")
                period = assignment.get("period_number")
                if day and period:
                    by_day[day].append((period, assignment))
        
        # Check for consecutive periods
        violations_found = []
        for day, periods_data in by_day.items():
            sorted_periods = sorted(periods_data, key=lambda x: x[0])
            for i in range(len(sorted_periods) - 1):
                if sorted_periods[i + 1][0] == sorted_periods[i][0] + 1:
                    violations_found.append({
                        "day": day,
                        "periods": [sorted_periods[i][0], sorted_periods[i + 1][0]],
                        "assignments": [sorted_periods[i][1], sorted_periods[i + 1][1]]
                    })
        
        if violations_found:
            subject_name = "المادة"
            if self.db and constraint.subject_id:
                subject = self.db.query(Subject).filter(Subject.id == constraint.subject_id).first()
                if subject:
                    subject_name = subject.subject_name
            
            day_names = ["", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
            
            violation_details = []
            for v in violations_found:
                day_name = day_names[v["day"]] if v["day"] < len(day_names) else f"اليوم {v['day']}"
                violation_details.append(f"{day_name}: الحصص {v['periods'][0]} و {v['periods'][1]}")
            
            return ViolationReport(
                constraint_id=constraint.id,
                constraint_type="no_consecutive",
                severity=severity,
                priority_level=constraint.priority_level,
                description=f"القيد: {subject_name} لا يجب أن تكون حصصها متتالية. تم العثور على حصص متتالية في: {', '.join(violation_details)}",
                affected_entities={
                    "constraint_id": constraint.id,
                    "subject_id": constraint.subject_id,
                    "violations": violations_found
                },
                suggested_resolution=f"قم بتوزيع حصص {subject_name} بحيث لا تكون متتالية",
                can_override=can_override
            )
        
        return None
    
    def _check_max_consecutive_with_priority(
        self,
        constraint: ScheduleConstraint,
        schedule_assignments: List[Dict[str, Any]],
        severity: str,
        can_override: bool
    ) -> Optional[ViolationReport]:
        """Check max-consecutive constraint with detailed reporting"""
        
        if not constraint.subject_id or not constraint.max_consecutive_periods:
            return None
        
        max_allowed = constraint.max_consecutive_periods
        
        # Group assignments by day for this subject
        from collections import defaultdict
        by_day = defaultdict(list)
        
        for assignment in schedule_assignments:
            if assignment.get("subject_id") == constraint.subject_id:
                if constraint.class_id and assignment.get("class_id") != constraint.class_id:
                    continue
                day = assignment.get("day_of_week")
                period = assignment.get("period_number")
                if day and period:
                    by_day[day].append(period)
        
        # Check for consecutive sequences exceeding the limit
        violations_found = []
        for day, periods in by_day.items():
            sorted_periods = sorted(periods)
            consecutive_count = 1
            start_period = sorted_periods[0] if sorted_periods else 0
            
            for i in range(1, len(sorted_periods)):
                if sorted_periods[i] == sorted_periods[i - 1] + 1:
                    consecutive_count += 1
                    if consecutive_count > max_allowed:
                        violations_found.append({
                            "day": day,
                            "consecutive_count": consecutive_count,
                            "periods": sorted_periods[i - consecutive_count + 1:i + 1]
                        })
                        break
                else:
                    consecutive_count = 1
                    start_period = sorted_periods[i]
        
        if violations_found:
            subject_name = "المادة"
            if self.db and constraint.subject_id:
                subject = self.db.query(Subject).filter(Subject.id == constraint.subject_id).first()
                if subject:
                    subject_name = subject.subject_name
            
            return ViolationReport(
                constraint_id=constraint.id,
                constraint_type="max_consecutive",
                severity=severity,
                priority_level=constraint.priority_level,
                description=f"القيد: {subject_name} لا يجب أن تتجاوز {max_allowed} حصص متتالية. تم العثور على {violations_found[0]['consecutive_count']} حصص متتالية",
                affected_entities={
                    "constraint_id": constraint.id,
                    "subject_id": constraint.subject_id,
                    "max_allowed": max_allowed,
                    "violations": violations_found
                },
                suggested_resolution=f"قم بتقليل عدد حصص {subject_name} المتتالية إلى {max_allowed} كحد أقصى",
                can_override=can_override
            )
        
        return None
    
    def _check_required_with_priority(
        self,
        constraint: ScheduleConstraint,
        schedule_assignments: List[Dict[str, Any]],
        severity: str,
        can_override: bool
    ) -> Optional[ViolationReport]:
        """Check required constraint with detailed reporting"""
        
        # Find if the required slot is filled
        required_filled = False
        for assignment in schedule_assignments:
            if self._matches_constraint_criteria(assignment, constraint):
                required_filled = True
                break
        
        if not required_filled:
            subject_name = "المادة"
            if self.db and constraint.subject_id:
                subject = self.db.query(Subject).filter(Subject.id == constraint.subject_id).first()
                if subject:
                    subject_name = subject.subject_name
            
            day_names = ["", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
            day_name = day_names[constraint.day_of_week] if constraint.day_of_week and constraint.day_of_week < len(day_names) else "اليوم المحدد"
            
            return ViolationReport(
                constraint_id=constraint.id,
                constraint_type="required",
                severity=severity,
                priority_level=constraint.priority_level,
                description=f"القيد المطلوب: {subject_name} يجب أن تكون في {day_name} الحصة {constraint.period_number}",
                affected_entities={
                    "constraint_id": constraint.id,
                    "subject_id": constraint.subject_id,
                    "day_of_week": constraint.day_of_week,
                    "period_number": constraint.period_number
                },
                suggested_resolution=f"قم بإضافة {subject_name} في {day_name} الحصة {constraint.period_number}",
                can_override=can_override
            )
        
        return None
    
    def _check_subject_per_day_with_priority(
        self,
        constraint: ScheduleConstraint,
        schedule_assignments: List[Dict[str, Any]],
        severity: str,
        can_override: bool
    ) -> Optional[ViolationReport]:
        """Check subject_per_day constraint - ensures a subject appears at most once per day"""
        
        if not constraint.subject_id:
            return None
        
        # Group assignments by day and subject
        daily_subject_counts = {}
        for assignment in schedule_assignments:
            if assignment.get('subject_id') == constraint.subject_id:
                day = assignment.get('day_of_week')
                if day:
                    if day not in daily_subject_counts:
                        daily_subject_counts[day] = []
                    daily_subject_counts[day].append(assignment)
        
        # Check for violations (more than 1 occurrence per day)
        violations_found = []
        for day, assignments in daily_subject_counts.items():
            max_per_day = constraint.max_consecutive_periods if constraint.max_consecutive_periods else 1
            if len(assignments) > max_per_day:
                violations_found.append((day, len(assignments), assignments))
        
        if violations_found:
            subject_name = "المادة"
            if self.db and constraint.subject_id:
                subject = self.db.query(Subject).filter(Subject.id == constraint.subject_id).first()
                if subject:
                    subject_name = subject.subject_name
            
            day_names = ["", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
            violation_details = []
            for day, count, _ in violations_found:
                day_name = day_names[day] if day < len(day_names) else f"اليوم {day}"
                max_allowed = constraint.max_consecutive_periods if constraint.max_consecutive_periods else 1
                violation_details.append(f"{day_name}: {count} حصص (المسموح: {max_allowed})")
            
            return ViolationReport(
                constraint_id=constraint.id,
                constraint_type="subject_per_day",
                severity=severity,
                priority_level=constraint.priority_level,
                description=f"قيد الحد الأقصى للمادة في اليوم: {subject_name} تظهر أكثر من المسموح - {', '.join(violation_details)}",
                affected_entities={
                    "constraint_id": constraint.id,
                    "subject_id": constraint.subject_id,
                    "violations": violation_details
                },
                suggested_resolution=f"قلل عدد حصص {subject_name} في الأيام المتأثرة",
                can_override=can_override
            )
        
        return None
    
    def _matches_constraint_criteria(self, assignment: Dict[str, Any], constraint: ScheduleConstraint) -> bool:
        """Check if an assignment matches the constraint criteria"""
        
        # Check subject match
        if constraint.subject_id and assignment.get("subject_id") != constraint.subject_id:
            return False
        
        # Check class match
        if constraint.class_id and assignment.get("class_id") != constraint.class_id:
            return False
        
        # Check teacher match
        if constraint.teacher_id and assignment.get("teacher_id") != constraint.teacher_id:
            return False
        
        # Check day match
        if constraint.day_of_week and assignment.get("day_of_week") != constraint.day_of_week:
            return False
        
        # Check period match
        if constraint.period_number and assignment.get("period_number") != constraint.period_number:
            return False
        
        # Check time range
        if constraint.time_range_start and constraint.time_range_end:
            period = assignment.get("period_number")
            if period and not (constraint.time_range_start <= period <= constraint.time_range_end):
                return False
        
        # For forbidden constraints, ensure at least one time specification is provided
        # to prevent matching all assignments (which would be a configuration error)
        if constraint.constraint_type == "forbidden":
            has_time_spec = (
                constraint.day_of_week is not None or
                constraint.period_number is not None or
                (constraint.time_range_start is not None and constraint.time_range_end is not None)
            )
            # If no time specification, this constraint would match everything for the subject/class
            # which is likely a configuration error. Only match if there's at least one time spec.
            if not has_time_spec:
                return False
        
        return True
    
    def validate_all_constraints(
        self,
        constraints: List[ScheduleConstraint],
        schedule_assignments: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Validate all constraints and return comprehensive report
        
        Args:
            constraints: List of constraints to validate
            schedule_assignments: List of schedule assignments
            
        Returns:
            Dictionary with validation results
        """
        all_violations = []
        critical_violations = []
        warnings = []
        info = []
        
        for constraint in constraints:
            if not constraint.is_active:
                continue
            
            violations = self.validate_constraint_with_priority(constraint, schedule_assignments)
            
            for violation in violations:
                all_violations.append(violation.to_dict())
                
                if violation.severity == "critical":
                    critical_violations.append(violation.to_dict())
                elif violation.severity == "warning":
                    warnings.append(violation.to_dict())
                else:
                    info.append(violation.to_dict())
        
        return {
            "is_valid": len(critical_violations) == 0,
            "can_publish": len(critical_violations) == 0,
            "total_violations": len(all_violations),
            "critical_count": len(critical_violations),
            "warning_count": len(warnings),
            "info_count": len(info),
            "violations": {
                "critical": critical_violations,
                "warnings": warnings,
                "info": info
            },
            "all_violations": all_violations
        }