const express = require("express");
const router = express.Router();
const axios = require("axios");
const generateController = require("../controllers/generateController");

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

// ── Multipart form upload route (file-based generation) ──────────────
router.post(
  "/generate",
  generateController.uploadMiddleware,
  generateController.generateContent
);

// ── JSON generation route (text-to-video, image, avatar-video, etc.) ─
// Frontend → Gateway POST /api/generate-json → FastAPI POST /generate-json
router.post("/generate-json", async (req, res) => {
  try {
    console.log("📩 [Gateway] /generate-json →", req.body);

    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/generate-json`,
      req.body,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    console.log("✅ [Gateway] FastAPI response:", response.data);
    res.json(response.data);

  } catch (err) {
    console.error("❌ [Gateway] /generate-json error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Generation failed",
      details: err.response?.data || err.message,
    });
  }
});

// ── Job status check ─────────────────────────────────────────────────
router.get("/status/:jobId", generateController.checkStatus);

module.exports = router;
