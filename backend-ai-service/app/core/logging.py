"""
Structured Logging Configuration

Sets up consistent logging across the Python service.
"""

import logging
import sys
from pythonjsonlogger import jsonlogger

def setup_logging() -> logging.Logger:
    """Configure structured logging for the application."""
    
    logger = logging.getLogger("ai_video_service")
    logger.setLevel(logging.INFO)
    
    # Console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    
    # JSON formatter for structured logs
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s'
    )
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    
    return logger
