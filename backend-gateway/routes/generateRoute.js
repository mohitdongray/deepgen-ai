import express from "express";
import {
  uploadMiddleware,
  generateContent,
  generateJson,
  checkStatus,
  proxyOutputs,
} from "../controllers/generateController.js";

const router = express.Router();

router.post("/generate-json", generateJson);
router.post("/generate", uploadMiddleware, generateContent);
router.get("/status/:jobId", checkStatus);
router.get("/outputs/:filename", proxyOutputs);

export default router;
