import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import generateRouter from "./routes/generateRoute.js";

dotenv.config();

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  process.env.PYTHON_SERVICE_URL ||
  "http://localhost:8000";

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const app = express();

app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({ status: "Gateway running", ai_service: AI_SERVICE_URL });
});

app.get("/health", async (_req, res) => {
  try {
    const ai = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
    res.json({
      status: "healthy",
      service: "DeepGen Gateway",
      ai_service: AI_SERVICE_URL,
      ai: ai.data,
    });
  } catch (err) {
    res.status(503).json({
      status: "degraded",
      service: "DeepGen Gateway",
      ai_service: AI_SERVICE_URL,
      error: err.message,
    });
  }
});

// Generation + status + outputs proxy
app.use(generateRouter);

app.listen(PORT, () => {
  console.log(`[Gateway] Listening on port ${PORT}`);
  console.log(`[Gateway] AI service: ${AI_SERVICE_URL}`);
  console.log(`[Gateway] CORS origin: ${FRONTEND_URL}`);
});
