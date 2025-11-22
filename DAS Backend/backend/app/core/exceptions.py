from fastapi import HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import traceback
import logging
from typing import Union, Optional, Dict, Any
import asyncio

from ..services.security_service import security_service
from ..services.telegram_service import telegram_service

logger = logging.getLogger(__name__)

class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "فشل التحقق من الهوية"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

class AuthorizationError(HTTPException):
    def __init__(self, detail: str = "صلاحيات غير كافية"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class ValidationError(HTTPException):
    def __init__(self, detail: str = "فشل التحقق من البيانات"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)

class NotFoundError(HTTPException):
    def __init__(self, detail: str = "المورد غير موجود"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class DatabaseError(HTTPException):
    def __init__(self, detail: str = "فشلت عملية قاعدة البيانات"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)

class FileUploadError(HTTPException):
    def __init__(self, detail: str = "فشل رفع الملف"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class SecurityError(HTTPException):
    def __init__(self, detail: str = "تم اكتشاف انتهاك أمني"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class RateLimitError(HTTPException):
    def __init__(self, detail: str = "تم تجاوز حد الطلبات"):
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)

class BusinessLogicError(HTTPException):
    def __init__(self, detail: str = "انتهاك منطق العمل"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)

# Schedule-specific exceptions
class ScheduleValidationError(HTTPException):
    """Raised when schedule generation prerequisites are not met"""
    def __init__(self, detail: str = "فشل التحقق من متطلبات إنشاء الجدول", errors: list = None):
        self.errors = errors or []
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class TeacherAvailabilityError(HTTPException):
    """Raised when no teachers are available for a required time slot"""
    def __init__(self, detail: str = "لا توجد معلمين متاحين للفترة الزمنية المطلوبة"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)

class ScheduleConflictError(HTTPException):
    """Raised when a conflict is detected in the schedule"""
    def __init__(self, detail: str = "تعارض في الجدول الدراسي"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)

class ConstraintViolationError(HTTPException):
    """Raised when a critical schedule constraint is violated"""
    def __init__(self, detail: str = "انتهاك قيد حرج في الجدول", constraint_type: str = None):
        self.constraint_type = constraint_type
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class InsufficientDataError(HTTPException):
    """Raised when there's insufficient data to generate a schedule"""
    def __init__(self, detail: str = "بيانات غير كافية لإنشاء الجدول"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

# Global Exception Handlers

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler for unhandled exceptions"""
    error_id = id(exc)
    error_traceback = traceback.format_exc()
    
    # Log the error
    logger.error(f"Unhandled exception [{error_id}]: {str(exc)}")
    logger.error(f"Traceback: {error_traceback}")
    
    # Log to audit system
    client_ip = request.client.host if request.client else "unknown"
    security_service.log_audit_event(
        user_id=None,
        action="UNHANDLED_EXCEPTION",
        table_name="system_errors",
        ip_address=client_ip,
        new_values={
            "error_id": error_id,
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "path": str(request.url),
            "method": request.method
        }
    )
    
    # Send to Telegram
    try:
        # Get user info from request if available
        user_info: Optional[Dict[str, Any]] = None
        if hasattr(request.state, 'user') and request.state.user:
            user_info = {
                "user_id": getattr(request.state.user, 'id', None),
                "username": getattr(request.state.user, 'username', None),
                "role": getattr(request.state.user, 'role', None)
            }
        
        request_info = {
            "path": str(request.url),
            "method": request.method,
            "ip_address": client_ip,
            "headers": dict(request.headers) if request.headers else None
        }
        
        error_details = {
            "error_id": error_id,
            "error_type": type(exc).__name__,
            "module": getattr(exc, '__module__', 'unknown'),
        }
        
        # Send error report to Telegram (non-blocking)
        asyncio.create_task(telegram_service.send_error_report(
            error_type=type(exc).__name__,
            error_message=str(exc),
            error_location=f"{request.method} {request.url.path}",
            error_details=error_details,
            stack_trace=error_traceback,
            user_info=user_info,
            request_info=request_info
        ))
    except Exception as telegram_error:
        logger.error(f"Failed to send error to Telegram: {telegram_error}")
    
    # Create system notification for critical errors
    security_service.create_system_notification(
        recipient_role="director",
        recipient_id=None,
        title="تنبيه خطأ بالنظام",
        message=f"حدث خطأ غير متوقع: {type(exc).__name__} - {str(exc)[:100]}",
        notification_type="error"
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "حدث خطأ داخلي في الخادم",
            "error_id": error_id,
            "type": "internal_server_error"
        }
    )

async def http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler for HTTP exceptions"""
    # Cast to HTTPException to access status_code and detail
    http_exc = exc
    client_ip = request.client.host if request.client else "unknown"
    
    # Log HTTP errors (except 404s to avoid spam)
    if http_exc.status_code != 404:  # type: ignore
        security_service.log_audit_event(
            user_id=None,
            action="HTTP_EXCEPTION",
            table_name="http_errors",
            ip_address=client_ip,
            new_values={
                "status_code": http_exc.status_code,  # type: ignore
                "detail": http_exc.detail,  # type: ignore
                "path": str(request.url),
                "method": request.method
            }
        )
        
        # Send to Telegram for server errors (5xx) and important client errors (4xx except 404)
        if http_exc.status_code >= 500 or (http_exc.status_code >= 400 and http_exc.status_code != 404):  # type: ignore
            try:
                user_info: Optional[Dict[str, Any]] = None
                if hasattr(request.state, 'user') and request.state.user:
                    user_info = {
                        "user_id": getattr(request.state.user, 'id', None),
                        "username": getattr(request.state.user, 'username', None),
                        "role": getattr(request.state.user, 'role', None)
                    }
                
                request_info = {
                    "path": str(request.url),
                    "method": request.method,
                    "ip_address": client_ip,
                }
                
                error_details = {
                    "status_code": http_exc.status_code,  # type: ignore
                    "error_type": type(http_exc).__name__,
                }
                
                asyncio.create_task(telegram_service.send_error_report(
                    error_type=f"HTTP {http_exc.status_code}",  # type: ignore
                    error_message=str(http_exc.detail) if hasattr(http_exc, 'detail') else str(http_exc),  # type: ignore
                    error_location=f"{request.method} {request.url.path}",
                    error_details=error_details,
                    user_info=user_info,
                    request_info=request_info
                ))
            except Exception as telegram_error:
                logger.error(f"Failed to send HTTP error to Telegram: {telegram_error}")
    
    return JSONResponse(
        status_code=http_exc.status_code,  # type: ignore
        content={
            "detail": http_exc.detail,  # type: ignore
            "type": "http_exception",
            "status_code": http_exc.status_code  # type: ignore
        }
    )

async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler for request validation errors"""
    # Cast to RequestValidationError
    validation_exc = exc  # type: ignore
    client_ip = request.client.host if request.client else "unknown"
    
    # Log validation errors
    security_service.log_audit_event(
        user_id=None,
        action="VALIDATION_ERROR",
        table_name="validation_errors",
        ip_address=client_ip,
        new_values={
            "errors": validation_exc.errors(),  # type: ignore
            "path": str(request.url),
            "method": request.method
        }
    )
    
    # Ensure errors are JSON-serializable (avoid bytes)
    def ensure_jsonable(value):
        if isinstance(value, (bytes, bytearray)):
            return value.decode("utf-8", errors="ignore")
        if isinstance(value, dict):
            return {k: ensure_jsonable(v) for k, v in value.items()}
        if isinstance(value, list):
            return [ensure_jsonable(v) for v in value]
        return value

    serialized_errors = [ensure_jsonable(err) for err in validation_exc.errors()]  # type: ignore

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "خطأ في التحقق من البيانات",
            "errors": serialized_errors,
            "type": "validation_error"
        }
    )

async def database_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handler for database exceptions"""
    # Cast to SQLAlchemyError
    db_exc = exc  # type: ignore
    client_ip = request.client.host if request.client else "unknown"
    error_traceback = traceback.format_exc()
    
    # Log database errors
    logger.error(f"Database error: {str(db_exc)}")  # type: ignore
    logger.error(f"Traceback: {error_traceback}")
    
    security_service.log_audit_event(
        user_id=None,
        action="DATABASE_ERROR",
        table_name="database_errors",
        ip_address=client_ip,
        new_values={
            "error_type": type(db_exc).__name__,  # type: ignore
            "error_message": str(db_exc),  # type: ignore
            "path": str(request.url),
            "method": request.method
        }
    )
    
    # Send to Telegram
    try:
        user_info: Optional[Dict[str, Any]] = None
        if hasattr(request.state, 'user') and request.state.user:
            user_info = {
                "user_id": getattr(request.state.user, 'id', None),
                "username": getattr(request.state.user, 'username', None),
                "role": getattr(request.state.user, 'role', None)
            }
        
        request_info = {
            "path": str(request.url),
            "method": request.method,
            "ip_address": client_ip,
        }
        
        error_details = {
            "error_type": type(db_exc).__name__,  # type: ignore
            "sqlalchemy_error": str(db_exc)[:500],  # type: ignore
        }
        
        asyncio.create_task(telegram_service.send_error_report(
            error_type="خطأ في قاعدة البيانات",
            error_message=str(db_exc),  # type: ignore
            error_location=f"{request.method} {request.url.path}",
            error_details=error_details,
            stack_trace=error_traceback,
            user_info=user_info,
            request_info=request_info
        ))
    except Exception as telegram_error:
        logger.error(f"Failed to send database error to Telegram: {telegram_error}")
    
    # Create system notification for database errors
    security_service.create_system_notification(
        recipient_role="director",
        recipient_id=None,
        title="تنبيه خطأ في قاعدة البيانات",
        message=f"حدث خطأ في قاعدة البيانات: {type(db_exc).__name__}",  # type: ignore
        notification_type="error"
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "فشلت عملية قاعدة البيانات",
            "type": "database_error"
        }
    )