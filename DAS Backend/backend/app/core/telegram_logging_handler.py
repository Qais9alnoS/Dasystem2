"""
Custom logging handler that sends ERROR and WARNING level logs to Telegram
"""
import logging
import asyncio
from typing import Optional, Dict, Any
import traceback
from datetime import datetime

from ..services.telegram_service import telegram_service


class TelegramLoggingHandler(logging.Handler):
    """Custom logging handler that sends logs to Telegram"""
    
    def __init__(self, level=logging.WARNING):
        super().__init__(level)
        self.enabled = telegram_service.enabled
    
    def emit(self, record: logging.LogRecord):
        """Emit a log record to Telegram"""
        if not self.enabled:
            return
        
        try:
            # Only send ERROR and WARNING level logs
            if record.levelno < logging.WARNING:
                return
            
            # Get error details
            error_type = record.levelname
            error_message = record.getMessage()
            error_location = f"{record.pathname}:{record.lineno}"
            
            # Get exception info if available
            stack_trace = None
            if record.exc_info:
                stack_trace = self.format(record)
            
            # Prepare error details
            error_details: Dict[str, Any] = {
                "logger_name": record.name,
                "module": record.module,
                "function": record.funcName,
                "level": record.levelname,
            }
            
            # Add extra context if available
            if hasattr(record, 'user_id'):
                error_details["user_id"] = record.user_id
            if hasattr(record, 'ip_address'):
                error_details["ip_address"] = record.ip_address
            
            # Send to Telegram (non-blocking)
            if record.levelno >= logging.ERROR:
                asyncio.create_task(telegram_service.send_error_report(
                    error_type=error_type,
                    error_message=error_message,
                    error_location=error_location,
                    error_details=error_details,
                    stack_trace=stack_trace
                ))
            elif record.levelno >= logging.WARNING:
                asyncio.create_task(telegram_service.send_warning_report(
                    warning_type=error_type,
                    warning_message=error_message,
                    warning_location=error_location,
                    warning_details=error_details
                ))
                
        except Exception as e:
            # Avoid infinite loop - don't log errors from this handler
            print(f"Failed to send log to Telegram: {e}")


def setup_telegram_logging():
    """Setup Telegram logging handler for the application"""
    handler = TelegramLoggingHandler(level=logging.WARNING)
    
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    
    return handler

