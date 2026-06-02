import sys
import io
import os
import asyncio
import uuid
import base64
import httpx
import aiofiles
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
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
from db import create_job, update_job, get_job

settings = None
http_client = None
registry = None

app = FastAPI(title="DeepGen AI Service", version="2.3.0")

@app.on_event("startup")
async def startup():
    global settings, http_client, registry
    settings = get_settings()
    http_client = HttpClient(settings)
    await http_client.start()
    registry = ProviderRegistry(settings, http_client)

@app.on_event("shutdown")
async def shutdown():
    await http_client.stop()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://deepgen-gateway.onrender.com",
        "http://localhost:5000",
        "https://deepgen-ai-1.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("outputs", exist_ok=True)

# ── MIME type maps ────────────────────────────────────────────────────────────
AUDIO_MIME = {"mp3": "audio/mpeg", "wav": "audio/wav", "ogg": "audio/ogg",
              "m4a": "audio/mp4", "aac": "audio/aac", "flac": "audio/flac"}
VIDEO_MIME  = {"mp4": "video/mp4", "webm": "video/webm", "mov": "video/quicktime"}
IMAGE_MIME  = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
               "webp": "image/webp", "gif": "image/gif"}

@app.get("/outputs/{filename}")
async def serve_output(filename: str):
    """
    Serve outputs/ with correct Content-Type and ngrok bypass headers.
    Replaces StaticFiles so Tavus gets audio/wav not application/octet-stream.
    """
    file_path = os.path.join("outputs", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    media_type = AUDIO_MIME.get(ext) or VIDEO_MIME.get(ext) or IMAGE_MIME.get(ext) or "application/octet-stream"
    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers={
            "ngrok-skip-browser-warning": "true",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
        },
    )


# ── Audio helpers ─────────────────────────────────────────────────────────────

def _convert_audio_to_wav(input_path: str, output_path: str) -> bool:
    """Convert audio to 16-bit PCM WAV via ffmpeg. Returns True on success."""
    try:
        import subprocess
        r = subprocess.run(
            ["ffmpeg", "-y", "-i", input_path,
             "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "1", output_path],
            capture_output=True, timeout=30,
        )
        return r.returncode == 0 and os.path.exists(output_path)
    except (FileNotFoundError, Exception):
        return False


def _get_audio_duration(file_path: str) -> float:
    """Return duration in seconds via ffprobe, or estimate from file size."""
    try:
        import subprocess, json
        r = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", file_path],
            capture_output=True, timeout=10,
        )
        if r.returncode == 0:
            return float(json.loads(r.stdout).get("format", {}).get("duration", 0))
    except Exception:
        pass
    try:
        return os.path.getsize(file_path) / 16000   # rough 128kbps estimate
    except Exception:
        return 0.0


# ── Routes ────────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    job_id: Optional[str] = None
    mode: str = "image"
    description: Optional[str] = None
    text: Optional[str] = None
    consent_confirmed: str = "true"


@app.get("/")
async def root():
    return {"status": "running", "version": "2.3.0"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "providers": {
            "qwen":  bool(os.getenv("QWEN_API_KEY")),
            "flux":  bool(os.getenv("FLUX_API_KEY")),
            "tavus": bool(os.getenv("TAVUS_API_KEY")),
        },
    }


