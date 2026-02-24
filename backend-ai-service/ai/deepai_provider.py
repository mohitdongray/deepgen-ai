import os
import asyncio
import requests
import json
from dotenv import load_dotenv

load_dotenv()

DEEPAI_API_KEY = os.getenv("DEEPAI_API_KEY")

BASE_URL = "https://api.deepai.org"

headers = {
    "Api-Key": DEEPAI_API_KEY,
    "Content-Type": "application/json"
}


def safe_json(response):
    try:
        if "application/json" in response.headers.get("Content-Type", ""):
            return response.json()
        else:
            print("⚠️ Non JSON response:", response.text[:200])
            return None
    except Exception as e:
        print("⚠️ JSON parse failed:", response.text[:200])
        return None


async def generate_image(prompt: str):
    """
    Generate image using DeepAI Text-to-Image API
    """
    print("🚀 DeepAI API HIT - Text to Image")

    loop = asyncio.get_event_loop()

    # ---------------- STEP1 TEXT TO IMAGE ----------------
    create_url = f"{BASE_URL}/api/text2img"

    payload = {
        "text": prompt,
        "grid_size": "1",
        "width": 512,
        "height": 512
    }

    print(f"DEBUG PAYLOAD: {json.dumps(payload, indent=2)}")

    def create_request():
        return requests.post(create_url, headers=headers, json=payload)

    response = await loop.run_in_executor(None, create_request)

    print("📡 Create Status:", response.status_code)

    if response.status_code not in [200, 201, 202]:
        print("❌ DeepAI Create Failed:", response.text)
        return None

    data = safe_json(response)
    if not data:
        return None

    # DeepAI returns output_url in the response
    image_url = data.get("output_url")
    
    if not image_url:
        print("❌ No image_url received")
        return None

    print("🖼️ DeepAI Image Generated:", image_url)

    return {
        "image_url": image_url,
        "thumbnail_url": image_url,
        "duration": 0,
        "provider": "deepai-text2img"
    }


async def enhance_image(image_url: str):
    """
    Enhance image using DeepAI Super Resolution API
    """
    print("🚀 DeepAI API HIT - Super Resolution")

    loop = asyncio.get_event_loop()

    # ---------------- STEP2 SUPER RESOLUTION ----------------
    enhance_url = f"{BASE_URL}/api/torch-srgan"

    payload = {
        "url": image_url
    }

    def enhance_request():
        return requests.post(enhance_url, headers=headers, json=payload)

    response = await loop.run_in_executor(None, enhance_request)

    print("📡 Enhance Status:", response.status_code)

    if response.status_code not in [200, 201, 202]:
        print("❌ DeepAI Enhance Failed:", response.text)
        return None

    data = safe_json(response)
    if not data:
        return None

    # DeepAI returns output_url in the response
    enhanced_url = data.get("output_url")
    
    if not enhanced_url:
        print("❌ No enhanced_url received")
        return None

    print("📦 DeepAI Image Enhanced:", enhanced_url)

    return {
        "image_url": enhanced_url,
        "thumbnail_url": enhanced_url,
        "duration": 0,
        "provider": "deepai-srgan"
    }


async def generate_video(prompt: str):
    """
    Generate visual content using DeepAI (image generation as video fallback)
    """
    print("🚀 DeepAI Video Generation (Image-based)")

    # For video generation, we'll generate a high-quality image
    # that can be used as a video frame or thumbnail
    result = await generate_image(prompt)
    
    if result:
        # Try to enhance the image if possible
        try:
            enhanced = await enhance_image(result["image_url"])
            if enhanced:
                print("✅ DeepAI Success with Enhancement")
                return enhanced
        except Exception as e:
            print(f"⚠️ Enhancement failed: {e}")
        
        print("✅ DeepAI Success (Basic)")
        return result
    
    return None
