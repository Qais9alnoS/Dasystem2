# Backend Architecture - School Management System

## Overview
Python-based backend architecture for a comprehensive school management system with SQLite database, supporting LAN network operations, automatic backups, and multi-user access control.

## Technology Stack

### Core Technologies
- **Language:** Python 3.9+
- **Web Framework:** FastAPI or Flask
- **Database:** SQLite with SQLAlchemy ORM
- **Authentication:** JWT tokens with role-based access
- **Network:** LAN-based deployment with CORS support
- **Backup System:** Automated SQLite database backups
- **Communication:** Telegram Bot API for notifications

### Dependencies
```python
# requirements.txt
fastapi==0.104.1
sqlalchemy==2.0.23
sqlite3
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-telegram-bot==20.7
schedule==1.2.0
python-multipart==0.0.6
uvicorn==0.24.0
python-dotenv==1.0.0
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py              # Configuration settings
│   ├── database.py            # Database connection and setup
│   │
│   ├── models/                # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── academic.py        # Academic year, classes, subjects
│   │   ├── users.py           # User authentication models
│   │   ├── students.py        # Student-related models
│   │   ├── teachers.py        # Teacher-related models
│   │   ├── finance.py         # Financial models
│   │   ├── activities.py      # Activities and participation
│   │   ├── schedules.py       # Schedule and constraints models
│   │   └── director.py        # Director dashboard models
│   │
│   ├── schemas/               # Pydantic schemas for API
│   │   ├── __init__.py
│   │   ├── academic.py
│   │   ├── auth.py
│   │   ├── students.py
│   │   ├── teachers.py
│   │   ├── finance.py
│   │   ├── activities.py
│   │   ├── schedules.py
│   │   └── director.py
│   │
│   ├── api/                   # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── academic.py        # Academic year management
│   │   ├── students.py        # Student management
│   │   ├── teachers.py        # Teacher management
│   │   ├── finance.py         # Financial operations
│   │   ├── activities.py      # Activities management
│   │   ├── schedules.py       # Schedule generation and management
│   │   └── director.py        # Director dashboard
│   │
│   ├── services/              # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py    # Authentication logic
│   │   ├── academic_service.py
│   │   ├── student_service.py
│   │   ├── teacher_service.py
│   │   ├── finance_service.py
│   │   ├── activity_service.py
│   │   ├── schedule_service.py
│   │   └── director_service.py
│   │
│   ├── utils/                 # Utility functions
│   │   ├── __init__.py
│   │   ├── security.py        # Password hashing, JWT
│   │   ├── backup.py          # Database backup utilities
│   │   ├── telegram.py        # Telegram notifications
│   │   ├── validators.py      # Data validation
│   │   └── schedule_generator.py # Advanced scheduling algorithm
│   │
│   └── core/                  # Core functionality
│       ├── __init__.py
│       ├── exceptions.py      # Custom exceptions
│       ├── middleware.py      # Custom middleware
│       └── dependencies.py    # FastAPI dependencies
│
├── tests/                     # Test suite
├── backups/                   # Database backup directory
├── uploads/                   # File uploads (activity images)
├── logs/                     # Application logs
├── .env                      # Environment variables
└── requirements.txt
```

## Core Components

### 1. Application Configuration (app/config.py)

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./school_management.db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Network
    HOST: str = "0.0.0.0"  # LAN access
    PORT: int = 8000
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None
    
    # Backup
    BACKUP_DIRECTORY: str = "./backups"
    BACKUP_INTERVAL_HOURS: int = 24
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIRECTORY: str = "./uploads"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 2. Database Setup (app/database.py)

