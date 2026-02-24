# AI Video Generation Platform - Python FastAPI AI Orchestration Service
#
# This service handles:
# - Communication with external AI APIs (HeyGen, Tavus, HuggingFace, Replicate)
# - Job management and state persistence
# - Response normalization from different providers
# - Asynchronous processing of video generation
#
# WHY PYTHON FOR AI SERVICE?
# - Native ecosystem for AI/ML integration (httpx, aiohttp for async HTTP)
# - Excellent async/await support for handling long-running AI API calls
# - Type hints with Pydantic for request/response validation
# - Better concurrency model for I/O-bound AI API operations
# - Clean separation: Gateway handles auth/routing, Python handles AI logic

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import asyncio
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load API keys
HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY")
TAVUS_API_KEY = os.getenv("TAVUS_API_KEY")
HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

from app.core.logging import setup_logging
from app.jobs.manager import JobManager
from app.services.orchestrator_minimal import AIOrchestrator

# Setup logging
logger = setup_logging()

# Initialize FastAPI app
app = FastAPI(
    title="AI Video Generation Service",
    description="Orchestrates video generation using external AI APIs",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],  # Only accept from Node.js gateway
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Initialize components
job_manager = JobManager()
orchestrator = AIOrchestrator()

# ============================================================================
# Pydantic Models (Request/Response Schemas)
# ============================================================================

class GenerationRequest(BaseModel):
    job_id: str
    consent_confirmed: bool
    description: Optional[str] = None
    
    # Educational note: We validate consent at every layer of the stack
    # to ensure ethical usage requirements are met.

class GenerationResponse(BaseModel):
    job_id: str
    status: str  # pending, processing, completed, failed
    message: str
    estimated_time: Optional[int] = None  # seconds

class StatusResponse(BaseModel):
    job_id: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    provider: Optional[str] = None
    processing_time: Optional[str] = None

# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/")
async def read_root():
    """Root endpoint with API information."""
    return {
        "message": "AI Video Generation Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "generate": "/generate",
            "status": "/status/{job_id}",
            "docs": "/docs"
        },
        "status": "running"
    }

# ============================================================================
# Health Check Endpoint
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "ai-orchestration",
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# Video Generation Endpoint (Form Data)
# ============================================================================

@app.post("/generate", response_model=GenerationResponse)
async def generate_video(
    background_tasks: BackgroundTasks,
    source_image: UploadFile = File(..., description="Source face image"),
    target_video: UploadFile = File(..., description="Target video file"),
    job_id: str = Form(...),
    consent_confirmed: str = Form(...),
    description: Optional[str] = Form(None)
):
    """
    Initiate video generation process with form data.
    
    This endpoint:
    1. Validates consent confirmation
    2. Creates a job entry for tracking
    3. Reads file data immediately
    4. Queues the generation task to run asynchronously
    5. Returns immediately with job ID for polling
    
    The actual processing happens in background to handle
    the 1-3 minute processing time of external AI APIs.
    """
    
    # ETHICS CHECK: Validate consent was confirmed
    if consent_confirmed.lower() not in ['true', '1', 'yes']:
        raise HTTPException(
            status_code=400,
            detail="Consent must be confirmed to proceed with video generation"
        )
    
    logger.info(f"Starting video generation job: {job_id}")
    
    # Read files immediately to avoid I/O issues
    source_bytes = await source_image.read()
    target_bytes = await target_video.read()
    
    # Create job record
    job_manager.create_job(
        job_id=job_id,
        status="pending",
        metadata={
            "source_filename": source_image.filename,
            "target_filename": target_video.filename,
            "description": description,
            "consent_confirmed": True
        }
    )
    
    # Queue background task with bytes (not UploadFile objects)
    # This allows immediate response while processing continues
    background_tasks.add_task(
        process_video_generation,
        job_id=job_id,
        source_bytes=source_bytes,
        target_bytes=target_bytes,
        description=description
    )
    
    return GenerationResponse(
        job_id=job_id,
        status="pending",
        message="Video generation queued",
        estimated_time=180  # 3 minutes estimated
    )

# ============================================================================
# Video Generation Endpoint (JSON)
# ============================================================================

