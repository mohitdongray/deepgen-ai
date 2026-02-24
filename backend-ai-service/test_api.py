import requests
import json

# Test the health endpoint first
def test_health():
    response = requests.get("http://127.0.0.1:8000/health")
    print("Health Check:")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

# Test video generation endpoint
def test_video_generation():
    url = "http://127.0.0.1:8000/generate"
    
    # Create test files (you can replace with real files)
    files = {
        'source_image': ('test.jpg', b'fake_image_data', 'image/jpeg'),
        'target_video': ('test.mp4', b'fake_video_data', 'video/mp4')
    }
    
    data = {
        'job_id': 'test123',
        'consent_confirmed': 'true',
        'description': 'Test video generation'
    }
    
    try:
        response = requests.post(url, files=files, data=data)
        print("Video Generation Test:")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_health()
    test_video_generation()
