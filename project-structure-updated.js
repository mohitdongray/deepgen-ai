/**
 * MAJOR PROJECT - AI VIDEO GENERATION PLATFORM
 * Updated: February 2026
 * Architecture: Node.js Gateway + Python AI Service + MongoDB
 */

const projectStructure = {
  name: "AI Video Generation Platform",
  version: "2.0.0",
  description: "Production-ready AI video generation with multi-provider orchestration",
  
  // ============================
  // FRONTEND (React/Vue/Next.js)
  // ============================
  frontend: {
    path: "frontend/",
    description: "User interface for video generation",
    technologies: ["React", "JavaScript", "CSS"],
    keyFiles: {
      "src/pages/Generate/Generate.jsx": "Main generation interface",
      "src/services/videoService.js": "API client for backend",
      "src/services/api.js": "Axios configuration",
      "src/components/": "UI components"
    }
  },

  // ============================
  // BACKEND GATEWAY (Node.js)
  // ============================
  "backend-gateway": {
    path: "backend-gateway/",
    description: "API Gateway and authentication",
    technologies: ["Node.js", "Express", "MongoDB", "JWT"],
    port: 5000,
    keyFiles: {
      "server.js": "Main Express server",
      "package.json": "Dependencies and scripts",
      ".env": "Environment variables",
      "controllers/generateController.js": "Video generation endpoint",
      "models/Generation.js": "MongoDB schema",
      "routes/generateRoutes.js": "API routes",
      "middleware/auth.js": "Authentication middleware",
      "test_heygen.js": "HeyGen API testing"
    },
    api: {
      "POST /generate": "Generate video content",
      "GET /test-heygen": "Test HeyGen API",
      "GET /jobs/:id": "Get job status",
      "GET /health": "Health check"
    }
  },

  // ============================
  // BACKEND AI SERVICE (Python)
  // ============================
  "backend-ai-service": {
    path: "backend-ai-service/",
    description: "AI video generation service with multi-provider orchestration",
    technologies: ["Python", "FastAPI", "MongoDB", "AsyncIO"],
    port: 8001,
    keyFiles: {
      "main_mongo.py": "FastAPI application with MongoDB",
      "app/services/ai_orchestrator.py": "Multi-provider orchestration",
      "ai/heygen_provider.py": "HeyGen Video Agent integration",
      "ai/gemini_provider.py": "Google Gemini/Veo integration", 
      "ai/huggingface_provider.py": "HuggingFace integration",
      "ai/heygen_cache.py": "HeyGen avatar/voice caching",
      "db.py": "MongoDB connection and CRUD",
      ".env": "Environment variables",
      "requirements.txt": "Python dependencies"
    },
    providers: {
      "Gemini": "Primary - Google Veo video generation",
      "HeyGen": "Secondary - Video Agent API (no avatar needed)",
      "HuggingFace": "Tertiary - Stable Diffusion images",
      "Fallback": "Final - Static fallback videos"
    },
    api: {
      "POST /generate": "Main video generation endpoint",
      "GET /jobs/{job_id}": "Get job status",
      "GET /health": "Service health check",
      "GET /static/*": "Static file serving"
    }
  },

  // ============================
  // DATABASE (MongoDB)
  // ============================
  database: {
    type: "MongoDB",
    description: "Job storage and results caching",
    collections: {
      "jobs": "Video generation jobs with status tracking",
      "generations": "Generated content metadata"
    },
    connection: {
      development: "mongodb://localhost:27017",
      production: "MongoDB Atlas cloud"
    }
  },

  // ============================
  // AI PROVIDERS INTEGRATION
  // ============================
  aiProviders: {
    "HeyGen": {
      api: "Video Agent API",
      endpoint: "https://api.heygen.com/v1/video_agent/generate",
      auth: "X-API-KEY header",
      freePlan: true,
      noAvatarRequired: true,
      features: ["AI presenter", "Lip-sync", "Auto-generated voice"]
    },
    "Gemini": {
      api: "Google Veo",
      endpoint: "generativelanguage.googleapis.com",
      auth: "API Key",
      model: "veo-3.1-generate-preview",
      features: ["High-quality video", "Text-to-video"]
    },
    "HuggingFace": {
      api: "Inference API",
      endpoint: "https://api-inference.huggingface.co",
      auth: "HF Token",
      model: "runwayml/stable-diffusion-v1-5",
      features: ["Image generation", "Artistic styles"]
    }
  },

  // ============================
  // ORCHESTRATION FLOW
  // ============================
  orchestration: {
    flow: [
      "1. Gemini (Primary)",
      "2. HeyGen Video Agent (Secondary)", 
      "3. HuggingFace (Tertiary)",
      "4. Fallback (Final)"
    ],
    features: [
      "Automatic failover",
      "Progress streaming",
      "Error handling",
      "Production logging"
    ]
  },

  // ============================
  // DEPLOYMENT
  // ============================
  deployment: {
    environments: {
      development: {
        "Frontend": "localhost:3000",
        "Gateway": "localhost:5000", 
        "AI Service": "localhost:8001"
      },
      production: {
        "Frontend": "Cloud hosting (Vercel/Netlify)",
        "Gateway": "Node.js server (AWS/DigitalOcean)",
        "AI Service": "Python service (AWS/DigitalOcean)",
        "Database": "MongoDB Atlas"
      }
    }
  },

  // ============================
  // KEY FEATURES
  // ============================
  features: {
    "Multi-Provider AI": "Gemini, HeyGen, HuggingFace with automatic failover",
    "Real-time Progress": "WebSocket-style progress streaming",
    "Production Logging": "Comprehensive error handling and debugging",
    "MongoDB Persistence": "Job tracking and result storage",
    "API Gateway": "Unified REST API with authentication",
    "Environment Management": "Secure configuration with .env files",
    "Static File Serving": "Generated content delivery",
    "Health Monitoring": "Service health checks and status"
  }
};

// Export for use in documentation
module.exports = projectStructure;
