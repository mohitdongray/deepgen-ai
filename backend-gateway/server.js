import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

app.get("/", (req, res) => {
  res.json({ status: "Gateway running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "DeepGen Gateway" });
});

app.post("/generate", async (req, res) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/generate`,
      req.body
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      error: "AI service error",
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
