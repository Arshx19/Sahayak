# Multi-stage production Dockerfile for SAHAYAK Python Backend
FROM python:3.11-slim

# Prevent Python from writing .pyc and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app/backend:/app/backend/crud"

# Install system dependencies for OpenCV, ZBar QR decoding, and imaging
RUN apt-get update && apt-get install -y --no-install-recommends \
    libzbar0 \
    libgl1 \
    libglib2.0-0 \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend source code and seed assets
COPY backend /app/backend

# Create runtime scratch and uploads directory
RUN mkdir -p /app/backend/uploads /app/backend/scratch

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start Uvicorn server pointing to CRUD application factory
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--app-dir", "/app/backend/crud"]
