"""
Configuration Management

Loads configuration from environment variables with sensible defaults.
Uses pydantic_settings for type validation.
"""

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Service Configuration
    port: int = 8000
    host: str = "0.0.0.0"
    debug: bool = False
    log_level: str = "info"
    
    # AI API Keys
    heygen_api_key: Optional[str] = None
    tavus_api_key: Optional[str] = None
    huggingface_token: Optional[str] = None
    replicate_api_token: Optional[str] = None
    
    # Storage
    storage_backend: str = "local"  # local, s3
    local_storage_path: str = "./storage"
    
    # Redis (for production)
    redis_url: Optional[str] = None
    
    # AWS (optional)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"
    s3_bucket_name: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Global settings instance
settings = Settings()
