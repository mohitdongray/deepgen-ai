import requests
import json

def test_mongo_integration():
    """Test MongoDB-based job submission and status tracking"""
    
    print("🚀 Testing MongoDB Integration...")
    
    # Test 1: Health Check
    print("\n1️⃣ Testing health check...")
    try:
        health_response = requests.get("http://127.0.0.1:8000/health")
        print(f"Health Status: {health_response.status_code}")
        print(f"Health Response: {health_response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return
    
    # Test 2: Submit Job
    print("\n2️⃣ Submitting job...")
    job_data = {
        "user_id": "test_user_123",
        "description": "Test MongoDB integration"
    }
    
    try:
        submit_response = requests.post(
            "http://127.0.0.1:8000/submit",
            json=job_data
        )
        print(f"Submit Status: {submit_response.status_code}")
        print(f"Submit Response: {submit_response.json()}")
        
        if submit_response.status_code == 200:
            job_id = submit_response.json()["job_id"]
            
            # Test 3: Check Status (immediately)
            print(f"\n3️⃣ Checking job status immediately...")
            status_response = requests.get(f"http://127.0.0.1:8000/status/{job_id}")
            print(f"Status Code: {status_response.status_code}")
            print(f"Status Response: {status_response.json()}")
            
            # Test 4: Wait and Check Final Status
            print(f"\n4️⃣ Waiting for completion...")
            import time
            time.sleep(4)  # Wait for background task
            
            final_response = requests.get(f"http://127.0.0.1:8000/status/{job_id}")
            print(f"Final Status Code: {final_response.status_code}")
            print(f"Final Status Response: {final_response.json()}")
            
            if final_response.status_code == 200:
                result = final_response.json()
                if result.get("status") == "completed":
                    print("\n✅ SUCCESS: MongoDB integration working!")
                    print(f"🎬 Job ID: {result.get('job_id')}")
                    print(f"📊 Progress: {result.get('progress')}%")
                    print(f"🎥 Video URL: {result.get('result', {}).get('videoUrl')}")
                    print(f"🖼️  Thumbnail: {result.get('result', {}).get('thumbnailUrl')}")
                    print(f"🤖 Provider: {result.get('result', {}).get('provider')}")
                else:
                    print(f"\n⚠️  Job Status: {result.get('status')}")
            else:
                print(f"\n❌ Final status check failed: {final_response.status_code}")
        else:
            print(f"\n❌ Job submission failed: {submit_response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")

if __name__ == "__main__":
    test_mongo_integration()
