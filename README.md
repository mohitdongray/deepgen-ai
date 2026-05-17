# AI Video Generation Platform

> An intelligent full-stack web application that enables users to generate AI-powered videos and images using multiple AI provider integrations, with a secure microservices architecture.

---

## Project Description

The AI Video Generation Platform is a full-stack web application that allows users to generate AI-powered video and image content by providing text prompts or uploading source media. The system uses a microservices architecture with a React frontend, a Node.js API Gateway, and a Python FastAPI AI service. It supports multiple generation modes — text-to-video, image-to-video, face swap, voice cloning, avatar video, and more — with automatic provider fallback and real-time job status tracking.

---

## Features

- **Multi-Mode AI Generation** — Text-to-Video, Image-to-Video, Face Swap, Voice Cloning, AI Dubbing, Avatar Video
- **Real-Time Job Status Tracking** — Polling-based system shows live progress (pending → processing → completed)
- **Multiple AI Provider Support** — Integrates HeyGen, Tavus, Replicate, HuggingFace, DeepAI, Google Gemini with automatic fallback
- **Secure API Gateway** — JWT authentication, rate limiting (5 requests/hour), file type/size validation, CORS protection
- **Multi-Layer Consent Validation** — Ethics gate enforced at UI, gateway, and AI service layers
- **MongoDB Integration** — Persistent job storage and user generation history
- **Responsive Modern UI** — Dark-themed React SPA with smooth animations and glassmorphism design
- **Asynchronous Processing** — Non-blocking background job queue returns immediately with a job ID

---

## Technologies Used

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI Framework |
| React Router DOM | 6.20.0 | Client-side routing |
| Axios | 1.6.2 | HTTP client |
| React Dropzone | 14.2.3 | File upload UI |
| Lucide React | 0.294.0 | Icon library |

### Backend Gateway (Node.js)

| Technology | Version | Purpose |
|---|---|---|
| Express | 4.18.2 | Web framework |
| Mongoose | 9.2.1 | MongoDB ODM |
| JWT (jsonwebtoken) | 9.0.2 | Authentication |
| Multer | 1.4.5 | File upload handling |
| Helmet | 7.1.0 | Security headers |
| Express Rate Limit | 7.1.5 | Rate limiting |
| Morgan | 1.10.0 | HTTP request logging |
| Axios | 1.6.2 | Inter-service HTTP |

### AI Service (Python)

| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.109.0 | Async web framework |
| Uvicorn | 0.27.0 | ASGI server |
| Pydantic | 2.5.3 | Data validation |
| httpx | 0.26.0 | Async HTTP client |
| Pillow | 10.2.0 | Image processing |
| python-multipart | 0.0.6 | File upload parsing |
| python-dotenv | 1.0.0 | Environment config |

### Database & Infrastructure

| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud database for job metadata and user data |
| Redis (optional) | Rate limiting and caching in production |

---

## Setup Instructions

### Prerequisites

- Node.js >= 18.0.0
- Python >= 3.9
- MongoDB Atlas account (or local MongoDB)
- API keys for at least one AI provider (HeyGen, HuggingFace, DeepAI, etc.)

---

### Step 1 — Clone & Navigate

```bash
git clone <repository-url>
cd "major project"
```

---

### Step 2 — Set Up Python AI Service

```bash
cd backend-ai-service

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
copy .env.example .env
# Edit .env and add your API keys (HEYGEN_API_KEY, DEEPAI_API_KEY, etc.)

# Start the AI service
python -m uvicorn main:app --reload --port 8000
```

---

### Step 3 — Set Up Node.js API Gateway

```bash
cd backend-gateway

# Install dependencies
npm install

# Copy and fill in environment variables
copy .env.example .env
# Edit .env: set MONGO_URI, JWT_SECRET, FRONTEND_URL, AI_SERVICE_URL

# Start the gateway (development)
npm run dev
```

---

### Step 4 — Set Up React Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file (if applicable)
copy .env.example .env

