import os
import asyncio
from typing import AsyncGenerator, Dict, Any
from dotenv import load_dotenv

from ai.gemini_provider import generate_video as gemini_generate
from ai.heygen_provider import generate_video as heygen_generate

load_dotenv()

class AIOrchestrator:
    """Handles video generation (talking avatars, AI presenters)"""
    
    async def generate_video(self, job_id: str, description: str = "") -> AsyncGenerator[Dict[str, Any], None]:
        """
        Generate video content using video-first providers
        Used for talking avatars, AI presenters, text-to-video
        """
        
        yield {"progress": 10, "message": "Starting video generation..."}

        # STEP 1 — Gemini (Primary for video)
        try:
            yield {"progress": 30, "message": "Trying Gemini..."}
            result = await gemini_generate(description)

            if result:
                yield {"progress": 80, "message": "Gemini success"}
                yield {
                    "progress": 100,
                    "message": "Video completed",
                    "result": result
                }
                return

        except Exception as e:
            yield {"progress": 35, "message": f"Gemini failed"}

        # STEP 2 — HeyGen (Secondary for video)
        try:
            yield {"progress": 60, "message": "Trying HeyGen..."}
            result = await heygen_generate(description)

            if result:
                yield {"progress": 80, "message": "HeyGen success"}
                yield {
                    "progress": 100,
                    "message": "Video completed",
                    "result": result
                }
                return

        except Exception as e:
            yield {"progress": 65, "message": f"HeyGen failed"}

        # STEP 3 — Video Fallback (No DeepAI here!)
        yield {
            "progress": 100,
            "message": "Video fallback used",
            "result": {
                "video_url": f"https://fallback.video/{job_id}.mp4",
                "thumbnail_url": f"https://fallback.video/{job_id}.png",
                "duration": 60,
                "provider": "video-fallback"
            }
        }
