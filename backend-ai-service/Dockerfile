# backend-ai-service/Dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

# Copy only requirements first to leverage Docker caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
