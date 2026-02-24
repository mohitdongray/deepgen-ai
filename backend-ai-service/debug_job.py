import requests
import time

def test_job_flow():
    """Test complete job flow with timing"""
    
    # 1. Submit job
    print("1. Submitting job...")
    files = {
        'source_image': ('test.jpg', b'fake_image_data', 'image/jpeg'),
        'target_video': ('test.mp4', b'fake_video_data', 'video/mp4')
    }
    
    data = {
        'job_id': 'test123',
        'consent_confirmed': 'true',
        'description': 'Test video generation'
    }
    
    response = requests.post("http://127.0.0.1:8000/generate", files=files, data=data)
    print(f"Submit Response: {response.status_code} - {response.json()}")
    
    # 2. Wait and check status
    print("\n2. Waiting for processing...")
    time.sleep(2)  # Wait for background task
    
    # 3. Check job status
    response = requests.get("http://127.0.0.1:8000/status/test123")
    print(f"Status Response: {response.status_code} - {response.json()}")

if __name__ == "__main__":
    test_job_flow()
