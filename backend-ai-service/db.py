"""
MongoDB Database Helper

Provides persistent storage for jobs using MongoDB Atlas.
This ensures jobs survive server restarts and can be
accessed across multiple server instances.
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv
from typing import Optional, Dict, Any
from datetime import datetime

load_dotenv()

# MongoDB Configuration - Read from environment
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is required")

# Initialize MongoDB client
client = MongoClient(MONGO_URI)
db = client["ai_jobs"]
jobs_collection = db["jobs"]

def create_job(job_id: str, user_id: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Create a new job in MongoDB."""
    job = {
        "job_id": job_id,
        "user_id": user_id,
        "status": "queued",
        "progress": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "result": None,
        "provider": None,
        "error": None,
        "metadata": metadata or {}
    }
    jobs_collection.insert_one(job)
    return job

def update_job(job_id: str, **kwargs) -> None:
    """Update job in MongoDB."""
    kwargs["updated_at"] = datetime.utcnow()
    jobs_collection.update_one({"job_id": job_id}, {"$set": kwargs})

def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Get job by ID from MongoDB."""
    return jobs_collection.find_one({"job_id": job_id})

def list_jobs(user_id: Optional[str] = None) -> list:
    """List all jobs, optionally filtered by user."""
    if user_id:
        return list(jobs_collection.find({"user_id": user_id}))
    return list(jobs_collection.find())

def delete_job(job_id: str) -> None:
    """Delete job from MongoDB."""
    jobs_collection.delete_one({"job_id": job_id})

def get_job_count() -> int:
    """Get total number of jobs."""
    return jobs_collection.count_documents({})

def cleanup_old_jobs(days: int = 7) -> int:
    """Clean up jobs older than specified days."""
    cutoff_date = datetime.utcnow() - datetime.timedelta(days=days)
    result = jobs_collection.delete_many({"created_at": {"$lt": cutoff_date}})
    return result.deleted_count

def test_connection():
    """Test MongoDB connection."""
    try:
        client.admin.command("ping")
        print("✅ MongoDB connection established")
        return True
    except Exception as e:
        print("MongoDB connection failed:", e)
        return False
