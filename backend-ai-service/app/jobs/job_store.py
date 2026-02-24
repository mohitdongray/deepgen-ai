"""
Job Store - Persistent Storage for Jobs

Provides singleton pattern for in-memory storage that persists
across all instances and requests while the server is running.
"""

from typing import Dict, Any, Optional
from datetime import datetime

class JobStore:
    """
    Singleton job store for persistent in-memory storage.
    
    This ensures all JobManager instances share the same job data,
    solving the issue where jobs disappear between requests.
    """
    
    # Class-level dictionary shared across all instances
    _jobs: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    def add_job(cls, job_id: str, data: Dict[str, Any]) -> None:
        """Add a job to the shared store."""
        cls._jobs[job_id] = data
    
    @classmethod
    def get_job(cls, job_id: str) -> Optional[Dict[str, Any]]:
        """Get a job from the shared store."""
        return cls._jobs.get(job_id)
    
    @classmethod
    def update_job(cls, job_id: str, **kwargs) -> None:
        """Update a job in the shared store."""
        if job_id in cls._jobs:
            cls._jobs[job_id].update(kwargs)
            cls._jobs[job_id]["updated_at"] = datetime.utcnow()
    
    @classmethod
    def delete_job(cls, job_id: str) -> None:
        """Delete a job from the shared store."""
        cls._jobs.pop(job_id, None)
    
    @classmethod
    def list_jobs(cls) -> Dict[str, Dict[str, Any]]:
        """List all jobs in the shared store."""
        return cls._jobs.copy()
    
    @classmethod
    def clear_jobs(cls) -> None:
        """Clear all jobs (useful for testing)."""
        cls._jobs.clear()
    
    @classmethod
    def get_job_count(cls) -> int:
        """Get total number of jobs."""
        return len(cls._jobs)
