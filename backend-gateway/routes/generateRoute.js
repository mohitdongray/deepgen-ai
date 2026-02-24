const express = require("express");
const router = express.Router();
const generateController = require("../controllers/generateController");

router.post("/generate", generateController.generateContent);

module.exports = router;
