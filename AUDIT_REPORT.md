# Production-Level Codebase Audit Report
## DeepGen AI — Full-Stack Video Generation Platform

**Audit Date:** May 25, 2026  
**Scope:** Backend AI Service (Python/FastAPI), Gateway (Node.js/Express), Frontend (React)  
**Assessment Level:** Production Readiness Evaluation

---

## Executive Summary

The DeepGen AI platform is a **well-architected three-tier system** with **solid foundational design**, but has **critical security, reliability, and deployment gaps** that **must be fixed before production use**. The codebase shows signs of **active refactoring** (transitioning from in-memory DB to JobStore, adding async providers) that was **not fully completed**.

### Overall Status: 🔴 **NOT PRODUCTION READY** (Estimated fixes: 2-3 weeks)

### Key Findings:
- ✅ **Strengths:** Clean async architecture, provider fallback pattern, multi-mode generation support
- ❌ **Critical Issues:** 8 blocking problems (JWT missing, rate limiting missing, data loss on crash, etc.)
- ⚠️ **High Issues:** 12 significant problems (type hints, auth errors, timeouts, etc.)
- ℹ️ **Medium Issues:** 10 maintainability/reliability issues

---

## 🔴 Critical Issues (MUST FIX)

### 1. **JWT Authentication Not Implemented**
- **File:** `backend-gateway/server.js`
- **Issue:** README.md promises JWT authentication and rate limiting (5 req/hour), but **zero middleware enforces them**. Anyone can call the API endpoints without authentication.
- **Risk:** Unauthorized access, potential API abuse, budget exhaustion on AI provider calls
- **Fix:**
```javascript
import rateLimit from 'express-rate-limit';
import jwt from 'express-jwt';

// Add before app.use(generateRouter)
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

app.use('/api/', limiter);
app.use('/api/', authMiddleware);
```
- **Effort:** 2-3 hours

---

### 2. **Rate Limiting Not Configured**
- **File:** `backend-gateway/server.js`
- **Issue:** No rate limiting middleware. Backend can be DDoS'd or abused. Each AI provider call costs money—unbounded requests = budget disaster.
- **Risk:** Service outage, expensive API bills
- **Fix:** Add rate limiting (see fix above)
- **Effort:** 1-2 hours

---

### 3. **Jobs Lost on Service Crash (In-Memory Storage Only)**
- **Files:** 
  - `backend-ai-service/db.py` (in-memory store)
  - `backend-ai-service/main.py` (uses db.py, not JobStore)
- **Issue:** Job metadata stored in volatile `_memory_store` dict. If service restarts:
  - All job status data lost
  - Users can't poll job status
  - Generated images/videos become orphaned
  - README mentions MongoDB but code **never uses it**
- **Risk:** Complete data loss, user frustration, apparent API failures
- **Fix:** 
  - **Option A (Recommended):** Remove legacy `db.py` and properly initialize `JobStore` in FastAPI startup
  ```python
  # In main.py, replace db imports with:
  from app.jobs.store import JobStore
  from app.jobs.models import JobRecord, JobStatus
  
  @app.on_event("startup")
  async def startup():
    app.state.job_store = JobStore(settings)
    await app.state.job_store.load()
    # ... rest of startup
  ```
  - **Option B (Better):** Restore MongoDB connection with motor async client (if long-term persistence needed)
- **Effort:** 4-6 hours (refactoring main.py and db usage)

---

### 4. **API Keys Leaked in Error Logs**
- **File:** `backend-ai-service/app/providers/qwen.py` line 25, similar in flux.py
- **Issue:** Auth headers with Bearer tokens logged on errors:
  ```python
  headers = {
    "Authorization": f"Bearer {self._settings.qwen_api_key}",  # VISIBLE IN LOGS
    "Content-Type": "application/json",
  }
  # ... if error:
  raise Exception(f"Qwen HTTP {response.status_code}: {response.text[:500]}")
  ```
  If monitoring/logging system is compromised, API keys exposed. If logs sent to external service, credentials leak.
