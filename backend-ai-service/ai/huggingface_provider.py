import os
import asyncio
from huggingface_hub import InferenceClient

client = InferenceClient(
    model="stabilityai/stable-diffusion-xl-base-1.0",
    token=os.getenv("HF_TOKEN")
)

async def generate_video(prompt: str):

    loop = asyncio.get_event_loop()

    def sync_generate():
        image = client.text_to_image(prompt=prompt)
        return image

    image = await loop.run_in_executor(None, sync_generate)

    return {
        "video_url": f"https://fake-video.ai/{prompt.replace(' ','_')}.mp4",
        "thumbnail_url": f"https://fake-video.ai/{prompt.replace(' ','_')}.png",
        "duration": 5,
        "provider": "huggingface-image"
    }

async def generate_video_stream(prompt: str):
    """Stream version for async generator consumption"""
    loop = asyncio.get_event_loop()

    def sync_generate():
        image = client.text_to_image(prompt=prompt)
        return image

    yield {"progress": 50, "message": "Generating with HuggingFace..."}
    
    image = await loop.run_in_executor(None, sync_generate)
    
    yield {
        "progress": 100,
        "message": "Completed",
        "result": {
            "video_url": f"https://fake-video.ai/{prompt.replace(' ','_')}.mp4",
            "thumbnail_url": f"https://fake-video.ai/{prompt.replace(' ','_')}.png",
            "duration": 5,
            "provider": "huggingface-image"
        }
    }
