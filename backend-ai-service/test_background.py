import asyncio
import os
import sys

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.jobs.manager import JobManager
from app.services.orchestrator_minimal import AIOrchestrator

async def test_background_task():
    """Test the background task directly"""
    
    # Initialize components
    job_manager = JobManager()
    orchestrator = AIOrchestrator()
    
    job_id = "test123"
    
    # Create job
    job_manager.create_job(
        job_id=job_id,
        status="pending",
        metadata={
            "source_filename": "test.jpg",
            "target_filename": "test.mp4",
            "description": "Test video generation",
            "consent_confirmed": True
        }
    )
    
    print(f"Job created: {job_manager.get_job(job_id)}")
    
    # Update to processing
    job_manager.update_job(job_id, status="processing")
    print(f"Job updated to processing: {job_manager.get_job(job_id)}")
    
    # Call orchestrator
    try:
        result = await orchestrator.generate_video(
            job_id=job_id,
            source_image=b"fake_image_data",
            target_video=b"fake_video_data",
            description="Test video generation"
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
            processing_time="2.0s"
        )
        
        print(f"Job completed: {job_manager.get_job(job_id)}")
        
    except Exception as e:
        print(f"Error in background task: {e}")
        job_manager.update_job(
            job_id=job_id,
            status="failed",
            error=str(e)
        )
        print(f"Job failed: {job_manager.get_job(job_id)}")

if __name__ == "__main__":
    asyncio.run(test_background_task())