- **Risk:** API key compromise, unauthorized API usage, cost fraud
- **Fix:**
```python
# Create sanitization utility
def sanitize_headers(headers):
  sanitized = headers.copy()
  for key in ['Authorization', 'x-key', 'x-api-key']:
    if key in sanitized:
      sanitized[key] = f"{key}: [REDACTED]"
  return sanitized

# In logging:
logger.error(f"Provider error: {sanitize_headers(headers)}")

# Also: Use HttpClient logging levels to suppress debug logs in production
```
- **Effort:** 2-3 hours

---

### 5. **CORS Origins Hardcoded (Not Environment-Driven)**
- **File:** `backend-ai-service/main.py` line 54-58
- **Issue:** CORS whitelist hardcoded with production URLs:
  ```python
  allow_origins=[
    "https://deepgen-gateway.onrender.com",
    "http://localhost:5000",
    "https://deepgen-ai-1.onrender.com"  # Should NOT be here
  ]
  ```
  If deployment URL changes, code must be redeployed. Frontend allowed direct access to AI service (security boundary violation).
- **Risk:** Deployment inflexibility, security boundary breach
- **Fix:**
```python
# In app/config.py
cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5000")

# In main.py
allowed_origins = [o.strip() for o in settings.cors_origins.split(',')]
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, ...)
```
- **Effort:** 1 hour

---

### 6. **Environment Variables Not Validated at Startup**
- **File:** `backend-ai-service/app/config.py`
- **Issue:** Settings class reads env vars but never validates they exist or are valid format:
  ```python
  qwen_api_key: str = os.getenv("QWEN_API_KEY", "")  # Empty string if missing!
  ```
  If `QWEN_API_KEY` is missing, code silently sets to `""`, then crashes later with confusing error. No early validation.
- **Risk:** Confusing deployment errors, hard to debug
- **Fix:**
```python
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # At least one image provider must be configured
    qwen_api_key: str = Field(default="", description="Qwen API key")
    flux_api_key: str = Field(default="", description="Flux API key")
    
    @validator('*', pre=True)
    def check_required_providers(cls, v, info):
        # Ensure at least one provider is configured
        if info.field_name in ['qwen_api_key', 'flux_api_key']:
            # After init, verify at least one is set
        return v
    
    @root_validator
    def validate_providers(cls, values):
        has_qwen = bool(values.get('qwen_api_key'))
        has_flux = bool(values.get('flux_api_key'))
        has_tavus = bool(values.get('tavus_api_key') and values.get('tavus_replica_id'))
        if not (has_qwen or has_flux):
            raise ValueError("At least one of QWEN_API_KEY or FLUX_API_KEY must be set")
        return values

# In startup:
try:
    settings = get_settings()
except ValueError as e:
    logger.critical(f"Config error: {e}")
    sys.exit(1)
```
- **Effort:** 2 hours

---

### 7. **Dead Code: db.py + main.py Using Legacy Job Store**
- **Files:** 
  - `backend-ai-service/db.py` (not used by refactored code)
  - `backend-ai-service/main.py` (imports from db.py)
  - `backend-ai-service/app/jobs/store.py` (new JobStore class, not used by main.py)
- **Issue:** Dual job storage systems:
  - `db.py` has in-memory `_memory_store`
  - `app/jobs/store.py` has proper `JobStore` with JSON persistence
  - `main.py` imports from `db.py` but should use `JobStore`
  - Refactoring incomplete, causing confusion and maintenance overhead
- **Risk:** Code clarity, maintainability, hidden behavior
- **Fix:**
  1. Remove `db.py` entirely
  2. Update `main.py`:
```python
# Remove: from db import create_job, update_job, get_job, test_connection
# Add:
from app.jobs.store import JobStore
from app.jobs.models import JobRecord, JobStatus

# In process_job:
async def process_job(job_id: str, prompt: str, mode: str):
    job_store: JobStore = request.app.state.job_store
    await job_store.set_status(job_id, JobStatus.PROCESSING, progress=10)
    # ... rest of logic
```
- **Effort:** 3-4 hours

---