class VideoGenerationRequest(BaseModel):
    """Request model for JSON video generation."""
    job_id: str
    description: Optional[str] = None
    source_image: str  # Base64 encoded
    target_video: str  # Base64 encoded
    consent_confirmed: str = "true"

@app.post("/generate-json", response_model=GenerationResponse)
async def generate_video_json(
    request: VideoGenerationRequest,
    background_tasks: BackgroundTasks
):
    """
    Initiate video generation process with JSON payload.
    
    Accepts base64 encoded files in JSON format.
    """
    
    # ETHICS CHECK: Validate consent was confirmed
    if request.consent_confirmed.lower() not in ['true', '1', 'yes']:
        raise HTTPException(
            status_code=400,
            detail="Consent must be confirmed to proceed with video generation"
        )
    
    logger.info(f"Starting video generation job: {request.job_id}")
    
    # Decode base64 files
    try:
        import base64
        source_bytes = base64.b64decode(request.source_image)
        target_bytes = base64.b64decode(request.target_video)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid base64 encoding: {str(e)}"
        )
    
    # Create job record
    job_manager.create_job(
        job_id=request.job_id,
        status="pending",
        metadata={
            "source_filename": "source_image.jpg",
            "target_filename": "target_video.mp4",
            "description": request.description,
            "consent_confirmed": True,
            "payload_type": "json"
        }
    )
    
    # Queue background task with decoded bytes
    background_tasks.add_task(
        process_video_generation,
        job_id=request.job_id,
        source_bytes=source_bytes,
        target_bytes=target_bytes,
        description=request.description
    )
    
    return GenerationResponse(
        job_id=request.job_id,
        status="pending",
        message="Video generation queued",
        estimated_time=180  # 3 minutes estimated
    )

# ============================================================================
# Status Check Endpoint
# ============================================================================

@app.get("/status/{job_id}", response_model=StatusResponse)
async def get_status(job_id: str):
    """
    Get the current status of a video generation job.
    
    Frontend polls this endpoint to track progress.
    """
    job = job_manager.get_job(job_id)
    
    if not job:
        raise HTTPException(
            status_code=404,
            detail=f"Job {job_id} not found"
        )
    
    return StatusResponse(
        job_id=job_id,
        status=job["status"],
        created_at=job["created_at"],
        updated_at=job.get("updated_at"),
        result=job.get("result"),
        error=job.get("error"),
        provider=job.get("provider"),
        processing_time=job.get("processing_time")
    )

# ============================================================================
# Background Task: Video Generation
# ============================================================================

async def process_video_generation(
    job_id: str,
    source_bytes: bytes,
    target_bytes: bytes,
    description: Optional[str]
):
    """
    Background task that handles the actual video generation.
    
    This function:
    1. Updates job status to 'processing'
    2. Selects appropriate AI provider
    3. Makes API call to external service
    4. Handles response and normalizes it
    5. Updates job with result or error
    
    Architecture note: This runs in background to not block HTTP response.
    External AI APIs (HeyGen, Tavus, etc.) take 1-3 minutes to complete.
    """
    start_time = datetime.utcnow()
    
    try:
        # Update status to processing
        job_manager.update_job(job_id, status="processing")
        logger.info(f"Job {job_id}: Processing started")
        
        # ORCHESTRATION: Select and call appropriate AI provider
        # For educational project, we demonstrate the pattern with
        # configurable provider selection
        result = await orchestrator.generate_video(
            job_id=job_id,
            source_image=source_bytes,
            target_video=target_bytes,
            description=description
        )
        
        # Calculate processing time
        end_time = datetime.utcnow()
        processing_time = (end_time - start_time).total_seconds()
        
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
            processing_time=f"{processing_time:.1f}s"
        )
        
        logger.info(f"Job {job_id}: Completed in {processing_time:.1f}s")
        
    except Exception as e:
        logger.error(f"Job {job_id}: Failed - {str(e)}")
        
        # Update job with error
        job_manager.update_job(
            job_id=job_id,
            status="failed",
            error=str(e)
        )

# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Disable in production
        log_level="info"
    )
