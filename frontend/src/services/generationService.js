/**
 * Async generation flow: start job → poll status → return media URLs.
 * Frontend → Gateway → FastAPI → providers
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Gateway base URL (supports CRA and Vite env names). */
export function getApiBase() {
  return (
    process.env.REACT_APP_GATEWAY_URL ||
    process.env.REACT_APP_API_URL ||
    process.env.VITE_API_URL ||
    process.env.VITE_BACKEND_URL ||
    process.env.REACT_APP_API_BASE_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:5000"
  );
}

/** Resolve /outputs/... paths through the gateway. */
export function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (url.startsWith("/")) return `${getApiBase()}${url}`;
  return url;
}

function formatValidationDetails(details) {
  if (typeof details === "string") return details;
  if (Array.isArray(details)) {
    return details
      .map((d) => {
        const loc = Array.isArray(d.loc) ? d.loc.filter((x) => x !== "body").join(".") : "";
        return loc ? `${loc}: ${d.msg}` : d.msg;
      })
      .join("; ");
  }
  return JSON.stringify(details);
}

async function parseErrorResponse(res) {
  try {
    const data = await res.json();
    if (data.details) return formatValidationDetails(data.details);
    if (typeof data.detail === "string") return data.detail;
    if (data.error) return data.error;
    return `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

/** Start JSON generation job. */
export async function startJsonGeneration({
  prompt,
  mode = "image",
  image_url,
  consent_confirmed = "true",
}) {
  const apiBase = getApiBase();
  console.log("[Generation] POST /generate-json", { mode, prompt: prompt?.slice(0, 60) });

  const res = await fetch(`${apiBase}/generate-json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      description: prompt,
      mode,
      image_url,
      consent_confirmed,
    }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }

  const data = await res.json();
  if (!data.job_id) {
    throw new Error("No job_id returned from server");
  }

  console.log("[Generation] job started:", data.job_id);
  return data.job_id;
}

/** Start multipart generation (file uploads). */
export async function startMultipartGeneration(formData) {
  const apiBase = getApiBase();
  console.log("[Generation] POST /generate (multipart)");

  const res = await fetch(`${apiBase}/generate`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }

  const data = await res.json();
  if (!data.job_id) {
    throw new Error("No job_id returned from server");
  }

  console.log("[Generation] job started:", data.job_id);
  return data.job_id;
}

/** Poll until job completes or fails. */
export async function pollUntilComplete(jobId, options = {}) {
  const {
    intervalMs = 2000,
    maxAttempts = 90,
    onProgress,
  } = options;

  const apiBase = getApiBase();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(intervalMs);

    const res = await fetch(`${apiBase}/status/${jobId}`);
    if (!res.ok) {
      throw new Error(await parseErrorResponse(res));
    }

    const job = await res.json();
    console.log("[Generation] poll", attempt + 1, job.status, job.provider || "");

    onProgress?.(job);

    if (job.status === "completed") {
      return {
        success: job.success !== false,
        provider: job.provider,
        image_url: resolveMediaUrl(job.image_url),
        video_url: resolveMediaUrl(job.video_url),
        job_id: job.job_id,
        status: "success",
        request_id: job.job_id,
      };
    }

    if (job.status === "failed") {
      throw new Error(job.error || "Generation failed");
    }
  }

  throw new Error("Generation timed out — try again later");
}

/** Full JSON flow: start + poll. */
export async function runJsonGeneration(params, pollOptions) {
  const jobId = await startJsonGeneration(params);
  return pollUntilComplete(jobId, pollOptions);
}

/** Full multipart flow: start + poll. */
export async function runMultipartGeneration(formData, pollOptions) {
  const jobId = await startMultipartGeneration(formData);
  return pollUntilComplete(jobId, pollOptions);
}