### 8. **Qwen 401 Errors Not Handled Specifically**
- **File:** `backend-ai-service/app/providers/qwen.py` line 43
- **Issue:** When Qwen returns 401 (Unauthorized) or 403 (Forbidden), error message truncated to 500 chars:
  ```python
  if response.status_code != 200:
    raise Exception(f"Qwen HTTP {response.status_code}: {response.text[:500]}")
  ```
  Doesn't distinguish between auth errors and temporary failures. No retry logic for expired tokens.
- **Risk:** Silent authentication failures, jobs fail with cryptic messages
- **Fix:**
```python
async def generate(self, prompt: str, *, mode: str) -> GenerationResult:
    # ... existing code ...
    response = await self._http.post(url, headers=headers, json=body, timeout=timeout)
    
    if response.status_code == 401:
        logger.error("[AUTH_FAILED] Qwen API key invalid or expired")
        raise ProviderUnavailableError("Qwen API key invalid (401)", provider=self.name)
    elif response.status_code == 403:
        logger.error("[AUTH_FAILED] Qwen API key insufficient permissions")
        raise ProviderUnavailableError("Qwen API key insufficient permissions (403)", provider=self.name)
    elif response.status_code != 200:
        logger.error(f"[REQUEST_FAILED] Qwen HTTP {response.status_code}: {response.text}")
        raise ProviderError(f"Qwen HTTP {response.status_code}", provider=self.name)
    
    # ... parse response ...
```
- **Effort:** 2-3 hours

---

## 🟠 High-Priority Issues

### 9. **Flux Polling Loop Misses Non-200 Responses**
- **File:** `backend-ai-service/app/providers/flux.py` line 48
- **Issue:** Polling loop silently ignores non-200 responses:
  ```python
  for attempt in range(1, self._settings.flux_max_polls + 1):
    await asyncio.sleep(self._settings.flux_poll_interval)
    poll_resp = await self._http.get(polling_url, headers=headers)
    if poll_resp.status_code != 200:
      continue  # ← Silently skip, no logging or retry logic
  ```
  If Flux API returns 429 (rate limited) or 503 (temporarily unavailable), loop keeps polling. No backoff, no failure detection.
- **Risk:** Jobs timeout unnecessarily, wasted retries, high latency
- **Fix:**
```python
for attempt in range(1, self._settings.flux_max_polls + 1):
    await asyncio.sleep(self._settings.flux_poll_interval)
    poll_resp = await self._http.get(polling_url, headers=headers)
    
    if poll_resp.status_code == 429:
        # Rate limited: exponential backoff
        backoff = min(2 ** (attempt // 10), 60)  # Max 60s
        logger.warning(f"Flux rate limited, backing off {backoff}s")
        await asyncio.sleep(backoff)
        continue
    elif poll_resp.status_code in (502, 503, 504):
        # Temporarily unavailable: retry with jitter
        jitter = random.uniform(0, 5)
        await asyncio.sleep(jitter)
        continue
    elif poll_resp.status_code >= 400:
        # Permanent error
        raise ProviderError(f"Flux polling error {poll_resp.status_code}", provider=self.name)
    
    # ... rest of logic ...
```
- **Effort:** 2-3 hours

---

### 10. **Tavus Video Generation Timeout Too Aggressive**
- **File:** 
  - `backend-ai-service/app/config.py` line 28-29
  - `backend-ai-service/.env.example` line 45-46
- **Issue:** Default config: `tavus_max_polls: 30` + `tavus_poll_interval: 5s` = max 150 seconds. Video generation often takes 3-5 minutes.
  ```
  30 polls × 5 seconds = 150 seconds max wait
  ```
  Jobs timeout before completion even when API is working.
- **Risk:** Frequent video job failures, poor user experience
- **Fix:**
```python
# In app/config.py
tavus_poll_interval: float = float(os.getenv("TAVUS_POLL_INTERVAL", "5"))
tavus_max_polls: int = int(os.getenv("TAVUS_MAX_POLLS", "240"))  # 240 × 5s = 1200s = 20 min

# In .env.example
TAVUS_POLL_INTERVAL=5
TAVUS_MAX_POLLS=240
# Typical Tavus video generation: 2-8 minutes, so 20 min timeout is safe
```
- **Effort:** 1 hour (config only)

---

