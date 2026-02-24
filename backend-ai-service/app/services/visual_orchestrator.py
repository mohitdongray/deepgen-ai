import os
import asyncio
from typing import AsyncGenerator, Dict, Any
from dotenv import load_dotenv

from ai.deepai_provider import generate_image as deepai_generate
from ai.huggingface_provider import generate_video as hf_generate

load_dotenv()

class VisualOrchestrator:
    """Handles visual generation (images, backgrounds, storyboards)"""
    
    async def generate_visual(self, job_id: str, prompt: str = "") -> AsyncGenerator[Dict[str, Any], None]:
        """
        Generate visual content using image-first providers
        Used for backgrounds, slides, storyboards, scene frames
        """
        
        yield {"progress": 10, "message": "Starting visual generation..."}

        # STEP 1 — DeepAI (Primary for images)
        try:
            yield {"progress": 30, "message": "Trying DeepAI..."}
            result = await deepai_generate(prompt)

            if result:
                yield {"progress": 90, "message": "DeepAI success"}
                yield {
                    "progress": 100,
                    "message": "Visual completed",
                    "result": result
                }
                return

        except Exception as e:
            yield {"progress": 35, "message": f"DeepAI failed"}

        # STEP 2 — HuggingFace (Fallback for images)
        try:
            yield {"progress": 60, "message": "Trying HuggingFace..."}
            result = await hf_generate(prompt)

            if result:
                yield {"progress": 90, "message": "HF success"}
                yield {
                    "progress": 100,
                    "message": "Visual completed",
                    "result": result
                }
                return

        except Exception as e:
            yield {"progress": 65, "message": f"HF failed"}

        # STEP 3 — Visual Fallback
        yield {
            "progress": 100,
            "message": "Visual fallback used",
            "result": {
                "image_url": f"https://fallback.visual/{job_id}.png",
                "thumbnail_url": f"https://fallback.visual/{job_id}.png",
                "duration": 0,
                "provider": "visual-fallback"
            }
        }
