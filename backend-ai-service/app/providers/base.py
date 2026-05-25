from dataclasses import dataclass
from typing import Optional

@dataclass
class GenerationResult:
    provider: str
    output: str
    success: bool = True
    image_url: Optional[str] = None
    video_url: Optional[str] = None

class BaseProvider:
    name: str

    async def generate(self, prompt: str, *, mode: str) -> GenerationResult:
        raise NotImplementedError

    def is_available(self) -> bool:
        return True