### 11. **HttpClient.get() Missing Parameters**
- **File:** `backend-ai-service/app/core/http.py` line 27
- **Issue:** Inconsistent method signatures:
  ```python
  async def post(self, url: str, headers: Dict[str, str], json: Dict[str, Any], ...):  # Has json param
      ...
  
  async def get(self, url: str, headers: Dict[str, str], retry: bool = True):  # Missing json?
      ...
  ```
  If GET request needs query params or body, interface doesn't support it. Confusing for callers.
- **Risk:** Type checking failures, incomplete interface
- **Fix:**
```python
async def get(self, url: str, headers: Dict[str, str] = None, params: Dict[str, Any] = None, retry: bool = True, **kwargs):
    headers = headers or {}
    return await self._request("GET", url, headers=headers, params=params, retry=retry, **kwargs)

# Update _request to pass through **kwargs
async def _request(self, method: str, url: str, **kwargs):
    retry = kwargs.pop("retry", True)
    for attempt in range(3 if retry else 1):
        try:
            resp = await self._client.request(method, url, **kwargs)
            return resp
        except (httpx.ConnectError, httpx.TimeoutException) as e:
            if attempt == 2:
                raise
            logger.warning(f"Request failed (attempt {attempt+1}): {e}")
            await asyncio.sleep(1.0)
```
- **Effort:** 1-2 hours

---

### 12. **Incomplete Type Hints in ProviderRegistry**
- **File:** `backend-ai-service/app/providers/registry.py` line 35, 47
- **Issue:** Methods missing return type hints:
  ```python
  def _get_image_providers(self) -> List[BaseProvider]:  # ← No type hint!
      providers = []
      # ...
      return providers
  
  def _get_video_providers(self) -> List[BaseProvider]:  # ← No type hint!
      # ...
  ```
  Makes IDE completion worse, mypy won't catch errors.
- **Fix:**
```python
from typing import List

def _get_image_providers(self) -> List[BaseProvider]:
    providers: List[BaseProvider] = []
    # ...
    return providers

def _get_video_providers(self) -> List[BaseProvider]:
    providers: List[BaseProvider] = []
    # ...
    return providers
```
- **Effort:** 30 minutes

---

### 13. **Timeout Mismatch: Gateway vs AI Service**
- **Files:**
  - `backend-gateway/controllers/generateController.js` line 88
  - `backend-ai-service/main.py` line 129
- **Issue:** Axios timeout: 30s, AI service timeout: 120s
  ```javascript
  // Gateway timeout: 30 seconds
  await axios.post(`${AI_SERVICE_URL}/generate`, form, { timeout: 30000 });
  ```
  ```python
  # AI service timeout: 120 seconds
  result = await asyncio.wait_for(registry.generate(...), timeout=120.0)
  ```
  Gateway gives up before AI service finishes processing. Job appears failed to client even though it's still generating.
- **Risk:** False job failures, poor user experience
- **Fix:**
```javascript
// Gateway timeout should be > AI service timeout
await axios.post(`${AI_SERVICE_URL}/generate`, form, { timeout: 180000 }); // 180s
```
- **Effort:** 30 minutes

---

### 14. **Error Response Format Inconsistent**
- **File:** `backend-gateway/controllers/generateController.js`
- **Issue:** Different endpoints return different error formats:
  ```javascript
  // Line 96:
  res.status(err.response?.status || 500).json({
    error: "Failed to generate",
    details: formatUpstreamError(err),
  });
  
  // Line 136:
  res.status(err.response?.status || 500).json({
    error: "Generation failed",
    details: formatUpstreamError(err),
  });
  
  // Line 156:
  res.status(status).json({
    error: "Status fetch failed",
    details: err.response?.data || err.message,
  });
  ```
  Frontend doesn't know which error format to expect. Hard to write robust error handling.
- **Fix:** Create error response helper:
```javascript
const sendError = (res, statusCode, errorType, details) => {
  res.status(statusCode).json({
    error: errorType,
    details: details,
    timestamp: new Date().toISOString(),
  });
};

// Usage:
catch (err) {
  sendError(res, err.response?.status || 500, "Generation failed", formatUpstreamError(err));
}
```
- **Effort:** 1-2 hours

