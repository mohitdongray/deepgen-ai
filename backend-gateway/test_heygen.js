require("dotenv").config();
const fetch = require("node-fetch");

// Test HeyGen API from Node.js
const testHeyGen = async () => {
  try {
    console.log("🔍 Testing HeyGen API from Node.js...");
    
    const response = await fetch("https://api.heygen.com/v2/avatars", {
      method: "GET",
      headers: {
        "x-api-key": process.env.HEYGEN_API_KEY,  // ✅ Correct: process.env.HEYGEN_API_KEY
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Success! Available avatars:");
      const avatars = data.data?.avatars || [];
      avatars.slice(0, 5).forEach((avatar, index) => {
        console.log(`  🎭 ${index + 1}. ${avatar.avatar_name} -> ${avatar.avatar_id}`);
      });
    } else {
      console.log("❌ Error:", data);
    }
    
  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
};

// Test voices too
const testVoices = async () => {
  try {
    console.log("\n🔍 Testing HeyGen Voices...");
    
    const response = await fetch("https://api.heygen.com/v2/voices", {
      method: "GET",
      headers: {
        "x-api-key": process.env.HEYGEN_API_KEY,  // ✅ Correct: process.env.HEYGEN_API_KEY
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Success! Available voices:");
      const voices = data.data?.voices || [];
      voices.slice(0, 5).forEach((voice, index) => {
        console.log(`  🎤 ${index + 1}. ${voice.name} -> ${voice.voice_id}`);
      });
    } else {
      console.log("❌ Error:", data);
    }
    
  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
};

// Run tests
testHeyGen().then(() => testVoices());
