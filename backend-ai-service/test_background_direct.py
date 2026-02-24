import asyncio
import os
import sys

# Add to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.jobs.manager import JobManager
from app.services.orchestrator_minimal import AIOrchestrator

async def test_background_direct():
    """Test background task execution directly"""
    
    print("🧪 Testing Background Task Directly...")
    
    # Initialize components
    job_manager = JobManager()
    orchestrator = AIOrchestrator()
    
    job_id = "bg_test_123"
    
    # 1. Create job
    print("\n1️⃣ Creating job...")
    job_manager.create_job(
        job_id=job_id,
        status="pending",
        metadata={
            "source_filename": "test.jpg",
            "target_filename": "test.mp4",
            "description": "Test background task",
            "consent_confirmed": True
        }
    )
    
    job = job_manager.get_job(job_id)
    print(f"Job created: {job}")
    
    # 2. Simulate background task
    print("\n2️⃣ Running background task...")
    try:
        # Update to processing
        job_manager.update_job(job_id, status="processing")
        print(f"Job updated to processing: {job_manager.get_job(job_id)}")
        
        # Call orchestrator
        result = await orchestrator.generate_video(
            job_id=job_id,
            source_image=b"fake_image_data",
            target_video=b"fake_video_data",
            description="Test background task"
        )
        
        print(f"Orchestrator result: {result}")
        
        # Update job with success
        job_manager.update_job(
            job_id=job_id,
            status="completed",
            result={
                "videoUrl": result.get("video_url"),
                "thumbnailUrl": result.get("thumbnail_url"),
                "duration": result.get("duration")
            },
            provider=result.get("provider"),
            processing_time="1.0s"
        )
        
        final_job = job_manager.get_job(job_id)
        print(f"Job completed: {final_job}")
        
    except Exception as e:
        print(f"Error in background task: {e}")
        job_manager.update_job(
            job_id=job_id,
            status="failed",
            error=str(e)
        )
        failed_job = job_manager.get_job(job_id)
        print(f"Job failed: {failed_job}")

if __name__ == "__main__":
    asyncio.run(test_background_direct())