# Start the frontend
npm start
```

---

### Step 5 — Verify All Services

Open your browser and check:

- Frontend: [http://localhost:3000](http://localhost:3000)
- API Gateway: [http://localhost:5000/health](http://localhost:5000/health)
- AI Service: [http://localhost:8000/health](http://localhost:8000/health)

---

## Folder Structure

```
major project/
├── frontend/                        # React SPA (Port 3000)
│   ├── public/
│   └── src/
│       ├── App.js                   # Root component with routing
│       ├── components/
│       │   ├── common/              # Shared UI components (Navbar, Cards, etc.)
│       │   ├── features/            # Feature-specific components (CursorEffect, etc.)
│       │   └── layout/              # Layout components (DashboardLayout)
│       ├── context/                 # React context providers (Auth, Theme, Generation)
│       ├── hooks/                   # Custom React hooks (useJobStatus, etc.)
│       ├── pages/                   # Application pages
│       │   ├── Home/                # Landing page
│       │   ├── Create/              # Creation mode selector
│       │   ├── Upload/              # File upload & generation trigger
│       │   ├── Generate/            # Text-based generation
│       │   ├── Preview/             # Result preview with video player
│       │   └── ExploreFeatures/     # Feature exploration page
│       └── services/                # API service layer (axios calls)
│
├── backend-gateway/                 # Node.js Express API Gateway (Port 5000)
│   ├── server.js                    # Main Express application
│   ├── config/
│   │   └── database.js              # MongoDB connection
│   ├── controllers/
│   │   └── generateController.js    # Generation & status logic
│   ├── middleware/
│   │   ├── rateLimiter.js           # Rate limiting (5/hour)
│   │   ├── requestValidator.js      # File & consent validation
│   │   ├── errorHandler.js          # Global error handler
│   │   └── security.js              # Custom security headers
│   ├── models/
│   │   └── Generation.js            # Mongoose schema
│   └── routes/
│       ├── videoRoutes.js           # Video generation routes
│       └── generateRoute.js         # Generate & status routes
│
├── backend-ai-service/              # Python FastAPI AI Service (Port 8000)
│   ├── main.py                      # FastAPI application entry point
│   ├── orchestrator.py              # Multi-provider AI orchestrator
│   ├── requirements.txt             # Python dependencies
│   ├── ai/
│   │   ├── ai_provider.py           # AIProviderManager (routes mode → provider)
│   │   ├── heygen_provider.py       # HeyGen API integration
│   │   ├── huggingface_provider.py  # HuggingFace Stable Diffusion
│   │   ├── deepai_provider.py       # DeepAI text-to-image
│   │   ├── gemini_provider.py       # Google Gemini integration
│   │   └── local_model.py           # Local model support
│   ├── app/
│   │   └── core/
│   │       └── logging.py           # Logging configuration
│   └── outputs/                     # Generated media storage
│
├── ARCHITECTURE.md                  # Detailed architecture documentation
├── project-structure.js             # Auto-generated structure reference
└── project-submission/              # Submission package
```

---

## Environment Variables

### `backend-gateway/.env`

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ai-video-db
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
```

### `backend-ai-service/.env`

```env
HEYGEN_API_KEY=your_heygen_key
DEEPAI_API_KEY=your_deepai_key
HUGGINGFACE_API_KEY=your_huggingface_key
GEMINI_API_KEY=your_gemini_key
REPLICATE_API_TOKEN=your_replicate_key
TAVUS_API_KEY=your_tavus_key
```

---

## API Endpoints

### API Gateway (Port 5000)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/generate` | Trigger AI generation |
| GET | `/api/status/:jobId` | Poll job status |
| POST | `/api/generate-video` | Upload files + generate |
| GET | `/api/video-status/:jobId` | Poll video job status |

### AI Service (Port 8000)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/generate` | Start generation job |
| POST | `/generate-json` | Start job (JSON body) |
| GET | `/status/:jobId` | Get job status |
| GET | `/metrics` | Service metrics |

---

## License

This project is developed for educational purposes.

---

*Project Version: 1.0.0 | Last Updated: May 2026*