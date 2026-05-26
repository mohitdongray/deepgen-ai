import sys
import io
import os
import asyncio
import uuid
import base64
import requests
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from app.config import get_settings
from app.core.http import HttpClient
from app.providers.registry import ProviderRegistry
from db import create_job, update_job, get_job, test_connection

print("[STARTUP] main.py loaded (awaiting startup event for HTTP client init)")
print(f"[STARTUP] QWEN_API_KEY    : {bool(os.getenv('QWEN_API_KEY'))}")
print(f"[STARTUP] FLUX_API_KEY    : {bool(os.getenv('FLUX_API_KEY'))}")
print(f"[STARTUP] TAVUS_API_KEY   : {bool(os.getenv('TAVUS_API_KEY'))}")
print(f"[STARTUP] TAVUS_REPLICA_ID: {bool(os.getenv('TAVUS_REPLICA_ID'))}")

# ✅ FIX #1: Don't initialize at module level
# These will be initialized in startup() event
settings = None
http_client = None
registry = None

app = FastAPI(title="DeepGen AI Service", version="2.1.0")

@app.on_event("startup")
async def startup():
    global settings, http_client, registry
    
    # Initialize settings
    settings = get_settings()
    print(f"[STARTUP] Settings loaded")
    
    # Initialize HTTP client and start it
    http_client = HttpClient(settings)
    await http_client.start()
    print("✅ HTTP client started")
    
    # Initialize registry after HTTP client is ready
    registry = ProviderRegistry(settings, http_client)
    print("✅ Provider registry initialized")

@app.on_event("shutdown")
async def shutdown():
    await http_client.stop()
    print("🛑 HTTP client stopped")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://deepgen-gateway.onrender.com",
        "http://localhost:5000",
        "https://deepgen-ai-1.onrender.com"   # optional, for direct frontend calls
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("outputs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

class GenerateRequest(BaseModel):
    job_id: Optional[str] = None
    mode: str = "image"
    description: Optional[str] = None
    text: Optional[str] = None
    consent_confirmed: str = "true"

@app.get("/")
async def root():
    return {"status": "running", "version": "2.1.0", "storage": "in-memory"}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "db": "in-memory",
        "providers": {
            "qwen":   bool(os.getenv("QWEN_API_KEY")),
            "flux":   bool(os.getenv("FLUX_API_KEY")),
            "tavus":  bool(os.getenv("TAVUS_API_KEY")),
        },
    }

@app.post("/generate")
async def generate(
    background_tasks: BackgroundTasks,
    description: str = Form(...),
    mode: str = Form(...),
    source_image: UploadFile = File(None),
    target_video: UploadFile = File(None),
):
    job_id = str(uuid.uuid4())
    print(f"[JOB:{job_id}] /generate  mode={mode}")
    await create_job(job_id=job_id, metadata={"mode": mode, "description": description})
    background_tasks.add_task(process_job, job_id, description, mode)
    return {"job_id": job_id, "status": "pending"}

@app.post("/generate-json")
async def generate_json(request: GenerateRequest, background_tasks: BackgroundTasks):
    job_id = request.job_id or str(uuid.uuid4())
    prompt = request.description or request.text or "a beautiful scene"
    print(f"[JOB:{job_id}] /generate-json  mode={request.mode}")
    await create_job(job_id=job_id, metadata={"mode": request.mode, "description": prompt})
    background_tasks.add_task(process_job, job_id, prompt, request.mode)
    return {"job_id": job_id, "status": "pending", "request_id": job_id}

@app.get("/status/{job_id}")
async def status(job_id: str):
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for k in ("created_at", "updated_at"):
        if job.get(k) and hasattr(job[k], "isoformat"):
            job[k] = job[k].isoformat()
    return job

async def process_job(job_id: str, prompt: str, mode: str):
    print(f"[PROCESS:{job_id}] Starting — mode={mode}")
    try:
        await update_job(job_id, status="processing", progress=10)
        try:
            result, provider_name = await asyncio.wait_for(
                registry.generate(mode, prompt),
                timeout=120.0
            )
        except asyncio.TimeoutError:
            raise Exception("Provider generation timed out after 120 seconds")
        media_url = result.image_url or result.video_url or result.output
        if not media_url:
            raise RuntimeError("Provider returned no media URL")
        print(f"[PROCESS:{job_id}] provider={provider_name}  url={media_url[:80]}")

        # Pollinations will go through the normal download path so files are saved to outputs/

        saved_path = None
        try:
            if media_url.startswith("data:image"):
                header, encoded = media_url.split(",", 1)
                ext = header.split(";")[0].split("/")[1]
                file_path = f"outputs/{job_id}.{ext}"
                with open(file_path, "wb") as f:
                    f.write(base64.b64decode(encoded))
                saved_path = f"/outputs/{job_id}.{ext}"
            else:
                resp = await asyncio.to_thread(requests.get, media_url, timeout=60)
                resp.raise_for_status()
                clean_url = media_url.split("?")[0]
                default_ext = "jpg" if mode == "image" else "mp4"
                raw_ext = clean_url.split(".")[-1] if "." in clean_url.split("/")[-1] else default_ext
                ext = raw_ext if len(raw_ext) <= 4 else default_ext
                file_path = f"outputs/{job_id}.{ext}"
                with open(file_path, "wb") as f:
                    f.write(resp.content)
                saved_path = f"/outputs/{job_id}.{ext}"
            print(f"[PROCESS:{job_id}] ✅ Saved → {file_path}")
        except Exception as dl_err:
            print(f"[PROCESS:{job_id}] Download failed ({dl_err}) — using direct URL")
            saved_path = media_url
        is_image = mode == "image" or saved_path and saved_path.split("?")[0].split(".")[-1] in ("png", "jpg", "jpeg", "webp", "gif")
        result_doc = {
            "image_url": saved_path if is_image else None,
            "video_url": None if is_image else saved_path,
            "provider":  provider_name,
        }
        await update_job(
            job_id,
            status="completed",
            progress=100,
            provider=provider_name,
            result=result_doc,
            image_url=result_doc["image_url"],
            video_url=result_doc["video_url"],
        )
    except Exception as e:
        print(f"[PROCESS:{job_id}] ❌ {e}")
        await update_job(job_id, status="failed", progress=0, error=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)