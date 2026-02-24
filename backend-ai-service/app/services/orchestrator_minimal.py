class AIOrchestrator:
    async def generate_video(self, job_id, source_image, target_video, description=None):
        # Minimal stub: returns fake result
        return {
            "video_url": f"https://fake.video/{job_id}.mp4",
            "thumbnail_url": f"https://fake.video/{job_id}.png",
            "duration": 60,
            "provider": "stub_provider"
        }
