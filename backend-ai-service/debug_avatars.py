import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def list_my_real_ids():
    headers = {
        "X-API-Key": os.getenv("HEYGEN_API_KEY"),
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
        # We check v2 avatars
        r = await client.get("https://api.heygen.com/v2/avatars", headers=headers)
        data = r.json()
        
        # This will print the first 5 available IDs to your terminal
        avatars = data.get('data', {}).get('avatars', [])
        if not avatars:
            print("❌ Your API Key sees ZERO avatars. Check your HeyGen Space settings.")
        else:
            print(f"✅ Found {len(avatars)} available avatars:")
            for a in avatars[:10]:
                print(f"  {a.get('avatar_name', 'Unknown')} -> {a.get('avatar_id', 'No ID')}")
        
        return avatars

if __name__ == "__main__":
    asyncio.run(list_my_real_ids())
