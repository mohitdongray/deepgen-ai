# 🔴 IMAGE GENERATION FLOW - WHERE IT'S BREAKING

## REQUEST FLOW ANALYSIS

```
USER/FRONTEND
    │
    ├─ POST /generate-json {"prompt": "...", "mode": "image"}
    │
    ▼
GATEWAY (backend-gateway/server.js)
    │
    ├─ ⏱️  TIMEOUT: 30 seconds ← [ISSUE #3: TOO SHORT!]
    │
    └─ Calls: axios.post(AI_SERVICE_URL/generate-json)
    │
    ▼
AI SERVICE (backend-ai-service/main.py)
    │
    ├─ ❌ [ISSUE #1: HTTP CLIENT NOT INITIALIZED]
    │   http_client created at module level
    │   NOT STARTED until startup event
    │   registry uses uninitialized http_client
    │   → When providers try to use http_client._client = None
    │   → CRASH! AttributeError
    │
    ├─ [IF #1 Fixed] Create job + return job_id
    │
    └─ Start background task: process_job()
           │
           ▼
       Call: registry.generate(mode, prompt)
           │
           ├─ ⏱️  TIMEOUT: 120 seconds per call
           │
           ├─ Try Provider #1: Pollinations
           │   │
           │   ├─ [ISSUE #2: URL not verified]
           │   │  Returns URL instantly without checking if it works
           │   │
           │   └─ ⏱️  TIMEOUT: 10 seconds max per provider
           │
           ├─ If timeout: Try Provider #2 (Qwen/Flux)
           │   │
           │   └─ [Same 10s timeout]
           │
           └─ If all fail: Return error
               │
               ▼
           Save to job store
               │
               ├─ [ISSUE #4: In-memory store loses data on restart]
               │
               └─ Return status=completed/failed
    │
    ▼
RESPONSE TO GATEWAY
    │
    ├─ [ISSUE #6: No validation that response is valid]
    │   Missing job_id → frontend crashes
    │
    └─ {"job_id": "xxx", "status": "pending"}
    │
    ▼
GATEWAY RETURNS TO FRONTEND
    │
    └─ res.json(response.data)
    │
    ▼
FRONTEND
    │
    ├─ Receives job_id
    │
    ├─ Starts polling: GET /status/{job_id}
    │
    ├─ Poll Loop: Every 2 seconds
    │   │
    │   └─ Wait for status = "completed" or "failed"
    │       │
    │       ├─ ⏱️  Max wait: 90 attempts × 2 seconds = 180 seconds
    │       │
    │       └─ [ISSUE #4: Job might not exist if service restarted]
    │           → 404 Not Found
    │           → Frontend shows "Job not found"
    │
    └─ Display image_url or error
```

---

## 🎯 THE MOST LIKELY BLOCKER

### **Issue #1: HTTP Client Not Initialized** (90% probability)

**Current Code (BROKEN):**
```python
# backend-ai-service/main.py lines 25-38

from app.core.http import HttpClient
from app.providers.registry import ProviderRegistry

settings = get_settings()
http_client = HttpClient(settings)  # ← Created but _client = None
registry = ProviderRegistry(settings, http_client)  # ← Using uninitialized http_client

app = FastAPI(...)

@app.on_event("startup")
async def startup():
    await http_client.start()  # ← TOO LATE! Started after registry created
    print("✅ HTTP client started")
```

**Problem:**
- `HttpClient.__init__()` sets `self._client = None`
- `registry` is created with this None-valued http_client
- When first request arrives, provider tries: `await self._client.request()` 
- → **AttributeError: 'NoneType' object has no attribute 'request'**

**Fixed Code:**
```python
# backend-ai-service/main.py

# At module level - NO initialization
settings = None
http_client = None
registry = None

app = FastAPI(...)

@app.on_event("startup")
async def startup():
    global settings, http_client, registry
    settings = get_settings()
    http_client = HttpClient(settings)
    await http_client.start()  # ← Start FIRST
    registry = ProviderRegistry(settings, http_client)  # ← Then create registry
    print("✅ HTTP client started")
    print("✅ Provider registry initialized")

@app.on_event("shutdown")
async def shutdown():
    if http_client:
        await http_client.stop()
    print("🛑 HTTP client stopped")
```

---

## 🔍 HOW TO DEBUG

### **Step 1: Check if HTTP Client is initialized**
```bash
# Look at AI service logs during startup
curl -s http://localhost:8000/health

# Should show:
# ✅ HTTP client started
# ✅ Provider registry initialized

# If missing, Issue #1 is your problem
```

### **Step 2: Check timeout issue**
```bash
# Gateway should wait longer than AI service
# Current: Gateway 30s, AI service 120s → WRONG!
# Should be: Gateway 180s, AI service 120s

# Test with:
curl -X POST http://localhost:5000/generate-json \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test image", "mode": "image"}' \
  --max-time 5  # Should get response within 5 seconds

# Expected response:
# {"job_id": "abc-123", "status": "pending"}

# If timeout: Issue #3 + possibly Issue #1
# If error: Check AI service logs for crash
```

### **Step 3: Check job persistence**
```bash
# With gateway running, make a request:
curl -X POST http://localhost:5000/generate-json \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "mode": "image"}'

# Note the job_id from response

# Then check status while job is processing:
curl http://localhost:5000/status/{job_id}

# Should return job metadata
# If 404: Issue #4 (job storage problem)
```

---

## 📋 DIAGNOSIS CHECKLIST

- [ ] **Do you see "HTTP client started" in AI service logs?**
  - NO → Issue #1 (Fix immediately)
  - YES → Continue to next

- [ ] **Does curl to /generate-json return within 5 seconds?**
  - NO (timeout) → Issue #3 (timeout too short)
  - YES → Continue to next

- [ ] **Does response include "job_id"?**
  - NO (missing or null) → Issue #6 (response validation)
  - YES → Continue to next

- [ ] **Can you poll status with /status/{job_id}?**
  - NO (404) → Issue #4 (job not found)
  - YES → Working! Check image URL

- [ ] **Does returned image_url work?**
  - NO (404 or blank) → Issue #2 (Pollinations URL not verified)
  - YES → Generation is working!

---

## 🚨 RECOMMENDED ACTION

**Apply this fix to `backend-ai-service/main.py` right now:**

```python
# DELETE (lines 25-38):
# settings = get_settings()
# http_client = HttpClient(settings)
# registry = ProviderRegistry(settings, http_client)

# REPLACE with (after imports):
settings = None
http_client = None
registry = None

# THEN make sure startup event has:
@app.on_event("startup")
async def startup():
    global settings, http_client, registry
    settings = get_settings()
    http_client = HttpClient(settings)
    await http_client.start()
    registry = ProviderRegistry(settings, http_client)
    print("✅ HTTP client started")
    print("✅ Provider registry initialized")
```

**Test immediately:**
```bash
# Restart AI service
# Then try:
curl -X POST http://localhost:8000/generate-json \
  -H "Content-Type: application/json" \
  -d '{"prompt": "beautiful sunset", "mode": "image"}'
```

**If you see `{"job_id": "...", "status": "pending"}` → Issue #1 is FIXED! ✅**

---

*Full debugging guide saved to: DEBUG_NO_RESPONSE.md*
