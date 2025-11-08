from fastapi import FastAPI, Depends, Request, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from slowapi.errors import RateLimitExceeded
import os

from app.config import settings
from app.database import engine, get_db, update_database_schema, Base
from app.models import *  # Import all models
from app.api import auth, academic, students, teachers, finance, activities, schedules, search, system, advanced, monitoring, director
from app.utils.security import get_password_hash
from app.core.rate_limiting import rate_limiter, security_headers_middleware, create_custom_rate_limit_handler
from app.core.exceptions import (
    global_exception_handler, http_exception_handler, 
    validation_exception_handler, database_exception_handler
)
from app.services.security_service import security_service
from app.services.config_service import config_service

# Create database tables
# Suppressing type error for Base.metadata as it's a known SQLAlchemy pattern
Base.metadata.create_all(bind=engine)  # type: ignore

# Initialize FastAPI app
app = FastAPI(
    title="School Management System API",
    description="Backend API for comprehensive school management",
    version="1.0.0"
)

# Setup CORS for localhost access - THIS MUST BE FIRST to handle preflight requests
# Allow all localhost ports for development
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:5173",  # Vite default
    "http://localhost:5174",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add rate limiter to app state
app.state.limiter = rate_limiter.limiter

# Add security headers middleware
app.middleware("http")(security_headers_middleware)

# Add exception handlers with proper type signatures
# Using type: ignore comments to suppress basedpyright errors for known working patterns
app.add_exception_handler(Exception, global_exception_handler)  
app.add_exception_handler(HTTPException, http_exception_handler)  
app.add_exception_handler(RequestValidationError, validation_exception_handler)  
app.add_exception_handler(SQLAlchemyError, database_exception_handler)  
app.add_exception_handler(RateLimitExceeded, create_custom_rate_limit_handler())  

# Create upload directories
os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs(settings.BACKUP_DIRECTORY, exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIRECTORY), name="uploads")

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(academic.router, prefix="/api/academic", tags=["Academic"])
# Fixed routes - each router should have its specific prefix
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["Teachers"])
app.include_router(finance.router, prefix="/api/finance", tags=["Finance"])
app.include_router(activities.router, prefix="/api/activities", tags=["Activities"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["Schedules"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(system.router, prefix="/api/system", tags=["System"])
app.include_router(advanced.router, prefix="/api/advanced", tags=["Advanced System Management"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring"])
app.include_router(director.router, prefix="/api/director", tags=["Director Dashboard"])

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Update database schema to match current models
    update_database_schema()
    
    # Check if this is the first run (no academic years exist)
    from app.database import SessionLocal
    from app.models.academic import AcademicYear
    from app.models.system import SystemSetting
    
    db = SessionLocal()
    try:
        # Check if any academic years exist
        academic_years_count = db.query(AcademicYear).count()
        if academic_years_count == 0:
            # Mark this as first run in system settings
            # Using type: ignore to suppress basedpyright error for working query pattern
            first_run_setting = db.query(SystemSetting).filter(
                SystemSetting.setting_key == "first_run_completed"
            ).first()  # type: ignore
            
            if not first_run_setting:
                # Create setting using dictionary to avoid type errors
                setting_data = {
                    "setting_key": "first_run_completed",
                    "setting_value": "false",
                    "description": "Indicates if the first run setup has been completed"
                }
                first_run_setting = SystemSetting(**setting_data)
                db.add(first_run_setting)
                db.commit()
        else:
            # If academic years exist, mark first run as completed
            # Using type: ignore to suppress basedpyright error for working query pattern
            first_run_setting = db.query(SystemSetting).filter(
                SystemSetting.setting_key == "first_run_completed"
            ).first()  # type: ignore
            
            if first_run_setting:
                first_run_setting.setting_value = "true"
                db.commit()
            elif academic_years_count > 0:
                # Create the setting if it doesn't exist but years do
                # Create setting using dictionary to avoid type errors
                setting_data = {
                    "setting_key": "first_run_completed",
                    "setting_value": "true",
                    "description": "Indicates if the first run setup has been completed"
                }
                first_run_setting = SystemSetting(**setting_data)
                db.add(first_run_setting)
                db.commit()
    finally:
        db.close()
    
    await create_default_admin()
    
    # Initialize default system configurations
    from app.database import SessionLocal
    from app.models.users import User
    
    db = SessionLocal()
    try:
        # Using type: ignore to suppress basedpyright error for working query pattern
        admin_user = db.query(User).filter(User.role == "director").first()  # type: ignore
        if admin_user:
            config_service.initialize_default_configs(admin_user.id)
    finally:
        db.close()

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
        # Check if any director user exists
        # Using type: ignore to suppress basedpyright error for working query pattern
        director_user = db.query(User).filter(User.role == "director").first()  # type: ignore
        if not director_user:
            # Create admin user using dictionary approach to avoid type errors
            admin_user_data = {
                "username": "admin",
                "password_hash": get_password_hash("admin123"),
                "role": "director",
                "is_active": True
            }
            admin_user = User(**admin_user_data)
            db.add(admin_user)
            
            # Also create director user to match documentation
            director_user_data = {
                "username": "director",
                "password_hash": get_password_hash("director123"),
                "role": "director",
                "is_active": True
            }
            director_user = User(**director_user_data)
            db.add(director_user)
            
            db.commit()
            print("Default admin users created:")
            print("  - Username: admin, Password: admin123")
            print("  - Username: director, Password: director123")
        else:
            print("Director user already exists")
            
        # Create finance user if it doesn't exist
        # Using type: ignore to suppress basedpyright error for working query pattern
        finance_user = db.query(User).filter(User.role == "finance").first()  # type: ignore
        if not finance_user:
            finance_user_data = {
                "username": "finance",
                "password_hash": get_password_hash("finance123"),
                "role": "finance",
                "is_active": True
            }
            finance_user = User(**finance_user_data)
            db.add(finance_user)
            db.commit()
            print("Finance user created:")
            print("  - Username: finance, Password: finance123")
        else:
            print("Finance user already exists")
            
        # Create morning_school user if it doesn't exist
        # Using type: ignore to suppress basedpyright error for working query pattern
        morning_user = db.query(User).filter(User.role == "morning_school").first()  # type: ignore
        if not morning_user:
            morning_user_data = {
                "username": "morning",
                "password_hash": get_password_hash("morning123"),
                "role": "morning_school",
                "is_active": True
            }
            morning_user = User(**morning_user_data)
            db.add(morning_user)
            db.commit()
            print("Morning school user created:")
            print("  - Username: morning, Password: morning123")
        else:
            print("Morning school user already exists")
            
        # Create evening_school user if it doesn't exist
        # Using type: ignore to suppress basedpyright error for working query pattern
        evening_user = db.query(User).filter(User.role == "evening_school").first()  # type: ignore
        if not evening_user:
            evening_user_data = {
                "username": "evening",
                "password_hash": get_password_hash("evening123"),
                "role": "evening_school",
                "is_active": True
            }
            evening_user = User(**evening_user_data)
            db.add(evening_user)
            db.commit()
            print("Evening school user created:")
            print("  - Username: evening, Password: evening123")
        else:
            print("Evening school user already exists")
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


