"""
Job Manager

Manages lifecycle of video generation jobs.
Uses persistent JobStore for shared in-memory storage.
In production, this would use Redis or a database.
"""

from typing import Dict, Optional, Any
from datetime import datetime
import asyncio
from .job_store import JobStore

class JobManager:
    """
    Manages async video generation jobs using persistent JobStore.
    
    Handles:
    - Job creation and tracking
    - Status updates
    - Result storage
    - Cleanup of old jobs
    
    Uses JobStore singleton pattern to ensure jobs persist
    across all instances and requests.
    """
    
    def __init__(self):
        # Use JobStore instead of per-instance dictionary
        # This ensures jobs persist across requests
        self._lock = asyncio.Lock()
    
    def create_job(self, job_id: str, status: str, metadata: Dict[str, Any]) -> None:
        """Create a new job entry in shared store."""
        JobStore.add_job(job_id, {
            "job_id": job_id,
            "status": status,
            "created_at": datetime.utcnow(),
            "updated_at": None,
            "metadata": metadata,
            "result": None,
            "error": None,
            "provider": None,
            "processing_time": None
        })
    
    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job by ID from shared store."""
        return JobStore.get_job(job_id)
    
    def update_job(
        self,
        job_id: str,
        status: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        provider: Optional[str] = None,
        processing_time: Optional[str] = None
    ) -> None:
        """Update job status and results in shared store."""
        if JobStore.get_job(job_id) is None:
            return
        
        # Build update dictionary
        updates = {}
        if status:
            updates["status"] = status
        if result:
            updates["result"] = result
        if error:
            updates["error"] = error
        if provider:
            updates["provider"] = provider
        if processing_time:
            updates["processing_time"] = processing_time
        
        # Update timestamp
        updates["updated_at"] = datetime.utcnow()
        
        # Apply updates to shared store
        JobStore.update_job(job_id, **updates)
    
    def delete_job(self, job_id: str) -> None:
        """Delete a job from shared store."""
        JobStore.delete_job(job_id)
    
    def list_jobs(self) -> Dict[str, Dict[str, Any]]:
        """List all jobs from shared store (for admin/debug)."""
        return JobStore.list_jobs()
    
    def get_job_count(self) -> int:
        """Get total number of jobs."""
        return JobStore.get_job_count()
