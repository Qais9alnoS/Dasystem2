"""
Rate Limiting Middleware and Security Enhancements
"""

import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from ..services.security_service import security_service

class AdvancedRateLimiter:
    """Advanced rate limiting with IP tracking and security monitoring"""
    
    def __init__(self):
        self.limiter = Limiter(key_func=get_remote_address)
        self.failed_attempts = defaultdict(list)
        self.blocked_ips = {}
        self.max_attempts = 5
        self.block_duration = 1800  # 30 minutes in seconds
    
    def is_ip_blocked(self, ip_address: str) -> bool:
        """Check if IP is currently blocked"""
        if ip_address in self.blocked_ips:
            block_time = self.blocked_ips[ip_address]
            if time.time() - block_time < self.block_duration:
                return True
            else:
                # Remove expired block
                del self.blocked_ips[ip_address]
        return False
    
    def record_failed_attempt(self, ip_address: str, username: Optional[str] = None):
        """Record failed authentication attempt"""
        current_time = time.time()
        
        # Clean old attempts (older than block duration)
        self.failed_attempts[ip_address] = [
            attempt_time for attempt_time in self.failed_attempts[ip_address]
            if current_time - attempt_time < self.block_duration
        ]
        
        self.failed_attempts[ip_address].append(current_time)
        
        # Block IP if too many attempts
        if len(self.failed_attempts[ip_address]) >= self.max_attempts:
            self.blocked_ips[ip_address] = current_time
            
            # Log security event
            security_service.create_system_notification(
                recipient_role="director",
                recipient_id=None,
                title="Security Alert: IP Blocked",
                message=f"IP address {ip_address} has been blocked due to repeated failed login attempts.",
                notification_type="warning"
            )
    
    def record_successful_attempt(self, ip_address: str):
        """Record successful authentication attempt"""
        # Clear failed attempts for this IP
        if ip_address in self.failed_attempts:
            del self.failed_attempts[ip_address]
    
    def get_remaining_attempts(self, ip_address: str) -> int:
        """Get remaining attempts before IP block"""
        current_time = time.time()
        
        # Clean old attempts
        self.failed_attempts[ip_address] = [
            attempt_time for attempt_time in self.failed_attempts[ip_address]
            if current_time - attempt_time < self.block_duration
        ]
        
        return max(0, self.max_attempts - len(self.failed_attempts[ip_address]))

# Global rate limiter instance
rate_limiter = AdvancedRateLimiter()

# Rate limit configurations
RATE_LIMITS = {
    "auth": "5/minute",
    "api": "100/minute",
    "upload": "10/minute",
    "search": "50/minute",
    "reports": "20/minute"
}

async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    start_time = time.time()
    
    # Get client IP
    client_ip = get_remote_address(request)
    
    # Check if IP is blocked
    if rate_limiter.is_ip_blocked(client_ip):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "IP address is temporarily blocked due to too many failed attempts",
                "retry_after": rate_limiter.block_duration
            }
        )
    
    try:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Add processing time header
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
        
    except RateLimitExceeded as e:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Rate limit exceeded",
                "retry_after": "60"  # Default retry after 60 seconds
            }
        )
    except Exception as e:
        # Log unexpected errors
        security_service.log_audit_event(
            user_id=None,
            action="ERROR",
            table_name="middleware",
            ip_address=client_ip,
            new_values={"error": str(e), "path": str(request.url)}
        )
        raise

async def security_headers_middleware(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    
    return response

def create_custom_rate_limit_handler():
    """Create custom rate limit exceeded handler"""
    async def rate_limit_handler(request: Request, exc: Exception):
        # Cast to RateLimitExceeded
        rate_exc = exc  # type: ignore
        client_ip = get_remote_address(request)
        
        # Log rate limit violation
        security_service.log_audit_event(
            user_id=None,
            action="RATE_LIMIT_EXCEEDED",
            table_name="rate_limits",
            ip_address=client_ip,
            new_values={
                "path": str(request.url),
                "method": request.method,
                "limit": str(rate_exc.detail)  # type: ignore
            }
        )
        
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Rate limit exceeded. Please try again later.",
                "retry_after": "60"  # Default retry after 60 seconds
            }
        )
    
    return rate_limit_handler
