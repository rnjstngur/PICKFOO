FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt
COPY backend /app/backend
COPY www /app/www
WORKDIR /app/backend
RUN DJANGO_SECRET_KEY=docker-build-only DB_ENGINE=sqlite python manage.py collectstatic --noinput
# Migrations should be run as a deploy/release step before starting the web process.
CMD ["sh", "-c", "exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --access-logfile -"]
