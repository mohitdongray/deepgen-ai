import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import generateRouter from "./routes/generateRoute.js";

// Load environment variables FIRST
dotenv.config();

// Validate critical environment variables
const requiredEnv = ["AI_SERVICE_URL", "FRONTEND_URL"];
const missing = requiredEnv.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`❌ Missing required env variables: ${missing.join(", ")}`);
  if (process.env.NODE_ENV === "production") process.exit(1);
} else {
  console.log("✅ Environment variables validated");
}

// Configuration
const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  process.env.PYTHON_SERVICE_URL ||
  "http://localhost:8000";
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const API_KEY = process.env.API_KEY; // optional, if not set, authentication is disabled
const NODE_ENV = process.env.NODE_ENV || "development";

// Create Express app
const app = express();

// ─── Rate Limiting (must come before routes) ─────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per window
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to generation endpoints
app.use("/generate-json", limiter);
app.use("/generate", limiter);

// ─── API Key Authentication (optional) ──────────────────────
if (API_KEY) {
  app.use((req, res, next) => {
    // Skip auth for health and root endpoints
    if (req.path === "/health" || req.path === "/") return next();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.split(" ")[1];
    if (token !== API_KEY) {
      return res.status(403).json({ error: "Invalid API key" });
    }
    next();
  });
  console.log("✅ API key authentication enabled");
} else {
  console.warn("⚠️ API_KEY not set – authentication disabled (not recommended for production)");
}

// ─── CORS (origins from environment) ───────────────────────
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
  : [FRONTEND_URL, "https://deepgen-ai-1.onrender.com", "http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));

// ─── Routes ────────────────────────────────────────────────
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

// ─── Start Server ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Gateway] Listening on port ${PORT}`);
  console.log(`[Gateway] AI service: ${AI_SERVICE_URL}`);
  console.log(`[Gateway] CORS origins: ${allowedOrigins.join(", ")}`);
  console.log(`[Gateway] Environment: ${NODE_ENV}`);
});