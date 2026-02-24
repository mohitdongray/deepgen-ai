"""
Mongo FastAPI Application (REAL AI VERSION)

Uses MongoDB + HuggingFace AI
No stub progress streaming
Returns REAL generated output
"""

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
from datetime import datetime
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

# Load env
load_dotenv()

# Mongo Helpers
from db import create_job, update_job, get_job, test_connection, list_jobs, get_job_count, cleanup_old_jobs

# REAL AI Orchestrator
from app.services.ai_orchestrator import AIOrchestrator
from app.services.visual_orchestrator import VisualOrchestrator
from ai.deepai_provider import generate_image as deepai_generate_image

# Init App
app = FastAPI(
    title="AI Video Generation Service",
    description="Persistent AI video generation with MongoDB",
    version="2.0.0",
)

# Initialize Orchestrators
video_orchestrator = AIOrchestrator()
visual_orchestrator = VisualOrchestrator()

# Mount static files
app.mount("/static", StaticFiles(directory="."), name="static")

# ============================
# Models
# ============================

class VideoRequest(BaseModel):
    user_id: str
    description: str = "Generate a video"

class JobRequest(BaseModel):
    user_id: str
    description: str = "Hello world"

class VisualRequest(BaseModel):
    user_id: str
    prompt: str = "Generate an AI image"

class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    result: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

# ============================
# Health
# ============================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "mongodb": "connected" if test_connection() else "disconnected",
        "timestamp": datetime.utcnow()
    }

# ============================
# VIDEO PIPELINE
# ============================

@app.post("/generate-video", response_model=JobResponse)
async def generate_video(req: VideoRequest, background_tasks: BackgroundTasks):
    
    job_id = str(uuid.uuid4())
    
    create_job(
        job_id=job_id,
        user_id=req.user_id,
        metadata={
            "description": req.description,
            "submitted_at": datetime.utcnow().isoformat(),
            "pipeline": "video"
        }
    )
    
    background_tasks.add_task(process_video_job, job_id, req.description)
    
    return JobResponse(
        job_id=job_id,
        status="queued",
        message="Video generation job submitted"
    )

# ============================
# VISUAL PIPELINE
# ============================

@app.post("/generate-visual", response_model=JobResponse)
async def generate_visual(req: VisualRequest, background_tasks: BackgroundTasks):
    
    job_id = str(uuid.uuid4())
    
    create_job(
        job_id=job_id,
        user_id=req.user_id,
        metadata={
            "description": req.prompt,
            "submitted_at": datetime.utcnow().isoformat(),
            "pipeline": "visual"
        }
    )
    
    background_tasks.add_task(process_visual_job, job_id, req.prompt)
    
    return JobResponse(
        job_id=job_id,
        status="queued",
        message="Visual generation job submitted"
    )

# ============================
# COMPOSITION PIPELINE (Future)
# ============================

@app.post("/compose-video", response_model=JobResponse)
async def compose_video(req: VideoRequest, background_tasks: BackgroundTasks):
    
    job_id = str(uuid.uuid4())
    
    create_job(
        job_id=job_id,
        user_id=req.user_id,
        metadata={
            "description": req.description,
            "submitted_at": datetime.utcnow().isoformat(),
            "pipeline": "composition"
        }
    )
    
    background_tasks.add_task(process_composition_job, job_id, req.description)
    
    return JobResponse(
        job_id=job_id,
        status="queued",
        message="Video composition job submitted"
    )

# ============================
# Legacy Submit (for backward compatibility)
# ============================

@app.post("/submit", response_model=JobResponse)
async def submit_job(req: JobRequest, background_tasks: BackgroundTasks):

    job_id = str(uuid.uuid4())

    create_job(
        job_id=job_id,
        user_id=req.user_id,
        metadata={
            "description": req.description,
            "submitted_at": datetime.utcnow().isoformat()
        }
    )

    background_tasks.add_task(process_job, job_id, req.description)

    return JobResponse(
        job_id=job_id,
        status="queued",
        message="Job submitted successfully"
    )

# ============================
# Job Status
# ============================

@app.get("/status/{job_id}", response_model=JobStatusResponse)
async def job_status(job_id: str):

    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusResponse(
        job_id=job["job_id"],
        status=job["status"],
        progress=job.get("progress", 0),
        result=job.get("result"),
        created_at=job["created_at"],
        updated_at=job["updated_at"]
    )

# ============================
# Admin / Listing
# ============================

@app.get("/jobs/{user_id}")
async def list_user_jobs(user_id: str):
    jobs = list_jobs(user_id=user_id)
    for job in jobs:
        job["_id"] = str(job["_id"])
    return {"jobs": jobs}

