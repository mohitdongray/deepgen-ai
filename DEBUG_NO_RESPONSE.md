# 🔍 IMAGE GENERATION BLOCKING ISSUES - DEBUG REPORT

**Diagnosis Date:** May 25, 2026  
**Issue:** No response from image generation endpoints

---

## 🚨 CRITICAL BLOCKING ISSUES FOUND

### **BLOCKING ISSUE #1: HTTP Client Not Initialized ❌**

**Location:** `backend-ai-service/main.py` line 37-38

**Problem:**
```python
settings = get_settings()
http_client = HttpClient(settings)  # Created but never started!
registry = ProviderRegistry(settings, http_client)  # Registry has uninitialized HTTP client

@app.on_event("startup")
async def startup():
    await http_client.start()  # This happens AFTER registry is created
    print("✅ HTTP client started")
```

**Why It Blocks:**
1. `ProviderRegistry` is instantiated at module load time (line 38)
2. At this point, `http_client._client` is still `None` (hasn't been started)
3. When a request arrives, `registry.generate()` calls a provider that uses `http_client`
4. The provider tries to use `self._http` which is an HttpClient with `_client=None`
5. When `_request()` tries to call `await self._client.request()` → **CRASH: NoneType has no attribute 'request'**

**Fix:**
```python
# Instead of creating registry at module level, create it in startup():

settings = get_settings()
http_client = HttpClient(settings)
registry = None  # Global placeholder

@app.on_event("startup")
async def startup():
    global http_client, registry
    await http_client.start()
    registry = ProviderRegistry(settings, http_client)  # Initialize AFTER http_client starts
    print("✅ HTTP client started")
    print("✅ Provider registry initialized")
```

**Impact:** 🔴 **CRITICAL - Blocks ALL image generation**

---

### **BLOCKING ISSUE #2: Pollinations Provider Returns URL Without Verification ⚠️**

**Location:** `backend-ai-service/app/providers/pollinations.py` line 8-12

**Problem:**
```python
async def generate(self, prompt: str, *, mode: str) -> GenerationResult:
    encoded = urllib.parse.quote(prompt)
    seed = random.randint(1, 1_000_000)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&seed={seed}"
    return GenerationResult(provider=self.name, output=url, image_url=url)  # Returns URL instantly, no verification
```

**Why This Blocks:**
1. URL is constructed locally, never verified to exist
2. If Pollinations API is down, URL still returns "successfully"
3. Frontend polls for status, gets "completed" with bad URL
4. Frontend tries to display image from invalid URL → blank/broken image
5. User sees "success" but no image

**Better Fix:**
```python
import httpx
import asyncio

async def generate(self, prompt: str, *, mode: str) -> GenerationResult:
    encoded = urllib.parse.quote(prompt)
    seed = random.randint(1, 1_000_000)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&seed={seed}"
    
    # Verify URL works by checking HEAD request
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.head(url, follow_redirects=True)
            if response.status_code == 200:
                return GenerationResult(provider=self.name, output=url, image_url=url)
            else:
                raise Exception(f"Pollinations returned {response.status_code}")
    except Exception as e:
        raise Exception(f"Pollinations verification failed: {e}")
```

**Impact:** 🟠 **HIGH - Returns "success" for broken images**

---

### **BLOCKING ISSUE #3: Timeout Chain Cascade ⏱️**

**Location:** Multiple files with conflicting timeouts

**Problem:**
```
Frontend → Gateway (30s timeout) → AI Service (120s timeout) → Provider (10s timeout each)
```

**Timeout Flow:**
1. Gateway waits max 30 seconds for AI service (line: `timeout: 30000`)
2. AI service waits max 120 seconds for providers (line: `timeout=120.0`)
3. Each provider waits max 10 seconds (line: `timeout=10.0`)
4. **Issue:** If provider takes 11+ seconds, it times out but AI service still waits 120s
5. Gateway kills connection after 30s → **Frontend sees "failed" before AI service finishes**

**Example Scenario:**
- User requests image generation at T=0
- Gateway sends to AI service
- AI service tries providers:
  - T=10s: Provider 1 times out after 10s
  - T=20s: Provider 2 times out after 10s
  - T=30s: **GATEWAY TIMES OUT** ← Frontend gets error
  - T=40s: Provider 3 would have succeeded but it's too late
  - T=100s: AI service finally completes but connection is closed

**Fix:**
```javascript
// backend-gateway/controllers/generateController.js line 88
// INCREASE from 30000 to 180000 (3 minutes)
const response = await axios.post(`${AI_SERVICE_URL}/generate`, form, {
    headers: form.getHeaders(),
    timeout: 180000,  // ← Changed from 30000
});
```

**Impact:** 🔴 **CRITICAL - False "timeouts" on valid requests**

---

### **BLOCKING ISSUE #4: Job Status Update Failures ❌**

**Location:** `backend-ai-service/db.py` (legacy in-memory store)

**Problem:**
```python
# db.py uses in-memory store
_memory_store: Dict[str, Dict[str, Any]] = {}

async def update_job(job_id: str, **kwargs):
    async with _lock:
        if job_id not in _memory_store:
            return  # ← SILENT FAILURE! No error if job doesn't exist
        # ...
```

**Why It Blocks:**
1. Job created in memory store
2. If service crashes or restarts between `/generate` and `/status/{job_id}` calls
3. Job data lost → polling returns 404 or missing job
4. Frontend shows "job not found" forever

**Fix:** Use persistent `JobStore` (already exists in codebase):
```python
# In main.py startup:
from app.jobs.store import JobStore
from app.jobs.models import JobRecord, JobStatus

@app.on_event("startup")
async def startup():
    global job_store
    job_store = JobStore(settings)
    await job_store.load()  # Loads from jobs.json on disk
```

**Impact:** 🔴 **CRITICAL - Jobs lost on restart**

---

### **BLOCKING ISSUE #5: Missing Error Logging 🔇**

**Location:** `backend-ai-service/main.py` line 199-201

**Problem:**
```python
except Exception as e:
    print(f"[PROCESS:{job_id}] ❌ {e}")  # ← Only prints, no logging to file
    await update_job(job_id, status="failed", error=str(e))
```

**Why It Blocks Debugging:**
1. Errors only print to stdout, not persisted
2. If service has many logs, error gets lost in stream
3. No way to find which provider actually failed
4. Frontend gets generic "failed" with truncated error message

**Fix:**
```python
import logging
logger = logging.getLogger(__name__)

except Exception as e:
    logger.error(f"[PROCESS:{job_id}] ❌ Generation failed", exc_info=True)
    # Also track which providers were attempted:
    await update_job(
        job_id,
        status="failed",
        error=str(e),
        attempted_providers=[...],  # Track chain
        error_details={
            "message": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
    )
```

**Impact:** 🟡 **MEDIUM - Hard to debug failures**

---

### **BLOCKING ISSUE #6: No Response Validation in Gateway ❌**

**Location:** `backend-gateway/controllers/generateController.js` line 127-133

**Problem:**
```javascript
const response = await axios.post(`${AI_SERVICE_URL}/generate-json`, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
});

console.log("[Gateway] job_id=%s", response.data?.job_id);
res.json(response.data);  // ← No validation that job_id actually exists!
```

**Why It Blocks:**
1. AI service returns response, but what if `job_id` is missing?
2. Frontend receives `{status: "pending"}` without `job_id`
3. Frontend can't poll status because no `job_id` to use
4. Appears as "no response"

**Fix:**
```javascript
const response = await axios.post(`${AI_SERVICE_URL}/generate-json`, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
});

if (!response.data?.job_id) {
    console.error("[Gateway] AI service did not return job_id");
    return res.status(500).json({
        error: "Invalid response from AI service",
        details: "Missing job_id in response"
    });
}

console.log("[Gateway] job_id=%s", response.data.job_id);
res.json(response.data);
```

**Impact:** 🟠 **HIGH - Invalid responses crash frontend**

---

## 📊 Blocking Issues Summary

| # | Issue | Severity | Impact | Status |
|---|-------|----------|--------|--------|
| 1 | HTTP Client not initialized | 🔴 CRITICAL | ALL requests crash | **BLOCKS** |
| 2 | Pollinations doesn't verify URL | 🟠 HIGH | Returns broken images | Fallback only |
| 3 | Timeout cascade (30s vs 120s) | 🔴 CRITICAL | False failures | **BLOCKS** |
| 4 | Job data lost on restart | 🔴 CRITICAL | Can't poll status | **BLOCKS** |
| 5 | No error logging | 🟡 MEDIUM | Can't debug | Visibility |
| 6 | No response validation | 🟠 HIGH | Frontend crashes | **BLOCKS** |

---

## 🚀 QUICK FIX PRIORITY

### **Fix #1 (HttpClient init) - 15 minutes**
This is likely **THE** reason you're getting no response.

```python
# backend-ai-service/main.py

# DELETE these lines (they run at module load):
# settings = get_settings()
# http_client = HttpClient(settings)
# registry = ProviderRegistry(settings, http_client)

# REPLACE with:
settings = None
http_client = None
registry = None

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

### **Fix #2 (Timeout coordination) - 5 minutes**
```javascript
// backend-gateway/controllers/generateController.js line 88
timeout: 180000,  // ← Change from 30000
```

### **Fix #3 (Use persistent JobStore) - 30 minutes**
See AUDIT_REPORT.md Critical Issue #3

---

## 🔧 How to Test If Issue #1 Is The Problem

**Check this in your AI service logs:**

```bash
# Run AI service and look for these lines:
# ✅ HTTP client started
# ✅ Provider registry initialized

# If you DON'T see these, AND you send a request, you'll see:
# AttributeError: 'NoneType' object has no attribute 'request'
```

**Or test with curl:**
```bash
curl -X POST http://localhost:8000/generate-json \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "mode": "image"}'

# If broken: 500 error with "NoneType" message
# If fixed: 200 with {"job_id": "xxx", "status": "pending"}
```

---

## 📋 Complete Fix Checklist

- [ ] **URGENT:** Fix HttpClient initialization (Issue #1)
- [ ] **URGENT:** Increase gateway timeout to 180s (Issue #3)
- [ ] Fix response validation in gateway (Issue #6)
- [ ] Add error logging with traceback (Issue #5)
- [ ] Use persistent JobStore (Issue #4)
- [ ] Add URL verification to Pollinations (Issue #2)

**Estimated Time:** 1-2 hours to fix all blocking issues

---

## 📞 Next Steps

1. **Apply Fix #1 immediately** - this is almost certainly your blocker
2. **Test with curl** - verify you get a `job_id` in response
3. **Check logs** - look for "HTTP client started" message
4. **Apply remaining fixes** in priority order
5. **Test end-to-end:** Frontend → Gateway → AI Service → Provider

---

*Debug Report Generated: May 25, 2026*
*For detailed fixes, see AUDIT_REPORT.md*
