require("dotenv").config();
const axios = require("axios");

const multer = require("multer");
const storage = multer.memoryStorage();

exports.uploadMiddleware = multer({ storage }).fields([
  { name: "source_image", maxCount: 1 },
  { name: "target_video", maxCount: 1 }
]);

// 🔥 MAIN GENERATE FUNCTION (FIXED)
exports.generateContent = async (req, res) => {
  try {
    console.log("📩 Incoming request from frontend");

    const FormData = require("form-data");
    const form = new FormData();
    
    form.append("description", req.body.description || "AI video test");
    form.append("mode", req.body.mode || "video");

    if (req.files && req.files.source_image) {
      form.append("source_image", req.files.source_image[0].buffer, req.files.source_image[0].originalname || "image.png");
    }

    if (req.files && req.files.target_video) {
      form.append("target_video", req.files.target_video[0].buffer, req.files.target_video[0].originalname || "video.mp4");
    }

    console.log("🚀 Sending to FastAPI FormData:", req.body.description);

    const response = await axios.post(
      "http://localhost:8000/generate",
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000
      }
    );

    console.log("✅ FastAPI response:", response.data);

    res.json(response.data);

  } catch (err) {
    console.error("❌ Generate Error:", err.response?.data || err.message);

    res.status(500).json({
      error: "Failed to generate",
      details: err.response?.data || err.message
    });
  }
};

// 🔥 STATUS CHECK (unchanged but improved logging)
exports.checkStatus = async (req, res) => {
  try {
    console.log("🔄 Checking status:", req.params.jobId);

    const response = await axios.get(
      `http://localhost:8000/status/${req.params.jobId}`,
      { timeout: 10000 }
    );

    res.json(response.data);

  } catch (err) {
    console.error("❌ Status Error:", err.response?.data || err.message);

    res.status(500).json({
      error: "Status fetch failed",
      details: err.response?.data || err.message
    });
  }
};

// 🔹 Test HeyGen API directly (kept as-is, just safer logging)
exports.testHeyGen = async (req, res) => {
  try {
    console.log("🔍 Testing HeyGen API...");

    const response = await fetch("https://api.heygen.com/v2/avatars", {
      method: "GET",
      headers: {
        "x-api-key": process.env.HEYGEN_API_KEY,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (response.ok) {
      const avatars = data.data?.avatars || [];

      res.json({
        success: true,
        data: {
          avatars: avatars.slice(0, 10),
          count: avatars.length
        }
      });

    } else {
      res.status(400).json({
        error: "Failed to fetch avatars",
        details: data
      });
    }

  } catch (error) {
    console.error("❌ HeyGen Error:", error.message);

    res.status(500).json({
      error: "Request failed",
      details: error.message
    });
  }
};