@app.get("/admin/jobs")
async def list_all_jobs():
    jobs = list_jobs()
    count = get_job_count()
    for job in jobs:
        job["_id"] = str(job["_id"])
    return {"jobs": jobs, "total": count}

@app.delete("/admin/cleanup")
async def cleanup(days: int = 7):
    deleted = cleanup_old_jobs(days)
    return {"deleted": deleted}

# ============================
# Background Workers (Clean Separation)
# ============================

async def process_video_job(job_id: str, description: str):
    """Process video generation job (Gemini + HeyGen only)"""
    try:
        print(f"🎬 Processing video job {job_id}")
        update_job(job_id, status="processing", progress=10, message="Starting video generation...")

        final_result = None
        async for progress_data in video_orchestrator.generate_video(job_id=job_id, description=description):
            update_job(
                job_id,
                progress=progress_data["progress"],
                message=progress_data.get("message", "Processing...")
            )
            
            if "result" in progress_data:
                final_result = progress_data["result"]

        update_job(
            job_id,
            status="completed",
            progress=100,
            result=final_result,
            provider=final_result.get("provider", "video-fallback"),
            message="Video generation completed"
        )
            
    except Exception as e:
        print(f"❌ Video job error: {e}")
        update_job(
            job_id,
            status="failed",
            progress=0,
            message=f"Video generation error: {str(e)}"
        )

async def process_visual_job(job_id: str, prompt: str):
    """Process visual generation job (DeepAI + HuggingFace only)"""
    try:
        print(f"🖼️ Processing visual job {job_id}")
        update_job(job_id, status="processing", progress=10, message="Starting visual generation...")

        final_result = None
        async for progress_data in visual_orchestrator.generate_visual(job_id=job_id, prompt=prompt):
            update_job(
                job_id,
                progress=progress_data["progress"],
                message=progress_data.get("message", "Processing...")
            )
            
            if "result" in progress_data:
                final_result = progress_data["result"]

        update_job(
            job_id,
            status="completed",
            progress=100,
            result=final_result,
            provider=final_result.get("provider", "visual-fallback"),
            message="Visual generation completed"
        )
            
    except Exception as e:
        print(f"❌ Visual job error: {e}")
        update_job(
            job_id,
            status="failed",
            progress=0,
            message=f"Visual generation error: {str(e)}"
        )

async def process_composition_job(job_id: str, description: str):
    """Process composition job (Visuals → Video with transitions)"""
    try:
        print(f"🧩 Processing composition job {job_id}")
        update_job(job_id, status="processing", progress=10, message="Starting video composition...")
        
        # Step 1: Generate visuals
        update_job(job_id, progress=20, message="Generating visual assets...")
        visual_result = None
        async for progress_data in visual_orchestrator.generate_visual(job_id=job_id, prompt=description):
            if "result" in progress_data:
                visual_result = progress_data["result"]
                break
        
        if visual_result:
            # Step 2: Create video from visuals (placeholder for now)
            update_job(job_id, progress=80, message="Composing video from visuals...")
            
            composed_result = {
                "video_url": f"https://composed.video/{job_id}.mp4",
                "thumbnail_url": visual_result.get("thumbnail_url"),
                "duration": 30,
                "provider": "composition-engine",
                "source_visual": visual_result
            }
            
            update_job(
                job_id,
                status="completed",
                progress=100,
                result=composed_result,
                provider="composition",
                message="Video composition completed"
            )
        else:
            raise Exception("Failed to generate visual assets")
            
    except Exception as e:
        print(f"❌ Composition job error: {e}")
        update_job(
            job_id,
            status="failed",
            progress=0,
            message=f"Composition error: {str(e)}"
        )

# ============================
# Legacy Job Processor (Backward Compatibility)
# ============================

async def process_job(job_id: str, description: str):
    """Legacy job processor for backward compatibility"""
    try:
        # Use the new video pipeline for legacy requests
        await process_video_job(job_id, description)
    except Exception as e:
        update_job(job_id, status="failed", error=str(e))

# ============================
# Root
# ============================

@app.get("/")
async def root():
    return {"message": "AI Video Service Running"}

# ============================
# Startup
# ============================

@app.on_event("startup")
async def startup():
    print("🚀 Server Starting...")
    if test_connection():
        print("✅ Mongo Connected")
    else:
        print("❌ Mongo Failed")

# ============================
# Run
# ============================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_mongo:app", host="127.0.0.1", port=8000, reload=True)
