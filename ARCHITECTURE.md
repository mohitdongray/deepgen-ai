# Architecture Documentation

## End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: USER INTERFACE                                                      │
│  Frontend (React - Port 3000)                                              │
│  • User navigates to Upload page                                           │
│  • Uploads source image (face) + target video                            │
│  • Must check consent checkbox (mandatory ethics gate)                    │
│  • Clicks "Start Generation"                                               │
│                                                                             │
│  Files: Upload.jsx, ConsentCheckbox.jsx                                   │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ POST /api/generate-video
                                  │ multipart/form-data
                                  │ Authorization: Bearer <JWT>
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: API GATEWAY                                                       │
│  Node.js Express (Port 5000)                                              │
│                                                                             │
│  Security Layer:                                                           │
│  1. rateLimiter.js → Check 5 generations/hour limit                      │
│  2. CORS → Validate origin matches FRONTEND_URL env                        │
│  3. requestValidator.js → Validate files:                                │
│     • Source image: JPEG/PNG, < 10MB                                       │
│     • Target video: MP4/MOV, < 100MB                                       │
│     • consentConfirmed === "true"                                          │
│                                                                             │
│  4. JWT auth middleware (optional)                                         │
│                                                                             │
│  If validation passes:                                                    │
│  • Generate UUID as jobId                                                  │
│  • Save files to uploads/ directory                                        │
│  • Forward to Python service                                               │
│                                                                             │
│  Files: server.js, videoRoutes.js, middleware/*.js                       │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ POST /generate
                                  │ Internal network only
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: AI ORCHESTRATION SERVICE                                          │
│  Python FastAPI (Port 8000)                                               │
│                                                                             │
│  1. Receives multipart request from Node.js gateway                        │
│                                                                             │
│  2. Double-check consent (ethics validation at all layers)                 │
│     if consent_confirmed not true: → HTTP 400 error                        │
│                                                                             │
│  3. JobManager.create_job():                                               │
│     • Store job metadata in memory (Redis in production)                   │
│     • status = "pending"                                                   │
│                                                                             │
│  4. BackgroundTasks.add_task():                                            │
│     • Queue async processing (returns HTTP 202 immediately)                │
│                                                                             │
│  Response: { jobId, status: "pending", estimatedTime: 180 }               │
│                                                                             │
│  Files: main.py, app/jobs/manager.py                                        │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ (Background Task - Async)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: BACKGROUND PROCESSING                                             │
│  Async task (non-blocking)                                                   │
│                                                                             │
│  1. Update job status → "processing"                                       │
│                                                                             │
│  2. orchestrator.generate_video():                                         │
│     • Select AI provider (HeyGen/Tavus/Replicate)                          │
│     • Read uploaded files                                                    │
│     • Upload to provider's storage (S3/GCS)                                │
│     • Call external AI API (HTTP POST)                                     │
│     • Poll for completion (every 5-10 seconds for 1-3 minutes)             │
│                                                                             │
│  3. External AI Processing (1-3 minutes):                                    │
│     • HeyGen API → face detection → face swap → render                   │
│     • Returns video URL when complete                                        │
│                                                                             │
│  4. On completion:                                                         │
│     • Update job status → "completed"                                      │
│     • Store result: { videoUrl, thumbnailUrl, duration }                   │
│     • Record provider name and processing time                             │
│                                                                             │
│  5. On failure:                                                            │
│     • Update job status → "failed"                                         │
│     • Store error message                                                    │
│                                                                             │
│  Files: app/services/orchestrator.py, app/services/*_service.py             │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ HTTP Response to initial request
                                  │ (already returned in Step 3)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5: STATUS POLLING                                                    │
│  Frontend polls for status                                                 │
│                                                                             │
│  While status !== "completed" || "failed":                                  │
│  • Every 2-5 seconds: GET /api/video-status/{jobId}                        │
│  • Show progress bar and status message                                    │
│  • Rate limit: 60 requests/minute (statusLimiter middleware)              │
│                                                                             │
│  Files: useJobStatus.js, GenerationProgress.jsx                            │
│  Polls: statusService.js → api.js                                          │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ GET /status/{jobId}
                                  │ Internal HTTP
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 6: STATUS RESPONSE                                                   │
│  Python → Node.js → Frontend                                               │
│                                                                             │
│  Response examples:                                                        │
│                                                                             │
│  PENDING/PROCESSING:                                                        │
│  {                                                                          │
│    "jobId": "uuid",                                                         │
│    "status": "processing",                                                    │
│    "createdAt": "2024-01-15T10:30:00Z",                                     │
│    "result": null                                                           │
│  }                                                                          │
│                                                                             │
│  COMPLETED:                                                                 │
│  {                                                                          │
│    "jobId": "uuid",                                                         │
│    "status": "completed",                                                     │
│    "createdAt": "2024-01-15T10:30:00Z",                                     │
│    "updatedAt": "2024-01-15T10:32:45Z",                                     │
│    "result": {                                                               │
│      "videoUrl": "https://storage.com/vid.mp4",                             │
│      "thumbnailUrl": "https://storage.com/thumb.jpg",                       │
│      "duration": 10.5                                                       │
│    },                                                                        │
│    "provider": "heygen",                                                      │
│    "processingTime": "165.2s"                                                │
│  }                                                                          │
│                                                                             │
│  FAILED:                                                                    │
│  {                                                                          │
│    "jobId": "uuid",                                                         │
│    "status": "failed",                                                        │
│    "error": "External API timeout"                                          │
│  }                                                                          │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 7: RESULT DISPLAY                                                    │
│  Preview Page (React)                                                      │
│                                                                             │
│  On "completed":                                                            │
│  • Display video player with result.videoUrl                               │
│  • Show "AI-Generated" badge (AIGeneratedBadge component)                  │
│  • Display provider info and processing time                               │
│  • Enable download button                                                  │
│  • Show ethical usage disclaimer                                           │
│                                                                             │
│  Files: Preview.jsx, AIGeneratedBadge.jsx                                   │
└─────────────────────────────────────────────────────────────────────────────┘

```

---

## Security Layers

```
Layer 1: Client (React)
├── No AI API keys in code
├── No direct external API calls
└── Consent checkbox (UI-level ethics gate)

Layer 2: Gateway (Node.js)
├── Rate limiting (5/hour per IP)
├── JWT authentication
├── File validation (size, type)
├── CORS restrictions
├── Input sanitization
└── Consent validation (server-side)

Layer 3: AI Service (Python)
├── Consent re-validation (defense in depth)
├── Job isolation (async processing)
├── Temporary file storage only
└── API keys from environment only

Layer 4: External APIs
├── HTTPS only
├── API key authentication
└── Provider-specific rate limits
```

---

## Data Flow Summary

```
┌──────────┐    HTTP      ┌──────────┐    HTTP      ┌──────────┐
│          │ ───────────→ │          │ ───────────→ │          │
│ Frontend │   REST/JSON  │  Node.js │   Internal   │  Python  │
│ (React)  │ ←─────────── │ Gateway  │ ←─────────── │ FastAPI  │
│          │   Job ID     │(Express) │   Job ID     │          │
└──────────┘              └──────────┘              └────┬─────┘
     │                                                    │
     │ Polling                                            │ Background
     │ GET /video-status/{id}                             │ Async Task
     │                                                    │
     │◄───────────────────────────────────────────────────┘
     │        Status Updates (pending → processing → completed)
     │
     ▼
  Display Result
  + AI-Generated Badge
```

---

## File Relationships

### Frontend Data Flow
```
Upload.jsx
  ├── uses useVideoGeneration.js hook
  │     └── calls videoService.js
  │           └── uses api.js (axios instance)
  │                 └── POST /generate-video
  ├── uses ConsentCheckbox.jsx (ethics validation)
  └── on success → navigate(/preview/{jobId})

Preview.jsx
  ├── uses useJobStatus.js hook
  │     └── calls statusService.js
  │           └── GET /video-status/{jobId}
  ├── displays AIGeneratedBadge.jsx
  └── shows GenerationProgress.jsx while processing
```

### Backend Data Flow
```
server.js (Express app)
  └── routes/videoRoutes.js
        └── POST /generate-video
              ├── middleware/rateLimiter.js (5/hour)
              ├── middleware/requestValidator.js (files + consent)
              └── calls Python service
                    └── main.py (FastAPI)
                          └── /generate endpoint
                                ├── validates consent
                                ├── jobs/manager.py (create_job)
                                └── BackgroundTasks (async)
                                      └── orchestrator.py
                                            ├── heygen_service.py
                                            ├── tavus_service.py
                                            ├── replicate_service.py
                                            └── huggingface_service.py
```

---

## Key Architectural Decisions

### 1. Dual Backend (Node.js + Python)
- **Node.js**: Handles web concerns (auth, CORS, rate limiting, validation)
- **Python**: Handles AI concerns (async API calls, job management)
- **Benefit**: Independent scaling + separation of concerns

### 2. Async Processing Pattern
- **Problem**: AI APIs take 1-3 minutes, can't block HTTP requests
- **Solution**: Background tasks with polling
- **Benefit**: Responsive UI + reliable processing

### 3. Multi-Layer Consent Validation
- **Frontend**: Checkbox UI
- **Gateway**: Form validation
- **AI Service**: Business logic validation
- **Benefit**: Defense in depth for ethics

### 4. Service Abstraction
- **Orchestrator**: Abstracts multiple AI providers
- **Benefit**: Can switch providers without changing client code
- **Fallback**: If one provider fails, can try another

---

## Error Handling Flow

```
1. Validation Error (400)
   Gateway: requestValidator.js → { error, details: [...] }
   
2. Rate Limit (429)
   Gateway: rateLimiter.js → { error, message, retryAfter }
   
3. AI Service Error (500)
   Python: Exception → logs error → job.status = "failed"
   Frontend: Status poll returns error message
   
4. Job Not Found (404)
   Python: JobManager returns None → HTTP 404
   
All errors flow through: errorHandler.js → sanitized response
```

---

## Deployment Architecture (Production)

```
                    ┌─────────────┐
                    │   Nginx     │
                    │   (Proxy)   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │   React     │ │   Node.js   │ │   Python    │
    │   Static    │ │   Gateway   │ │   FastAPI   │
    │   (CDN)     │ │   (Docker)  │ │   (Docker)  │
    └─────────────┘ └──────┬──────┘ └──────┬──────┘
                           │               │
                    ┌──────▼──────┐ ┌──────▼──────┐
                    │   Redis     │ │   External  │
                    │   (Cache)   │ │   AI APIs   │
                    │   (Rate     │ │   (HTTPS)   │
                    │   Limiting) │ │             │
                    └─────────────┘ └─────────────┘
```

---

**Documentation Version**: 1.0.0  
**Last Updated**: February 2026
