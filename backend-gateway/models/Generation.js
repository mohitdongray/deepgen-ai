const mongoose = require("mongoose");

const generationSchema = new mongoose.Schema({
  userPrompt: { type: String, required: true },
  aiScript: { type: String },
  generatedImage: { type: String },
  generatedVideo: { type: String },
  modelUsed: { type: String },
  apiUsed: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AIGeneration", generationSchema);