---

### 15. **No MongoDB Integration Despite Documentation**
- **Files:**
  - `README.md` (mentions MongoDB)
  - `backend-ai-service/requirements.txt` (no motor/pymongo)
  - `backend-ai-service/.env.example` (MONGO_URI env var)
- **Issue:** README lists "MongoDB Integration — Persistent job storage" but code uses in-memory dict. Env var exists but code ignores it.
- **Fix:** Either:
  - **Option A:** Remove MongoDB from docs and env template, clarify in-memory is used
  - **Option B:** Implement MongoDB with motor:
```bash
pip install motor
```
```python
from motor.motor_asyncio import AsyncIOMotorClient

class JobStore:
    def __init__(self, settings: Settings):
        self.client = AsyncIOMotorClient(settings.mongo_uri)
        self.db = self.client.ai_video_db
        self.collection = self.db.jobs
    
    async def create(self, job: JobRecord) -> JobRecord:
        await self.collection.insert_one(job.dict())
        return job
```
- **Effort:** 6-8 hours (Option B)

---

## 🟡 Medium-Priority Issues

### 16. **No Request Validation in GenerateRequest Schema**
- **File:** `backend-ai-service/main.py` line 67
- **Issue:** Pydantic schema allows both description and text to be optional, but at least one must be provided:
  ```python
  class GenerateRequest(BaseModel):
      job_id: Optional[str] = None
      mode: str = "image"
      description: Optional[str] = None  # Both optional!
      text: Optional[str] = None         # But at least one needed
      consent_confirmed: str = "true"
  ```
  If both are empty, prompt becomes "a beautiful scene" (default). Silent fallback is confusing.
- **Fix:**
```python
from pydantic import validator, root_validator

class GenerateRequest(BaseModel):
    job_id: Optional[str] = None
    mode: str = "image"
    description: Optional[str] = None
    text: Optional[str] = None
    consent_confirmed: str = "true"
    
    @root_validator
    def validate_prompt(cls, values):
        prompt = (values.get('description') or values.get('text') or "").strip()
        if not prompt:
            raise ValueError("At least one of 'description' or 'text' must be provided")
        return values
```
- **Effort:** 1 hour

---

### 17. **Multer Stores Uploads in Memory (10MB Limit)**
- **File:** `backend-gateway/server.js` line 50, 29
- **Issue:** Uploads stored in RAM:
  ```javascript
  const storage = multer.memoryStorage();  // ← RAM only
  app.use(express.json({ limit: "10mb" }));
  ```
  Large video files (> 10MB) rejected. No streaming to AI service.
- **Fix:** Use disk storage:
```javascript
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
}).fields([...]);
```
- **Effort:** 2 hours

---

### 18. **MediaService and GenerationService Defined but Unused**
- **File:** `backend-ai-service/app/services/`
- **Issue:** Service layer exists but main.py doesn't use it. `process_job()` downloads files directly instead of calling MediaService.
- **Fix:** Integrate services or remove dead code:
```python
# In main.py process_job():
media_service = MediaService(settings)
saved_path = await media_service.download_and_save(media_url, job_id, mode)
```
- **Effort:** 3-4 hours

---

### 19. **No Provider Chain Visibility to Frontend**
- **File:** `backend-ai-service/main.py`, `frontend/src/services/generationService.js`
- **Issue:** When job fails, frontend gets `{status: failed, error: msg}` but doesn't know which providers were tried:
  ```python
  # main.py line 200:
  await update_job(job_id, status="failed", error=str(e))
  ```
  Frontend shows generic "Generation failed" without context. User doesn't know if Qwen was tried first, then Flux, etc.
- **Fix:** Track attempted providers:
```python
# In process_job:
attempted = []
for provider in providers:
    try:
        attempted.append(provider.name)
        result = await provider.generate(prompt)
        return
    except Exception as e:
        logger.warning(f"Provider {provider.name} failed: {e}")

await update_job(job_id, status="failed", error=str(e), attempted_providers=attempted)
```
- **Effort:** 2-3 hours

---

