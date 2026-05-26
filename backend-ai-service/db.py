import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any

JOBS_FILE = Path("jobs.json")
_memory_store: Dict[str, Dict[str, Any]] = {}
_lock = asyncio.Lock()

async def _save():
    """Write current jobs to disk."""
    async with _lock:
        JOBS_FILE.write_text(json.dumps(_memory_store, indent=2, default=str))

async def _load():
    """Load jobs from disk on startup."""
    global _memory_store
    if JOBS_FILE.exists():
        try:
            data = json.loads(JOBS_FILE.read_text())
            _memory_store = data
        except Exception as e:
            print(f"Failed to load jobs: {e}")

async def create_job(job_id: str, metadata: dict = None) -> dict:
    doc = {
        "job_id": job_id,
        "status": "pending",
        "progress": 0,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "metadata": metadata or {},
        "result": None,
        "provider": None,
        "image_url": None,
        "video_url": None,
        "error": None,
    }
    async with _lock:
        _memory_store[job_id] = doc
    await _save()
    return doc

async def update_job(job_id: str, **kwargs):
    async with _lock:
        if job_id not in _memory_store:
            return
        for key, value in kwargs.items():
            if value is not None:
                _memory_store[job_id][key] = value
        _memory_store[job_id]["updated_at"] = datetime.utcnow().isoformat()
    await _save()

async def get_job(job_id: str) -> Optional[dict]:
    async with _lock:
        return _memory_store.get(job_id)

async def test_connection():
    await _load()
    print("✅ File‑backed job store ready (jobs.json)")