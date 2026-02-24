import requests

def test_job_status():
    job_id = "test123"
    url = f"http://127.0.0.1:8000/status/{job_id}"
    
    try:
        response = requests.get(url)
        print(f"Job Status Check for {job_id}:")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_job_status()
