import requests
import time

def test_simple():
    """Test with minimal orchestrator"""
    
    # Test with minimal orchestrator
    from app.services.orchestrator_minimal import AIOrchestrator
    
    orchestrator = AIOrchestrator()
    
    # Test the generate method directly
    import asyncio
    
    async def test_generate():
        result = await orchestrator.generate_video(
            job_id="test123",
            source_image=b"fake_image",
            target_video=b"fake_video",
            description="test"
        )
        print(f"Orchestrator result: {result}")
        return result
    
    # Run the test
    result = asyncio.run(test_generate())
    print(f"Final result: {result}")

if __name__ == "__main__":
    test_simple()
