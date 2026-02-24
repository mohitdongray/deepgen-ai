import os
import asyncio
import requests
import json
from .heygen_cache import heygen_cache

BASE_URL = "https://api.heygen.com"

headers = {
    "X-API-KEY": os.getenv("HEYGEN_API_KEY"),
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


async def generate_video(prompt: str):

    print("🚀 HeyGen Video Agent API HIT")

    loop = asyncio.get_event_loop()

    # ---------------- STEP1 CREATE ----------------
    create_url = f"{BASE_URL}/v1/video_agent/generate"

    payload = {
        "prompt": prompt
    }

    print(f"DEBUG PAYLOAD: {json.dumps(payload, indent=2)}")

    def create_request():
        return requests.post(create_url, headers=headers, json=payload)

    response = await loop.run_in_executor(None, create_request)

    print("📡 Create Status:", response.status_code)

    if response.status_code not in [200, 201, 202]:
        print("❌ HeyGen Create Failed:", response.text)
        return None

    data = safe_json(response)
    if not data:
        return None

    video_id = data.get("data", {}).get("video_id")

    if not video_id:
        print("❌ No video_id received")
        return None

    print("🎬 Video ID:", video_id)

    # ---------------- STEP2 POLL ----------------
    status_url = f"{BASE_URL}/v1/video_status.get?video_id={video_id}"

    for _ in range(20):

        def status_request():
            return requests.get(status_url, headers=headers)

        status_res = await loop.run_in_executor(None, status_request)

        print("📡 Poll Status:", status_res.status_code)

        if status_res.status_code != 200:
            print("❌ Status Poll Failed:", status_res.text)
            return None

        status_data = safe_json(status_res)
        if not status_data:
            return None

        status = status_data.get("data", {}).get("status")
        print("⏳ HeyGen Status:", status)

        if status == "completed":

            video_url = status_data["data"].get("video_url")
            thumbnail = status_data["data"].get("thumbnail_url")

            if not video_url:
                print("❌ Completed but no video_url")
                return None

            print("✅ HeyGen Video Agent Success")

            return {
                "video_url": video_url,
                "thumbnail_url": thumbnail,
                "duration": 5,
                "provider": "heygen-video-agent"
            }

        if status == "failed":
            print(f"❌ FULL ERROR DATA: {json.dumps(status_data, indent=2)}")
            print("❌ HeyGen generation failed")
            return None

        await asyncio.sleep(3)

    print("❌ Timeout waiting for HeyGen")
    return None
