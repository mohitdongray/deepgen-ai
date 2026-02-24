from fastapi import FastAPI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-orchestration",
        "timestamp": "2025-02-15T00:00:00Z"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
