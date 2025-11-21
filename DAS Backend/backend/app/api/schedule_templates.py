"""
Schedule Templates API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from ..services.template_service import TemplateService
from ..models.schedule_templates import ScheduleTemplate
from ..models.users import User
from ..core.dependencies import get_current_user
from ..utils.history_helper import log_schedule_action

router = APIRouter(prefix="/schedule-templates", tags=["Schedule Templates"])

# Pydantic schemas
class TemplateCreate(BaseModel):
    schedule_id: int
    template_name: str
    description: Optional[str] = None
    is_public: bool = False

class TemplateApply(BaseModel):
    academic_year_id: int
    class_id: int
    section: Optional[str] = None

class TemplateResponse(BaseModel):
    id: int
    template_name: str
    description: Optional[str]
    grade_level: str
    grade_number: int
    session_type: str
    is_public: bool
    usage_count: int
    success_rate: int
    created_at: Optional[str]
    last_used_at: Optional[str]
    
    class Config:
        from_attributes = True

# Endpoints

@router.get("/", response_model=List[TemplateResponse])
def get_templates(
    grade_level: Optional[str] = Query(None),
    grade_number: Optional[int] = Query(None),
    session_type: Optional[str] = Query(None),
    is_public: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all templates with optional filtering"""
    service = TemplateService(db)
    templates = service.get_templates(
        grade_level=grade_level,
        grade_number=grade_number,
        session_type=session_type,
        is_public=is_public
    )
    return [TemplateResponse(**t.to_dict()) for t in templates]

@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: int, db: Session = Depends(get_db)):
    """Get a specific template"""
    template = db.query(ScheduleTemplate).filter(
        ScheduleTemplate.id == template_id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return TemplateResponse(**template.to_dict())

@router.post("/", response_model=TemplateResponse)
def create_template(
    data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new template from an existing schedule"""
    service = TemplateService(db)
    
    try:
        template = service.create_template_from_schedule(
            schedule_id=data.schedule_id,
            template_name=data.template_name,
            description=data.description,
            is_public=data.is_public
        )
        
        # Log history
        log_schedule_action(
            db=db,
            action_type="create",
            entity_type="schedule_template",
            entity_id=template.id,
            entity_name=data.template_name,
            description=f"تم إنشاء قالب جدول: {data.template_name}",
            current_user=current_user,
            new_values=data.dict()
        )
        
        return TemplateResponse(**template.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{template_id}/apply")
def apply_template(
    template_id: int,
    data: TemplateApply,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Apply a template to create a new schedule"""
    service = TemplateService(db)
    
    try:
        schedule = service.apply_template(
            template_id=template_id,
            academic_year_id=data.academic_year_id,
            class_id=data.class_id,
            section=data.section
        )
        
        # Get template name for logging
        template = db.query(ScheduleTemplate).filter(ScheduleTemplate.id == template_id).first()
        
        # Log history
        log_schedule_action(
            db=db,
            action_type="apply_template",
            entity_type="schedule_template",
            entity_id=template_id,
            entity_name=template.template_name if template else f"Template {template_id}",
            description=f"تم تطبيق قالب جدول لإنشاء جدول جديد",
            current_user=current_user,
            academic_year_id=data.academic_year_id,
            new_values=data.dict()
        )
        
        return {
            "success": True,
            "message": "Template applied successfully",
            "schedule_id": schedule.id,
            "schedule": {
                "id": schedule.id,
                "name": schedule.name,
                "status": schedule.status,
                "class_id": schedule.class_id
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete (soft delete) a template"""
    # Get template name before deletion
    template = db.query(ScheduleTemplate).filter(ScheduleTemplate.id == template_id).first()
    
    service = TemplateService(db)
    service.delete_template(template_id)
    
    # Log history
    log_schedule_action(
        db=db,
        action_type="delete",
        entity_type="schedule_template",
        entity_id=template_id,
        entity_name=template.template_name if template else f"Template {template_id}",
        description=f"تم حذف قالب جدول",
        current_user=current_user
    )
    
    return {
        "success": True,
        "message": "Template deleted successfully"
    }

@router.get("/{template_id}/stats")
def get_template_stats(template_id: int, db: Session = Depends(get_db)):
    """Get usage statistics for a template"""
    template = db.query(ScheduleTemplate).filter(
        ScheduleTemplate.id == template_id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {
        "template_id": template.id,
        "template_name": template.template_name,
        "usage_count": template.usage_count,
        "success_rate": template.success_rate,
        "quality_metrics": template.quality_metrics,
        "last_used_at": template.last_used_at.isoformat() if template.last_used_at else None
    }

