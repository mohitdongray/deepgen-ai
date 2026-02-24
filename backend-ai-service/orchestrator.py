"""
AI Orchestrator with Real HuggingFace Video Generation
"""

import asyncio
import os
import requests
from typing import Dict, Any, AsyncGenerator
from dotenv import load_dotenv

load_dotenv()

HF_API_KEY = os.getenv("HF_API_KEY")


class AIOrchestrator:
    """Simulated AI Orchestrator (fallback only)"""

    async def generate_video(self, job_id: str, description: str = ""):
        final_result = {
            "videoUrl": f"https://fake.video/{job_id}.mp4",
            "thumbnailUrl": f"https://fake.video/{job_id}.png",
            "duration": 60,
            "provider": "stub_provider"
        }

        for i in range(1, 6):
            await asyncio.sleep(0.5)
            progress = i * 20

            if i == 5:
                yield {
                    "progress": progress,
                    "message": f"Completed... {progress}%",
                    "result": final_result
                }
            else:
                yield {
                    "progress": progress,
                    "message": f"Processing... {progress}%"
                }


class RealAIOrchestrator:

    def __init__(self, api_keys: Dict[str, str] = {}):
        self.api_keys = api_keys
        self.providers = {
            "huggingface": self._call_huggingface,
        }

    async def generate_video(
        self,
        job_id: str,
        description: str = "",
        provider: str = "huggingface"
    ) -> AsyncGenerator[Dict[str, Any], None]:

        if provider not in self.providers:
            raise ValueError(f"Unsupported provider: {provider}")

        async for progress in self.providers[provider](job_id, description):
            yield progress

    # 🎬 REAL HUGGINGFACE VIDEO GENERATION
    async def _call_huggingface(
        self,
        job_id: str,
        description: str
    ) -> AsyncGenerator[Dict[str, Any], None]:

        yield {"progress": 10, "message": "Initializing AI Model..."}

        API_URL = "https://api-inference.huggingface.co/models/ali-vilab/text-to-video-ms-1.7b"

        headers = {
            "Authorization": f"Bearer {HF_API_KEY}"
        }

        payload = {
            "inputs": description if description else "A cinematic futuristic city"
        }

        yield {"progress": 40, "message": "Generating video via HuggingFace..."}

        response = requests.post(API_URL, headers=headers, json=payload)

        if response.status_code != 200:
            yield {
                "progress": 100,
                "error": response.text
            }
            return

        yield {"progress": 70, "message": "Saving video output..."}

        os.makedirs("outputs", exist_ok=True)
        output_path = f"outputs/{job_id}.mp4"

        with open(output_path, "wb") as f:
            f.write(response.content)

        yield {"progress": 90, "message": "Finalizing..."}

        final_result = {
            "videoUrl": f"/outputs/{job_id}.mp4",
            "thumbnailUrl": "",
            "duration": 5,
            "provider": "huggingface"
        }

        yield {
            "progress": 100,
            "status": "completed",
            "result": final_result
        }
