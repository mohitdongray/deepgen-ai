import requests
import time

def test_persistence():
    """Test job persistence across multiple requests"""
    
    print("🚀 Testing Job Persistence...")
    
    # 1. Submit job
    print("\n1️⃣ Submitting job...")
    files = {
        'source_image': ('test.jpg', b'fake_image_data', 'image/jpeg'),
        'target_video': ('test.mp4', b'fake_video_data', 'video/mp4')
    }
    
    data = {
        'job_id': 'persist_test',
        'consent_confirmed': 'true',
        'description': 'Test persistence'
    }
    
    response = requests.post("http://127.0.0.1:8000/generate", files=files, data=data)
    print(f"Submit Response: {response.status_code}")
    print(f"Submit Data: {response.json()}")
    
    if response.status_code == 200:
        # 2. Wait for background task
        print("\n2️⃣ Waiting 2 seconds for background task...")
        time.sleep(2)
        
        # 3. Check job status
        print("\n3️⃣ Checking job status...")
        status_response = requests.get("http://127.0.0.1:8000/status/persist_test")
        print(f"Status Response: {status_response.status_code}")
        print(f"Status Data: {status_response.json()}")
        
        # 4. Check status again (should persist)
        print("\n4️⃣ Checking status again...")
        final_response = requests.get("http://127.0.0.1:8000/status/persist_test")
        print(f"Final Status: {final_response.status_code}")
        print(f"Final Data: {final_response.json()}")
        
        if final_response.status_code == 200:
            result = final_response.json()
            if result.get('status') == 'completed':
                print("\n✅ SUCCESS: Job persistence working!")
                print(f"🎬 Video URL: {result.get('result', {}).get('videoUrl')}")
                print(f"🖼️  Thumbnail: {result.get('result', {}).get('thumbnailUrl')}")
            else:
                print(f"\n⚠️  Job status: {result.get('status')}")
        else:
            print(f"\n❌ Status check failed: {final_response.status_code}")
    else:
        print(f"\n❌ Job submission failed: {response.status_code}")

if __name__ == "__main__":
    test_persistence()
