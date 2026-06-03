import urllib.parse
import random
from app.providers.base import BaseProvider, GenerationResult

class PollinationsProvider(BaseProvider):
    name = "pollinations"

    async def generate(self, prompt: str, *, mode: str) -> GenerationResult:
        if not prompt or not prompt.strip():
            raise ValueError("Pollinations: prompt must not be empty")
        encoded = urllib.parse.quote(prompt.strip())
        seed = random.randint(1, 1_000_000)
        url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&seed={seed}"
        return GenerationResult(provider=self.name, output=url, image_url=url)
