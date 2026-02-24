import requests
import base64
import json

def test_json_payload():
    """Test job submission with JSON payload"""
    
    print("🚀 Testing JSON Payload Submission...")
    
    # Prepare JSON payload with base64 encoded files
    payload = {
        "job_id": "test123",
        "description": "Hello world",
        "source_image": "ZmFrZV9pbWFnZQ==",  # base64 for "fake_image"
        "target_video": "ZmFrZV92aWRlbw=="   # base64 for "fake_video"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        # Submit job to JSON endpoint
        print("\n1️⃣ Submitting job with JSON payload...")
        response = requests.post(
            "http://127.0.0.1:8000/generate-json",
            headers=headers,
            json=payload
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            # Check job status
            print("\n2️⃣ Checking job status...")
            status_response = requests.get("http://127.0.0.1:8000/status/test123")
            print(f"Status Code: {status_response.status_code}")
            print(f"Status Response: {status_response.json()}")
            
            if status_response.status_code == 200:
                result = status_response.json()
                print("\n✅ SUCCESS: Job persistence working!")
                print(f"🎬 Job Status: {result.get('status')}")
                print(f"🎥 Video URL: {result.get('result', {}).get('videoUrl')}")
                print(f"🖼️  Thumbnail: {result.get('result', {}).get('thumbnailUrl')}")
                print(f"🤖 Provider: {result.get('provider')}")
            else:
                print(f"\n❌ Status check failed: {status_response.status_code}")
        else:
            print(f"\n❌ Job submission failed: {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    test_json_payload()