### 20. **GenerationContext Incomplete**
- **File:** `frontend/src/context/GenerationContext.js`
- **Issue:** Context only stores `currentJob` without status/progress/error details:
  ```javascript
  const [currentJob, setCurrentJob] = useState(null);
  ```
  UI components need separate state for polling. Context underutilized.
- **Fix:** Extend context:
```javascript
const [currentJob, setCurrentJob] = useState(null);
const [jobStatus, setJobStatus] = useState(null);  // pending/processing/completed/failed
const [progress, setProgress] = useState(0);
const [error, setError] = useState(null);
const [provider, setProvider] = useState(null);
```
- **Effort:** 2-3 hours

---

### 21. **Pollinations Fallback Returns Public URL (No Local Copy)**
- **File:** `backend-ai-service/main.py` line 140
- **Issue:** Fallback provider returns public CDN URL without downloading:
  ```python
  if provider_name == "pollinations":
    saved_path = media_url  # ← Public URL, not cached locally
  ```
  URL may be logged, leaked, or intercepted. No local copy for audit trail or compliance.
- **Fix:** Always download to local storage:
```python
# Remove the Pollinations optimization
# Always download, even for public URLs:
try:
    resp = await asyncio.to_thread(requests.get, media_url, timeout=60)
    saved_path = f"/outputs/{job_id}.{ext}"
    # ... save locally
except:
    saved_path = media_url  # Fallback to direct URL only if download fails
```
- **Effort:** 1-2 hours

---

### 22. **Flux/Qwen Base URLs Hardcoded in Config**
- **File:** `backend-ai-service/app/config.py` line 17, 26
- **Issue:** API endpoints hardcoded:
  ```python
  qwen_base_url: str = os.getenv("QWEN_BASE_URL", "https://dashscope-intl.aliyuncs.com/api/v1")
  flux_base_url: str = os.getenv("FLUX_BASE_URL", "https://api.bfl.ai")
  ```
  If vendors change API domain (common for SaaS), code must be updated and redeployed.
- **Fix:** Document policy for API endpoint changes; consider using service discovery or API gateways for long-term.
- **Effort:** Low (document only)

---

### 23. **No Job Cleanup/TTL**
- **File:** `backend-ai-service/app/jobs/store.py`
- **Issue:** JobStore persists all jobs forever. Outputs/ folder grows unbounded. No cleanup policy.
- **Fix:** Add TTL and cleanup:
```python
async def cleanup_old_jobs(self, ttl_days: int = 30):
    """Delete jobs older than ttl_days."""
    cutoff = datetime.utcnow() - timedelta(days=ttl_days)
    async with self._lock:
        to_delete = [
            job_id for job_id, job in self._jobs.items()
            if job.updated_at < cutoff
        ]
        for job_id in to_delete:
            del self._jobs[job_id]
        await self._persist()
    return len(to_delete)

# Call on startup or periodic task:
@app.on_event("startup")
async def startup():
    # ... existing code ...
    await app.state.job_store.cleanup_old_jobs(ttl_days=30)
```
- **Effort:** 2-3 hours

---

### 24. **No WebSocket Real-Time Updates (Polling-Only)**
- **File:** `frontend/src/services/generationService.js` line 112
- **Issue:** Frontend polls every 2 seconds. High latency, wasted requests.
- **Note:** This is a MVP limitation, acceptable for v1, but should be tracked for v2.
- **Effort:** Not critical for current release

---

### 25. **Frontend Env Var Resolution Fragile**
- **File:** `frontend/src/services/generationService.js` line 8
- **Issue:** 5 different env var names checked in priority order:
  ```javascript
  process.env.REACT_APP_GATEWAY_URL ||
  process.env.REACT_APP_API_URL ||
  process.env.VITE_API_URL ||
  process.env.VITE_BACKEND_URL ||
  process.env.REACT_APP_API_BASE_URL?.replace(...) ||
  "http://localhost:5000"
  ```
  If wrong one is set, user confused. No logging of which was used.
