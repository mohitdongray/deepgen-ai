import axios from "axios";
import multer from "multer";
import FormData from "form-data";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  process.env.PYTHON_SERVICE_URL ||
  "http://localhost:8000";

/**
 * Normalize frontend mode strings to AI service internal modes.
 * - Image modes → "image"
 * - Video/avatar modes → "video"
 * - Unknown → fallback to "image"
 */
function normalizeMode(mode) {
  const m = (mode || "").toLowerCase();
  // Image‑related modes
  if (["image", "img", "text-to-image", "image-generation", "generate-image"].includes(m)) {
    return "image";
  }
  // Video/avatar modes
  if (["video", "text-to-video", "avatar-video", "image-to-video", 
       "face-swap", "voice-cloning", "ai-dubbing", "text-to-avatar"].includes(m)) {
    return "video";
  }
  // Default to image (safe fallback)
  return "image";
}

function formatUpstreamError(err) {
  const data = err.response?.data;
  if (!data) return err.message;

  if (Array.isArray(data.details)) {
    return data.details
      .map((d) => {
        const loc = Array.isArray(d.loc) ? d.loc.join(".") : "";
        return loc ? `${loc}: ${d.msg}` : d.msg;
      })
      .join("; ");
  }

  if (typeof data.details === "string") return data.details;
  if (data.error) return data.error;
  if (data.detail) return data.detail;
  return JSON.stringify(data);
}

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({ storage }).fields([
  { name: "source_image", maxCount: 1 },
  { name: "target_video", maxCount: 1 },
]);

export async function generateContent(req, res) {
  try {
    console.log("[Gateway] POST /generate — forwarding multipart to AI service");

    const rawMode = req.body.mode || "image";
    const normalizedMode = normalizeMode(rawMode);
    console.log(`[Gateway] Mode normalized: ${rawMode} → ${normalizedMode}`);

    const form = new FormData();
    form.append("description", req.body.description || req.body.prompt || "AI generation");
    form.append("mode", normalizedMode);
    form.append("consent_confirmed", req.body.consent_confirmed || "true");

    if (req.files?.source_image?.[0]) {
      const f = req.files.source_image[0];
      form.append("source_image", f.buffer, {
        filename: f.originalname || "image.png",
        contentType: f.mimetype,
      });
    }

    if (req.files?.target_video?.[0]) {
      const f = req.files.target_video[0];
      form.append("target_video", f.buffer, {
        filename: f.originalname || "video.mp4",
        contentType: f.mimetype,
      });
    }

    const response = await axios.post(`${AI_SERVICE_URL}/generate`, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    console.log("[Gateway] AI service accepted job:", response.data?.job_id);
    res.json(response.data);
  } catch (err) {
    console.error("[Gateway] /generate error:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: "Failed to generate",
      details: formatUpstreamError(err),
    });
  }
}

export async function generateJson(req, res) {
  try {
    const body = req.body || {};
    const prompt = (body.prompt || body.description || body.text || "").trim();
    if (!prompt) {
      return res.status(400).json({
        error: "Validation failed",
        details: "prompt is required",
      });
    }

    const rawMode = body.mode || "image";
    const normalizedMode = normalizeMode(rawMode);
    console.log(`[Gateway] POST /generate-json — rawMode=${rawMode} → normalized=${normalizedMode}`);

    const payload = {
      mode: normalizedMode,
      consent_confirmed: body.consent_confirmed ?? "true",
      prompt,
      description: prompt,
      text: body.text,
      image_url: body.image_url,
      job_id: body.job_id,
    };

    const response = await axios.post(`${AI_SERVICE_URL}/generate-json`, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    console.log("[Gateway] job_id=%s", response.data?.job_id);
    res.json(response.data);
  } catch (err) {
    console.error("[Gateway] /generate-json error:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: "Generation failed",
      details: formatUpstreamError(err),
    });
  }
}

export async function checkStatus(req, res) {
  try {
    const { jobId } = req.params;
    console.log("[Gateway] GET /status/%s", jobId);

    const response = await axios.get(`${AI_SERVICE_URL}/status/${jobId}`, {
      timeout: 15000,
    });

    res.json(response.data);
  } catch (err) {
    console.error("[Gateway] /status error:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json({
      error: "Status fetch failed",
      details: err.response?.data || err.message,
    });
  }
}

export async function proxyOutputs(req, res) {
  try {
    const filePath = req.params.filename;
    const response = await axios.get(`${AI_SERVICE_URL}/outputs/${filePath}`, {
      responseType: "stream",
      timeout: 60000,
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      return res.status(response.status).json({
        error: "Output not found",
      });
    }

    if (response.headers["content-type"]) {
      res.set("Content-Type", response.headers["content-type"]);
    }
    response.data.pipe(res);
  } catch (err) {
    console.error("[Gateway] /outputs proxy error:", err.message);
    res.status(502).json({ error: "Failed to fetch output" });
  }
}