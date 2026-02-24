import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Test what voices your API key can use
headers = {
    "X-API-Key": os.getenv("HEYGEN_API_KEY"),
    "Content-Type": "application/json"
}
r = requests.get("https://api.heygen.com/v2/voices", headers=headers)
print("🔍 Your HeyGen Voice Library:")
print(r.json())