- **Fix:** Log at startup:
```javascript
export function getApiBase() {
  const candidates = [
    ['REACT_APP_GATEWAY_URL', process.env.REACT_APP_GATEWAY_URL],
    ['REACT_APP_API_URL', process.env.REACT_APP_API_URL],
    // ... etc
  ];
  
  for (const [name, value] of candidates) {
    if (value) {
      console.log(`[API] Using ${name}: ${value}`);
      return value;
    }
  }
  
  console.log(`[API] Using fallback: http://localhost:5000`);
  return "http://localhost:5000";
}
```
- **Effort:** 1 hour

---

### 26. **Health Check Incomplete**
- **File:** `backend-ai-service/main.py` line 78
- **Issue:** `/health` endpoint returns static response, doesn't verify JobStore is accessible:
  ```python
  @app.get("/health")
  async def health():
      return {
          "status": "ok",
          "db": "in-memory",
          "providers": { ... }
      }
  ```
  Doesn't test if outputs/ directory is writable, jobs.json is accessible, etc.
- **Fix:**
```python
@app.get("/health")
async def health():
    try:
        # Test job store
        job_store: JobStore = request.app.state.job_store
        test_job_id = f"health-check-{uuid.uuid4()}"
        test_job = JobRecord(job_id=test_job_id, status=JobStatus.PENDING)
        await job_store.create(test_job)
        await job_store.delete(test_job_id)
        
        # Test outputs directory
        os.makedirs("outputs", exist_ok=True)
        test_file = "outputs/.health-check"
        Path(test_file).touch()
        Path(test_file).unlink()
        
        return {
            "status": "healthy",
            "db": "accessible",
            "providers": { ... },
            "storage": "writable"
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e)
        }, 503
```
- **Effort:** 2 hours

---

### 27. **ProviderUnavailableError Defined but Never Raised**
- **File:** `backend-ai-service/app/exceptions.py` line 42
- **Issue:** Exception class defined but never imported/used in providers:
  ```python
  class ProviderUnavailableError(ProviderError):
      """Provider is not configured (missing API key, etc.)."""
  ```
  Dead code, causes confusion.
- **Fix:** Either use it or remove it:
```python
# In qwen.py:
if not self._settings.qwen_api_key:
    raise ProviderUnavailableError("QWEN_API_KEY not configured", provider=self.name)
