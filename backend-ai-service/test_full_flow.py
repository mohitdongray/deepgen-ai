import requests
import time
import json

def test_full_flow():
    """Test the complete flow with debugging"""
    
    print("🚀 Testing Full Flow...")
    
    # 1. Submit job
    print("\n1️⃣ Submitting job...")
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
    print(f"Submit Response: {response.status_code}")
    print(f"Submit Data: {response.json()}")
    
    if response.status_code == 200:
        # 2. Check status immediately
        print("\n2️⃣ Checking status immediately...")
        status_response = requests.get("http://127.0.0.1:8000/status/test123")
        print(f"Status Response: {status_response.status_code}")
        print(f"Status Data: {status_response.json()}")
        
        # 3. Wait and check again
        print("\n3️⃣ Waiting 3 seconds for background task...")
        time.sleep(3)
        
        print("\n4️⃣ Checking status after wait...")
        final_response = requests.get("http://127.0.0.1:8000/status/test123")
        print(f"Final Status: {final_response.status_code}")
        print(f"Final Data: {final_response.json()}")
        
        if final_response.status_code == 200:
            result = final_response.json()
            if result.get('status') == 'completed':
                print("\n✅ SUCCESS: Full pipeline working!")
                print(f"🎬 Video URL: {result.get('result', {}).get('videoUrl')}")
                print(f"🖼️  Thumbnail: {result.get('result', {}).get('thumbnailUrl')}")
            else:
                print(f"\n⚠️  Job status: {result.get('status')}")
        else:
            print(f"\n❌ Status check failed: {final_response.status_code}")
    else:
        print(f"\n❌ Job submission failed: {response.status_code}")

if __name__ == "__main__":
    test_full_flow()
