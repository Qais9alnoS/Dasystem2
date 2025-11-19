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
    #hi 
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


def _get_changes(old_values: Dict, new_values: Dict) -> Dict[str, Dict]:
    """Extract changes between old and new values"""
    changes = {}
    for key in new_values:
        if key in old_values and old_values[key] != new_values[key]:
            changes[key] = {
                "old": old_values[key],
                "new": new_values[key]
            }
    return changes


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
    "max_participants": "الحد الأقصى للمشاركين"
}