@app.post("/generate")
async def generate(
    background_tasks: BackgroundTasks,
    description: str = Form(...),
    mode: str = Form(...),
    source_image: UploadFile = File(None),
    target_video: UploadFile = File(None),
    avatar_audio: UploadFile = File(None),
    replica_id: str = Form(None),
):
    job_id = str(uuid.uuid4())
    print(f"[MAIN] /generate job={job_id} mode={mode} replica_id={replica_id}")

    audio_url = None

    if avatar_audio is not None:
        # 1. Save raw upload
        original_name = avatar_audio.filename or "audio.wav"
        original_ext  = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else "wav"
        raw_path = os.path.join("outputs", f"{job_id}_raw.{original_ext}")

        content = await avatar_audio.read()
        async with aiofiles.open(raw_path, "wb") as f:
            await f.write(content)
        print(f"[MAIN] Saved raw audio: {raw_path} ({len(content):,} bytes)")

        # 2. Hard reject if the file is impossibly small
        if len(content) < 8_000:
            await create_job(job_id=job_id, metadata={"mode": mode, "description": description})
            await update_job(
                job_id, status="failed", progress=0,
                error=f"Audio file too small ({len(content):,} bytes). "
                      "Please upload at least 3 seconds of speech (~50 KB+)."
            )
            return {"job_id": job_id, "status": "failed",
                    "error": "Audio too short — please upload 3+ seconds of speech."}

        # 3. Duration check (warn only — don't hard-fail, let Tavus decide)
        duration = _get_audio_duration(raw_path)
        print(f"[MAIN] Audio duration: {duration:.2f}s")
        if duration < 2.0:
            print(f"[MAIN] ⚠️  Audio is only {duration:.2f}s — Tavus may produce a blank video. "
                  "Recommend 3+ seconds.")

        # 4. Convert to WAV PCM for maximum Tavus compatibility
        wav_path = os.path.join("outputs", f"{job_id}_audio.wav")
        if _convert_audio_to_wav(raw_path, wav_path):
            serve_filename = f"{job_id}_audio.wav"
            print(f"[MAIN] Converted to WAV: {wav_path} ({os.path.getsize(wav_path):,} bytes)")
            if original_ext != "wav":
                try: os.remove(raw_path)
                except Exception: pass
        else:
            # ffmpeg unavailable — serve original
            serve_filename = f"{job_id}_raw.{original_ext}"
            print(f"[MAIN] ffmpeg unavailable — serving original .{original_ext}")

        # 5. Build public audio URL
        public_base = settings.public_base_url.rstrip("/")
        audio_url = f"{public_base}/outputs/{serve_filename}"
        print(f"[MAIN] Audio URL → {audio_url}")

        if any(h in public_base for h in ("localhost", "127.0.0.1", "0.0.0.0")):
            print("[MAIN] ⚠️  PUBLIC_BASE_URL is localhost — Tavus cannot reach this URL!")

    metadata = {"mode": mode, "description": description, "replica_id": replica_id}
    if audio_url:
        metadata["audio_url"] = audio_url

    await create_job(job_id=job_id, metadata=metadata)
    background_tasks.add_task(
        process_job, job_id, description, mode,
        replica_id=replica_id, audio_url=audio_url,
    )
    return {"job_id": job_id, "status": "pending"}


@app.post("/generate-json")
async def generate_json(request: GenerateRequest, background_tasks: BackgroundTasks):
    job_id = request.job_id or str(uuid.uuid4())
    prompt = request.description or request.text or "a beautiful scene"
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


# ── Background job processor ──────────────────────────────────────────────────

async def process_job(
    job_id: str, prompt: str, mode: str,
    replica_id: str = None, audio_url: str = None,
):
    try:
        await update_job(job_id, status="processing", progress=10)

        try:
            result, provider_name = await asyncio.wait_for(
                registry.generate(mode, prompt, replica_id=replica_id, audio_url=audio_url),
                timeout=900.0,
            )
        except asyncio.TimeoutError:
            raise Exception("Provider generation timed out after 900 seconds")

        media_url = result.image_url or result.video_url or result.output
        if not media_url:
            raise RuntimeError("Provider returned no media URL")

        # ── Resolve the output path ───────────────────────────────────────────
        saved_path = None

        if media_url.startswith("/outputs/"):
            # Local file already on disk (e.g. mock video) — no download needed
            local_path = media_url.lstrip("/")   # "outputs/_mock_avatar.mp4"
            if os.path.exists(local_path):
                saved_path = media_url            # serve as-is via /outputs/
                print(f"[MAIN] Local file ready: {saved_path}")
            else:
                raise RuntimeError(f"Local media path not found: {local_path}")

        elif media_url.startswith("data:image"):
            header, encoded = media_url.split(",", 1)
            ext = header.split(";")[0].split("/")[1]
            file_path = f"outputs/{job_id}.{ext}"
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(encoded))
            saved_path = f"/outputs/{job_id}.{ext}"

        else:
            # Download from external URL (Tavus hosted_url, Pollinations, etc.)
            try:
                async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
                    resp = await client.get(media_url)
                    resp.raise_for_status()
                    clean_url  = media_url.split("?")[0]
                    default_ext = "jpg" if mode == "image" else "mp4"
                    raw_ext = clean_url.split(".")[-1] if "." in clean_url.split("/")[-1] else default_ext
                    ext = raw_ext if len(raw_ext) <= 4 else default_ext
                    file_path = f"outputs/{job_id}.{ext}"
                    async with aiofiles.open(file_path, "wb") as f:
                        await f.write(resp.content)
                    saved_path = f"/outputs/{job_id}.{ext}"
                    print(f"[MAIN] Downloaded {len(resp.content):,} bytes → {file_path}")
            except Exception as dl_err:
                print(f"[MAIN] Download failed ({dl_err}), using direct URL as fallback")
                saved_path = media_url   # serve external URL directly (may have CORS issues)

        is_image = mode == "image" or (
            saved_path and saved_path.split("?")[0].split(".")[-1]
            in ("png", "jpg", "jpeg", "webp", "gif")
        )
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
        print(f"[MAIN] Job {job_id} failed: {e}")
        await update_job(job_id, status="failed", progress=0, error=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
