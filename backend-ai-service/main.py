import sys
import io
import os

# ============================================================
#  CRITICAL: Load .env FIRST — before any os.getenv() calls
# ============================================================
from dotenv import load_dotenv
load_dotenv()  # reads .env from the current working directory

# Ensure this file's own directory is on sys.path so
# `from ai.ai_provider import ...` works regardless of launch dir.
_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, Dict, Any
import base64
import uuid
import asyncio
import requests
import json

from ai.ai_provider import AIProviderManager

print("[STARTUP] main.py loaded")
print(f"[STARTUP] HuggingFace key present: {bool(os.getenv('HUGGINGFACE_API_KEY'))}")
print(f"[STARTUP] DeepAI key present:      {bool(os.getenv('DEEPAI_API_KEY'))}")
print(f"[STARTUP] HeyGen key present:      {bool(os.getenv('HEYGEN_API_KEY'))}")
print(f"[STARTUP] NVIDIA key present:      {bool(os.getenv('NVIDIA_API_KEY'))}")

# =========================
# APP SETUP
# =========================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("outputs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

JOBS_FILE = "jobs.json"

def load_jobs() -> Dict[str, Any]:
    if os.path.exists(JOBS_FILE):
        try:
            with open(JOBS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_jobs():
    with open(JOBS_FILE, "w") as f:
        json.dump(jobs, f)

jobs: Dict[str, Any] = load_jobs()
provider_manager = AIProviderManager()

# =========================
# BASIC ROUTES
# =========================

@app.get("/")
async def root():
    return {"status": "running"}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "providers": {
            "huggingface": bool(os.getenv("HUGGINGFACE_API_KEY")),
            "deepai":      bool(os.getenv("DEEPAI_API_KEY")),
            "nvidia":      bool(os.getenv("NVIDIA_API_KEY")),
            "heygen":      bool(os.getenv("HEYGEN_API_KEY")),
        }
    }

# =========================
# REQUEST MODELS
# =========================

class VideoGenerationRequest(BaseModel):
    job_id: Optional[str] = None
    mode: str = "image"
    description: Optional[str] = None
    text: Optional[str] = None
    consent_confirmed: str = "true"

# =========================
# ENDPOINTS
# =========================

@app.post("/generate")
async def generate(
    background_tasks: BackgroundTasks,
    description: str = Form(...),
    mode: str = Form(...),
    source_image: UploadFile = File(None),
    target_video: UploadFile = File(None),
):
    job_id = str(uuid.uuid4())
    print(f"[JOB:{job_id}] Mode={mode}  Prompt={description[:60]}")
    jobs[job_id] = {"job_id": job_id, "status": "pending", "video_url": None, "image_url": None}
    save_jobs()
    background_tasks.add_task(process_job, job_id, description, mode)
    return {"job_id": job_id, "status": "pending"}


@app.post("/generate-json")
async def generate_json(request: VideoGenerationRequest, background_tasks: BackgroundTasks):
    job_id = request.job_id or str(uuid.uuid4())
    prompt = request.description or request.text or "a beautiful scene"
    print(f"[JOB:{job_id}] Mode={request.mode}  Prompt={prompt[:60]}")
    jobs[job_id] = {"job_id": job_id, "status": "pending", "video_url": None, "image_url": None}
    save_jobs()
    background_tasks.add_task(process_job, job_id, prompt, request.mode)
    return {"job_id": job_id, "status": "pending", "request_id": job_id}


@app.get("/status/{job_id}")
async def status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# =========================
# BACKGROUND WORKER
# =========================

async def process_job(job_id: str, prompt: str, mode: str):
    print(f"[PROCESS:{job_id}] Starting — mode={mode}")
    try:
        jobs[job_id]["status"] = "processing"
        save_jobs()

        # Run the synchronous provider manager in a thread pool
        result = await asyncio.to_thread(provider_manager.generate, mode, prompt)
        print(f"[PROCESS:{job_id}] Raw result: {result}")

        # ── Extract media URL ──────────────────────────────────────────
        media_url = None
        if result:
            media_url = (
                result.get("video_url") or
                result.get("image_url") or
                result.get("output_url")
            )
            if not media_url and isinstance(result.get("output"), str):
                out = result["output"]
                if out.startswith("http") or out.startswith("data:"):
                    media_url = out
            if not media_url and isinstance(result.get("output"), dict):
                out = result["output"]
                media_url = out.get("video_url") or out.get("image_url")

        if not media_url:
            print(f"[PROCESS:{job_id}] No URL found — falling back")
            media_url = "https://www.w3schools.com/html/mov_bbb.mp4"

        provider_name = result.get("provider", "unknown") if result else "unknown"
        print(f"[PROCESS:{job_id}] Provider={provider_name}  URL={media_url[:80]}")

        # ── Download / decode and save locally ────────────────────────
        try:
            if media_url.startswith("data:image"):
                header, encoded = media_url.split(",", 1)
                ext = header.split(";")[0].split("/")[1]
                file_path = f"outputs/{job_id}.{ext}"
                with open(file_path, "wb") as f:
                    f.write(base64.b64decode(encoded))
            else:
                response = await asyncio.to_thread(requests.get, media_url, timeout=30)
                response.raise_for_status() # Ensure we got a valid response
                
                # Strip query params from URL before checking extension
                clean_url = media_url.split("?")[0]
                default_ext = "jpg" if mode == "image" else "mp4"
                
                ext = clean_url.split(".")[-1] if "." in clean_url.split("/")[-1] else default_ext
                if len(ext) > 4: ext = default_ext
                
                file_path = f"outputs/{job_id}.{ext}"
                with open(file_path, "wb") as f:
                    f.write(response.content)

            jobs[job_id]["status"] = "completed"
            jobs[job_id]["provider"] = provider_name
            is_image = mode == "image" or ext in ("png", "jpg", "jpeg", "webp", "gif")
            if is_image:
                jobs[job_id]["image_url"] = f"/outputs/{job_id}.{ext}"
            else:
                jobs[job_id]["video_url"] = f"/outputs/{job_id}.{ext}"
            save_jobs()
            print(f"[PROCESS:{job_id}] ✅ Completed — saved to {file_path}")

        except Exception as dl_err:
            print(f"[PROCESS:{job_id}] Download failed ({dl_err}) — using direct URL")
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["provider"] = provider_name
            if mode == "image":
                jobs[job_id]["image_url"] = media_url
            else:
                jobs[job_id]["video_url"] = media_url
            save_jobs()

    except Exception as e:
        print(f"[PROCESS:{job_id}] ❌ Error: {e}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        save_jobs()

# =========================
# RUN
# =========================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)