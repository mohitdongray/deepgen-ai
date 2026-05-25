import urllib.parse
import random
from app.providers.base import BaseProvider, GenerationResult

class PollinationsProvider(BaseProvider):
    name = "pollinations"

    async def generate(self, prompt: str, *, mode: str) -> GenerationResult:
        encoded = urllib.parse.quote(prompt)
        seed = random.randint(1, 1_000_000)
        url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&seed={seed}"
        return GenerationResult(provider=self.name, output=url, image_url=url)
