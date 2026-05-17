import React, { useState } from "react";
import { generateVideo } from "../../services/videoService";

function Generate() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);
    setProgress("Submitting request...");

    try {
      const data = await generateVideo(prompt, "image");
      setResult(data);
    } catch (error) {
      console.error("Generation failed:", error);
      setResult({
        status: "error",
        error: error.message || "Generation failed. Please try again.",
      });
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  // Helper: build full URL for locally saved images
  const getImageUrl = (url) => {
    if (!url) return null;
    // If it's already a full URL (http/https/data) use it as-is
    if (url.startsWith("http") || url.startsWith("data:")) {
      return url;
    }
    // If it's a local path like /outputs/xxx.png, prepend the backend base URL
    if (url.startsWith("/")) {
      return `http://localhost:8000${url}`;
    }
    return url;
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", color: "#e2e8f0" }}>
      <h1>AI Content Generator</h1>
      <p>Enter a prompt to generate AI content</p>

      <div style={{ marginBottom: "20px" }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here... (e.g. a futuristic city at night)"
          style={{
            width: "100%",
            height: "120px",
            padding: "12px",
            fontSize: "16px",
            border: "1px solid #475569",
            borderRadius: "8px",
            resize: "vertical",
            backgroundColor: "#1e293b",
            color: "#e2e8f0",
          }}
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          backgroundColor: loading ? "#475569" : "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
          marginBottom: "10px",
          transition: "all 0.3s ease",
        }}
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {/* Progress message */}
      {loading && progress && (
        <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>
          ⏳ {progress} (this may take 10–60 seconds)
        </p>
      )}

      {/* Result */}
      {result && (
        <div
          style={{
            padding: "20px",
            border: "1px solid #334155",
            borderRadius: "8px",
            backgroundColor: "#0f172a",
          }}
        >
          <h3>Generation Result</h3>
          <p>
            <strong>Status:</strong>{" "}
            <span
              style={{
                color:
                  result.status === "success"
                    ? "#10b981"
                    : result.status === "error"
                    ? "#ef4444"
                    : "#f59e0b",
              }}
            >
              {result.status}
            </span>
          </p>

          {result.provider && (
            <p>
              <strong>Provider:</strong> {result.provider}
            </p>
          )}

          {result.request_id && (
            <p>
              <strong>Job ID:</strong> {result.request_id}
            </p>
          )}

          {/* SUCCESS: show image */}
          {result.status === "success" && result.image_url && (
            <div style={{ marginTop: "15px" }}>
              <h4>Generated Image:</h4>
              <img
                src={getImageUrl(result.image_url)}
                alt="AI Generated"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  console.error("Image failed to load:", result.image_url);
                }}
              />
              <p style={{ color: "#64748b", fontSize: "12px", marginTop: "8px" }}>
                URL: {getImageUrl(result.image_url)}
              </p>
            </div>
          )}

          {/* SUCCESS: no image URL */}
          {result.status === "success" && !result.image_url && (
            <p style={{ color: "#f59e0b", marginTop: "10px" }}>
              ⚠️ Generation succeeded but no image URL was returned.
            </p>
          )}

          {/* ERROR */}
          {result.status === "error" && (
            <div style={{ marginTop: "15px", color: "#ef4444" }}>
              <h4>Error:</h4>
              <p>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Generate;
