# backend-ai-service/db.py
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any

_memory_store: Dict[str, Dict[str, Any]] = {}
_lock = asyncio.Lock()

async def create_job(job_id: str, metadata: dict = None) -> dict:
    doc = {
        "job_id": job_id,
        "status": "pending",
        "progress": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "metadata": metadata or {},
        "result": None,
        "provider": None,
        "image_url": None,
        "video_url": None,
        "error": None,
    }
    async with _lock:
        _memory_store[job_id] = doc
    return doc

async def update_job(job_id: str, **kwargs):
    async with _lock:
        if job_id not in _memory_store:
            return
        for key, value in kwargs.items():
            if value is not None:
                _memory_store[job_id][key] = value
        _memory_store[job_id]["updated_at"] = datetime.utcnow()

async def get_job(job_id: str) -> Optional[dict]:
    async with _lock:
        return _memory_store.get(job_id)

async def test_connection():
    print("✅ Using in‑memory job store (no MongoDB)")
    return True