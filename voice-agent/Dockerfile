FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for WebRTC / audio
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libportaudio2 \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY system_prompt.txt .

# Expose port
EXPOSE 8000

# Run the server
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
