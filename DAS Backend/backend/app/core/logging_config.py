"""
Custom logging configuration to filter out 401 errors
"""
import logging
from uvicorn.logging import DefaultFormatter

class FilterUnauthorized(logging.Filter):
    """Filter to exclude 401 Unauthorized logs"""
    def filter(self, record):
        # Don't log 401 errors
        if hasattr(record, 'status_code') and record.status_code == 401:
            return False
        # Also filter by message content
        if '401' in str(record.getMessage()):
            return False
        return True

class CustomAccessFormatter(DefaultFormatter):
    """Custom formatter that filters 401s"""
    def format(self, record):
        # Don't format 401 records
        if '401' in str(record.getMessage()):
            return ""
        return super().format(record)

def setup_logging():
    """Configure uvicorn logging to filter 401 errors"""
    # Get uvicorn access logger
    uvicorn_access = logging.getLogger("uvicorn.access")
    
    # Add filter to all handlers
    for handler in uvicorn_access.handlers:
        handler.addFilter(FilterUnauthorized())
        
    # Also filter uvicorn.error logger
    uvicorn_error = logging.getLogger("uvicorn.error")
    for handler in uvicorn_error.handlers:
        handler.addFilter(FilterUnauthorized())
