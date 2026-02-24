import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("DEEPAI_API_KEY")

print("🔑 DeepAI API Key:", API_KEY)
print("🔑 Key Length:", len(API_KEY) if API_KEY else "None")
print("🔑 Key Type:", type(API_KEY))

url = "https://api.deepai.org/api/text2img"

headers = {
    "Api-Key": API_KEY
}

data = {
    "text": "A futuristic AI robot presenter in a studio"
}

response = requests.post(url, headers=headers, data=data)

print("Status:", response.status_code)
print("Response:", response.json())

# Test Enhancement API (Optional)
print("\n" + "="*50)
print("🧪 Testing Enhancement API...")

enhance_url = "https://api.deepai.org/api/torch-srgan"

enhance_data = {
    "image": "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d"
}

enhance_response = requests.post(enhance_url, headers={"Api-Key": API_KEY}, data=enhance_data)

print("Enhance Status:", enhance_response.status_code)
print("Enhance Response:", enhance_response.json())