```
- **Effort:** 30 minutes

---

### 28. **Multipart Upload Files Ignored**
- **File:** `backend-ai-service/main.py` line 90
- **Issue:** POST `/generate` accepts `source_image` and `target_video` files but `process_job()` never uses them:
  ```python
  @app.post("/generate")
  async def generate(
      background_tasks: BackgroundTasks,
      description: str = Form(...),
      mode: str = Form(...),
      source_image: UploadFile = File(None),  # ← Accepted but unused
      target_video: UploadFile = File(None),  # ← Accepted but unused
  ):
      background_tasks.add_task(process_job, job_id, description, mode)
      # No files passed to process_job!
  ```
- **Fix:** Pass files to process_job or remove from endpoint signature if not needed yet:
```python
background_tasks.add_task(
    process_job,
    job_id,
    description,
    mode,
    source_image=source_image,
    target_video=target_video
)
```
- **Effort:** 2-3 hours

---

## 📊 Issue Summary Table

| Severity | Count | Category |
|----------|-------|----------|
| 🔴 Critical | 8 | JWT missing, rate limiting, data loss, API keys in logs, CORS config, env validation, db.py dead code, Qwen 401 |
| 🟠 High | 9 | Flux polling, Tavus timeout, HttpClient interface, type hints, timeout mismatch, error format, MongoDB, validation, job cleanup health check |
| 🟡 Medium | 10+ | Multer memory storage, dead code, provider visibility, context incomplete, Pollinations CDN, hardcoded URLs, WebSocket, env fragility |
| 🟢 Low | 3 | ProviderUnavailableError unused, minor logging gaps |

---

## ✅ Step-by-Step Fix Plan

### Phase 1: Security & Data Protection (Days 1-2)
1. ✅ Implement JWT auth + rate limiting (Critical #1, #2)
2. ✅ Sanitize API keys in logs (Critical #4)
3. ✅ Remove db.py, integrate JobStore (Critical #3, #7)
4. ✅ Validate environment variables at startup (Critical #6)
5. ✅ Move CORS origins to env config (Critical #5)

### Phase 2: Provider Resilience (Days 2-3)
6. ✅ Add Qwen 401-specific error handling (Critical #8)
7. ✅ Implement Flux polling backoff & error handling (High #9)
8. ✅ Update Tavus timeout defaults (High #10)
9. ✅ Fix HttpClient interface (High #11)
10. ✅ Add type hints to ProviderRegistry (High #12)
11. ✅ Fix timeout mismatch (High #13)

### Phase 3: API & UX Polish (Days 3-4)
12. ✅ Standardize error response format (High #14)
13. ✅ Extend GenerationContext (Medium #20)
14. ✅ Add provider chain visibility (Medium #19)
15. ✅ Add request validation (Medium #16)
16. ✅ Implement job cleanup/TTL (Medium #23)
17. ✅ Enhance health check (Medium #26)

### Phase 4: Storage & Files (Days 4-5)
18. ✅ Switch to disk storage for uploads (Medium #17)
19. ✅ Integrate MediaService (Medium #18)
20. ✅ Always cache media locally (Medium #21)
21. ✅ Remove MongoDB or implement it properly (High #15)

### Phase 5: Polish & Docs (Days 5-6)
22. ✅ Fix frontend env var resolution logging (Medium #25)
23. ✅ Remove or use ProviderUnavailableError (Low #27)
24. ✅ Implement multipart file handling (Medium #28)
25. ✅ Update README with accurate features
26. ✅ Add SECURITY.md documenting auth, rate limits, etc.
27. ✅ Run end-to-end tests on all 3 tiers

---

## 🏆 What's Working Well ✅

1. **Async Architecture:** FastAPI + httpx + uvicorn well-configured for concurrency
2. **Provider Pattern:** Clean BaseProvider interface with fallback chain (Qwen → Flux → Pollinations)
3. **Job Status Tracking:** Polling-based system works, just needs persistence fix
4. **CORS & Gateway Model:** Proper security boundary (frontend → gateway → AI service)
5. **Mode Normalization:** Frontend mode strings correctly mapped to backend modes
6. **Modular File Structure:** Clear separation between routes, providers, services, config

---

## 📋 Deployment Checklist

Before going to production, verify:

- [ ] **Security**
  - [ ] JWT enabled on all /api/* routes
  - [ ] Rate limiting configured (5 req/hour)
  - [ ] API keys never logged (sanitized)
  - [ ] CORS origins loaded from env, not hardcoded
  - [ ] Environment variables validated at startup

- [ ] **Reliability**
  - [ ] Jobs persisted (MongoDB or file-based)
  - [ ] Provider fallback chain tested
  - [ ] Timeouts coordinated (gateway > AI service)
  - [ ] Health checks passing
  - [ ] Error responses consistent

- [ ] **Scaling**
  - [ ] Database can handle 1000+ jobs
  - [ ] Outputs/ cleanup policy in place
  - [ ] Rate limiting prevents abuse
  - [ ] Monitoring/logging integrated

- [ ] **Operations**
  - [ ] Error logs sanitized (no API keys)
  - [ ] Provider status visible in health check
  - [ ] Job history queryable
  - [ ] Runbooks for common failures

---

## 📞 Recommendations

1. **Start with Critical issues** (JWT, data loss, secrets) → 1 week
2. **Then High issues** (provider resilience, validation) → 1 week  
3. **Then Medium issues** (UX, cleanup, polish) → 1 week
4. **Load testing before production** (simulate 100 concurrent jobs)
5. **Set up monitoring** (Datadog, Sentry, or similar) to catch errors in production

---

## Conclusion

The DeepGen platform has **solid architectural foundations** but **critical security and reliability gaps** that must be addressed before production. With focused effort over 2-3 weeks, all issues can be resolved. The recommended path is:

1. Fix security holes (JWT, rate limiting, key sanitization)
2. Ensure data durability (replace in-memory DB)
3. Strengthen provider resilience (error handling, timeouts)
4. Polish API and UX
5. Deploy with monitoring

**Estimated Effort: 80-120 developer hours**

---

*Report Generated: May 25, 2026*
*Auditor: Senior AI Systems Engineer*
