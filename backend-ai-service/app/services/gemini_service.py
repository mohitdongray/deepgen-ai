"""
Google Gemini AI Service
====================

This service integrates with Google Gemini API to generate:
- AI scripts for video presentations
- Image prompts for avatar generation
- Video prompts for content creation

Architecture:
User Prompt → Gemini API → Structured Response → Backend → Frontend
"""

import os
import httpx
import json
from typing import Dict, Any, Optional
from datetime import datetime

# API Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-1.5-flash"

class GeminiService:
    """
    Google Gemini AI integration for content generation.
    
    Generates structured responses for:
    - Video scripts
    - Avatar image descriptions  
    - Video style prompts
    """
    
    def __init__(self):
        """Initialize Gemini service with API key."""
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.client = httpx.AsyncClient(
            base_url=f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": self.api_key
            },
            timeout=60.0
        )
    
    async def generate_ai_content(self, user_prompt: str) -> Dict[str, Any]:
        """
        Generate AI content based on user prompt.
        
        For video creation assistant, generates:
        - Script for presentation
        - Avatar image description
        - Video style prompt
        
        Args:
            user_prompt: User's input prompt
            
        Returns:
            Dict with script, image_prompt, video_prompt
        """
        
        try:
            # Enhanced prompt for video creation assistant
            enhanced_prompt = f"""
            You are an AI video creation assistant. Based on the user's request, generate:
            
            1. A short talking presentation script (2-3 sentences)
            2. A visual avatar image description (detailed appearance)
            3. A talking video style description (background, lighting, mood)
            
            User Request: {user_prompt}
            
            Please respond in JSON format with these exact keys:
            {{
              "script": "the presentation script",
              "image_prompt": "detailed avatar description", 
              "video_prompt": "video style and direction"
            }}
            
            Make the script conversational and professional.
            Make the avatar description detailed (clothing, background, expression).
            Make the video prompt specific (camera angles, lighting, mood).
            """
            
            # Request to Gemini API
            response = await self.client.post(
                json={
                    "contents": [{
                        "parts": [{
                            "text": enhanced_prompt
                        }]
                    }],
                    "generationConfig": {
                        "temperature": 0.7,
                        "topK": 1,
                        "maxOutputTokens": 1000
                    }
                }
            )
            
            # Parse response
            if response.status_code == 200:
                content = response.json()
                
                # Extract generated text
                if "candidates" in content and len(content["candidates"]) > 0:
                    generated_text = content["candidates"][0]["content"]["parts"][0]["text"]
                    
                    # Try to parse JSON from generated text
                    try:
                        # Clean up the response to extract JSON
                        json_start = generated_text.find('{')
                        json_end = generated_text.rfind('}') + 1
                        
                        if json_start != -1 and json_end > json_start:
                            json_str = generated_text[json_start:json_end]
                            parsed_data = json.loads(json_str)
                            
                            return {
                                "success": True,
                                "script": parsed_data.get("script", ""),
                                "image_prompt": parsed_data.get("image_prompt", ""),
                                "video_prompt": parsed_data.get("video_prompt", ""),
                                "model_used": GEMINI_MODEL,
                                "api_used": "google-gemini",
                                "created_at": datetime.utcnow().isoformat()
                            }
                    
                    except json.JSONDecodeError:
                        # Fallback if JSON parsing fails
                        lines = generated_text.split('\n')
                        script_line = next((line for line in lines if "script:" in line.lower()), "")
                        image_line = next((line for line in lines if "image_prompt:" in line.lower()), "")
                        video_line = next((line for line in lines if "video_prompt:" in line.lower()), "")
                        
                        return {
                            "success": True,
                            "script": script_line.replace("script:", "").strip() if script_line else "",
                            "image_prompt": image_line.replace("image_prompt:", "").strip() if image_line else "",
                            "video_prompt": video_line.replace("video_prompt:", "").strip() if video_line else "",
                            "model_used": GEMINI_MODEL,
                            "api_used": "google-gemini",
                            "created_at": datetime.utcnow().isoformat()
                        }
                
                else:
                    return {
                        "success": False,
                        "error": f"Gemini API error: {content}",
                        "model_used": GEMINI_MODEL,
                        "api_used": "google-gemini"
                    }
            
            else:
                return {
                    "success": False,
                    "error": f"Gemini API request failed: {response.status_code}",
                    "model_used": GEMINI_MODEL,
                    "api_used": "google-gemini"
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Gemini service error: {str(e)}",
                "model_used": GEMINI_MODEL,
                "api_used": "google-gemini"
            }
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if Gemini service is healthy."""
        try:
            response = await self.client.post(
                json={
                    "contents": [{"parts": [{"text": "Health check"}]}]
                }
            )
            
            return {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "api": "google-gemini",
                "model": GEMINI_MODEL,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "api": "google-gemini",
                "model": GEMINI_MODEL
            }