```python
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import os

# Create database directory if it doesn't exist
os.makedirs(os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", "")), exist_ok=True)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite specific
    echo=False  # Set to True for SQL logging
)

# Enable foreign key constraints for SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 3. Enhanced Authentication System (app/utils/security.py)

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings
from app.utils.telegram import send_telegram_notification_sync
import secrets
import string

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def generate_default_password() -> str:
    """Generate a secure random default password"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(12))

def reset_password_with_default(user_role: str, username: str) -> str:
    """Reset password to default and notify director via Telegram"""
    default_password = generate_default_password()
    
    # Send notification to director
    message = f"🔐 Password Reset Alert\n\n"
    message += f"Role: {user_role}\n"
    message += f"Username: {username}\n"
    message += f"New Default Password: {default_password}\n\n"
    message += f"⚠️ Please change this password immediately after login."
    
    send_telegram_notification_sync(message)
    
    return get_password_hash(default_password)

def validate_password_strength(password: str) -> dict:
    """Validate password strength requirements"""
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors
    }
```

### 4. Role-Based Access Control (app/core/dependencies.py)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.utils.security import verify_token
from typing import List

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    username = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Specific role dependencies
DirectorOnly = Depends(require_roles(["director"]))
FinanceAccess = Depends(require_roles(["director", "finance"]))
SchoolAccess = Depends(require_roles(["director", "morning_school", "evening_school"]))
```

### 5. Advanced Schedule Generation (app/utils/schedule_generator.py)

```python
from sqlalchemy.orm import Session
from app.models.schedules import Schedule, ScheduleConstraint
from app.models.teachers import Teacher, TeacherAssignment
from app.models.academic import Class, Subject
from typing import List, Dict, Tuple
import json

class ScheduleGenerator:
    def __init__(self, db: Session, academic_year_id: int, session_type: str):
        self.db = db
        self.academic_year_id = academic_year_id
        self.session_type = session_type
        self.schedule_matrix = {}  # [class_section][day][period] = subject_teacher
        
    def generate_schedule(self) -> Dict:
        """Main schedule generation method using constraint satisfaction"""
        
        # 1. Load all constraints
        constraints = self._load_constraints()
        
        # 2. Load teacher availability
        teacher_availability = self._load_teacher_availability()
        
        # 3. Load class-subject requirements
        class_requirements = self._load_class_requirements()
        
        # 4. Initialize schedule matrix
        self._initialize_schedule_matrix()
        
        # 5. Apply scheduling algorithm
        success = self._solve_schedule(constraints, teacher_availability, class_requirements)
        
        if success:
            # 6. Save to database
            self._save_schedule_to_db()
            return {"status": "success", "schedule": self.schedule_matrix}
        else:
            return {"status": "failed", "message": "Unable to generate conflict-free schedule"}
    
    def _load_constraints(self) -> List[ScheduleConstraint]:
        return self.db.query(ScheduleConstraint).filter(
            ScheduleConstraint.academic_year_id == self.academic_year_id,
            ScheduleConstraint.is_active == True
        ).all()
    
    def _load_teacher_availability(self) -> Dict:
        teachers = self.db.query(Teacher).filter(
            Teacher.academic_year_id == self.academic_year_id,
            Teacher.is_active == True
        ).all()
        
        availability = {}
        for teacher in teachers:
            if teacher.free_time_slots:
                availability[teacher.id] = json.loads(teacher.free_time_slots)
            else:
                # Default: available all periods
                availability[teacher.id] = self._get_default_availability()
        
        return availability
    
    def _solve_schedule(self, constraints, teacher_availability, class_requirements) -> bool:
        """Backtracking algorithm with constraint checking"""
        # Implementation of constraint satisfaction algorithm
        # This would be a complex algorithm considering:
        # - Teacher availability
        # - Classroom conflicts
        # - Subject requirements
        # - Time constraints (forbidden/required slots)
        # - Consecutive period constraints
        
        # Simplified implementation placeholder
        return self._greedy_schedule_assignment(constraints, teacher_availability, class_requirements)
    
    def _greedy_schedule_assignment(self, constraints, teacher_availability, class_requirements) -> bool:
        """Greedy approach to schedule assignment"""
        for class_section, subjects in class_requirements.items():
            for subject_id, periods_needed in subjects.items():
                assigned_periods = 0
                
                for day in range(1, 6):  # Monday to Friday
                    for period in range(1, 8):  # Assuming 7 periods per day
                        if assigned_periods >= periods_needed:
                            break
                        
                        # Check if slot is available and constraints are satisfied
                        if self._can_assign_slot(class_section, day, period, subject_id, constraints):
                            teacher_id = self._find_available_teacher(subject_id, day, period, teacher_availability)
                            if teacher_id:
                                self.schedule_matrix[class_section][day][period] = {
                                    'subject_id': subject_id,
                                    'teacher_id': teacher_id
                                }
                                assigned_periods += 1
                
                if assigned_periods < periods_needed:
                    return False  # Could not satisfy requirements
        
        return True
