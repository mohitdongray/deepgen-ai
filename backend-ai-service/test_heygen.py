import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Test what your API key can actually see
headers = {"X-Api-Key": os.getenv("HEYGEN_API_KEY")}
r = requests.get("https://api.heygen.com/v2/avatars", headers=headers)
print("🔍 Your HeyGen Avatar Library:")
print(r.json())
