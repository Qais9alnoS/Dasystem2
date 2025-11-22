"""
History Helper - Utilities for easy history logging integration
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.history_service import history_service
from app.models.users import User


def log_student_action(
    db: Session,
    action_type: str,
    student: Any,
    current_user: User,
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None
):
    """Log student-related actions"""
    # Determine action category based on student session type
    category = student.session_type if student.session_type in ["morning", "evening"] else "morning"
    
    # Create description
    descriptions = {
        "create": f"تم إضافة طالب جديد: {student.full_name}",
        "update": f"تم تعديل بيانات الطالب: {student.full_name}",
        "delete": f"تم حذف الطالب: {student.full_name}",
        "deactivate": f"تم إلغاء تفعيل الطالب: {student.full_name}",
        "activate": f"تم تفعيل الطالب: {student.full_name}"
    }
    
    metadata = {}
    if old_values and new_values:
        metadata["changes"] = _get_changes(old_values, new_values)
    elif new_values:
        metadata["data"] = new_values
    
    history_service.log_action(
        db=db,
        action_type=action_type,
        action_category=category,
        entity_type="student",
        entity_id=student.id,
        entity_name=student.full_name,
        description=descriptions.get(action_type, f"عملية على الطالب: {student.full_name}"),
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        academic_year_id=student.academic_year_id,
        session_type=student.session_type,
        severity="critical" if action_type == "delete" else "info",
        meta_data=metadata
    )


def log_class_action(
    db: Session,
    action_type: str,
    class_obj: Any,
    current_user: User,
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None
):
    """Log class-related actions"""
    category = class_obj.session_type if class_obj.session_type in ["morning", "evening"] else "morning"
    
    class_name = f"الصف {class_obj.grade_level} - {class_obj.grade_number}"
    
    descriptions = {
        "create": f"تم إضافة صف جديد: {class_name}",
        "update": f"تم تعديل الصف: {class_name}",
        "delete": f"تم حذف الصف: {class_name}"
    }
    
    metadata = {}
    if old_values and new_values:
        metadata["changes"] = _get_changes(old_values, new_values)
    
    history_service.log_action(
        db=db,
        action_type=action_type,
        action_category=category,
        entity_type="class",
        entity_id=class_obj.id,
        entity_name=class_name,
        description=descriptions.get(action_type, f"عملية على الصف: {class_name}"),
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        academic_year_id=class_obj.academic_year_id,
        session_type=class_obj.session_type,
        meta_data=metadata
    )


def log_finance_action(
    db: Session,
    action_type: str,
    entity_type: str,
    entity_id: int,
    entity_name: str,
    description: str,
    current_user: User,
    academic_year_id: Optional[int] = None,
    amount: Optional[float] = None,
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None
):
    """Log finance-related actions"""
    metadata = {}
    if amount:
        metadata["amount"] = amount
    if old_values and new_values:
        metadata["changes"] = _get_changes(old_values, new_values)
    elif new_values:
        metadata["data"] = new_values
    
    # Determine severity based on amount
    severity = "info"
    if amount and amount > 1000000:  # Large transactions
        severity = "warning"
    if action_type == "delete":
        severity = "critical"
    
    history_service.log_action(
        db=db,
        action_type=action_type,
        action_category="finance",
        entity_type=entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        description=description,
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        academic_year_id=academic_year_id,
        severity=severity,
        meta_data=metadata
    )


def log_director_action(
    db: Session,
    action_type: str,
    entity_type: str,
    entity_id: int,
    entity_name: str,
    description: str,
    current_user: User,
    academic_year_id: Optional[int] = None,
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None
):
    """Log director-exclusive actions"""
    metadata = {}
    if old_values and new_values:
        metadata["changes"] = _get_changes(old_values, new_values)
    elif new_values:
        metadata["data"] = new_values
    
    history_service.log_action(
        db=db,
        action_type=action_type,
        action_category="director",
        entity_type=entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        description=description,
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        academic_year_id=academic_year_id,
        severity="warning" if action_type in ["delete", "deactivate"] else "info",
        meta_data=metadata
    )


def log_activity_action(
    db: Session,
    action_type: str,
    activity: Any,
    current_user: User,
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None
):
    """Log activity-related actions"""
    descriptions = {
        "create": f"تم إضافة نشاط جديد: {activity.name}",
        "update": f"تم تعديل النشاط: {activity.name}",
        "delete": f"تم حذف النشاط: {activity.name}"
    }
    
    metadata = {}
    if old_values and new_values:
        metadata["changes"] = _get_changes(old_values, new_values)
    
    history_service.log_action(
        db=db,
        action_type=action_type,
        action_category="activity",
        entity_type="activity",
        entity_id=activity.id,
        entity_name=activity.name,
        description=descriptions.get(action_type, f"عملية على النشاط: {activity.name}"),
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        academic_year_id=activity.academic_year_id,
        session_type=activity.session_type,
        meta_data=metadata
    )


def log_teacher_action(
    db: Session,
    action_type: str,
    teacher: Any,
    current_user: User,
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None
):
    """Log teacher-related actions"""
    category = teacher.session_type if teacher.session_type in ["morning", "evening"] else "morning"
    
    descriptions = {
        "create": f"تم إضافة معلم جديد: {teacher.full_name}",
        "update": f"تم تعديل بيانات المعلم: {teacher.full_name}",
        "delete": f"تم حذف المعلم: {teacher.full_name}",
        "deactivate": f"تم إلغاء تفعيل المعلم: {teacher.full_name}"
    }
    
    metadata = {}
    if old_values and new_values:
        metadata["changes"] = _get_changes(old_values, new_values)
    elif new_values:
        metadata["data"] = new_values
    
    history_service.log_action(
        db=db,
        action_type=action_type,
        action_category=category,
        entity_type="teacher",
        entity_id=teacher.id,
        entity_name=teacher.full_name,
        description=descriptions.get(action_type, f"عملية على المعلم: {teacher.full_name}"),
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        academic_year_id=teacher.academic_year_id,
        session_type=teacher.session_type,
        severity="critical" if action_type == "delete" else "info",
        meta_data=metadata
    )


def log_subject_action(
    db: Session,
    action_type: str,
    subject: Any,
    current_user: User,
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None
):
    """Log subject-related actions"""
    descriptions = {
        "create": f"تم إضافة مادة جديدة: {subject.subject_name}",
        "update": f"تم تعديل المادة: {subject.subject_name}",
        "delete": f"تم حذف المادة: {subject.subject_name}"
    }
    
    metadata = {}
    if old_values and new_values:
        metadata["changes"] = _get_changes(old_values, new_values)
    
    # Get class info for context
    from app.models.academic import Class
    class_obj = db.query(Class).filter(Class.id == subject.class_id).first()
    category = class_obj.session_type if class_obj and class_obj.session_type in ["morning", "evening"] else "morning"
    
    history_service.log_action(
        db=db,
        action_type=action_type,
        action_category=category,
        entity_type="subject",
        entity_id=subject.id,
        entity_name=subject.subject_name,
        description=descriptions.get(action_type, f"عملية على المادة: {subject.subject_name}"),
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        academic_year_id=class_obj.academic_year_id if class_obj else None,
        session_type=category,
        severity="critical" if action_type == "delete" else "info",
        meta_data=metadata
    )


def log_academic_year_action(
    db: Session,
    action_type: str,
    year: Any,
    current_user: User,
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None
):
    """Log academic year actions"""
    descriptions = {
        "create": f"تم إنشاء سنة دراسية جديدة: {year.year_name}",
        "update": f"تم تعديل السنة الدراسية: {year.year_name}",
        "delete": f"تم حذف السنة الدراسية: {year.year_name}"
    }
    
    metadata = {}
    if old_values and new_values:
        metadata["changes"] = _get_changes(old_values, new_values)
    
    history_service.log_action(
        db=db,
        action_type=action_type,
        action_category="director",
        entity_type="academic_year",
        entity_id=year.id,
        entity_name=year.year_name,
        description=descriptions.get(action_type, f"عملية على السنة الدراسية: {year.year_name}"),
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        academic_year_id=year.id,
        severity="critical" if action_type == "delete" else "warning",
        meta_data=metadata
    )


def log_system_action(
    db: Session,
    action_type: str,
    entity_type: str,
    entity_id: int,
    entity_name: str,
    description: str,
    current_user: User,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    meta_data: Optional[Dict] = None
):
    """Log system-level actions (login, logout, config changes, etc.)"""
    metadata = meta_data or {}
    if ip_address:
        metadata["ip_address"] = ip_address
    if user_agent:
        metadata["user_agent"] = user_agent
    
    # Determine severity
    severity = "info"
    if action_type in ["login_failed", "password_change", "user_deleted"]:
        severity = "warning"
    if action_type in ["login_failed_multiple", "user_deleted", "config_critical"]:
        severity = "critical"
    
    history_service.log_action(
        db=db,
        action_type=action_type,
        action_category="system",
        entity_type=entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        description=description,
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        severity=severity,
        meta_data=metadata
    )


def log_activity_registration(
    db: Session,
    action_type: str,
    registration: Any,
    student_name: str,
    activity_name: str,
    current_user: User,
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None
):
    """Log activity registration actions"""
    descriptions = {
        "create": f"تم تسجيل {student_name} في نشاط {activity_name}",
        "update": f"تم تعديل تسجيل {student_name} في {activity_name}",
        "delete": f"تم إلغاء تسجيل {student_name} من {activity_name}"
    }
    
    metadata = {
        "student": student_name,
        "activity": activity_name,
        "payment_amount": registration.payment_amount if hasattr(registration, 'payment_amount') else None
    }
    
    if old_values and new_values:
        metadata["changes"] = _get_changes(old_values, new_values)
    
    history_service.log_action(
        db=db,
        action_type=action_type,
        action_category="activity",
        entity_type="activity_registration",
        entity_id=registration.id,
        entity_name=f"{student_name} - {activity_name}",
        description=descriptions.get(action_type, "عملية على تسجيل نشاط"),
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        severity="warning" if action_type == "delete" else "info",
        meta_data=metadata
    )


def log_activity_participants_bulk_change(
    db: Session,
    activity: Any,
    current_user: User,
    added_classes: Optional[list] = None,
    removed_classes: Optional[list] = None,
    added_students: Optional[list] = None,
    removed_students: Optional[list] = None,
    payment_updates: Optional[Dict] = None
):
    """Log bulk participant changes for an activity"""
    added_classes = added_classes or []
    removed_classes = removed_classes or []
    added_students = added_students or []
    removed_students = removed_students or []
    payment_updates = payment_updates or {}
    
    # Build detailed metadata
    metadata = {}
    changes = {}
    
    # Track class changes
    if added_classes:
        class_names = [f"الصف {c['grade_number']} - {c['session']}" for c in added_classes]
        changes["added_classes"] = {
            "old": "لا يوجد",
            "new": ", ".join(class_names)
        }
        metadata["added_classes_count"] = len(added_classes)
        metadata["added_classes_details"] = class_names
    
    if removed_classes:
        class_names = [f"الصف {c['grade_number']} - {c['session']}" for c in removed_classes]
        changes["removed_classes"] = {
            "old": ", ".join(class_names),
            "new": "تمت الإزالة"
        }
        metadata["removed_classes_count"] = len(removed_classes)
        metadata["removed_classes_details"] = class_names
    
    # Track individual student changes (not from class operations)
    if added_students:
        student_names = [s['name'] for s in added_students]
        changes["added_students"] = {
            "old": "لا يوجد",
            "new": ", ".join(student_names[:5]) + (f" + {len(student_names) - 5} آخرين" if len(student_names) > 5 else "")
        }
        metadata["added_students_count"] = len(added_students)
    
    if removed_students:
        student_names = [s['name'] for s in removed_students]
        changes["removed_students"] = {
            "old": ", ".join(student_names[:5]) + (f" + {len(student_names) - 5} آخرين" if len(student_names) > 5 else ""),
            "new": "تمت الإزالة"
        }
        metadata["removed_students_count"] = len(removed_students)
    
    # Track payment updates
    if payment_updates:
        paid_count = payment_updates.get('paid_count', 0)
        pending_count = payment_updates.get('pending_count', 0)
        metadata["payment_status"] = f"{paid_count} مدفوع، {pending_count} معلق"
    
    metadata["changes"] = changes
    
    # Build description
    description_parts = []
    if added_classes:
        description_parts.append(f"إضافة {len(added_classes)} صف")
    if removed_classes:
        description_parts.append(f"إزالة {len(removed_classes)} صف")
    if added_students:
        description_parts.append(f"إضافة {len(added_students)} طالب")
    if removed_students:
        description_parts.append(f"إزالة {len(removed_students)} طالب")
    
    description = f"تم تعديل المشاركين في {activity.name}"
    if description_parts:
        description += f" ({', '.join(description_parts)})"
    
    history_service.log_action(
        db=db,
        action_type="update",
        action_category="activity",
        entity_type="activity_participants",
        entity_id=activity.id,
        entity_name=activity.name,
        description=description,
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        academic_year_id=activity.academic_year_id,
        session_type=activity.session_type,
        severity="info",
        meta_data=metadata
    )


def log_schedule_action(
    db: Session,
    action_type: str,
    schedule: Any,
    current_user: User,
    description: str,
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None
):
    """Log schedule-related actions"""
    metadata = {}
    if old_values and new_values:
        metadata["changes"] = _get_changes(old_values, new_values)
    
    category = schedule.session_type if hasattr(schedule, 'session_type') and schedule.session_type in ["morning", "evening"] else "morning"
    
    history_service.log_action(
        db=db,
        action_type=action_type,
        action_category=category,
        entity_type="schedule",
        entity_id=schedule.id if hasattr(schedule, 'id') else 0,
        entity_name=schedule.name if hasattr(schedule, 'name') else "جدول",
        description=description,
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        academic_year_id=schedule.academic_year_id if hasattr(schedule, 'academic_year_id') else None,
        session_type=category,
        severity="critical" if action_type == "delete" else "info",
        meta_data=metadata
    )


def log_daily_action(
    db: Session,
    action_type: str,
    entity_type: str,
    entity_id: int,
    entity_name: str,
    description: str,
    current_user: User,
    session_type: Optional[str] = None,
    severity: str = "info",
    meta_data: Optional[Dict] = None
):
    """Log daily operations (attendance, student actions, etc.)"""
    category = session_type if session_type in ["morning", "evening"] else "morning"
    
    history_service.log_action(
        db=db,
        action_type=action_type,
        action_category=category,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        description=description,
        user_id=current_user.id,
        user_name=current_user.username,
        user_role=current_user.role,
        session_type=category,
        severity=severity,
        meta_data=meta_data or {}
    )


def _get_changes(old_values: Dict, new_values: Dict) -> Dict[str, Dict]:
    """Extract changes between old and new values"""
    # Fields to exclude from change tracking (complex data structures)
    excluded_fields = {
        'qualifications',   # Array data - not useful in history
        'experience',       # Array data - not useful in history
        'password_hash',    # Security sensitive
        'password',         # Security sensitive
        'created_at',       # Timestamp fields
        'updated_at',       # Timestamp fields
    }
    
    changes = {}
    for key in new_values:
        # Skip excluded fields
        if key in excluded_fields:
            continue
        
        # Special handling for free_time_slots
        if key == 'free_time_slots':
            if key in old_values:
                old_slots = old_values[key] if isinstance(old_values[key], list) else []
                new_slots = new_values[key] if isinstance(new_values[key], list) else []
                
                # Only log if there are actual changes
                if old_slots != new_slots:
                    # Create a summary of changes
                    summary = _summarize_schedule_changes(old_slots, new_slots)
                    if summary:
                        changes[key] = {
                            "old": summary["old"],
                            "new": summary["new"]
                        }
            continue
        
        # Special handling for target_grades (activity participants)
        if key == 'target_grades':
            if key in old_values and old_values[key] != new_values[key]:
                old_grades = old_values[key] if isinstance(old_values[key], list) else []
                new_grades = new_values[key] if isinstance(new_values[key], list) else []
                
                old_summary = f"{len(old_grades)} صف" if old_grades else "لا يوجد"
                new_summary = f"{len(new_grades)} صف" if new_grades else "لا يوجد"
                
                changes[key] = {
                    "old": old_summary,
                    "new": new_summary
                }
            continue
            
        if key in old_values and old_values[key] != new_values[key]:
            # Check if values are complex structures (lists/dicts) and skip them
            old_val = old_values[key]
            new_val = new_values[key]
            
            # Skip if both are lists or dicts (complex structures)
            if (isinstance(old_val, (list, dict)) and isinstance(new_val, (list, dict))):
                continue
                
            changes[key] = {
                "old": old_values[key],
                "new": new_values[key]
            }
    return changes


def _summarize_schedule_changes(old_slots: list, new_slots: list) -> dict:
    """Summarize changes in teacher free time slots"""
    days_ar = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"]
    
    # Count status types in old and new
    old_free = sum(1 for s in old_slots if s.get('status') == 'free')
    new_free = sum(1 for s in new_slots if s.get('status') == 'free')
    old_assigned = sum(1 for s in old_slots if s.get('status') == 'assigned')
    new_assigned = sum(1 for s in new_slots if s.get('status') == 'assigned')
    old_blocked = sum(1 for s in old_slots if s.get('status') == 'blocked')
    new_blocked = sum(1 for s in new_slots if s.get('status') == 'blocked')
    
    # Find specific changes
    changed_slots = []
    
    for i, new_slot in enumerate(new_slots):
        if i < len(old_slots):
            old_slot = old_slots[i]
            if old_slot.get('status') != new_slot.get('status'):
                day = new_slot.get('day', 0)
                period = new_slot.get('period', 0)
                day_name = days_ar[day] if day < len(days_ar) else f"يوم {day}"
                old_status = "متاح" if old_slot.get('status') == 'free' else "مشغول" if old_slot.get('status') == 'assigned' else "غير متاح"
                new_status = "متاح" if new_slot.get('status') == 'free' else "مشغول" if new_slot.get('status') == 'assigned' else "غير متاح"
                
                changed_slots.append({
                    "day": day_name,
                    "period": period + 1,
                    "old_status": old_status,
                    "new_status": new_status
                })
    
    if not changed_slots:
        return {}
    
    # Create readable summary with counts
    old_summary = f"متاح: {old_free}, مشغول: {old_assigned}, غير متاح: {old_blocked}"
    
    # List specific changes
    change_details = []
    for slot in changed_slots[:5]:  # Show up to 5 changes
        change_details.append(f"{slot['day']} ح{slot['period']}: {slot['old_status']} → {slot['new_status']}")
    
    new_summary = f"متاح: {new_free}, مشغول: {new_assigned}, غير متاح: {new_blocked} | " + ", ".join(change_details)
    if len(changed_slots) > 5:
        new_summary += f" + {len(changed_slots) - 5} تغييرات"
    
    return {
        "old": old_summary,
        "new": new_summary
    }


def format_arabic_number(number: float) -> str:
    """Format number for Arabic display"""
    return f"{number:,.0f}"


# Field translations for better Arabic descriptions
FIELD_TRANSLATIONS = {
    # Student fields
    "full_name": "الاسم الكامل",
    "father_name": "اسم الأب",
    "mother_name": "اسم الأم",
    "birth_date": "تاريخ الميلاد",
    "grade_number": "الصف",
    "section": "الشعبة",
    "session_type": "الفترة",
    "transportation_type": "نوع المواصلات",
    "bus_number": "رقم الباص",
    
    # Finance fields
    "school_fee": "القسط المدرسي",
    "bus_fee": "قسط الباص",
    "school_discount_value": "حسم القسط",
    "bus_discount_value": "حسم الباص",
    "payment_amount": "المبلغ المدفوع",
    "amount": "المبلغ",
    
    # Class fields
    "grade_level": "المرحلة",
    "section_count": "عدد الشعب",
    "max_students_per_section": "الحد الأقصى للطلاب",
    
    # Activity fields
    "name": "الاسم",
    "activity_type": "نوع النشاط",
    "cost_per_student": "التكلفة للطالب",
    "max_participants": "الحد الأقصى للمشاركين",
    "target_grades": "الصفوف المستهدفة",
    
    # Teacher fields
    "free_time_slots": "الأوقات المتاحة",
    
    # User fields
    "username": "اسم المستخدم",
    "role": "الصلاحية",
    "is_active": "الحالة"
}