```

### 6. Backup System (app/utils/backup.py)

```python
import shutil
import os
import schedule
import time
from datetime import datetime
from pathlib import Path
from app.config import settings
from app.utils.telegram import send_telegram_notification
import threading

class BackupManager:
    def __init__(self):
        self.backup_dir = Path(settings.BACKUP_DIRECTORY)
        self.backup_dir.mkdir(exist_ok=True)
        
    def create_backup(self) -> str:
        """Create a backup of the SQLite database"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"school_db_backup_{timestamp}.db"
        backup_path = self.backup_dir / backup_filename
        
        try:
            # Copy database file
            source_db = settings.DATABASE_URL.replace("sqlite:///", "")
            shutil.copy2(source_db, backup_path)
            
            # Log backup
            self._log_backup(backup_path, "success")
            
            # Send notification
            send_telegram_notification(
                f"✅ Database backup created successfully: {backup_filename}"
            )
            
            return str(backup_path)
            
        except Exception as e:
            self._log_backup(backup_path, "failed", str(e))
            send_telegram_notification(
                f"❌ Database backup failed: {str(e)}"
            )
            raise
    
    def schedule_backups(self):
        """Schedule automatic backups"""
        schedule.every(settings.BACKUP_INTERVAL_HOURS).hours.do(self.create_backup)
        
        def run_scheduler():
            while True:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        
        # Run scheduler in background thread
        scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
        scheduler_thread.start()
    
    def _log_backup(self, backup_path: Path, status: str, error_message: str = None):
        """Log backup attempt to database"""
        from app.database import SessionLocal
        from app.models.system import BackupHistory
        
        db = SessionLocal()
        try:
            backup_record = BackupHistory(
                backup_path=str(backup_path),
                backup_size=backup_path.stat().st_size if backup_path.exists() else 0,
                status=status,
                error_message=error_message
            )
            db.add(backup_record)
            db.commit()
        finally:
            db.close()
    
    def cleanup_old_backups(self, keep_days: int = 30):
        """Remove backups older than specified days"""
        cutoff_time = time.time() - (keep_days * 24 * 60 * 60)
        
        for backup_file in self.backup_dir.glob("school_db_backup_*.db"):
            if backup_file.stat().st_mtime < cutoff_time:
                backup_file.unlink()
```

### 7. Telegram Notifications (app/utils/telegram.py)

```python
import asyncio
from telegram import Bot
from app.config import settings
import logging

logger = logging.getLogger(__name__)

async def send_telegram_notification(message: str):
    """Send notification to Telegram"""
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        logger.warning("Telegram configuration missing, skipping notification")
        return
    
    try:
        bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
        await bot.send_message(chat_id=settings.TELEGRAM_CHAT_ID, text=message)
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")

def send_telegram_notification_sync(message: str):
    """Synchronous wrapper for telegram notifications"""
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(send_telegram_notification(message))
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")
```

### 9. Enhanced Search Service (app/services/search_service.py)

```python
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app.models.students import Student
from app.models.teachers import Teacher
from app.models.academic import AcademicYear
from typing import List, Dict, Optional
import unidecode

class UniversalSearchService:
    def __init__(self, db: Session):
        self.db = db
    
    def search_by_name(self, query: str, academic_year_id: Optional[int] = None, 
                      limit: int = 20) -> Dict:
        """3-character minimum search across students and teachers"""
        
        if len(query.strip()) < 3:
            return {
                "students": {"current": [], "former": []},
                "teachers": {"current": [], "former": []},
                "total_results": 0
            }
        
        # Normalize search query for better matching
        normalized_query = self._normalize_arabic_text(query)
        search_pattern = f"%{normalized_query}%"
        
        # Search current students
        current_students = self._search_current_students(
            search_pattern, academic_year_id, limit // 4
        )
        
        # Search former students
        former_students = self._search_former_students(
            search_pattern, academic_year_id, limit // 4
        )
        
        # Search current teachers
        current_teachers = self._search_current_teachers(
            search_pattern, academic_year_id, limit // 4
        )
        
        # Search former teachers
        former_teachers = self._search_former_teachers(
            search_pattern, academic_year_id, limit // 4
        )
        
        return {
            "students": {
                "current": current_students,
                "former": former_students
            },
            "teachers": {
                "current": current_teachers,
                "former": former_teachers
            },
            "total_results": (
                len(current_students) + len(former_students) + 
                len(current_teachers) + len(former_teachers)
            )
        }
    
    def _normalize_arabic_text(self, text: str) -> str:
        """Normalize Arabic text for better search matching"""
        # Remove diacritics and normalize Arabic characters
        normalized = text.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
        normalized = normalized.replace('ة', 'ه')  # تاء مربوطة to هاء
        return normalized.strip().lower()
    
    def _search_current_students(self, pattern: str, academic_year_id: Optional[int], 
                               limit: int) -> List[Dict]:
        """Search current students by name pattern"""
        query = self.db.query(Student).filter(
            Student.is_active == True,
            or_(
                func.lower(Student.full_name).like(pattern),
                func.lower(Student.father_name).like(pattern),
                func.lower(Student.mother_name).like(pattern)
            )
        )
        
        if academic_year_id:
            query = query.filter(Student.academic_year_id == academic_year_id)
        
        students = query.limit(limit).all()
        
        return [
            {
                "id": student.id,
                "name": student.full_name,
                "father_name": student.father_name,
                "grade": f"{student.grade_level} - Grade {student.grade_number}",
                "section": student.section or "Not Assigned",
                "session": student.session_type,
                "status": "current",
                "type": "student",
                "academic_year": student.academic_year_id,
                "has_financial_dues": self._has_financial_dues(student.id)
            }
            for student in students
        ]
    
    def _search_former_students(self, pattern: str, academic_year_id: Optional[int], 
                              limit: int) -> List[Dict]:
        """Search former/inactive students"""
        query = self.db.query(Student).filter(
            Student.is_active == False,
            or_(
                func.lower(Student.full_name).like(pattern),
                func.lower(Student.father_name).like(pattern),
                func.lower(Student.mother_name).like(pattern)
            )
        )
        
        # If searching in specific year, exclude that year for former students
        if academic_year_id:
            query = query.filter(Student.academic_year_id != academic_year_id)
        
        students = query.limit(limit).all()
        
        return [
            {
                "id": student.id,
                "name": student.full_name,
                "father_name": student.father_name,
                "grade": f"{student.grade_level} - Grade {student.grade_number}",
                "section": student.section or "Not Assigned",
                "session": student.session_type,
                "status": "former",
                "type": "student",
                "academic_year": student.academic_year_id,
                "last_year": self._get_academic_year_name(student.academic_year_id)
            }
            for student in students
        ]
    
    def _search_current_teachers(self, pattern: str, academic_year_id: Optional[int], 
                               limit: int) -> List[Dict]:
        """Search current active teachers"""
        query = self.db.query(Teacher).filter(
            Teacher.is_active == True,
            func.lower(Teacher.full_name).like(pattern)
        )
        
        if academic_year_id:
            query = query.filter(Teacher.academic_year_id == academic_year_id)
        
        teachers = query.limit(limit).all()
        
        return [
            {
                "id": teacher.id,
                "name": teacher.full_name,
                "subjects": self._get_teacher_subjects(teacher.id),
                "classes": self._get_teacher_classes(teacher.id),
                "phone": teacher.phone,
                "status": "current",
                "type": "teacher",
                "academic_year": teacher.academic_year_id
            }
            for teacher in teachers
        ]
    
    def _search_former_teachers(self, pattern: str, academic_year_id: Optional[int], 
                              limit: int) -> List[Dict]:
        """Search former/inactive teachers"""
        query = self.db.query(Teacher).filter(
            Teacher.is_active == False,
            func.lower(Teacher.full_name).like(pattern)
        )
        
        if academic_year_id:
            query = query.filter(Teacher.academic_year_id != academic_year_id)
        
        teachers = query.limit(limit).all()
        
        return [
            {
                "id": teacher.id,
                "name": teacher.full_name,
                "subjects": self._get_teacher_subjects(teacher.id),
                "phone": teacher.phone,
                "status": "former",
                "type": "teacher",
                "academic_year": teacher.academic_year_id,
                "last_year": self._get_academic_year_name(teacher.academic_year_id)
            }
            for teacher in teachers
        ]
    
    def _has_financial_dues(self, student_id: int) -> bool:
        """Check if student has outstanding financial dues"""
        from app.models.finance import StudentFinance, StudentPayment
        
        # Get total amount owed
        finance = self.db.query(StudentFinance).filter(
            StudentFinance.student_id == student_id
        ).first()
        
        if not finance:
            return False
        
        # Get total paid
        total_paid = self.db.query(func.sum(StudentPayment.payment_amount)).filter(
            StudentPayment.student_id == student_id
        ).scalar() or 0
        
        return finance.total_amount > total_paid
    
    def _get_teacher_subjects(self, teacher_id: int) -> List[str]:
        """Get subjects taught by teacher"""
        from app.models.teachers import TeacherAssignment
        from app.models.academic import Subject
        
        subjects = self.db.query(Subject.subject_name).join(
            TeacherAssignment, TeacherAssignment.subject_id == Subject.id
        ).filter(
            TeacherAssignment.teacher_id == teacher_id
        ).distinct().all()
        
        return [subject[0] for subject in subjects]
    
    def _get_teacher_classes(self, teacher_id: int) -> List[str]:
        """Get classes taught by teacher"""
        from app.models.teachers import TeacherAssignment
        from app.models.academic import Class
        
        classes = self.db.query(Class.grade_level, Class.grade_number).join(
            TeacherAssignment, TeacherAssignment.class_id == Class.id
        ).filter(
            TeacherAssignment.teacher_id == teacher_id
        ).distinct().all()
        
        return [f"{cls[0]} {cls[1]}" for cls in classes]
    
    def _get_academic_year_name(self, academic_year_id: int) -> str:
        """Get academic year name by ID"""
        year = self.db.query(AcademicYear.year_name).filter(
            AcademicYear.id == academic_year_id
        ).first()
        
        return year[0] if year else "Unknown"

# API endpoint for search
def search_universal(query: str, academic_year_id: Optional[int] = None, 
                   db: Session = Depends(get_db)):
    """Universal search endpoint"""
    search_service = UniversalSearchService(db)
    return search_service.search_by_name(query, academic_year_id)
```

### 10. Academic Year Migration Service (app/services/migration_service.py)

```python
from sqlalchemy.orm import Session
from app.models.academic import AcademicYear, Class, Subject
from app.models.students import Student, StudentFinance
from app.models.teachers import Teacher
from app.utils.telegram import send_telegram_notification_sync
from typing import Dict
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class AcademicYearMigrationService:
    def __init__(self, db: Session):
        self.db = db
        self.migration_log = []
    
    def migrate_academic_year(self, source_year_id: int, target_year_name: str, 
                            target_year_description: str, migration_options: Dict) -> Dict:
        """Migrate data from previous academic year to new year with student promotion"""
        
        try:
            # Create new academic year
            new_year = self._create_new_academic_year(target_year_name, target_year_description)
            
            migration_summary = {
                "new_year_id": new_year.id,
                "source_year_id": source_year_id,
                "results": {}
            }
            
            # Execute migration based on options
            if migration_options.get("copy_school_structure", False):
                migration_summary["results"]["school_structure"] = self._migrate_school_structure(
                    source_year_id, new_year.id
                )
            
            if migration_options.get("promote_students", False):
                migration_summary["results"]["students"] = self._migrate_students(
                    source_year_id, new_year.id, migration_options.get("student_options", {})
                )
            
            # Send notification
            self._send_migration_notification(migration_summary)
            
            return {"status": "success", "summary": migration_summary}
            
        except Exception as e:
            logger.error(f"Migration failed: {str(e)}")
            self.db.rollback()
            return {"status": "error", "message": str(e)}
    
    def _create_new_academic_year(self, year_name: str, description: str) -> AcademicYear:
        """Create new academic year and deactivate previous ones"""
        # Deactivate all previous years
        self.db.query(AcademicYear).update({"is_active": False})
        
        new_year = AcademicYear(
            year_name=year_name,
            description=description,
            is_active=True
        )
        
        self.db.add(new_year)
        self.db.commit()
        self.db.refresh(new_year)
        
        self.migration_log.append(f"Created new academic year: {year_name}")
        return new_year
    
    def _migrate_students(self, source_year_id: int, target_year_id: int, options: Dict) -> Dict:
        """Migrate and promote students to next grade"""
        results = {"promoted": 0, "repeated": 0, "graduated": 0}
        
        source_students = self.db.query(Student).filter(
            Student.academic_year_id == source_year_id,
            Student.is_active == True
        ).all()
        
        for source_student in source_students:
            next_grade = self._calculate_next_grade(source_student)
            
            if next_grade["can_promote"]:
                self._create_promoted_student(source_student, target_year_id, next_grade)
                results["promoted"] += 1
            else:
                self._mark_student_as_graduated(source_student)
                results["graduated"] += 1
        
        self.db.commit()
        return results
    
    def _calculate_next_grade(self, student: Student) -> Dict:
        """Calculate next grade for student promotion"""
        current_grade = student.grade_number
        current_level = student.grade_level
        
        # Primary: 1-6, then Intermediate 1
        if current_level == "primary" and current_grade < 6:
            return {"can_promote": True, "new_level": "primary", "new_grade": current_grade + 1}
        elif current_level == "primary" and current_grade == 6:
            return {"can_promote": True, "new_level": "intermediate", "new_grade": 1}
        
        # Intermediate: 1-3, then Secondary 1
        elif current_level == "intermediate" and current_grade < 3:
            return {"can_promote": True, "new_level": "intermediate", "new_grade": current_grade + 1}
        elif current_level == "intermediate" and current_grade == 3:
            return {"can_promote": True, "new_level": "secondary", "new_grade": 1}
        
        # Secondary: 1-3, then graduate
        elif current_level == "secondary" and current_grade < 3:
            return {"can_promote": True, "new_level": "secondary", "new_grade": current_grade + 1}
        else:
            return {"can_promote": False}  # Graduate
    
    def _create_promoted_student(self, source_student: Student, target_year_id: int, grade_info: Dict):
        """Create new student record for promoted student"""
        new_student = Student(
            academic_year_id=target_year_id,
            full_name=source_student.full_name,
            father_name=source_student.father_name,
            mother_name=source_student.mother_name,
            # ... copy all other fields ...
            grade_level=grade_info["new_level"],
            grade_number=grade_info["new_grade"],
            session_type=source_student.session_type,
            is_active=True
        )
        self.db.add(new_student)
    
    def _send_migration_notification(self, summary: Dict):
        """Send migration completion notification"""
        message = f"📚 Academic Year Migration Completed\n"
        message += f"Results: {summary['results']}"
        send_telegram_notification_sync(message)
```

```python
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, get_db
from app.models import *  # Import all models
from app.api import auth, academic, students, teachers, finance, activities, schedules, director
from app.utils.backup import BackupManager
from app.core.middleware import setup_middleware

# Create database tables
from app.models.base import Base
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="School Management System API",
    description="Backend API for comprehensive school management",
    version="1.0.0"
)

# Setup CORS for LAN access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for LAN access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup custom middleware
setup_middleware(app)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(academic.router, prefix="/api/academic", tags=["Academic"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["Teachers"])
app.include_router(finance.router, prefix="/api/finance", tags=["Finance"])
app.include_router(activities.router, prefix="/api/activities", tags=["Activities"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["Schedules"])
app.include_router(director.router, prefix="/api/director", tags=["Director"])

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Initialize backup manager
    backup_manager = BackupManager()
    backup_manager.schedule_backups()
    
    # Create default admin user if none exists
    await create_default_admin()

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    pass

@app.get("/")
async def root():
    return {"message": "School Management System API", "version": "1.0.0"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

async def create_default_admin():
    """Create default admin user if none exists"""
    from app.database import SessionLocal
    from app.models.users import User
    from app.utils.security import get_password_hash
    
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.role == "director").first()
        if not admin_user:
            default_admin = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                role="director",
                is_active=True
            )
            db.add(default_admin)
            db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True  # Development only
    )
```

## API Architecture

### RESTful Endpoints Structure

```
Authentication:
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/change-password
POST   /api/auth/reset-password

Academic Management:
GET    /api/academic/years
POST   /api/academic/years
PUT    /api/academic/years/{id}
DELETE /api/academic/years/{id}
GET    /api/academic/classes
POST   /api/academic/classes

Student Management:
GET    /api/students
POST   /api/students
GET    /api/students/{id}
PUT    /api/students/{id}
DELETE /api/students/{id}
GET    /api/students/search?q={query}
GET    /api/students/{id}/finances
POST   /api/students/{id}/payments
GET    /api/students/{id}/academics

Teacher Management:
GET    /api/teachers
POST   /api/teachers
GET    /api/teachers/{id}
PUT    /api/teachers/{id}
DELETE /api/teachers/{id}
GET    /api/teachers/{id}/schedule
POST   /api/teachers/{id}/attendance

Financial Management:
GET    /api/finance/dashboard
GET    /api/finance/transactions
POST   /api/finance/transactions
GET    /api/finance/reports
GET    /api/finance/categories

Activity Management:
GET    /api/activities
POST   /api/activities
GET    /api/activities/{id}
PUT    /api/activities/{id}
POST   /api/activities/{id}/participants

Schedule Management:
GET    /api/schedules
POST   /api/schedules/generate
GET    /api/schedules/constraints
POST   /api/schedules/constraints
GET    /api/schedules/export

Director Dashboard:
GET    /api/director/dashboard
GET    /api/director/notes
POST   /api/director/notes
GET    /api/director/rewards
POST   /api/director/rewards
GET    /api/director/assistance
POST   /api/director/assistance
```

## Deployment Configuration

### Environment Variables (.env)
```env
# Database
DATABASE_URL=sqlite:///./school_management.db

# Security
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Network
HOST=0.0.0.0
PORT=8000

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Backup
BACKUP_DIRECTORY=./backups
BACKUP_INTERVAL_HOURS=24

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIRECTORY=./uploads
```

### Production Deployment Script (deploy.py)
```python
import subprocess
import sys
import os

def deploy_production():
    """Deploy the application for production use"""
    
    # Install dependencies
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    # Create necessary directories
    os.makedirs("backups", exist_ok=True)
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    # Run with production server
    subprocess.run([
        "uvicorn", "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--workers", "4",
        "--log-level", "info"
    ])

if __name__ == "__main__":
    deploy_production()
```

## Performance Considerations

1. **Database Optimization:**
   - Proper indexing on frequently queried columns
   - Connection pooling for concurrent access
   - Query optimization using SQLAlchemy

2. **Caching Strategy:**
   - In-memory caching for frequently accessed data
   - Redis integration for distributed caching (optional)

3. **Background Tasks:**
   - Asynchronous backup operations
   - Scheduled maintenance tasks
   - Telegram notifications in background

4. **Security Measures:**
   - JWT token-based authentication
   - Role-based access control
   - Password hashing with bcrypt
   - SQL injection prevention through ORM

This backend architecture provides a robust, scalable foundation for the school management system with comprehensive features, security, and network deployment capabilities.