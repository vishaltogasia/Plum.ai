from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("plum.ai.rate_limit")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

def rate_limit_error_handler(request: Request, exc: RateLimitExceeded):
    """Custom error handler for rate limit exceeded."""
    logger.warning(f"Rate limit exceeded for {get_remote_address(request)}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "detail": "Too many requests. Please try again later.",
            "retry_after": exc.detail.split("calls in ")[-1] if hasattr(exc, 'detail') else None
        }
    )

# Rate limiting rules by endpoint type
RATE_LIMITS = {
    # Auth endpoints - Allow more lenient limits for login attempts
    "auth_login": "5/minute",
    "auth_register": "3/minute",
    "auth_refresh": "10/minute",
    
    # Chat endpoints - Moderate limits to prevent abuse
    "chat_stream": "30/hour",
    "chat_message": "50/hour",
    
    # Knowledge base - Prevent spam uploads
    "kb_upload": "10/hour",
    "kb_url_ingest": "20/hour",
    
    # Public endpoints - Stricter limits
    "public_chat_session": "20/hour",
    "public_chat_message": "100/hour",
    
    # Admin endpoints - More lenient for legitimate use
    "business_create": "50/day",
    "business_update": "100/day",
    "analytics_query": "200/hour",
}

def apply_rate_limit(limit_key: str):
    """
    Decorator to apply rate limiting to endpoints.
    
    Usage:
        @router.post("/endpoint")
        @apply_rate_limit("endpoint_key")
        def my_endpoint():
            pass
    """
    def decorator(func):
        limit = RATE_LIMITS.get(limit_key, "100/hour")
        return limiter.limit(limit)(func)
    return decorator
