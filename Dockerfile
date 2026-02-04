FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements-django.txt .
RUN pip install --no-cache-dir -r requirements-django.txt

RUN python -c "from solcx import install_solc; install_solc('0.8.0')"

COPY manage.py .
COPY backend/ backend/
COPY core/ core/
COPY vision/ vision/
COPY blockchain/ blockchain/
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

RUN python manage.py collectstatic --noinput 2>/dev/null || true

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
