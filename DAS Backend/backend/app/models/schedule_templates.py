"""
Schedule Templates Model
Allows saving successful schedules as reusable templates
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import BaseModel

class ScheduleTemplate(BaseModel):
    __tablename__ = "schedule_templates"
    
    # Template metadata
    template_name = Column(String(200), nullable=False)
    description = Column(Text)
    grade_level = Column(String(20), nullable=False)  # primary, intermediate, secondary
    grade_number = Column(Integer, nullable=False)
    session_type = Column(String(10), nullable=False)  # morning, evening
    
    # Template configuration
    template_data = Column(JSON, nullable=False)  # Stores assignments, constraints, etc.
    constraint_settings = Column(JSON)  # Constraint priorities and rules
    optimization_settings = Column(JSON)  # Genetic algorithm parameters
    
    # Metadata
    created_by_id = Column(Integer, ForeignKey("users.id"))
    is_public = Column(Boolean, default=False)  # Can other users see/use this template?
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)  # How many times this template was used
    success_rate = Column(Integer, default=100)  # Quality score (0-100)
    
    # Quality metrics
    quality_metrics = Column(JSON)  # Stores quality scores, conflict rates, etc.
    
    # Timestamps
    last_used_at = Column(DateTime)
    
    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    
    def __repr__(self):
        return f"<ScheduleTemplate(name='{self.template_name}', grade={self.grade_level} {self.grade_number})>"
    
    def to_dict(self):
        """Convert template to dictionary for JSON response"""
        return {
            "id": self.id,
            "template_name": self.template_name,
            "description": self.description,
            "grade_level": self.grade_level,
            "grade_number": self.grade_number,
            "session_type": self.session_type,
            "template_data": self.template_data,
            "constraint_settings": self.constraint_settings,
            "optimization_settings": self.optimization_settings,
            "is_public": self.is_public,
            "is_active": self.is_active,
            "usage_count": self.usage_count,
            "success_rate": self.success_rate,
            "quality_metrics": self.quality_metrics,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "created_by_id": self.created_by_id
        }

