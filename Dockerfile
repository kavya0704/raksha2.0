FROM python:3.11-slim

# Install system dependencies for OpenCV and networking
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Environment config
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# Start FastAPI server on port dynamically assigned by Railway
CMD ["python", "-m", "backend.main"]
