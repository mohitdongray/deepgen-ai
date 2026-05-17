import os
import asyncio

# dotenv is loaded in main.py before this module is imported,
# but guard here too so the module works in tests / standalone scripts.
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ============================================================
#  AIProviderManager
#  Routes frontend modes to real AI providers.
#  Priority chain per mode — tries each in order, falls back.
# ============================================================

class AIProviderManager:
    def __init__(self):
        # Keys are read AFTER load_dotenv() has been called
        self.huggingface_key = os.getenv("HUGGINGFACE_API_KEY")
        self.deepai_key      = os.getenv("DEEPAI_API_KEY")
        self.nvidia_key      = os.getenv("NVIDIA_API_KEY")
        self.heygen_key      = os.getenv("HEYGEN_API_KEY")
        self.tavus_key       = os.getenv("TAVUS_API_KEY")
        self.gemini_key      = os.getenv("GEMINI_API_KEY")

        # Log key availability once on init (helps diagnose env issues)
        print("[AIProvider] Key check:")
        print(f"  huggingface : {'✅' if self.huggingface_key else '❌ NOT SET'}")
        print(f"  deepai      : {'✅' if self.deepai_key      else '❌ NOT SET'}")
        print(f"  nvidia      : {'✅' if self.nvidia_key      else '❌ NOT SET'}")
        print(f"  heygen      : {'✅' if self.heygen_key      else '❌ NOT SET'}")

    # ----------------------------------------------------------------
    #  MODE → PROVIDER CHAIN
    #  HuggingFace is listed first for image modes — it's the most
    #  reliable option with a free-tier API key.
    #  NVIDIA SDXL is first when an NVIDIA key is available (faster).
    # ----------------------------------------------------------------
    MODE_TO_PROVIDER_CHAIN = {
        # ── Image generation (most common use-case) ────────────────
        "image":                  ["pollinations", "nvidia_sdxl", "huggingface", "deepai", "fallback"],
        "face-swap":              ["pollinations", "nvidia_sdxl", "huggingface", "deepai", "fallback"],
        "script-to-scene":        ["pollinations", "nvidia_sdxl", "huggingface", "deepai", "fallback"],
        "batch-video-production": ["pollinations", "nvidia_sdxl", "huggingface", "deepai", "fallback"],
        "ai-content-generation":  ["pollinations", "nvidia_sdxl", "huggingface", "deepai", "fallback"],
        # ── Video generation ──────────────────────────────────────
        "text-to-video":          ["tavus", "heygen", "fallback"],
        "video":                  ["tavus", "heygen", "fallback"],
        "image-to-video":         ["heygen", "fallback"],
        # ── Avatar / voice ────────────────────────────────────────
        "avatar-video":           ["heygen", "fallback"],
        "voice-cloning":          ["heygen", "fallback"],
        "ai-dubbing":             ["heygen", "fallback"],
        # ── Enhancement (no generation, use fallback for now) ─────
        "video-enhancement":      ["fallback"],
    }

    # ----------------------------------------------------------------
    #  MAIN ROUTER
    # ----------------------------------------------------------------
    def generate(self, mode: str, prompt: str) -> dict:
        provider_methods = {
            "pollinations": self._pollinations,
            "nvidia_sdxl": self._nvidia_sdxl,
            "huggingface": self._huggingface,
            "deepai":      self._deepai,
            "heygen":      self._heygen,
            "tavus":       self._tavus,
            "fallback":    self._fallback,
        }

        chain = self.MODE_TO_PROVIDER_CHAIN.get(mode)
        if not chain:
            print(f"[AIProvider] Unknown mode '{mode}' — using image fallback chain")
            chain = ["nvidia_sdxl", "huggingface", "deepai", "fallback"]

        print(f"[AIProvider] Mode='{mode}' → chain: {chain}")

        for provider_name in chain:
            if provider_name == "fallback":
                print("[AIProvider] All providers failed — returning fallback")
                return self._fallback(prompt)
            try:
                print(f"[AIProvider] Trying: {provider_name}")
                result = provider_methods[provider_name](prompt)
                print(f"[AIProvider] ✅ Success with {provider_name}")
                return result
            except Exception as e:
                print(f"[AIProvider] ❌ {provider_name} failed: {e}")
                continue

        return self._fallback(prompt)

    # ----------------------------------------------------------------
    #  POLLINATIONS AI  (Free, highly reliable image generation)
    # ----------------------------------------------------------------
    def _pollinations(self, prompt: str) -> dict:
        import urllib.parse
        import random
        print("  [Pollinations] Calling free image generation...")
        
        encoded_prompt = urllib.parse.quote(prompt)
        seed = random.randint(1, 1000000)
        
        # We just return the URL. process_job() will download it.
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&seed={seed}"
        
        return {
            "provider": "pollinations",
            "output": url,
        }

    # ----------------------------------------------------------------
    #  NVIDIA SDXL  (primary image provider when NVIDIA key is set)
    # ----------------------------------------------------------------
    def _nvidia_sdxl(self, prompt: str) -> dict:
        """
        Calls NVIDIA's inference API to generate an image with SDXL.
        Requires NVIDIA_API_KEY in .env
        Sign up free: https://build.nvidia.com/
        """
        import requests

        if not self.nvidia_key:
            raise Exception("NVIDIA_API_KEY not set")

        print("  [NVIDIA] Calling SDXL image generation...")

        headers = {
            "Authorization": f"Bearer {self.nvidia_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        payload = {
            "text_prompts": [{"text": prompt, "weight": 1}],
            "cfg_scale": 7,
            "sampler": "K_DPM_2_ANCESTRAL",
            "seed": 0,
            "steps": 25,
            "width": 1024,
            "height": 1024,
        }

        response = requests.post(
            "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl",
            headers=headers,
            json=payload,
            timeout=60,
        )

        print(f"  [NVIDIA] Status: {response.status_code}")
        if response.status_code != 200:
            raise Exception(f"NVIDIA API error {response.status_code}: {response.text[:300]}")

        data = response.json()
        artifacts = data.get("artifacts") or []
        if not artifacts:
            raise Exception(f"NVIDIA: empty artifacts list: {data}")

        b64 = artifacts[0].get("base64")
        if not b64:
            raise Exception(f"NVIDIA: no base64 in artifact: {artifacts[0]}")

        image_url = f"data:image/png;base64,{b64}"
        print(f"  [NVIDIA] ✅ Image ready (base64, {len(b64)} chars)")
        return {"provider": "nvidia_sdxl", "output": image_url}

    # ----------------------------------------------------------------
    #  HUGGINGFACE  (primary image provider when no NVIDIA key)
    #  Uses SD-XL via the Inference API — free tier works fine.
    # ----------------------------------------------------------------
    def _huggingface(self, prompt: str) -> dict:
        import requests
        import base64
        import time

        if not self.huggingface_key:
            raise Exception("HUGGINGFACE_API_KEY not set")

        print("  [HuggingFace] Calling SDXL via Inference API...")

        # stabilityai/stable-diffusion-xl-base-1.0 is free and fast
        API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
        headers = {"Authorization": f"Bearer {self.huggingface_key}"}

        for attempt in range(3):
            res = requests.post(
                API_URL,
                headers=headers,
                json={"inputs": prompt},
                timeout=90,
            )
            content_type = res.headers.get("Content-Type", "")
            print(f"  [HuggingFace] Attempt {attempt+1}: status={res.status_code}  CT={content_type}")

            if res.status_code == 503:
                # Model is loading — wait and retry
                estimated = res.json().get("estimated_time", 20)
                wait = min(float(estimated), 30)
                print(f"  [HuggingFace] Model loading, waiting {wait:.0f}s...")
                time.sleep(wait)
                continue

            if res.status_code == 200 and "image" in content_type:
                b64 = base64.b64encode(res.content).decode("utf-8")
                image_url = f"data:image/png;base64,{b64}"
                print(f"  [HuggingFace] ✅ Image ready ({len(res.content)} bytes)")
                return {"provider": "huggingface", "output": image_url}

            # Non-retryable error
            raise Exception(f"HuggingFace error {res.status_code}: {res.text[:300]}")

        raise Exception("HuggingFace failed after 3 retries (model still loading)")

    # ----------------------------------------------------------------
    #  DEEPAI  (secondary image provider)
    # ----------------------------------------------------------------
    def _deepai(self, prompt: str) -> dict:
        import requests

        if not self.deepai_key:
            raise Exception("DEEPAI_API_KEY not set")

        print("  [DeepAI] Calling text2img...")

        # DeepAI requires form-data, NOT JSON
        res = requests.post(
            "https://api.deepai.org/api/text2img",
            data={"text": prompt},
            headers={"Api-Key": self.deepai_key},
            timeout=60,
        )
        print(f"  [DeepAI] Status: {res.status_code}")

        if res.status_code != 200:
            raise Exception(f"DeepAI error {res.status_code}: {res.text[:300]}")

        data = res.json()
        output_url = data.get("output_url")
        if not output_url:
            raise Exception(f"DeepAI: no output_url in response: {data}")

        print(f"  [DeepAI] ✅ Image URL: {output_url[:80]}")
        return {"provider": "deepai", "output": output_url}

    # ----------------------------------------------------------------
    #  HEYGEN  (avatar / video generation)
    # ----------------------------------------------------------------
    def _heygen(self, prompt: str) -> dict:
        import requests
        import time

        if not self.heygen_key:
            raise Exception("HEYGEN_API_KEY not set")

        print("  [HeyGen] Calling Video Agent API...")

        res = requests.post(
            "https://api.heygen.com/v1/video_agent/generate",
            json={"prompt": prompt},
            headers={"X-API-KEY": self.heygen_key, "Content-Type": "application/json"},
            timeout=30,
        )
        print(f"  [HeyGen] Status: {res.status_code}")

        if res.status_code not in (200, 201, 202):
            raise Exception(f"HeyGen error {res.status_code}: {res.text[:300]}")

        video_id = res.json().get("data", {}).get("video_id")
        if not video_id:
            raise Exception(f"HeyGen: no video_id in response: {res.json()}")

        status_url = f"https://api.heygen.com/v1/video_status.get?video_id={video_id}"
        for attempt in range(24):  # 2-minute timeout
            time.sleep(5)
            poll = requests.get(status_url, headers={"X-API-KEY": self.heygen_key})
            data = poll.json().get("data", {})
            status = data.get("status")
            print(f"  [HeyGen] Poll {attempt+1}/24 — status: {status}")
            if status == "completed":
                video_url = data.get("video_url")
                if not video_url:
                    raise Exception("HeyGen completed but no video_url")
                return {"provider": "heygen", "output": video_url, "video_url": video_url}
            if status == "failed":
                raise Exception(f"HeyGen generation failed: {data}")

        raise Exception("HeyGen timed out after 2 minutes")

    # ----------------------------------------------------------------
    #  TAVUS  (called directly, not in default chain)
    # ----------------------------------------------------------------
    def _tavus(self, prompt: str) -> dict:
        import requests
        import time

        if not self.tavus_key:
            raise Exception("TAVUS_API_KEY not set")

        print("  [Tavus] Submitting video generation request...")
        
        # Hardcoded default replica_id if not provided, Tavus requires a replica_id
        # "r79e1c033f" is a known stock replica, or we can use another default if known.
        # We will pass the script as requested.
        payload = {
            "script": prompt,
            "replica_id": "r79e1c033f", # Default stock avatar
            "video_name": "DeepGen Video"
        }

        res = requests.post(
            "https://tavusapi.com/v2/videos",
            json=payload,
            headers={"x-api-key": self.tavus_key, "Content-Type": "application/json"},
            timeout=30,
        )
        if res.status_code not in (200, 201):
            raise Exception(f"Tavus error {res.status_code}: {res.text[:300]}")
            
        data = res.json()
        video_id = data.get("video_id")
        if not video_id:
            raise Exception(f"Tavus: no video_id in response: {data}")

        print(f"  [Tavus] Job queued with video_id: {video_id}. Polling for completion...")
        
        status_url = f"https://tavusapi.com/v2/videos/{video_id}"
        
        for attempt in range(30):  # Poll up to 2.5 minutes
            time.sleep(5)
            poll = requests.get(status_url, headers={"x-api-key": self.tavus_key})
            
            if poll.status_code != 200:
                print(f"  [Tavus] Poll failed {poll.status_code}: {poll.text}")
                continue
                
            poll_data = poll.json()
            status = poll_data.get("status")
            print(f"  [Tavus] Poll {attempt+1}/30 — status: {status}")
            
            if status == "ready":
                download_url = poll_data.get("download_url") or poll_data.get("hosted_url")
                print(f"  [Tavus] ✅ Video ready: {download_url[:80]}")
                return {"provider": "tavus", "output": download_url, "video_url": download_url}
            elif status == "failed":
                raise Exception(f"Tavus generation failed: {poll_data}")
                
        raise Exception("Tavus timed out after 2.5 minutes")

    # ----------------------------------------------------------------
    #  FALLBACK  — always succeeds, returns a visible sample
    # ----------------------------------------------------------------
    def _fallback(self, prompt: str) -> dict:
        print("  [Fallback] ⚠️  No provider succeeded — returning sample output")
        return {
            "provider": "fallback",
            # Sample image (not a video) so the image pipeline works too
            "output": "https://picsum.photos/seed/ai/1024/1024",
        }