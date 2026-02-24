import React, { useState } from "react";
import { generateVideo } from "../../services/videoService";

function Generate() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const data = await generateVideo(prompt);
      setResult(data.data);
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>AI Content Generator</h1>
      <p>Enter a prompt to generate AI content</p>
      
      <div style={{ marginBottom: "20px" }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          style={{
            width: "100%",
            height: "120px",
            padding: "12px",
            fontSize: "16px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            resize: "vertical"
          }}
        />
      </div>

      <button 
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          backgroundColor: loading ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
          marginBottom: "20px"
        }}
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {result && (
        <div style={{ 
          padding: "20px", 
          border: "1px solid #ddd", 
          borderRadius: "8px",
          backgroundColor: "#f9f9f9"
        }}>
          <h3>Generation Result</h3>
          <p><strong>Prompt:</strong> {result.userPrompt}</p>
          <p><strong>Script:</strong> {result.aiScript || "No script generated"}</p>
          <p><strong>Model Used:</strong> {result.modelUsed}</p>
          <p><strong>API Used:</strong> {result.apiUsed}</p>
          <p><strong>Created:</strong> {new Date(result.createdAt).toLocaleString()}</p>
          
          {result.generatedImage && (
            <div style={{ marginTop: "15px" }}>
              <h4>Generated Image:</h4>
              <img 
                src={result.generatedImage} 
                alt="AI Generated" 
                style={{ maxWidth: "100%", height: "auto", borderRadius: "8px" }}
              />
            </div>
          )}
          
          {result.generatedVideo && (
            <div style={{ marginTop: "15px" }}>
              <h4>Generated Video:</h4>
              <video 
                src={result.generatedVideo} 
                controls 
                style={{ maxWidth: "100%", borderRadius: "8px" }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Generate;
