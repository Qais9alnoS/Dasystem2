from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData  # Added import
from typing import TYPE_CHECKING
from app.config import settings
import os

if TYPE_CHECKING:
    from sqlalchemy.ext.declarative import DeclarativeMeta

# Create database directory if it doesn't exist
db_path = settings.DATABASE_URL.replace("sqlite:///", "")
if "/" in db_path or "\\" in db_path:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

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

# Adding type annotation to help type checkers
if TYPE_CHECKING:
    Base: DeclarativeMeta

def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def update_database_schema():
    """Update database schema to match current models"""
    import sqlite3
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if class_id column exists in students table
    cursor.execute("PRAGMA table_info(students)")
    columns = cursor.fetchall()
    class_id_exists = any(col[1] == 'class_id' for col in columns)
    
    # Add class_id column if it doesn't exist
    if not class_id_exists:
        try:
            cursor.execute("ALTER TABLE students ADD COLUMN class_id INTEGER REFERENCES classes(id)")
            print("Added class_id column to students table")
        except Exception as e:
            print(f"Error adding class_id column: {e}")
    
    # Check if is_active column exists in subjects table
    cursor.execute("PRAGMA table_info(subjects)")
    columns = cursor.fetchall()
    is_active_exists = any(col[1] == 'is_active' for col in columns)
    
    # Add is_active column if it doesn't exist
    if not is_active_exists:
        try:
            cursor.execute("ALTER TABLE subjects ADD COLUMN is_active BOOLEAN DEFAULT 1")
            print("Added is_active column to subjects table")
        except Exception as e:
            print(f"Error adding is_active column: {e}")
    
    conn.commit()
    conn.close()