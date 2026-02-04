FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements-vision.txt .
RUN pip install --no-cache-dir -r requirements-vision.txt

COPY server.py .
COPY models/ models/

EXPOSE 5000

CMD ["python", "server.py"]
