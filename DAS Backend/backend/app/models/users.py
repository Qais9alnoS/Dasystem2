from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # director, finance, morning_school, evening_school, admin
    session_type = Column(String(10))  # morning, evening - للمشرفين فقط، المدير يرى الاثنين
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))