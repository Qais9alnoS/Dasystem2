"""
Advanced File Management Service
Handles file uploads with validation, compression, and security checks
"""

import os
import hashlib
try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False
    magic = None  
    print("Warning: python-magic not available. File type validation will be limited.")
import uuid
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ImageOps
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import SessionLocal
from ..models.system import FileUpload
from ..config import settings

class FileService:
    """Advanced file management service"""
    
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIRECTORY)
        self.upload_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        self.image_dir = self.upload_dir / "images"
        self.document_dir = self.upload_dir / "documents"
        self.temp_dir = self.upload_dir / "temp"
        
        for directory in [self.image_dir, self.document_dir, self.temp_dir]:
            directory.mkdir(exist_ok=True)
        
        # Allowed file types
        self.allowed_image_types = {
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'
        }
        self.allowed_document_types = {
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv'
        }
        
        # Maximum file sizes (in bytes)
        self.max_image_size = 5 * 1024 * 1024  # 5MB
        self.max_document_size = 10 * 1024 * 1024  # 10MB
        
        # Image compression settings
        self.image_quality = 85
        self.max_image_dimension = 1920
    
    def validate_file(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """Validate uploaded file"""
        try:
            if not os.path.exists(file_path):
                return {"valid": False, "error": "File does not exist"}
            
            file_size = os.path.getsize(file_path)
            
            # Check file size limits
            if file_type in self.allowed_image_types:
                if file_size > self.max_image_size:
                    return {"valid": False, "error": f"Image file too large. Maximum size: {self.max_image_size // (1024*1024)}MB"}
            elif file_type in self.allowed_document_types:
                if file_size > self.max_document_size:
                    return {"valid": False, "error": f"Document file too large. Maximum size: {self.max_document_size // (1024*1024)}MB"}
            else:
                return {"valid": False, "error": f"File type not allowed: {file_type}"}
            
            # Check if file type matches content (if python-magic is available)
            if MAGIC_AVAILABLE and magic is not None:
                try:
                    # Fix: Only use magic if it's properly imported
                    detected_type = magic.from_file(file_path, mime=True)
                    if detected_type != file_type:
                        return {"valid": False, "error": f"File type mismatch. Expected: {file_type}, Detected: {detected_type}"}
                except Exception as e:
                    # If magic detection fails, continue with basic validation
                    print(f"Warning: Magic file detection failed: {e}")
                    pass
            
            # Additional security checks for images
            if file_type in self.allowed_image_types:
                try:
                    with Image.open(file_path) as img:
                        # Verify it's a valid image
                        img.verify()
                except Exception as e:
                    return {"valid": False, "error": f"Invalid image file: {str(e)}"}
            
            return {"valid": True, "file_size": file_size}
            
        except Exception as e:
            return {"valid": False, "error": f"File validation error: {str(e)}"}
    
    def calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA-256 hash of file"""
        hash_sha256 = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            return hash_sha256.hexdigest()
        except Exception:
            return ""
    
    def compress_image(self, input_path: str, output_path: str) -> Dict[str, Any]:
        """Compress and optimize image"""
        try:
            with Image.open(input_path) as img:
                # Convert to RGB if necessary
                background = None
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background
                
                # Auto-orient based on EXIF data
                img = ImageOps.exif_transpose(img)
                
                # Fix: Check if img is not None before accessing its attributes
                if img is not None:
                    # Resize if too large
                    if max(img.size) > self.max_image_dimension:
                        img.thumbnail((self.max_image_dimension, self.max_image_dimension), Image.Resampling.LANCZOS)
                    
                    # Save with optimization
                    img.save(output_path, 'JPEG', quality=self.image_quality, optimize=True)
                
                original_size = os.path.getsize(input_path) if os.path.exists(input_path) else 0
                compressed_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
                
                return {
                    "success": True,
                    "original_size": original_size,
                    "compressed_size": compressed_size,
                    "compression_ratio": (original_size - compressed_size) / original_size * 100 if original_size > 0 else 0
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def upload_file(self, file_content: bytes, original_filename: str, file_type: str,
                   uploaded_by: int, related_entity_type: Optional[str] = None,
                   related_entity_id: Optional[int] = None) -> Dict[str, Any]:
        """Upload and process file"""
        # Initialize temp_file_path to avoid "possibly unbound" error
        temp_file_path = None
        final_file_path = None
        try:
            # Generate unique filename
            file_extension = Path(original_filename).suffix.lower()
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            
            # Determine storage directory
            if file_type in self.allowed_image_types:
                storage_dir = self.image_dir
            else:
                storage_dir = self.document_dir
            
            temp_file_path = self.temp_dir / unique_filename
            final_file_path = storage_dir / unique_filename
            
            # Write file to temp location
            with open(temp_file_path, 'wb') as f:
                f.write(file_content)
            
            # Validate file
            validation = self.validate_file(str(temp_file_path), file_type)
            if not validation["valid"]:
                if temp_file_path and temp_file_path.exists():
                    os.remove(temp_file_path)
                return {"success": False, "error": validation["error"]}
            
            # Calculate file hash
            file_hash = self.calculate_file_hash(str(temp_file_path))
            
            # Check for duplicate files
            db: Optional[Session] = SessionLocal()
            if db is None:
                if temp_file_path and temp_file_path.exists():
                    os.remove(temp_file_path)
                return {"success": False, "error": "Database connection failed"}
            
            # Use a separate function to handle database operations to avoid None issues
            def _get_existing_file(db_session: Session, file_hash: str) -> Optional[FileUpload]:
                return db_session.query(FileUpload).filter(FileUpload.file_hash == file_hash).first()
            
            existing_file = _get_existing_file(db, file_hash)
            
            if existing_file:
                if temp_file_path and temp_file_path.exists():
                    os.remove(temp_file_path)
                db.close()
                return {
                    "success": False,
                    "error": "File already exists",
                    "existing_file_id": existing_file.id
                }
            
            # Process file based on type
            if file_type in self.allowed_image_types:
                # Compress image
                compression_result = self.compress_image(str(temp_file_path), str(final_file_path))
                if not compression_result["success"]:
                    if temp_file_path and temp_file_path.exists():
                        os.remove(temp_file_path)
                    db.close()
                    return {"success": False, "error": f"Image compression failed: {compression_result['error']}"}
            else:
                # Move document file
                if temp_file_path and temp_file_path.exists() and final_file_path:
                    os.rename(str(temp_file_path), str(final_file_path))
            
            # Check if final file exists before getting its size
            file_size = 0
            if final_file_path and final_file_path.exists():
                file_size = os.path.getsize(str(final_file_path))
            
            # Create database record - fix parameter names to match the FileUpload model
            file_record = FileUpload()
            file_record.filename = unique_filename
            file_record.original_filename = original_filename
            file_record.file_path = str(final_file_path) if final_file_path else ""
            file_record.file_size = file_size
            file_record.file_type = file_type
            file_record.file_hash = file_hash
            file_record.uploaded_by = uploaded_by
            file_record.related_entity_type = related_entity_type
            file_record.related_entity_id = related_entity_id
            file_record.is_active = True
            file_record.created_at = datetime.utcnow()
            
            db.add(file_record)
            db.commit()
            db.refresh(file_record)
            
            file_id = file_record.id if file_record else 0
            file_size_result = file_record.file_size if file_record else 0
            file_url = f"/api/files/{file_record.id}/download" if file_record else ""
            
            db.close()
            
            return {
                "success": True,
                "file_id": file_id,
                "filename": unique_filename,
                "file_size": file_size_result,
                "file_url": file_url
            }
                
        except Exception as e:
            # Cleanup temp file if it exists
            if temp_file_path and temp_file_path.exists():
                os.remove(str(temp_file_path))
            return {"success": False, "error": f"Upload failed: {str(e)}"}
    
    def get_file(self, file_id: int, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Get file information"""
        db: Optional[Session] = SessionLocal()
        if db is None:
            return None
            
        # Use a separate function to handle database operations to avoid None issues
        def _get_file_record(db_session: Session, file_id: int, user_id: Optional[int]) -> Optional[FileUpload]:
            query = db_session.query(FileUpload)
            query = query.filter(FileUpload.id == file_id, FileUpload.is_active == True)
            
            # Optional user access control
            if user_id:
                query = query.filter(FileUpload.uploaded_by == user_id)
            
            return query.first()
        
        try:
            file_record = _get_file_record(db, file_id, user_id)
            
            if not file_record:
                db.close()
                return None
            
            result = {
                "id": file_record.id,
                "filename": file_record.filename,
                "original_filename": file_record.original_filename,
                "file_path": file_record.file_path,
                "file_size": file_record.file_size,
                "file_type": file_record.file_type,
                "uploaded_by": file_record.uploaded_by,
                "related_entity_type": file_record.related_entity_type,
                "related_entity_id": file_record.related_entity_id,
                "created_at": file_record.created_at
            }
            
            db.close()
            return result
            
        except Exception as e:
            print(f"Failed to get file: {e}")
            db.close()
            return None
    
    def delete_file(self, file_id: int, user_id: Optional[int] = None) -> bool:
        """Delete file"""
        db: Optional[Session] = SessionLocal()
        if db is None:
            return False
            
        # Use a separate function to handle database operations to avoid None issues
        def _get_file_for_deletion(db_session: Session, file_id: int, user_id: Optional[int]) -> Optional[FileUpload]:
            query = db_session.query(FileUpload)
            query = query.filter(FileUpload.id == file_id, FileUpload.is_active == True)
            
            # Optional user access control
            if user_id:
                query = query.filter(FileUpload.uploaded_by == user_id)
            
            return query.first()
        
        try:
            file_record = _get_file_for_deletion(db, file_id, user_id)
            
            if not file_record:
                db.close()
                return False
            
            # Delete physical file
            if os.path.exists(file_record.file_path):
                os.remove(file_record.file_path)
            
            # Mark as inactive in database
            file_record.is_active = False
            db.commit()
            
            db.close()
            return True
            
        except Exception as e:
            print(f"Failed to delete file: {e}")
            db.close()
            return False
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """Get storage usage statistics"""
        db: Optional[Session] = SessionLocal()
        if db is None:
            return {}
            
        try:
            # Use separate functions to handle database operations to avoid None issues
            def _get_total_files(db_session: Session) -> int:
                query = db_session.query(FileUpload)
                query = query.filter(FileUpload.is_active == True)
                return query.count()
            
            def _get_total_size(db_session: Session) -> int:
                query = db_session.query(FileUpload)
                query = query.filter(FileUpload.is_active == True)
                total_size_result = query.with_entities(func.sum(FileUpload.file_size)).first()
                return total_size_result[0] if total_size_result and total_size_result[0] else 0
            
            def _get_image_files(db_session: Session) -> int:
                query = db_session.query(FileUpload)
                query = query.filter(FileUpload.is_active == True)
                query = query.filter(FileUpload.file_type.in_(self.allowed_image_types))
                return query.count()
            
            total_files = _get_total_files(db)
            total_size = _get_total_size(db)
            image_files = _get_image_files(db)
            document_files = total_files - image_files
            
            # Available space (approximate)
            if hasattr(os, 'statvfs'):  # Unix/Linux
                disk_usage = os.statvfs(str(self.upload_dir))
                available_space = disk_usage.f_frsize * disk_usage.f_bavail
            else:  # Windows fallback
                import shutil
                disk_usage = shutil.disk_usage(str(self.upload_dir))
                available_space = disk_usage.free
            
            db.close()
            
            return {
                "total_files": total_files,
                "image_files": image_files,
                "document_files": document_files,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "available_space_bytes": available_space,
                "available_space_gb": round(available_space / (1024 * 1024 * 1024), 2)
            }
            
        except Exception as e:
            print(f"Failed to get storage stats: {e}")
            db.close()
            return {}
    
    def cleanup_old_temp_files(self, hours_old: int = 24) -> int:
        """Clean up old temporary files"""
        try:
            cutoff_time = datetime.now().timestamp() - (hours_old * 3600)
            cleaned_count = 0
            
            for file_path in self.temp_dir.iterdir():
                if file_path.is_file() and file_path.stat().st_mtime < cutoff_time:
                    try:
                        os.remove(str(file_path))
                        cleaned_count += 1
                    except:
                        pass
            
            return cleaned_count
            
        except Exception as e:
            print(f"Failed to cleanup temp files: {e}")
            return 0

# Global file service instance
file_service = FileService()