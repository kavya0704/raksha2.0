FROM python:3.11-slim

# Install system dependencies for OpenCV and networking
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python requirements first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy all application source files
COPY . .

# Environment config
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# Start: Python reads $PORT from environment (Railway injects this)
CMD ["python", "-m", "backend.main"]
