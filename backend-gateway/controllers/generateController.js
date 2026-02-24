require("dotenv").config();
const AIGeneration = require("../models/Generation");
const axios = require("axios");
const fetch = require("node-fetch");

exports.generateContent = async (req, res) => {
  try {
    const { prompt } = req.body;

    // 🔹 Call AI Service (Python backend)
    const aiResponse = await axios.post(
      "http://localhost:8001/generate",
      {
        user_id: req.user?.id || "anonymous",
        description: prompt
      }
    );

    const result = aiResponse.data;

    // 🔹 Save to MongoDB
    const savedData = await AIGeneration.create({
      userPrompt: prompt,
      aiScript: result.result?.script || "",
      generatedImage: result.result?.thumbnail_url || "",
      generatedVideo: result.result?.video_url || "",
      modelUsed: result.result?.provider || "AI Service",
      apiUsed: "AI Orchestrator"
    });

    // 🔹 Return response
    res.json({
      success: true,
      data: savedData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Generation Failed" });
  }
};

// 🔹 Test HeyGen API directly
exports.testHeyGen = async (req, res) => {
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
      
      res.json({
        success: true,
        data: {
          avatars: avatars.slice(0, 10),
          count: avatars.length
        }
      });
    } else {
      console.log("❌ Error:", data);
      res.status(400).json({ error: "Failed to fetch avatars", details: data });
    }
    
  } catch (error) {
    console.error("❌ Request failed:", error.message);
    res.status(500).json({ error: "Request failed", details: error.message });
  }
};
