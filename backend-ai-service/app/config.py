import os
from functools import lru_cache

class Settings:
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    http_timeout: int = int(os.getenv("HTTP_TIMEOUT", "120"))

    # Qwen
    qwen_api_key: str = os.getenv("QWEN_API_KEY", "")
    qwen_base_url: str = os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/api/v1")
    qwen_model: str = os.getenv("QWEN_MODEL", "wanx-v1")
    qwen_image_size: str = os.getenv("QWEN_IMAGE_SIZE", "1024*1024")
    qwen_timeout: float = float(os.getenv("QWEN_TIMEOUT", "60"))

    # Flux
    flux_api_key: str = os.getenv("FLUX_API_KEY", "")
    flux_base_url: str = os.getenv("FLUX_BASE_URL", "https://api.us1.bfl.ai")
    flux_model_endpoint: str = os.getenv("FLUX_MODEL_ENDPOINT", "v1/flux-pro-1.1")
    flux_width: int = int(os.getenv("FLUX_WIDTH", "1024"))
    flux_height: int = int(os.getenv("FLUX_HEIGHT", "1024"))
    flux_poll_interval: float = float(os.getenv("FLUX_POLL_INTERVAL", "2"))
    flux_max_polls: int = int(os.getenv("FLUX_MAX_POLLS", "60"))

    # Tavus
    tavus_api_key: str = os.getenv("TAVUS_API_KEY", "")
    tavus_replica_id: str = os.getenv("TAVUS_REPLICA_ID", "")
    tavus_base_url: str = os.getenv("TAVUS_BASE_URL", "https://tavusapi.com/v2")
    tavus_poll_interval: float = float(os.getenv("TAVUS_POLL_INTERVAL", "3"))
    tavus_max_polls: int = int(os.getenv("TAVUS_MAX_POLLS", "120"))

    # Pollinations
    pollinations_enabled: bool = os.getenv("POLLINATIONS_ENABLED", "true").lower() == "true"

@lru_cache
def get_settings() -> Settings:
    return Settings()
