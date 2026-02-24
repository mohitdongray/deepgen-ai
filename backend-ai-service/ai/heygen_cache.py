import os
import asyncio
import httpx
import json
from dotenv import load_dotenv

load_dotenv()

class HeyGenCache:
    def __init__(self):
        self.api_key = os.getenv("HEYGEN_API_KEY")
        self.headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
        self._avatars = []
        self._voices = []
        self._initialized = False
    
    async def initialize(self):
        """Fetch and cache avatars and voices on startup"""
        print("🔄 Initializing HeyGen Cache...")
        
        # Fetch avatars
        await self._fetch_avatars()
        
        # Fetch voices  
        await self._fetch_voices()
        
        self._initialized = True
        print(f"✅ HeyGen Cache Ready: {len(self._avatars)} avatars, {len(self._voices)} voices")
    
    async def _fetch_avatars(self):
        """Fetch available avatars"""
        url = "https://api.heygen.com/v2/avatars"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers)
                data = response.json()
                
                self._avatars = data.get('data', {}).get('avatars', [])
                
                if self._avatars:
                    print(f"✅ Found {len(self._avatars)} avatars")
                    for a in self._avatars[:3]:
                        print(f"  🎭 {a.get('avatar_name', 'Unknown')} -> {a.get('avatar_id', 'No ID')}")
                else:
                    print("❌ No avatars found, trying fallback options")
                    # Try common working avatars in order
                    fallback_options = [
                        "Daisy-inskirt-20220818",
                        "Abigail_expressive_2024112501", 
                        "Abigail_public",
                        "josh_lite_20230714",
                        "Angela-inblackskirt-20220820"
                    ]
                    return fallback_options[0]  # Return first option
                    
            except Exception as e:
                print(f"❌ Failed to fetch avatars: {e}")
                # Try fallback options on exception too
                fallback_options = [
                    "Daisy-inskirt-20220818",
                    "Abigail_expressive_2024112501", 
                    "Abigail_public",
                    "josh_lite_20230714",
                    "Angela-inblackskirt-20220820"
                ]
                return fallback_options[0]
    
    async def _fetch_voices(self):
        """Fetch available voices"""
        url = "https://api.heygen.com/v2/voices"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers)
                data = response.json()
                
                self._voices = data.get('data', {}).get('voices', [])
                
                if self._voices:
                    print(f"✅ Found {len(self._voices)} voices")
                    for v in self._voices[:3]:
                        print(f"  🎤 {v.get('name', 'Unknown')} -> {v.get('voice_id', 'No ID')}")
                else:
                    print("❌ No voices found")
                    
            except Exception as e:
                print(f"❌ Failed to fetch voices: {e}")
    
    def get_first_avatar(self):
        """Get first available avatar ID"""
        if not self._avatars:
            return None
        return self._avatars[0].get('avatar_id')
    
    def get_first_voice(self):
        """Get first available voice ID"""
        if not self._voices:
            return None
        return self._voices[0].get('voice_id')
    
    def get_avatar_name(self, avatar_id):
        """Get avatar name by ID"""
        for avatar in self._avatars:
            if avatar.get('avatar_id') == avatar_id:
                return avatar.get('avatar_name', 'Unknown')
        return 'Unknown'
    
    def get_voice_name(self, voice_id):
        """Get voice name by ID"""
        for voice in self._voices:
            if voice.get('voice_id') == voice_id:
                return voice.get('name', 'Unknown')
        return 'Unknown'

# Global cache instance
heygen_cache = HeyGenCache()
